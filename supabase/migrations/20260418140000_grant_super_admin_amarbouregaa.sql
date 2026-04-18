-- One-off bootstrap: grant the 'super_admin' role to amarbouregaa11@gmail.com.
--
-- Idempotent: if the user doesn't exist (they haven't signed up yet) OR if they
-- already have the role, the statement is a no-op.
--
-- The is_super_admin() RPC only checks (user_id, role) — organization_id is
-- required by the NOT NULL constraint on user_roles but has no semantic meaning
-- for super-admin. We attach it to the user's existing organization_id from
-- their profile.
DO $$
DECLARE
  _user_id uuid;
  _org_id uuid;
BEGIN
  SELECT id INTO _user_id FROM auth.users WHERE email = 'amarbouregaa11@gmail.com' LIMIT 1;
  IF _user_id IS NULL THEN
    RAISE NOTICE 'User amarbouregaa11@gmail.com not found — they must sign up first, then re-run this grant.';
    RETURN;
  END IF;

  SELECT organization_id INTO _org_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
  IF _org_id IS NULL THEN
    -- No profile row yet → use any existing org as the required FK target
    SELECT id INTO _org_id FROM public.organizations LIMIT 1;
    IF _org_id IS NULL THEN
      RAISE EXCEPTION 'No organization exists yet — create one before granting super_admin.';
    END IF;
  END IF;

  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (_user_id, _org_id, 'super_admin'::public.app_role)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Granted super_admin to amarbouregaa11@gmail.com (user_id=%, org_id=%).', _user_id, _org_id;
END $$;
