
-- 3. Create function to handle user deletion cleanup
-- This runs BEFORE the user is deleted from auth.users, recording trial usage
-- and cleaning up the profile/roles so RLS blocks all access immediately.
CREATE OR REPLACE FUNCTION public.handle_user_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _org_id UUID;
  _org_trial_start timestamptz;
  _org_trial_end timestamptz;
BEGIN
  -- Get the user's organization info
  SELECT p.organization_id INTO _org_id
  FROM public.profiles p
  WHERE p.user_id = OLD.id;

  IF _org_id IS NOT NULL THEN
    -- Get trial dates from org
    SELECT o.trial_start_date, o.trial_end_date
    INTO _org_trial_start, _org_trial_end
    FROM public.organizations o
    WHERE o.id = _org_id;

    -- Record trial usage in history (upsert to handle edge cases)
    INSERT INTO public.trial_history (email, organization_id, trial_start_date, trial_end_date, deleted_at)
    VALUES (OLD.email, _org_id, COALESCE(_org_trial_start, now()), COALESCE(_org_trial_end, now()), now())
    ON CONFLICT (email) DO UPDATE SET
      deleted_at = now(),
      trial_end_date = COALESCE(EXCLUDED.trial_end_date, trial_history.trial_end_date);

    -- Delete user roles (revoke all access)
    DELETE FROM public.user_roles WHERE user_id = OLD.id;

    -- Delete profile (breaks get_user_org_id → RLS blocks everything)
    DELETE FROM public.profiles WHERE user_id = OLD.id;
  ELSE
    -- No profile found, still record the email to prevent trial re-abuse
    INSERT INTO public.trial_history (email, deleted_at)
    VALUES (OLD.email, now())
    ON CONFLICT (email) DO UPDATE SET deleted_at = now();
  END IF;

  RETURN OLD;
END;
$$;

-- Attach trigger to auth.users on DELETE
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_deleted();
