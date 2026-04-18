-- Retry of 20260418140000_grant_super_admin_amarbouregaa.sql now that the
-- user has signed up. Identical idempotent body — if the role is already
-- present, ON CONFLICT DO NOTHING silently skips.
DO $$
DECLARE
  _user_id uuid;
  _org_id uuid;
BEGIN
  SELECT id INTO _user_id FROM auth.users WHERE email = 'amarbouregaa11@gmail.com' LIMIT 1;
  IF _user_id IS NULL THEN
    RAISE NOTICE 'User amarbouregaa11@gmail.com still not found — did the signup succeed?';
    RETURN;
  END IF;

  SELECT organization_id INTO _org_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
  IF _org_id IS NULL THEN
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
