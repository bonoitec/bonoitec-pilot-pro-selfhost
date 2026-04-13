-- Phase 2: Admin dashboard write actions + audit log.
--
-- Adds:
--   1. admin_audit_log table (RLS-locked, only accessible via SECURITY DEFINER RPCs)
--   2. _admin_log_action() helper (called from every write RPC)
--   3. Fix admin_get_users (same ambiguous total_count bug as admin_get_organizations)
--   4. admin_get_audit_log() read RPC
--   5. 10 write RPCs covering every admin action in the UI spec:
--      shop:   update_organization, extend_trial, grant_subscription,
--              set_subscription_active, delete_organization
--      user:   update_user, change_user_role, verify_user_email, delete_user
--      plat:   promote_super_admin
--
-- All write RPCs:
--   - Are SECURITY DEFINER + VOLATILE (they mutate state and call _admin_log_action).
--   - Call _require_super_admin() first (42501 unauthorized otherwise).
--   - Require a reason text (>=3 chars after trim).
--   - Write exactly one audit row inside the same transaction.
--   - Reject self-harm actions (self-delete, self-demote).

-- ────────────────────────────────────────────────────────────────────
-- 1. Audit table
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('organization','user','platform')),
  target_id uuid,
  target_description text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_desc ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log (action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor ON public.admin_audit_log (actor_id);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all direct access to audit log" ON public.admin_audit_log;
CREATE POLICY "Deny all direct access to audit log" ON public.admin_audit_log
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- ────────────────────────────────────────────────────────────────────
-- 2. Helper: _admin_log_action
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._admin_log_action(
  _action text,
  _target_type text,
  _target_id uuid,
  _target_description text,
  _details jsonb
) RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, target_description, details)
  VALUES (auth.uid(), _action, _target_type, _target_id, _target_description, COALESCE(_details, '{}'::jsonb));
$$;

REVOKE EXECUTE ON FUNCTION public._admin_log_action(text, text, uuid, text, jsonb) FROM public;
-- intentionally NOT granted to authenticated — only callable from other SECURITY DEFINER functions in same schema

-- Reason validator: throw 22023 if invalid
CREATE OR REPLACE FUNCTION public._require_reason(_reason text) RETURNS void
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF _reason IS NULL OR length(trim(_reason)) < 3 THEN
    RAISE EXCEPTION 'Reason is required (min 3 chars)' USING ERRCODE = '22023';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────
