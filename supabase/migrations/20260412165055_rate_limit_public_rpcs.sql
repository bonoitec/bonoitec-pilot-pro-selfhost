-- H6: Rate-limit public SECURITY DEFINER functions that are callable without auth.
-- Wrap each function with a call to check_rate_limit() keyed on the input identifier,
-- so brute-forcing one tracking code or deposit code is throttled.
--
-- Keys are namespaced per-function so they don't share budgets. Limits are per-minute.
-- Legitimate customers polling their own repair will stay well under the limits.

-- ── get_repair_by_tracking_code ──────────────────────────────────────────
-- Also fixes an existing bug: the signed URL was generated against the 'logos' bucket
-- instead of 'repair-photos'. Changed to the correct bucket.
CREATE OR REPLACE FUNCTION public.get_repair_by_tracking_code(_code text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _repair RECORD;
  _resolved_photos jsonb := '[]'::jsonb;
  _photo text;
  _signed_url text;
  _allowed boolean;
  _normalized_code text;
BEGIN
  _normalized_code := upper(trim(COALESCE(_code, '')));
  IF length(_normalized_code) = 0 OR length(_normalized_code) > 64 THEN
    RETURN NULL;
  END IF;

  -- Rate limit: 30 lookups per minute per tracking code
  SELECT public.check_rate_limit('repair-tracking:' || _normalized_code, 60, 30) INTO _allowed;
  IF _allowed = false THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = '23P01';
  END IF;

  SELECT r.id, r.reference, r.status, r.issue, r.technician_message,
         r.photos, r.estimated_completion, r.created_at, r.updated_at,
         d.brand as device_brand, d.model as device_model
  INTO _repair
  FROM public.repairs r
  LEFT JOIN public.devices d ON d.id = r.device_id
  WHERE r.tracking_code = _normalized_code
  LIMIT 1;

  IF _repair.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Resolve photo URLs: generate signed URLs for paths, keep full URLs as-is
  IF _repair.photos IS NOT NULL AND jsonb_array_length(_repair.photos) > 0 THEN
    FOR _photo IN SELECT jsonb_array_elements_text(_repair.photos)
    LOOP
      IF _photo LIKE 'http%' THEN
        _resolved_photos := _resolved_photos || to_jsonb(_photo);
      ELSE
        -- Fixed bucket name: photos live in 'repair-photos', not 'logos'.
        -- Wrapped in BEGIN/EXCEPTION to degrade to raw path if the helper doesn't exist.
        BEGIN
          SELECT url INTO _signed_url
          FROM storage.fns_get_signed_url('repair-photos', _photo, 3600);
        EXCEPTION WHEN OTHERS THEN
          _signed_url := NULL;
        END;
        IF _signed_url IS NOT NULL THEN
          _resolved_photos := _resolved_photos || to_jsonb(_signed_url);
        ELSE
          _resolved_photos := _resolved_photos || to_jsonb(_photo);
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN json_build_object(
    'id', _repair.id,
    'reference', _repair.reference,
    'status', _repair.status,
    'issue', _repair.issue,
    'technician_message', _repair.technician_message,
    'photos', _resolved_photos,
    'estimated_completion', _repair.estimated_completion,
    'created_at', _repair.created_at,
    'updated_at', _repair.updated_at,
    'device_brand', _repair.device_brand,
    'device_model', _repair.device_model
  );
END;
$function$;

-- ── validate_deposit_code ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.validate_deposit_code(_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _allowed boolean;
  _exists boolean;
  _normalized text;
BEGIN
  _normalized := trim(COALESCE(_code, ''));
  IF length(_normalized) = 0 OR length(_normalized) > 64 THEN
    RETURN false;
  END IF;

  -- Rate limit: 30 lookups per minute per code
  SELECT public.check_rate_limit('deposit-validate:' || _normalized, 60, 30) INTO _allowed;
  IF _allowed = false THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = '23P01';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.deposit_codes
    WHERE code = _normalized AND is_active = true
  ) INTO _exists;

  RETURN _exists;
END;
$function$;

-- ── get_repair_messages_by_tracking ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_repair_messages_by_tracking(_tracking_code text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _allowed boolean;
  _normalized_code text;
  _result json;
BEGIN
  _normalized_code := upper(trim(COALESCE(_tracking_code, '')));
  IF length(_normalized_code) = 0 OR length(_normalized_code) > 64 THEN
    RETURN '[]'::json;
  END IF;

  -- Rate limit: 60 per minute per tracking code (chat polling)
  SELECT public.check_rate_limit('repair-messages:' || _normalized_code, 60, 60) INTO _allowed;
  IF _allowed = false THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = '23P01';
  END IF;

  WITH target_repair AS (
    SELECT r.id
    FROM public.repairs r
    WHERE upper(r.tracking_code) = _normalized_code
    LIMIT 1
  )
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', m.id,
        'repair_id', m.repair_id,
        'sender_type', m.sender_type,
        'sender_name', m.sender_name,
        'channel', m.channel,
        'content', m.content,
        'is_read', m.is_read,
        'created_at', m.created_at
      )
      ORDER BY m.created_at ASC, m.id ASC
    ),
    '[]'::json
  )
  INTO _result
  FROM public.repair_messages m
  JOIN target_repair tr ON tr.id = m.repair_id;

  RETURN _result;
