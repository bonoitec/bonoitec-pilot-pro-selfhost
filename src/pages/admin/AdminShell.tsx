import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, ClipboardList, MailWarning } from "lucide-react";

/**
 * AdminShell — top-level layout for /admin pages.
 * Intentionally DOES NOT include AppSidebar, customer header, or trial banner.
 * Admin is a separate visual context from the customer app.
 */
export function AdminShell({
  children,
  onOpenAudit,
  onOpenFailedEmails,
  failedEmailsBadge,
}: {
  children: ReactNode;
  onOpenAudit?: () => void;
  onOpenFailedEmails?: () => void;
  failedEmailsBadge?: number;
}) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-5 border-b border-border/40 bg-card/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-sm shadow-primary/20">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold font-display tracking-tight">BonoitecPilot Admin</span>
            <span className="text-[10px] text-muted-foreground">Vue plateforme</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onOpenFailedEmails && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-8 relative"
              onClick={onOpenFailedEmails}
              title="Emails non délivrés"
            >
              <MailWarning className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Emails</span>
              {failedEmailsBadge !== undefined && failedEmailsBadge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                  {failedEmailsBadge > 99 ? "99+" : failedEmailsBadge}
                </span>
              )}
            </Button>
          )}
          {onOpenAudit && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-8"
              onClick={onOpenAudit}
              title="Historique des actions admin"
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Historique</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 h-8"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Déconnexion</span>
          </Button>
        </div>
      </header>

      {/* Main full-width content */}
      <main className="flex-1 px-5 py-6 max-w-[1400px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
