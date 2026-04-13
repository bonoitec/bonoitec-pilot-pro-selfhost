-- Super-admin dashboard RPCs (read-only, cross-organization).
--
-- Every function begins with a `is_super_admin()` check and raises 42501 otherwise.
-- All functions are SECURITY DEFINER with search_path pinned to 'public' and are
-- granted to the `authenticated` role only. Anonymous callers get 404.
--
-- These functions are the ONLY way the frontend can see cross-tenant data.
-- Regular org admins still cannot invoke them because is_super_admin() returns false.

-- Helper: fail fast if caller is not a super-admin.
CREATE OR REPLACE FUNCTION public._require_super_admin()
RETURNS void
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public._require_super_admin() FROM public;
GRANT EXECUTE ON FUNCTION public._require_super_admin() TO authenticated;


-- ── 1. Platform stats — single-row KPI aggregate ──────────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_platform_stats()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _result json;
BEGIN
  PERFORM public._require_super_admin();

  SELECT json_build_object(
    'total_orgs',            (SELECT count(*) FROM public.organizations),
    'active_subs',           (SELECT count(*) FROM public.organizations WHERE subscription_status = 'active'),
    'active_trials',         (SELECT count(*) FROM public.organizations WHERE subscription_status = 'trial' AND (trial_end_date IS NULL OR trial_end_date > now())),
    'expired_trials',        (SELECT count(*) FROM public.organizations WHERE subscription_status IN ('trial_expired', 'expired')),
    'total_users',           (SELECT count(*) FROM public.profiles),
    'total_repairs',         (SELECT count(*) FROM public.repairs),
    'total_clients',         (SELECT count(*) FROM public.clients),
    'total_invoices',        (SELECT count(*) FROM public.invoices),
    'total_inventory_items', (SELECT count(*) FROM public.inventory),
    'total_revenue_ttc',     (SELECT COALESCE(SUM(total_ttc), 0) FROM public.invoices WHERE status IN ('payee', 'partiel')),
    'signups_7d',            (SELECT count(*) FROM public.profiles WHERE created_at > now() - interval '7 days'),
    'repairs_7d',            (SELECT count(*) FROM public.repairs WHERE created_at > now() - interval '7 days'),
    'invoices_7d',           (SELECT count(*) FROM public.invoices WHERE created_at > now() - interval '7 days'),
    'mrr_estimate_eur', (
      SELECT COALESCE(SUM(
        CASE
          WHEN plan_name IN ('monthly', 'monthly_cancelling')     THEN 19.99
          WHEN plan_name IN ('quarterly', 'quarterly_cancelling') THEN 17.99
          WHEN plan_name IN ('annual', 'annual_cancelling')       THEN 14.99
          ELSE 0
        END
      ), 0)
      FROM public.organizations
      WHERE subscription_status = 'active'
    )
  ) INTO _result;

  RETURN _result;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_get_platform_stats() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_get_platform_stats() TO authenticated;