-- 3. Fix admin_get_users (ambiguous total_count — same bug as #1 was)
-- ────────────────────────────────────────────────────────────────────
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
  _total bigint;
BEGIN
  PERFORM public._require_super_admin();

  _clamped_limit := GREATEST(1, LEAST(100, COALESCE(_limit, 25)));
  _search_pattern := CASE
    WHEN _search IS NULL OR length(trim(_search)) = 0 THEN NULL
    ELSE '%' || trim(_search) || '%'
  END;

  SELECT count(*)::bigint INTO _total
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.organizations o ON o.id = p.organization_id
  WHERE _search_pattern IS NULL
     OR u.email::text ILIKE _search_pattern
     OR p.full_name ILIKE _search_pattern
     OR o.name ILIKE _search_pattern;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text,
    p.full_name,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    p.organization_id,
    o.name AS organization_name,
    COALESCE(
      (SELECT ur.role::text FROM public.user_roles ur
       WHERE ur.user_id = u.id AND ur.organization_id = p.organization_id
       ORDER BY CASE ur.role::text
         WHEN 'super_admin' THEN 0
         WHEN 'admin'       THEN 1
         ELSE 2 END
       LIMIT 1),
      'technician'
    ) AS role,
    _total AS total_count
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.organizations o ON o.id = p.organization_id
  WHERE _search_pattern IS NULL
     OR u.email::text ILIKE _search_pattern
     OR p.full_name ILIKE _search_pattern
     OR o.name ILIKE _search_pattern
  ORDER BY u.created_at DESC
  LIMIT _clamped_limit
  OFFSET GREATEST(0, COALESCE(_offset, 0));
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_get_users(int, int, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_get_users(int, int, text) TO authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 4. admin_get_audit_log — paginated audit trail
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_audit_log(
  _limit int DEFAULT 50,
  _offset int DEFAULT 0,
  _action_filter text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _clamped_limit int;
  _total bigint;
  _rows json;
BEGIN
  PERFORM public._require_super_admin();
  _clamped_limit := GREATEST(1, LEAST(200, COALESCE(_limit, 50)));

  SELECT count(*)::bigint INTO _total
  FROM public.admin_audit_log a
  WHERE _action_filter IS NULL OR a.action = _action_filter;

  SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json) INTO _rows
  FROM (
    SELECT a.id, a.action, a.target_type, a.target_id, a.target_description,
           a.details, a.created_at,
           a.actor_id, u.email::text AS actor_email, p.full_name AS actor_name
    FROM public.admin_audit_log a
    LEFT JOIN auth.users u ON u.id = a.actor_id
    LEFT JOIN public.profiles p ON p.user_id = a.actor_id
    WHERE _action_filter IS NULL OR a.action = _action_filter
    ORDER BY a.created_at DESC
    LIMIT _clamped_limit
    OFFSET GREATEST(0, COALESCE(_offset, 0))
  ) r;

  RETURN json_build_object('total', _total, 'rows', _rows);
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_get_audit_log(int, int, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_get_audit_log(int, int, text) TO authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 5. Shop-level write RPCs
-- ────────────────────────────────────────────────────────────────────

-- 5a. admin_update_organization
CREATE OR REPLACE FUNCTION public.admin_update_organization(
  _org_id uuid,
  _name text,
  _email text,
  _phone text,
  _siret text,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _before record;
BEGIN
  PERFORM public._require_super_admin();
  PERFORM public._require_reason(_reason);

  SELECT id, name, email, phone, siret INTO _before
  FROM public.organizations WHERE id = _org_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'organization not found' USING ERRCODE = 'P0002'; END IF;

  UPDATE public.organizations
     SET name = NULLIF(trim(_name), ''),
         email = NULLIF(trim(_email), ''),
         phone = NULLIF(trim(_phone), ''),
         siret = NULLIF(trim(_siret), ''),
         updated_at = now()
   WHERE id = _org_id;

  PERFORM public._admin_log_action(
    'update_organization', 'organization', _org_id,
    COALESCE(NULLIF(trim(_name), ''), _before.name),
    jsonb_build_object(
      'reason', _reason,
      'before', to_jsonb(_before),
      'after',  jsonb_build_object('name', _name, 'email', _email, 'phone', _phone, 'siret', _siret)
    )
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_update_organization(uuid, text, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_update_organization(uuid, text, text, text, text, text) TO authenticated;

-- 5b. admin_extend_trial
CREATE OR REPLACE FUNCTION public.admin_extend_trial(
  _org_id uuid,
  _days int,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _old timestamptz;
  _new timestamptz;
  _name text;
BEGIN
  PERFORM public._require_super_admin();
  PERFORM public._require_reason(_reason);
  IF _days IS NULL OR _days < 1 OR _days > 365 THEN
    RAISE EXCEPTION 'days must be 1..365' USING ERRCODE = '22023';
  END IF;

  SELECT name, trial_end_date INTO _name, _old
  FROM public.organizations WHERE id = _org_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'organization not found' USING ERRCODE = 'P0002'; END IF;

  _new := GREATEST(COALESCE(_old, now()), now()) + (_days || ' days')::interval;

  UPDATE public.organizations
     SET trial_end_date = _new,
         subscription_status = CASE
           WHEN subscription_status IN ('trial_expired','expired') THEN 'trial'
           ELSE subscription_status
         END,
         updated_at = now()
   WHERE id = _org_id;

  PERFORM public._admin_log_action(
    'extend_trial', 'organization', _org_id, _name,
    jsonb_build_object('reason', _reason, 'days', _days, 'old_end', _old, 'new_end', _new)
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_extend_trial(uuid, int, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_extend_trial(uuid, int, text) TO authenticated;

-- 5c. admin_grant_subscription
CREATE OR REPLACE FUNCTION public.admin_grant_subscription(
  _org_id uuid,
  _plan text,
  _months int,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _name text;
  _new_end timestamptz;
BEGIN
  PERFORM public._require_super_admin();
  PERFORM public._require_reason(_reason);
  IF _plan NOT IN ('monthly','quarterly','annual') THEN
    RAISE EXCEPTION 'plan must be monthly/quarterly/annual' USING ERRCODE = '22023';
  END IF;
  IF _months IS NULL OR _months < 1 OR _months > 36 THEN
    RAISE EXCEPTION 'months must be 1..36' USING ERRCODE = '22023';
  END IF;

  SELECT name INTO _name FROM public.organizations WHERE id = _org_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'organization not found' USING ERRCODE = 'P0002'; END IF;

  _new_end := now() + (_months || ' months')::interval;

  UPDATE public.organizations
     SET subscription_status = 'active',
         plan_name = _plan,
         trial_end_date = _new_end,
         updated_at = now()
   WHERE id = _org_id;

  PERFORM public._admin_log_action(
    'grant_subscription', 'organization', _org_id, _name,
    jsonb_build_object('reason', _reason, 'plan', _plan, 'months', _months, 'end', _new_end)
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_grant_subscription(uuid, text, int, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_grant_subscription(uuid, text, int, text) TO authenticated;

-- 5d. admin_set_subscription_active
CREATE OR REPLACE FUNCTION public.admin_set_subscription_active(
  _org_id uuid,
  _active boolean,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _name text;
  _old text;
  _new text;
BEGIN
  PERFORM public._require_super_admin();
  PERFORM public._require_reason(_reason);

  SELECT name, subscription_status::text INTO _name, _old
  FROM public.organizations WHERE id = _org_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'organization not found' USING ERRCODE = 'P0002'; END IF;

  IF _active THEN
    _new := 'active';
  ELSE
    _new := 'trial_expired';
  END IF;

  UPDATE public.organizations
     SET subscription_status = _new,
         updated_at = now()
   WHERE id = _org_id;

  PERFORM public._admin_log_action(
    'set_subscription_active', 'organization', _org_id, _name,
    jsonb_build_object('reason', _reason, 'from', _old, 'to', _new)
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_set_subscription_active(uuid, boolean, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_set_subscription_active(uuid, boolean, text) TO authenticated;

-- 5e. admin_delete_organization
CREATE OR REPLACE FUNCTION public.admin_delete_organization(
  _org_id uuid,
  _confirm_name text,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _name text;
BEGIN
  PERFORM public._require_super_admin();
  PERFORM public._require_reason(_reason);

  SELECT name INTO _name FROM public.organizations WHERE id = _org_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'organization not found' USING ERRCODE = 'P0002'; END IF;
  IF _confirm_name IS NULL OR trim(_confirm_name) <> COALESCE(_name, '') THEN
    RAISE EXCEPTION 'confirmation name does not match' USING ERRCODE = '22023';
  END IF;

  -- Log BEFORE delete (FK from audit.actor_id to auth.users is fine; target_id is text uuid, not FK-constrained).
  PERFORM public._admin_log_action(
    'delete_organization', 'organization', _org_id, _name,
    jsonb_build_object('reason', _reason, 'deleted_at', now())
  );

  -- Detach trial history (FK), then delete org (cascades to profiles/user_roles/etc via their own FKs).
  DELETE FROM public.trial_history WHERE organization_id = _org_id;
  DELETE FROM public.organizations WHERE id = _org_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_organization(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_delete_organization(uuid, text, text) TO authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 6. User-level write RPCs
-- ────────────────────────────────────────────────────────────────────

-- 6a. admin_update_user (full_name only for now)
CREATE OR REPLACE FUNCTION public.admin_update_user(
  _user_id uuid,
  _full_name text,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _before text;
  _email text;
BEGIN
  PERFORM public._require_super_admin();
  PERFORM public._require_reason(_reason);

  SELECT p.full_name, u.email::text INTO _before, _email
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  WHERE p.user_id = _user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'user profile not found' USING ERRCODE = 'P0002'; END IF;

  UPDATE public.profiles
     SET full_name = NULLIF(trim(_full_name), ''),
         updated_at = now()
   WHERE user_id = _user_id;

  PERFORM public._admin_log_action(
    'update_user', 'user', _user_id, COALESCE(_email, _before),
    jsonb_build_object('reason', _reason, 'before', _before, 'after', _full_name)
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_update_user(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_update_user(uuid, text, text) TO authenticated;

-- 6b. admin_change_user_role
CREATE OR REPLACE FUNCTION public.admin_change_user_role(
  _user_id uuid,
  _org_id uuid,
  _new_role text,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _old_role text;
  _email text;
BEGIN
  PERFORM public._require_super_admin();
  PERFORM public._require_reason(_reason);

  IF _new_role NOT IN ('admin','technician') THEN
    RAISE EXCEPTION 'role must be admin or technician' USING ERRCODE = '22023';
  END IF;
  -- Prevent self-demote from super_admin via this RPC
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot change your own role via this RPC' USING ERRCODE = '42501';
  END IF;

  SELECT ur.role::text, u.email::text INTO _old_role, _email
  FROM public.user_roles ur
  LEFT JOIN auth.users u ON u.id = ur.user_id
  WHERE ur.user_id = _user_id AND ur.organization_id = _org_id
  ORDER BY CASE ur.role::text WHEN 'super_admin' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END
  LIMIT 1;

  -- Upsert the role
  DELETE FROM public.user_roles WHERE user_id = _user_id AND organization_id = _org_id AND role::text IN ('admin','technician');
  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (_user_id, _org_id, _new_role::public.app_role);

  PERFORM public._admin_log_action(
    'change_user_role', 'user', _user_id, _email,
    jsonb_build_object('reason', _reason, 'organization_id', _org_id, 'from', _old_role, 'to', _new_role)
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_change_user_role(uuid, uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_change_user_role(uuid, uuid, text, text) TO authenticated;

-- 6c. admin_verify_user_email
CREATE OR REPLACE FUNCTION public.admin_verify_user_email(
  _user_id uuid,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _email text;
BEGIN
  PERFORM public._require_super_admin();
  PERFORM public._require_reason(_reason);

  SELECT email::text INTO _email FROM auth.users WHERE id = _user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'user not found' USING ERRCODE = 'P0002'; END IF;

  UPDATE auth.users
     SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
         confirmed_at       = COALESCE(confirmed_at, now())
   WHERE id = _user_id;

  PERFORM public._admin_log_action(
    'verify_user_email', 'user', _user_id, _email,
    jsonb_build_object('reason', _reason)
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_verify_user_email(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_verify_user_email(uuid, text) TO authenticated;

-- 6d. admin_delete_user
CREATE OR REPLACE FUNCTION public.admin_delete_user(
  _user_id uuid,
  _confirm_email text,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _email text;
BEGIN
  PERFORM public._require_super_admin();
  PERFORM public._require_reason(_reason);

  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot delete yourself' USING ERRCODE = '42501';
  END IF;

  SELECT email::text INTO _email FROM auth.users WHERE id = _user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'user not found' USING ERRCODE = 'P0002'; END IF;
  IF _confirm_email IS NULL OR lower(trim(_confirm_email)) <> lower(COALESCE(_email, '')) THEN
    RAISE EXCEPTION 'confirmation email does not match' USING ERRCODE = '22023';
  END IF;

  PERFORM public._admin_log_action(
    'delete_user', 'user', _user_id, _email,
    jsonb_build_object('reason', _reason, 'deleted_at', now())
  );

  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE user_id = _user_id;
  DELETE FROM auth.users WHERE id = _user_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid, text, text) TO authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 7. Platform-level write RPC
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_promote_super_admin(
  _user_id uuid,
  _org_id uuid,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _email text;
BEGIN
  PERFORM public._require_super_admin();
  PERFORM public._require_reason(_reason);

  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot self-promote via this RPC' USING ERRCODE = '42501';
  END IF;

  SELECT email::text INTO _email FROM auth.users WHERE id = _user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'user not found' USING ERRCODE = 'P0002'; END IF;

  -- Ensure not already super admin
  IF EXISTS (SELECT 1 FROM public.user_roles
             WHERE user_id = _user_id AND role = 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'user already has super_admin role' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (_user_id, _org_id, 'super_admin'::public.app_role);

  PERFORM public._admin_log_action(
    'promote_super_admin', 'user', _user_id, _email,
    jsonb_build_object('reason', _reason, 'organization_id', _org_id)
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_promote_super_admin(uuid, uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_promote_super_admin(uuid, uuid, text) TO authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 8. Callable-from-edge helper for password-reset audit entry
--    (the edge function calls this via service_role; no super_admin check here
--     because the edge function already verified the caller was admin.)
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_log_password_reset(
  _actor_id uuid,
  _target_user_id uuid,
  _target_email text,
  _reason text
)
RETURNS void
LANGUAGE sql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, target_description, details)
  VALUES (_actor_id, 'reset_password', 'user', _target_user_id, _target_email,
          jsonb_build_object('reason', _reason));
$$;

REVOKE EXECUTE ON FUNCTION public.admin_log_password_reset(uuid, uuid, text, text) FROM public;
-- NOT granted to authenticated — only callable via service_role in edge function.
