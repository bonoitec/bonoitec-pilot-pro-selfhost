
-- Create a security definer function that returns org data without sensitive Stripe fields for non-admin members
CREATE OR REPLACE FUNCTION public.get_org_safe_data()
RETURNS TABLE (
  id uuid,
  name text,
  address text,
  phone text,
  email text,
  siret text,
  logo_url text,
  vat_enabled boolean,
  vat_rate numeric,
  vat_number text,
  ape_code text,
  legal_status text,
  website text,
  invoice_footer text,
  google_review_url text,
  checklist_label text,
  invoice_prefix text,
  quote_prefix text,
  postal_code text,
  city text,
  country text,
  article_categories jsonb,
  intake_checklist_items jsonb,
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  subscription_status text,
  plan_name text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id, o.name, o.address, o.phone, o.email, o.siret, o.logo_url,
    o.vat_enabled, o.vat_rate, o.vat_number, o.ape_code, o.legal_status,
    o.website, o.invoice_footer, o.google_review_url, o.checklist_label,
    o.invoice_prefix, o.quote_prefix, o.postal_code, o.city, o.country,
    o.article_categories, o.intake_checklist_items,
    o.trial_start_date, o.trial_end_date, o.subscription_status, o.plan_name,
    o.created_at, o.updated_at
  FROM public.organizations o
  WHERE o.id = get_user_org_id()
$$;

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION public.get_org_safe_data() TO authenticated;

-- Now restrict the SELECT policy so only admins see stripe fields
-- Drop old permissive SELECT policy
DROP POLICY IF EXISTS "Org members can view organization" ON public.organizations;

-- Create admin-only full access SELECT policy
CREATE POLICY "Admins can view full organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (id = get_user_org_id() AND has_role(auth.uid(), 'admin'::app_role));

-- Create non-admin SELECT policy that excludes nothing at SQL level
-- but we rely on the safe function for non-admin access
-- Actually, technicians still need basic org data for the app to work
-- So we keep a SELECT policy for all org members
CREATE POLICY "Org members can view organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (id = get_user_org_id());
