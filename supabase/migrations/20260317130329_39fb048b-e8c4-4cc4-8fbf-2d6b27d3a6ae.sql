-- Critical multi-tenant hardening: scope roles by organization
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS organization_id uuid;

-- Backfill role organization from existing user profiles
UPDATE public.user_roles ur
SET organization_id = p.organization_id
FROM public.profiles p
WHERE p.user_id = ur.user_id
  AND ur.organization_id IS NULL;

-- Enforce organization-scoped role integrity
ALTER TABLE public.user_roles
ALTER COLUMN organization_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_roles_organization_id_fkey'
      AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_org_role_key
ON public.user_roles (user_id, organization_id, role);

CREATE INDEX IF NOT EXISTS idx_user_roles_org_user
ON public.user_roles (organization_id, user_id);

-- Role check must be scoped to caller's organization to prevent cross-tenant privilege bleed
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id <> auth.uid() THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = _user_id
        AND ur.organization_id = public.get_user_org_id()
        AND ur.role = _role
    )
  END
$$;

-- Ensure new user bootstrap writes org-scoped admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'admin');

  RETURN NEW;
END;
$$;

-- Recreate user_roles policies with strict org scoping
DROP POLICY IF EXISTS "Admins can manage roles in own org" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles in own org"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  organization_id = public.get_user_org_id()
  AND public.has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
      AND p.organization_id = user_roles.organization_id
  )
)
WITH CHECK (
  organization_id = public.get_user_org_id()
  AND public.has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
      AND p.organization_id = user_roles.organization_id
  )
);

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND organization_id = public.get_user_org_id()
);