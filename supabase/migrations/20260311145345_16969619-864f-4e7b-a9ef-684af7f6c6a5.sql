-- Drop and recreate the view with SECURITY INVOKER (default, safe)
DROP VIEW IF EXISTS public.organizations_safe;

CREATE VIEW public.organizations_safe
WITH (security_invoker = true)
AS
SELECT
  id, name, address, city, postal_code, country, phone, email, website,
  siret, vat_number, ape_code, legal_status,
  logo_url, invoice_prefix, quote_prefix, invoice_footer,
  vat_enabled, vat_rate,
  checklist_label, intake_checklist_items, article_categories,
  google_review_url,
  subscription_status, trial_start_date, trial_end_date, plan_name,
  created_at, updated_at,
  CASE WHEN public.has_role(auth.uid(), 'admin') THEN stripe_customer_id ELSE NULL END AS stripe_customer_id,
  CASE WHEN public.has_role(auth.uid(), 'admin') THEN stripe_subscription_id ELSE NULL END AS stripe_subscription_id
FROM public.organizations
WHERE id = public.get_user_org_id();

GRANT SELECT ON public.organizations_safe TO authenticated;