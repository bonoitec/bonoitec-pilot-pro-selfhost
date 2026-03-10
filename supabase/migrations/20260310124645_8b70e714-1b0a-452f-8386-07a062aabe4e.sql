-- Revoke public execute on has_role to prevent authenticated users from enumerating admin roles
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;

-- Grant only to postgres (owner) so RLS policies still work via SECURITY DEFINER context
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO postgres;