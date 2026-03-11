
-- Add trial and subscription fields to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS trial_start_date timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS trial_end_date timestamp with time zone DEFAULT (now() + interval '30 days'),
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trial';

-- Update existing organizations to have trial dates set
UPDATE public.organizations
SET trial_start_date = created_at,
    trial_end_date = created_at + interval '30 days',
    subscription_status = 'trial'
WHERE trial_start_date IS NULL OR trial_end_date IS NULL;

-- Update handle_new_user to set trial dates on new account creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_org_id UUID;
BEGIN
  INSERT INTO public.organizations (name, trial_start_date, trial_end_date, subscription_status)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'organization_name', 'Mon atelier'),
    now(),
    now() + interval '30 days',
    'trial'
  )
  RETURNING id INTO new_org_id;

  INSERT INTO public.profiles (user_id, organization_id, full_name)
  VALUES (
    NEW.id,
    new_org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');

  RETURN NEW;
END;
$function$;
