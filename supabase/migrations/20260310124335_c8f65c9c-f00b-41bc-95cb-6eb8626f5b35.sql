-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Admins can insert organization" ON public.organizations;

-- Recreate with proper admin-only restriction
CREATE POLICY "Admins can insert organization"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Remove duplicate UPDATE policy
DROP POLICY IF EXISTS "Admins can update organization" ON public.organizations;

-- Remove duplicate SELECT policy  
DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;