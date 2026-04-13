import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsSuperAdmin } from "@/lib/superAdmin";

// Route guard for super-admin-only pages.
// Enforcement is defence-in-depth: the real check is server-side via the
// is_super_admin() RPC called inside every admin_* RPC. This component is
// just a UX guard that hides the page from non-admins and sends them away.
export function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { isSuperAdmin, isLoading: saLoading } = useIsSuperAdmin();

  if (authLoading || saLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
