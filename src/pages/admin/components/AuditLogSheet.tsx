import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Building2, User, Shield, AlertCircle, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type AuditRow = {
  id: string;
  action: string;
  target_type: "organization" | "user" | "platform";
  target_id: string | null;
  target_description: string | null;
  details: Record<string, unknown>;
  created_at: string;
  actor_id: string;
  actor_email: string | null;
  actor_name: string | null;
};

type AuditResponse = { total: number; rows: AuditRow[] };

const actionLabel: Record<string, string> = {
  update_organization: "Modifier infos atelier",
  extend_trial: "Prolonger essai",
  grant_subscription: "Offrir abonnement",
  set_subscription_active: "Activer/suspendre abonnement",
  delete_organization: "Supprimer atelier",
  update_user: "Modifier utilisateur",
  change_user_role: "Changer rôle",
  verify_user_email: "Valider email",
  delete_user: "Supprimer utilisateur",
  reset_password: "Réinitialiser mot de passe",
  promote_super_admin: "Promouvoir super-admin",
  create_blog: "Créer un article",
  update_blog: "Modifier un article",
  delete_blog: "Supprimer un article",
  publish_blog: "Publier un article",
  unpublish_blog: "Dépublier un article",
};

function targetIcon(type: string) {
  if (type === "organization") return <Building2 className="h-3.5 w-3.5" />;
  if (type === "user") return <User className="h-3.5 w-3.5" />;
  if (type === "blog") return <FileText className="h-3.5 w-3.5" />;
  return <Shield className="h-3.5 w-3.5" />;
}

function rel(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: fr });
  } catch {
    return iso;
  }
}

export function AuditLogSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, isLoading, error } = useQuery<AuditResponse>({
    queryKey: ["admin-audit-log"],
    enabled: open,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("admin_get_audit_log", { _limit: 100 });
      if (error) throw error;
      return data as AuditResponse;
    },
  });

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display">
            <ClipboardList className="h-5 w-5 text-primary" />
            Historique des actions
          </SheetTitle>
          <SheetDescription>
            {data ? `${data.total} action${data.total !== 1 ? "s" : ""} au total` : "Chargement…"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-2">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="h-4 w-4" />
              Erreur de chargement
            </div>
          )}

          {isLoading && (
            <>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </>
          )}

          {!isLoading && data?.rows.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Aucune action enregistrée.</p>
          )}

          {!isLoading && data?.rows.map((row) => (
            <div key={row.id} className="rounded-lg border border-border/40 bg-card p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {targetIcon(row.target_type)}
                  <span className="font-medium truncate">
                    {actionLabel[row.action] ?? row.action}
                  </span>
                </div>
                <Badge variant="outline" className="text-[9px] shrink-0">{row.target_type}</Badge>
              </div>

              {row.target_description && (
                <div className="text-muted-foreground truncate">
                  → <span className="font-medium text-foreground">{row.target_description}</span>
                </div>
              )}

              {(() => {
                const reason = (row.details as { reason?: unknown })?.reason;
                return reason && typeof reason === "string" ? (
                  <div className="text-muted-foreground italic">« {reason} »</div>
                ) : null;
              })()}

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                <span className="truncate">{row.actor_name ?? row.actor_email ?? "?"}</span>
                <span>{rel(row.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