-- ── 2. Organizations list — paginated + searchable ────────────────────────
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
BEGIN
  PERFORM public._require_super_admin();

  _clamped_limit := GREATEST(1, LEAST(100, COALESCE(_limit, 25)));
  _search_pattern := CASE
    WHEN _search IS NULL OR length(trim(_search)) = 0 THEN NULL
    ELSE '%' || trim(_search) || '%'
  END;

  RETURN QUERY
  WITH filtered AS (
    SELECT o.*
    FROM public.organizations o
    WHERE _search_pattern IS NULL
       OR o.name ILIKE _search_pattern
       OR o.email ILIKE _search_pattern
       OR o.siret ILIKE _search_pattern
  ),
  total AS (
    SELECT count(*)::bigint AS total_count FROM filtered
  )
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
    (SELECT total_count FROM total) AS total_count
  FROM filtered o
  ORDER BY o.created_at DESC
  LIMIT _clamped_limit
  OFFSET GREATEST(0, COALESCE(_offset, 0));
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_get_organizations(int, int, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_get_organizations(int, int, text) TO authenticated;


-- ── 3. Users list — paginated + searchable, joins auth.users ──────────────
CREATE OR REPLACE FUNCTION public.admin_get_users(
  _limit int DEFAULT 25,
  _offset int DEFAULT 0,
  _search text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  organization_id uuid,
  organization_name text,
  role text,
  total_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _clamped_limit int;
  _search_pattern text;
BEGIN
  PERFORM public._require_super_admin();

  _clamped_limit := GREATEST(1, LEAST(100, COALESCE(_limit, 25)));
  _search_pattern := CASE
    WHEN _search IS NULL OR length(trim(_search)) = 0 THEN NULL
    ELSE '%' || trim(_search) || '%'
  END;

  RETURN QUERY
  WITH filtered AS (
    SELECT
      u.id               AS user_id,
      u.email::text      AS email,
      p.full_name        AS full_name,
      u.created_at       AS created_at,
      u.last_sign_in_at  AS last_sign_in_at,
      u.email_confirmed_at AS email_confirmed_at,
      p.organization_id  AS organization_id,
      o.name             AS organization_name,
      COALESCE(
        (SELECT ur.role::text FROM public.user_roles ur
         WHERE ur.user_id = u.id AND ur.organization_id = p.organization_id
         ORDER BY CASE ur.role::text
           WHEN 'super_admin' THEN 0
           WHEN 'admin'       THEN 1
           ELSE 2 END
         LIMIT 1),
        'technician'
      ) AS role
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    LEFT JOIN public.organizations o ON o.id = p.organization_id
    WHERE _search_pattern IS NULL
       OR u.email::text ILIKE _search_pattern
       OR p.full_name ILIKE _search_pattern
       OR o.name ILIKE _search_pattern
  ),
  total AS (
    SELECT count(*)::bigint AS total_count FROM filtered
  )
  SELECT
    f.user_id,
    f.email,
    f.full_name,
    f.created_at,
    f.last_sign_in_at,
    f.email_confirmed_at,
    f.organization_id,
    f.organization_name,
    f.role,
    (SELECT total_count FROM total) AS total_count
  FROM filtered f
  ORDER BY f.created_at DESC
  LIMIT _clamped_limit
  OFFSET GREATEST(0, COALESCE(_offset, 0));
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_get_users(int, int, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_get_users(int, int, text) TO authenticated;


-- ── 4. Recent activity — mixed event stream ───────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_recent_activity(_limit int DEFAULT 50)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _clamped_limit int;
  _result json;
BEGIN
  PERFORM public._require_super_admin();
  _clamped_limit := GREATEST(1, LEAST(500, COALESCE(_limit, 50)));

  WITH events AS (
    -- Signups
    SELECT
      'signup'::text       AS type,
      p.created_at         AS at,
      p.organization_id    AS org_id,
      COALESCE(o.name, '') AS org_name,
      COALESCE('Nouvel utilisateur : ' || p.full_name, 'Nouvel utilisateur') AS summary
    FROM public.profiles p
    LEFT JOIN public.organizations o ON o.id = p.organization_id

    UNION ALL

    -- Repairs created
    SELECT
      'repair'::text       AS type,
      r.created_at         AS at,
      r.organization_id    AS org_id,
      COALESCE(o.name, '') AS org_name,
      COALESCE(
        r.reference || ' — ' || COALESCE(d.brand, '') || ' ' || COALESCE(d.model, ''),
        r.reference
      ) AS summary
    FROM public.repairs r
    LEFT JOIN public.organizations o ON o.id = r.organization_id
    LEFT JOIN public.devices d ON d.id = r.device_id

    UNION ALL

    -- Invoices paid
    SELECT
      'invoice_paid'::text AS type,
      COALESCE(i.paid_at, i.created_at) AS at,
      i.organization_id    AS org_id,
      COALESCE(o.name, '') AS org_name,
      i.reference || ' — ' || COALESCE(i.total_ttc::text, '0') || ' €' AS summary
    FROM public.invoices i
    LEFT JOIN public.organizations o ON o.id = i.organization_id
    WHERE i.status = 'payee'

    UNION ALL

    -- Notification failures (observability signal)
    SELECT
      'notification_failed'::text AS type,
      nl.created_at        AS at,
      nl.organization_id   AS org_id,
      COALESCE(o.name, '') AS org_name,
      COALESCE(nl.error_message, 'Notification échouée') AS summary
    FROM public.notification_logs nl
    LEFT JOIN public.organizations o ON o.id = nl.organization_id
    WHERE nl.status = 'failed'
  )
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'type',     e.type,
        'at',       e.at,
        'org_id',   e.org_id,
        'org_name', e.org_name,
        'summary',  left(e.summary, 300)
      )
      ORDER BY e.at DESC
    ),
    '[]'::json
  )
  INTO _result
  FROM (
    SELECT * FROM events ORDER BY at DESC LIMIT _clamped_limit
  ) e;

  RETURN _result;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_get_recent_activity(int) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_get_recent_activity(int) TO authenticated;


-- ── 5. Rate limit hits — abuse detection ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_rate_limit_hits(_limit int DEFAULT 50)
RETURNS TABLE (
  key text,
  hits_1h bigint,
  last_hit_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _clamped_limit int;
BEGIN
  PERFORM public._require_super_admin();
  _clamped_limit := GREATEST(1, LEAST(200, COALESCE(_limit, 50)));

  RETURN QUERY
  SELECT
    rlh.key,
    count(*)::bigint AS hits_1h,
    MAX(rlh.created_at) AS last_hit_at
  FROM public.rate_limit_hits rlh
  WHERE rlh.created_at > now() - interval '1 hour'
  GROUP BY rlh.key
  ORDER BY hits_1h DESC, last_hit_at DESC
  LIMIT _clamped_limit;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_get_rate_limit_hits(int) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_get_rate_limit_hits(int) TO authenticated;
