import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// C5: Super-admin check is now server-side via RPC `is_super_admin()`.
// The email-based allowlist that used to live here has been removed to avoid
// leaking credentials in client-side code.
//
// Use `useIsSuperAdmin()` in React components — it's cached via react-query.

export function useIsSuperAdmin(): { isSuperAdmin: boolean; isLoading: boolean } {
  const { session } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["is_super_admin", session?.user?.id],
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_super_admin");
      if (error) return false;
      return Boolean(data);
    },
  });
  return { isSuperAdmin: Boolean(data), isLoading };
}
