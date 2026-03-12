-- Update get_repair_by_tracking_code to generate signed URLs for photos
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
BEGIN
  SELECT r.id, r.reference, r.status, r.issue, r.technician_message,
         r.photos, r.estimated_completion, r.created_at, r.updated_at,
         d.brand as device_brand, d.model as device_model
  INTO _repair
  FROM public.repairs r
  LEFT JOIN public.devices d ON d.id = r.device_id
  WHERE r.tracking_code = _code
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
        -- Generate a signed URL (1 hour expiry) using storage API
        SELECT url INTO _signed_url
        FROM storage.fns_get_signed_url('logos', _photo, 3600);
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