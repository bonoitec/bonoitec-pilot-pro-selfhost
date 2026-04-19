-- Convert device_catalog from per-workshop to single shared global list.
--
-- Goal: super-admin curates one catalog, every workshop sees the same models
-- in their repair/quote/IMEI flows.
--
-- Safety: as of 2026-04-19 the table is empty (verified). If any rows existed
-- they would need to be deduplicated on (brand, model) before this runs.

-- 1. Drop EVERY policy that references organization_id (they block column drop).
DROP POLICY IF EXISTS "Anyone can view device catalog" ON public.device_catalog;
DROP POLICY IF EXISTS "Admins can manage device catalog" ON public.device_catalog;
DROP POLICY IF EXISTS "Super admins can manage device catalog" ON public.device_catalog;
DROP POLICY IF EXISTS "Org members can view device catalog" ON public.device_catalog;
DROP POLICY IF EXISTS "Org members can insert device catalog" ON public.device_catalog;
DROP POLICY IF EXISTS "Org members can update device catalog" ON public.device_catalog;
DROP POLICY IF EXISTS "Admins can delete device catalog" ON public.device_catalog;

-- 2. Drop org-scoped unique + FK + column.
ALTER TABLE public.device_catalog
  DROP CONSTRAINT IF EXISTS device_catalog_brand_model_org_key,
  DROP CONSTRAINT IF EXISTS device_catalog_organization_id_fkey,
  DROP COLUMN IF EXISTS organization_id;

-- 3. Re-add the natural unique key.
ALTER TABLE public.device_catalog
  ADD CONSTRAINT device_catalog_brand_model_key UNIQUE (brand, model);

-- 4. RLS — read open, write super-admin only.

CREATE POLICY "Anyone can view device catalog"
  ON public.device_catalog FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage device catalog"
  ON public.device_catalog FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 5. Audited write RPCs — keep all changes traceable in admin_audit_log.

CREATE OR REPLACE FUNCTION public.admin_upsert_device_catalog(
  _id uuid,
  _category text,
  _brand text,
  _model text,
  _model_number text,
  _release_year int,
  _storage_variants jsonb,
  _color_variants jsonb,
  _is_active boolean,
  _reason text
) RETURNS uuid
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _result_id uuid;
  _action text;
  _label text;
BEGIN
  PERFORM public._require_super_admin();
  PERFORM public._require_reason(_reason);

  IF _brand IS NULL OR length(trim(_brand)) = 0 THEN
    RAISE EXCEPTION 'brand is required' USING ERRCODE = '22023';
  END IF;
  IF _model IS NULL OR length(trim(_model)) = 0 THEN
    RAISE EXCEPTION 'model is required' USING ERRCODE = '22023';
  END IF;

  IF _id IS NULL THEN
    INSERT INTO public.device_catalog
      (category, brand, model, model_number, release_year,
       storage_variants, color_variants, is_active)
    VALUES
      (COALESCE(_category, 'Smartphone'),
       trim(_brand), trim(_model),
       NULLIF(trim(COALESCE(_model_number, '')), ''),
       _release_year,
       COALESCE(_storage_variants, '[]'::jsonb),
       COALESCE(_color_variants, '[]'::jsonb),
       COALESCE(_is_active, true))
    RETURNING id INTO _result_id;
    _action := 'create_device_catalog';
  ELSE
    UPDATE public.device_catalog
       SET category = COALESCE(_category, category),
           brand = trim(_brand),
           model = trim(_model),
           model_number = NULLIF(trim(COALESCE(_model_number, '')), ''),
           release_year = _release_year,
           storage_variants = COALESCE(_storage_variants, storage_variants),
           color_variants = COALESCE(_color_variants, color_variants),
           is_active = COALESCE(_is_active, is_active),
           updated_at = now()
     WHERE id = _id
     RETURNING id INTO _result_id;
    IF _result_id IS NULL THEN
      RAISE EXCEPTION 'device not found' USING ERRCODE = 'P0002';
    END IF;
    _action := 'update_device_catalog';
  END IF;

  _label := trim(_brand) || ' ' || trim(_model);
  PERFORM public._admin_log_action(
    _action, 'platform', _result_id, _label,
    jsonb_build_object(
      'reason', _reason,
      'category', COALESCE(_category, 'Smartphone'),
      'release_year', _release_year
    )
  );

  RETURN _result_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_upsert_device_catalog(
  uuid, text, text, text, text, int, jsonb, jsonb, boolean, text
) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_upsert_device_catalog(
  uuid, text, text, text, text, int, jsonb, jsonb, boolean, text
) TO authenticated;


CREATE OR REPLACE FUNCTION public.admin_delete_device_catalog(
  _id uuid,
  _reason text
) RETURNS void
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _label text;
BEGIN
  PERFORM public._require_super_admin();
  PERFORM public._require_reason(_reason);

  SELECT brand || ' ' || model INTO _label
    FROM public.device_catalog WHERE id = _id;
  IF _label IS NULL THEN
    RAISE EXCEPTION 'device not found' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.device_catalog WHERE id = _id;

  PERFORM public._admin_log_action(
    'delete_device_catalog', 'platform', _id, _label,
    jsonb_build_object('reason', _reason)
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_device_catalog(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_delete_device_catalog(uuid, text) TO authenticated;


CREATE OR REPLACE FUNCTION public.admin_bulk_seed_device_catalog(
  _devices jsonb,
  _reason text
) RETURNS int
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _added int := 0;
  _row_count int;
  _device jsonb;
BEGIN
  PERFORM public._require_super_admin();
  PERFORM public._require_reason(_reason);

  IF jsonb_typeof(_devices) <> 'array' THEN
    RAISE EXCEPTION 'devices must be a JSON array' USING ERRCODE = '22023';
  END IF;

  FOR _device IN SELECT * FROM jsonb_array_elements(_devices) LOOP
    INSERT INTO public.device_catalog
      (category, brand, model, release_year, storage_variants, color_variants, is_active)
    VALUES
      (COALESCE(_device->>'category', 'Smartphone'),
       _device->>'brand',
       _device->>'model',
       (_device->>'release_year')::int,
       COALESCE(_device->'storage_variants', '[]'::jsonb),
       COALESCE(_device->'color_variants', '[]'::jsonb),
       true)
    ON CONFLICT (brand, model) DO NOTHING;

    GET DIAGNOSTICS _row_count = ROW_COUNT;
    _added := _added + _row_count;
  END LOOP;

  PERFORM public._admin_log_action(
    'bulk_seed_device_catalog', 'platform', NULL, 'Catalogue préchargé',
    jsonb_build_object('reason', _reason, 'count_attempted', jsonb_array_length(_devices))
  );

  RETURN _added;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_bulk_seed_device_catalog(jsonb, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_bulk_seed_device_catalog(jsonb, text) TO authenticated;
