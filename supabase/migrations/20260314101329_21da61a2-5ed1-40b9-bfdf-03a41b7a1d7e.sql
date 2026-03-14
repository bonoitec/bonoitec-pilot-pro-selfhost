
-- Remove the broad non-admin SELECT policy that exposes Stripe data
DROP POLICY IF EXISTS "Org members can view organization" ON public.organizations;
