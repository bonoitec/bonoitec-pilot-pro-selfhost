
-- Step 1: Add organization_id column (nullable)
ALTER TABLE public.device_catalog ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Step 2: Drop unique constraint on (brand, model) to allow duplication per org
ALTER TABLE public.device_catalog DROP CONSTRAINT IF EXISTS device_catalog_brand_model_key;

-- Step 3: Duplicate existing rows for every organization
INSERT INTO public.device_catalog (category, brand, model, model_number, release_year, storage_variants, color_variants, image_url, is_active, organization_id)
SELECT dc.category, dc.brand, dc.model, dc.model_number, dc.release_year, dc.storage_variants, dc.color_variants, dc.image_url, dc.is_active, o.id
FROM public.device_catalog dc
CROSS JOIN public.organizations o
WHERE dc.organization_id IS NULL;

-- Step 4: Delete original rows with no org
DELETE FROM public.device_catalog WHERE organization_id IS NULL;

-- Step 5: Make NOT NULL
ALTER TABLE public.device_catalog ALTER COLUMN organization_id SET NOT NULL;

-- Step 6: New unique constraint per org
ALTER TABLE public.device_catalog ADD CONSTRAINT device_catalog_brand_model_org_key UNIQUE (brand, model, organization_id);

-- Step 7: Drop old policies
DROP POLICY IF EXISTS "Admins can manage device catalog" ON public.device_catalog;
DROP POLICY IF EXISTS "Anyone can view device catalog" ON public.device_catalog;

-- Step 8: New RLS policies
CREATE POLICY "Org members can view device catalog"
ON public.device_catalog FOR SELECT TO authenticated
USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can insert device catalog"
ON public.device_catalog FOR INSERT TO authenticated
WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Org members can update device catalog"
ON public.device_catalog FOR UPDATE TO authenticated
USING (organization_id = get_user_org_id());

CREATE POLICY "Admins can delete device catalog"
ON public.device_catalog FOR DELETE TO authenticated
USING (organization_id = get_user_org_id() AND has_role(auth.uid(), 'admin'::app_role));
