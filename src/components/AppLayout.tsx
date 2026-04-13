import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { Search, LogOut, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TrialBanner } from "@/components/TrialBanner";
import { TrialExpiredWall } from "@/components/TrialExpiredWall";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useSubscription } from "@/hooks/useSubscription";
import { useEffect, useRef } from "react";
import { useIsSuperAdmin } from "@/lib/superAdmin";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isExpired, isLoading: trialLoading } = useTrialStatus();
  const { checkSubscription, subscribed, isLoading: subLoading } = useSubscription();
  const { isSuperAdmin, isLoading: saLoading } = useIsSuperAdmin();

  // Sticky "first load done" flag. Once all three status queries have resolved
  // at least once, we never show the full-screen loader again — background
  // refetches must not unmount children or users lose form state.
  const firstLoadDoneRef = useRef(false);
  if (!firstLoadDoneRef.current && !trialLoading && !subLoading && !saLoading) {
    firstLoadDoneRef.current = true;
  }
  const showInitialLoader = !firstLoadDoneRef.current && (trialLoading || subLoading || saLoading);

  // Handle checkout success at layout level (before TrialExpiredWall blocks Outlet).
  // checkSubscription is intentionally OMITTED from deps — its identity changes on
  // token refresh and would retrigger this effect unnecessarily. The ref stays stable.
  const checkSubscriptionRef = useRef(checkSubscription);
  checkSubscriptionRef.current = checkSubscription;
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Paiement réussi ! Votre abonnement est maintenant actif.");
      checkSubscriptionRef.current();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  // Full-screen loader ONLY on very first load — never on background refetches,
  // so in-flight forms don't get unmounted when the subscription poll / super-admin
  // check / trial status refetches in the background.
  if (showInitialLoader) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Block access if trial expired — super admin bypasses all restrictions
  if (isExpired && !subscribed && !isSuperAdmin) {
    return <TrialExpiredWall />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-border/40 px-4 bg-card/60 backdrop-blur-xl sticky top-0 z-30">
            <SidebarTrigger className="shrink-0" />
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Rechercher client, réparation, appareil..."
                className="pl-9 h-9 bg-muted/40 border-0 focus-visible:ring-1 rounded-xl"
                maxLength={200}
              />
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs gradient-primary text-primary-foreground font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                    {user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto space-y-4">
            <TrialBanner />
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
