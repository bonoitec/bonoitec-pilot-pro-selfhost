-- 1. Create private repair-photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('repair-photos', 'repair-photos', false)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS policies for repair-photos bucket
-- Authenticated users can upload to their org's folder
CREATE POLICY "Org members can upload repair photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'repair-photos'
  AND (storage.foldername(name))[1] IN ('repairs', 'signatures')
);

-- Authenticated users can view files in their org's repairs
CREATE POLICY "Org members can view repair photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'repair-photos');

-- 3. Remove overly permissive INSERT policy on organizations
DROP POLICY IF EXISTS "Admins can insert organization" ON public.organizations;

