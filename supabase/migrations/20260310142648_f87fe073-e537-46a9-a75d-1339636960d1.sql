
-- Fix critical privilege escalation: prevent users from changing their organization_id
-- Drop existing vulnerable policies
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Recreate UPDATE policy: user can update own profile BUT cannot change organization_id
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND organization_id = get_user_org_id());

-- Recreate INSERT policy: only allow inserting if org_id matches (set during handle_new_user trigger)
-- This prevents a user from creating a profile pointing to another org
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND organization_id = get_user_org_id());
