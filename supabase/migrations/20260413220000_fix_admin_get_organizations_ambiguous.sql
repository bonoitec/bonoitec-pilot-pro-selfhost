-- Fix: admin_get_organizations threw 42702 "column reference total_count is ambiguous".
-- The RETURNS TABLE declared a column `total_count` and the CTE also had `total_count`,
-- so the SELECT inside the function couldn't disambiguate. Qualify the CTE reference.

CREATE OR REPLACE FUNCTION public.admin_get_organizations(
  _limit int DEFAULT 25,
  _offset int DEFAULT 0,
  _search text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  phone text,
  siret text,
  created_at timestamptz,
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  subscription_status text,
  plan_name text,
  stripe_customer_id text,
  stripe_subscription_id text,
  user_count bigint,
  repair_count bigint,
  client_count bigint,
  invoice_count bigint,
  total_paid_ttc numeric,
  last_repair_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _clamped_limit int;
  _search_pattern text;
  _total_count bigint;
BEGIN
  PERFORM public._require_super_admin();

  _clamped_limit := GREATEST(1, LEAST(100, COALESCE(_limit, 25)));
  _search_pattern := CASE
    WHEN _search IS NULL OR length(trim(_search)) = 0 THEN NULL
    ELSE '%' || trim(_search) || '%'
  END;

  SELECT count(*)::bigint INTO _total_count
  FROM public.organizations o
  WHERE _search_pattern IS NULL
     OR o.name ILIKE _search_pattern
     OR o.email ILIKE _search_pattern
     OR o.siret ILIKE _search_pattern;

  RETURN QUERY
  SELECT
    o.id,
    o.name,
    o.email,
    o.phone,
    o.siret,
    o.created_at,
    o.trial_start_date,
    o.trial_end_date,
    o.subscription_status::text,
    o.plan_name,
    o.stripe_customer_id,
    o.stripe_subscription_id,
    (SELECT count(*)::bigint FROM public.profiles p WHERE p.organization_id = o.id) AS user_count,
    (SELECT count(*)::bigint FROM public.repairs r WHERE r.organization_id = o.id) AS repair_count,
    (SELECT count(*)::bigint FROM public.clients c WHERE c.organization_id = o.id) AS client_count,
    (SELECT count(*)::bigint FROM public.invoices i WHERE i.organization_id = o.id) AS invoice_count,
    (SELECT COALESCE(SUM(i.total_ttc), 0) FROM public.invoices i WHERE i.organization_id = o.id AND i.status = 'payee') AS total_paid_ttc,
    (SELECT MAX(r.created_at) FROM public.repairs r WHERE r.organization_id = o.id) AS last_repair_at,
    _total_count AS total_count
  FROM public.organizations o
  WHERE _search_pattern IS NULL
     OR o.name ILIKE _search_pattern
     OR o.email ILIKE _search_pattern
     OR o.siret ILIKE _search_pattern
  ORDER BY o.created_at DESC
  LIMIT _clamped_limit
  OFFSET GREATEST(0, COALESCE(_offset, 0));
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_get_organizations(int, int, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_get_organizations(int, int, text) TO authenticated;
