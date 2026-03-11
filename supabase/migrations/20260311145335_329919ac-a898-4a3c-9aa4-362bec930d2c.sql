-- Create a secure view that hides Stripe-sensitive columns from non-admins
CREATE OR REPLACE VIEW public.organizations_safe AS
SELECT
  id, name, address, city, postal_code, country, phone, email, website,
  siret, vat_number, ape_code, legal_status,
  logo_url, invoice_prefix, quote_prefix, invoice_footer,
  vat_enabled, vat_rate,
  checklist_label, intake_checklist_items, article_categories,
  google_review_url,
  subscription_status, trial_start_date, trial_end_date, plan_name,
  created_at, updated_at,
  -- Only expose Stripe IDs to admins
  CASE WHEN public.has_role(auth.uid(), 'admin') THEN stripe_customer_id ELSE NULL END AS stripe_customer_id,
  CASE WHEN public.has_role(auth.uid(), 'admin') THEN stripe_subscription_id ELSE NULL END AS stripe_subscription_id
FROM public.organizations
WHERE id = public.get_user_org_id();

-- Grant access to the view
GRANT SELECT ON public.organizations_safe TO authenticated;