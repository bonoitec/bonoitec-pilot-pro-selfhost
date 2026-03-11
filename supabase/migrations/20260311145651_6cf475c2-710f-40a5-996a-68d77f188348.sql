-- Drop the view since Stripe IDs are only needed in edge functions (server-side)
-- The existing RLS on organizations table + edge functions with service_role_key handle security
DROP VIEW IF EXISTS public.organizations_safe;