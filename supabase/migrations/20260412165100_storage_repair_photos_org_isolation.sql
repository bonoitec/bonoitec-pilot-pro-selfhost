-- C7: Org-isolation on repair-photos storage bucket.
--
-- Previous policies allowed any authenticated user to:
--   - upload to paths starting with 'repairs/' or 'signatures/'
--   - read ANY file in repair-photos
-- That meant a user from Org A could read/overwrite photos belonging to Org B.
--
-- New policies require {org_id} as the second path segment:
--   repairs/{org_id}/{repair_id}/{filename}
--   signatures/{org_id}/{filename}
--
-- The frontend already uses this layout (see src/components/dialogs/CreateRepairWizard.tsx
-- and src/components/dialogs/CreateRepairDialog.tsx), so this migration just tightens
-- the policies that were previously too permissive.

-- Drop old permissive policies
DROP POLICY IF EXISTS "Org members can upload repair photos" ON storage.objects;
DROP POLICY IF EXISTS "Org members can view repair photos" ON storage.objects;

-- INSERT: path must be repairs/{org_id}/... or signatures/{org_id}/...
CREATE POLICY "Org members can upload repair photos to own org"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'repair-photos'
  AND (storage.foldername(name))[1] IN ('repairs', 'signatures')
  AND (storage.foldername(name))[2] = public.get_user_org_id()::text
);

-- SELECT: can only read files under own org's path
CREATE POLICY "Org members can view repair photos in own org"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'repair-photos'
  AND (storage.foldername(name))[1] IN ('repairs', 'signatures')
  AND (storage.foldername(name))[2] = public.get_user_org_id()::text
);

-- UPDATE: same constraint
CREATE POLICY "Org members can update repair photos in own org"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'repair-photos'
  AND (storage.foldername(name))[1] IN ('repairs', 'signatures')
  AND (storage.foldername(name))[2] = public.get_user_org_id()::text
)
WITH CHECK (
  bucket_id = 'repair-photos'
  AND (storage.foldername(name))[1] IN ('repairs', 'signatures')
  AND (storage.foldername(name))[2] = public.get_user_org_id()::text
);

-- DELETE: same constraint
CREATE POLICY "Org members can delete repair photos in own org"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'repair-photos'
  AND (storage.foldername(name))[1] IN ('repairs', 'signatures')
  AND (storage.foldername(name))[2] = public.get_user_org_id()::text
);
