CREATE OR REPLACE FUNCTION public.send_customer_message(
  _tracking_code TEXT,
  _content TEXT,
  _sender_name TEXT DEFAULT 'Client'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _repair RECORD;
BEGIN
  -- Length guards
  IF _content IS NULL OR length(trim(_content)) < 1 OR length(_content) > 2000 THEN
    RETURN json_build_object('error', 'Message invalide (max 2000 caractères)');
  END IF;
  IF _sender_name IS NOT NULL AND length(_sender_name) > 100 THEN
    RETURN json_build_object('error', 'Nom trop long (max 100 caractères)');
  END IF;

  SELECT r.id, r.organization_id INTO _repair
  FROM repairs r
  WHERE r.tracking_code = _tracking_code
  LIMIT 1;

  IF _repair.id IS NULL THEN
    RETURN json_build_object('error', 'Réparation introuvable');
  END IF;

  INSERT INTO repair_messages (repair_id, organization_id, sender_type, sender_name, channel, content)
  VALUES (_repair.id, _repair.organization_id, 'customer', COALESCE(trim(_sender_name), 'Client'), 'internal', trim(_content));

  RETURN json_build_object('success', true);
END;
$function$;