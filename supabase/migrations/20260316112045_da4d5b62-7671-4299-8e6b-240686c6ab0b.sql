-- RPC for customer to mark technician messages as read (public, no auth needed)
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
  _count int;
BEGIN
  SELECT r.id INTO _repair_id
  FROM public.repairs r
  WHERE upper(r.tracking_code) = upper(trim(_tracking_code))
  LIMIT 1;

  IF _repair_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Réparation introuvable');
  END IF;

  UPDATE public.repair_messages
  SET is_read = true, read_at = now()
  WHERE repair_id = _repair_id
    AND sender_type = _sender_type
    AND is_read = false;

  GET DIAGNOSTICS _count = ROW_COUNT;

  RETURN json_build_object('success', true, 'updated', _count);
END;
$function$;