END;
$function$;

-- ── send_customer_message ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.send_customer_message(
  _tracking_code text,
  _content text,
  _sender_name text DEFAULT 'Client'::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _repair_id uuid;
  _organization_id uuid;
  _safe_sender_name text;
  _new_message public.repair_messages%ROWTYPE;
  _allowed boolean;
  _normalized_code text;
BEGIN
  _normalized_code := upper(trim(COALESCE(_tracking_code, '')));
  IF length(_normalized_code) = 0 OR length(_normalized_code) > 64 THEN
    RETURN json_build_object('success', false, 'error', 'Tracking code invalide');
  END IF;

  IF _content IS NULL OR length(trim(_content)) < 1 OR length(trim(_content)) > 2000 THEN
    RETURN json_build_object('success', false, 'error', 'Message invalide (1 à 2000 caractères)');
  END IF;

  IF _sender_name IS NOT NULL AND length(trim(_sender_name)) > 100 THEN
    RETURN json_build_object('success', false, 'error', 'Nom trop long (max 100 caractères)');
  END IF;

  -- Rate limit: 10 messages per minute per tracking code
  SELECT public.check_rate_limit('customer-message:' || _normalized_code, 60, 10) INTO _allowed;
  IF _allowed = false THEN
    RETURN json_build_object('success', false, 'error', 'Trop de messages envoyés. Réessayez dans une minute.');
  END IF;

  SELECT r.id, r.organization_id
  INTO _repair_id, _organization_id
  FROM public.repairs r
  WHERE upper(r.tracking_code) = _normalized_code
  LIMIT 1;

  IF _repair_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Réparation introuvable');
  END IF;

  _safe_sender_name := left(COALESCE(NULLIF(trim(_sender_name), ''), 'Client'), 100);

  INSERT INTO public.repair_messages (
    repair_id,
    organization_id,
    sender_type,
    sender_name,
    channel,
    content,
    is_read
  )
  VALUES (
    _repair_id,
    _organization_id,
    'customer',
    _safe_sender_name,
    'internal',
    trim(_content),
    false
  )
  RETURNING * INTO _new_message;

  RETURN json_build_object(
    'success', true,
    'repair_id', _repair_id,
    'message', json_build_object(
      'id', _new_message.id,
      'repair_id', _new_message.repair_id,
      'sender_type', _new_message.sender_type,
      'sender_name', _new_message.sender_name,
      'channel', _new_message.channel,
      'content', _new_message.content,
      'is_read', _new_message.is_read,
      'created_at', _new_message.created_at
    )
  );
END;
$function$;

-- ── mark_messages_read_by_tracking ───────────────────────────────────────
-- Rate limiting is lower priority here (idempotent, low-impact) but we add it
-- for consistency and to prevent polling abuse.
CREATE OR REPLACE FUNCTION public.mark_messages_read_by_tracking(
  _tracking_code text,
  _sender_type text DEFAULT 'technician'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _repair_id uuid;
  _updated_count int;
  _allowed boolean;
  _normalized_code text;
BEGIN
  _normalized_code := upper(trim(COALESCE(_tracking_code, '')));
  IF length(_normalized_code) = 0 OR length(_normalized_code) > 64 THEN
    RETURN json_build_object('success', false, 'updated', 0);
  END IF;

  IF _sender_type NOT IN ('technician', 'customer', 'system', 'internal') THEN
    RETURN json_build_object('success', false, 'error', 'sender_type invalide');
  END IF;

  SELECT public.check_rate_limit('mark-read:' || _normalized_code, 60, 60) INTO _allowed;
  IF _allowed = false THEN
    RETURN json_build_object('success', false, 'error', 'Trop de requêtes');
  END IF;

  SELECT r.id INTO _repair_id
  FROM public.repairs r
  WHERE upper(r.tracking_code) = _normalized_code
  LIMIT 1;

  IF _repair_id IS NULL THEN
    RETURN json_build_object('success', false, 'updated', 0);
  END IF;

  UPDATE public.repair_messages
  SET is_read = true
  WHERE repair_id = _repair_id
    AND sender_type = _sender_type
    AND is_read = false;

  GET DIAGNOSTICS _updated_count = ROW_COUNT;

  RETURN json_build_object('success', true, 'updated', _updated_count);
END;
$function$;
