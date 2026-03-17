
-- Backfill trial_history for existing users using a temporary SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public._backfill_trial_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.trial_history (email, organization_id, trial_start_date, trial_end_date)
  SELECT u.email, p.organization_id, o.trial_start_date, o.trial_end_date
  FROM auth.users u
  JOIN public.profiles p ON p.user_id = u.id
  JOIN public.organizations o ON o.id = p.organization_id
  WHERE u.email IS NOT NULL
  ON CONFLICT (email) DO NOTHING;
END;
$$;

-- Run the backfill
SELECT public._backfill_trial_history();

-- Drop the temporary function
DROP FUNCTION public._backfill_trial_history();
