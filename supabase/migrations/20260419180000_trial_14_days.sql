-- Shorten free trial from 30 days to 14 days for new sign-ups.
--
-- Existing organizations are NOT touched — we only change behavior going forward.
-- Two surfaces are updated:
--   1. The handle_new_user trigger that runs on auth.users INSERT.
--   2. The default value on organizations.trial_end_date (defensive, in case
--      anything inserts a row without specifying the column).
ALTER TABLE public.organizations
  ALTER COLUMN trial_end_date SET DEFAULT (now() + interval '14 days');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_org_id UUID;
  _has_used_trial BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.trial_history WHERE email = NEW.email
  ) INTO _has_used_trial;

  IF _has_used_trial THEN
    INSERT INTO public.organizations (name, trial_start_date, trial_end_date, subscription_status)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'organization_name', 'Mon atelier'),
      now(),
      now(),
      'trial_expired'
    )
    RETURNING id INTO new_org_id;
  ELSE
    INSERT INTO public.organizations (name, trial_start_date, trial_end_date, subscription_status)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'organization_name', 'Mon atelier'),
      now(),
      now() + interval '14 days',
      'trial'
    )
    RETURNING id INTO new_org_id;

    INSERT INTO public.trial_history (email, organization_id, trial_start_date, trial_end_date)
    VALUES (NEW.email, new_org_id, now(), now() + interval '14 days');
  END IF;

  INSERT INTO public.profiles (user_id, organization_id, full_name)
  VALUES (
    NEW.id,
    new_org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'admin');

  RETURN NEW;
END;
$$;
