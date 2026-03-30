
-- 1. Fix trial_history: deny all access to authenticated users (internal table only)
CREATE POLICY "Deny all access to trial_history"
ON public.trial_history
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- 2. Fix repair_messages sender_type spoofing: restrict INSERT to non-system types
DROP POLICY IF EXISTS "Org members can insert repair messages" ON public.repair_messages;
CREATE POLICY "Org members can insert repair messages"
ON public.repair_messages
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = get_user_org_id()
  AND sender_type IN ('technician', 'customer', 'internal')
);

-- 3. Fix logos bucket: add org ownership checks
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;

-- Recreate with org-scoped path check (logos stored as {org_id}/logo.xxx)
CREATE POLICY "Org members can upload own logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = get_user_org_id()::text
);

CREATE POLICY "Org members can update own logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = get_user_org_id()::text
);

CREATE POLICY "Org members can delete own logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = get_user_org_id()::text
);
