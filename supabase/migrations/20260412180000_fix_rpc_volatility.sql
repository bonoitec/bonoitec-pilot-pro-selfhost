-- Fix: the previous migration marked rate-limited RPCs as STABLE, which PostgREST
-- enforces as a read-only transaction. That prevented check_rate_limit() from
-- inserting into rate_limit_hits, breaking both rate limiting and the function itself.
--
-- Redeclare the read-oriented functions as VOLATILE so their internal
-- check_rate_limit() INSERT can run.

-- get_repair_by_tracking_code (adds rate limit tracking side effect)
CREATE OR REPLACE FUNCTION public.get_repair_by_tracking_code(_code text)
 RETURNS json
 LANGUAGE plpgsql
 VOLATILE SECURITY DEFINER
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

  IF _repair.photos IS NOT NULL AND jsonb_array_length(_repair.photos) > 0 THEN
    FOR _photo IN SELECT jsonb_array_elements_text(_repair.photos)
    LOOP
      IF _photo LIKE 'http%' THEN
        _resolved_photos := _resolved_photos || to_jsonb(_photo);
      ELSE
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

-- validate_deposit_code
CREATE OR REPLACE FUNCTION public.validate_deposit_code(_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 VOLATILE SECURITY DEFINER
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

-- get_repair_messages_by_tracking
CREATE OR REPLACE FUNCTION public.get_repair_messages_by_tracking(_tracking_code text)
 RETURNS json
 LANGUAGE plpgsql
 VOLATILE SECURITY DEFINER
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
