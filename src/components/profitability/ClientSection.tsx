import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, UserCheck, TrendingUp, TrendingDown } from "lucide-react";

interface ClientSectionProps {
  period: string;
  dateFrom: string;
}

export function ClientSection({ period, dateFrom }: ClientSectionProps) {
  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ["profitability-clients", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: repairs = [] } = useQuery({
    queryKey: ["profitability-client-repairs", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repairs")
        .select("id, client_id, final_price, estimated_price, status, created_at")
        .gte("created_at", dateFrom)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const newClients = clients.filter(c => new Date(c.created_at) >= new Date(dateFrom));
  const totalClients = clients.length;

  // Clients with multiple repairs = recurring
  const clientRepairCount: Record<string, number> = {};
  repairs.forEach(r => {
    if (r.client_id) {
      clientRepairCount[r.client_id] = (clientRepairCount[r.client_id] || 0) + 1;
    }
  });
  const recurringClients = Object.values(clientRepairCount).filter(c => c > 1).length;
  const activeClients = Object.keys(clientRepairCount).length;

  // Average basket per client
  const clientRevenue: Record<string, number> = {};
  repairs.forEach(r => {
    if (r.client_id && ["termine", "pret_a_recuperer"].includes(r.status)) {
      const price = r.final_price ?? r.estimated_price ?? 0;
      clientRevenue[r.client_id] = (clientRevenue[r.client_id] || 0) + price;
    }
  });
  const avgBasket = activeClients > 0
    ? Object.values(clientRevenue).reduce((a, b) => a + b, 0) / activeClients
    : 0;

  const returnRate = activeClients > 0 ? (recurringClients / activeClients) * 100 : 0;

  // Recent clients list (last 5 new)
  const recentClients = newClients.slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Client KPIs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Évaluation des clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingClients ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total clients", value: totalClients, icon: Users, color: "text-primary" },
                { label: "Nouveaux", value: newClients.length, icon: UserPlus, color: "text-success" },
                { label: "Récurrents", value: recurringClients, icon: UserCheck, color: "text-warning" },
                { label: "Taux retour", value: `${returnRate.toFixed(0)}%`, icon: returnRate > 20 ? TrendingUp : TrendingDown, color: returnRate > 20 ? "text-success" : "text-muted-foreground" },
              ].map(kpi => (
                <div key={kpi.label} className="rounded-xl bg-muted/30 p-3 border border-border/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                    <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
                  </div>
                  <p className="text-lg font-bold">{kpi.value}</p>
                </div>
              ))}
              <div className="col-span-2 rounded-xl bg-muted/30 p-3 border border-border/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] text-muted-foreground">Panier moyen / client</span>
                </div>
                <p className="text-lg font-bold">{avgBasket.toFixed(0)} €</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Clients List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-success" />
            Nouveaux clients
            {newClients.length > 0 && (
              <Badge variant="success" className="text-[10px]">+{newClients.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingClients ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : recentClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Aucun nouveau client sur cette période
            </div>
          ) : (
            <div className="space-y-2">
              {recentClients.map(c => {
                const repairCount = clientRepairCount[c.id] || 0;
                const date = new Date(c.created_at);
                const dateStr = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`;
                return (
                  <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all border border-transparent hover:border-border/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success shrink-0">
                        <UserPlus className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground">{dateStr}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {repairCount} réparation{repairCount !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
