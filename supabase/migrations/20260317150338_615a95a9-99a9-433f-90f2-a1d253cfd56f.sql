
-- 2. Update handle_new_user to check trial history and skip trial if already used
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
  -- Check if this email has already used a free trial
  SELECT EXISTS (
    SELECT 1 FROM public.trial_history WHERE email = NEW.email
  ) INTO _has_used_trial;

  IF _has_used_trial THEN
    -- Email already used trial: create org with expired trial (no free access)
    INSERT INTO public.organizations (name, trial_start_date, trial_end_date, subscription_status)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'organization_name', 'Mon atelier'),
      now(),
      now(), -- trial_end = now() means already expired
      'trial_expired'
    )
    RETURNING id INTO new_org_id;
  ELSE
    -- First time: normal 30-day trial
    INSERT INTO public.organizations (name, trial_start_date, trial_end_date, subscription_status)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'organization_name', 'Mon atelier'),
      now(),
      now() + interval '30 days',
      'trial'
    )
    RETURNING id INTO new_org_id;

    -- Record trial usage
    INSERT INTO public.trial_history (email, organization_id, trial_start_date, trial_end_date)
    VALUES (NEW.email, new_org_id, now(), now() + interval '30 days');
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
