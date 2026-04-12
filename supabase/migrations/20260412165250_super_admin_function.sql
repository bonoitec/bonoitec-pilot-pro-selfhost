-- C5 part 2: is_super_admin() RPC + grants.
-- Depends on the 'super_admin' enum value added in the previous migration.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'::public.app_role
  );
$function$;

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
