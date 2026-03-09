
-- 1. Add FK from repairs.technician_id to technicians.id
ALTER TABLE public.repairs
ADD CONSTRAINT repairs_technician_id_fkey
FOREIGN KEY (technician_id) REFERENCES public.technicians(id);

-- 2. Fix profile INSERT policy: restrict organization_id
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Note: The handle_new_user trigger creates the profile with SECURITY DEFINER, 
-- so the INSERT policy is only for edge cases. The real fix is on UPDATE:
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND organization_id = get_user_org_id());

-- 3. Fix admin role management - scope to own org
DROP POLICY IF EXISTS "Admins can manage roles in own org" ON public.user_roles;
CREATE POLICY "Admins can manage roles in own org"
ON public.user_roles FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.profiles p1 
    WHERE p1.user_id = auth.uid() 
    AND p1.organization_id = (
      SELECT p2.organization_id FROM public.profiles p2 WHERE p2.user_id = user_roles.user_id LIMIT 1
    )
  )
);

-- 4. Remove overly permissive anon repair tracking policy
DROP POLICY IF EXISTS "Public can view repair by tracking code" ON public.repairs;

-- 5. Remove overly permissive anon deposit codes policy
DROP POLICY IF EXISTS "Public can read active deposit codes" ON public.deposit_codes;

-- 6. Create secure RPC for tracking code lookup (returns limited fields)
CREATE OR REPLACE FUNCTION public.get_repair_by_tracking_code(_code text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'id', r.id,
    'reference', r.reference,
    'status', r.status,
    'issue', r.issue,
    'technician_message', r.technician_message,
    'photos', r.photos,
    'estimated_completion', r.estimated_completion,
    'created_at', r.created_at,
    'updated_at', r.updated_at,
    'device_brand', d.brand,
    'device_model', d.model
  )
  FROM public.repairs r
  LEFT JOIN public.devices d ON d.id = r.device_id
  WHERE r.tracking_code = _code
  LIMIT 1
$$;

-- 7. Create secure RPC for deposit code validation
CREATE OR REPLACE FUNCTION public.validate_deposit_code(_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deposit_codes WHERE code = _code AND active = true
  )
$$;
