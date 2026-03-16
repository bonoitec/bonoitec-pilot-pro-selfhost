-- Performance index for ordered conversation reads
CREATE INDEX IF NOT EXISTS idx_repair_messages_repair_created_id
ON public.repair_messages (repair_id, created_at, id);

-- Public customer retrieval by tracking code (ordered and enriched)
CREATE OR REPLACE FUNCTION public.get_repair_messages_by_tracking(_tracking_code text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH target_repair AS (
    SELECT r.id
    FROM public.repairs r
    WHERE upper(r.tracking_code) = upper(trim(_tracking_code))
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
  FROM public.repair_messages m
  JOIN target_repair tr ON tr.id = m.repair_id;
$function$;

-- Public customer send by tracking code (validated + returns inserted message)
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
BEGIN
  IF _content IS NULL OR length(trim(_content)) < 1 OR length(trim(_content)) > 2000 THEN
    RETURN json_build_object('success', false, 'error', 'Message invalide (1 à 2000 caractères)');
  END IF;

  IF _sender_name IS NOT NULL AND length(trim(_sender_name)) > 100 THEN
    RETURN json_build_object('success', false, 'error', 'Nom trop long (max 100 caractères)');
  END IF;

  SELECT r.id, r.organization_id
  INTO _repair_id, _organization_id
  FROM public.repairs r
  WHERE upper(r.tracking_code) = upper(trim(_tracking_code))
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