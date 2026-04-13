import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, CheckCircle2, Clock, XCircle, Euro, TrendingUp, UserPlus, AlertTriangle } from "lucide-react";

type PlatformStats = {
  total_orgs: number;
  active_subs: number;
  active_trials: number;
  expired_trials: number;
  total_users: number;
  total_repairs: number;
  total_revenue_ttc: number;
  signups_7d: number;
  mrr_estimate_eur: number;
  // Phase 2 (not in RPC yet, will be undefined):
  trials_expiring_72h?: number;
  failed_notifications_24h?: number;
};

const euro = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(n));
};

export function StatsBar() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-platform-stats-v2"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("admin_get_platform_stats");
      if (error) throw error;
      return data as PlatformStats;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const cards = [
    { label: "Ateliers", value: data?.total_orgs, icon: Building2, gradient: true },
    { label: "Abonnés actifs", value: data?.active_subs, icon: CheckCircle2, color: "text-success" },
    { label: "Essais en cours", value: data?.active_trials, icon: Clock, color: "text-primary" },
    { label: "Expirés", value: data?.expired_trials, icon: XCircle, color: "text-destructive" },
    { label: "Revenu encaissé", value: data ? euro(data.total_revenue_ttc) : undefined, icon: Euro, color: "text-success" },
    { label: "MRR estimé", value: data ? euro(data.mrr_estimate_eur) : undefined, icon: TrendingUp, gradient: true },
  ];

  // Simple derived alerts — we don't yet have trials_expiring_72h from the RPC,
  // so just show failed notification count if available.
  const alerts: { icon: typeof AlertTriangle; text: string }[] = [];
  if ((data?.failed_notifications_24h ?? 0) > 0) {
    alerts.push({ icon: AlertTriangle, text: `${data!.failed_notifications_24h} emails non délivrés ces 24h` });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.gradient ? "gradient-primary text-primary-foreground shadow-sm shadow-primary/20" : "bg-muted"}`}>
                  <c.icon className={`h-4 w-4 ${c.gradient ? "" : c.color ?? ""}`} />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-14 rounded-lg" />
              ) : (
                <p className={`text-2xl font-bold font-display ${c.gradient ? "gradient-text" : ""}`}>
                  {c.value ?? "—"}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {alerts.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="p-4 space-y-1.5">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <a.icon className="h-4 w-4 text-warning shrink-0" />
                <span className="text-foreground/90">{a.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
