import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { BarChart3, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateInsights, type InsightCard } from "@/lib/generateInsights";

const periods = [
  { key: "7d", label: "7 jours" },
  { key: "30d", label: "30 jours" },
  { key: "month", label: "Ce mois" },
  { key: "year", label: "Cette année" },
] as const;

function getDateFilter(period: string): string {
  const now = new Date();
  switch (period) {
    case "7d": return new Date(now.getTime() - 7 * 86400000).toISOString();
    case "30d": return new Date(now.getTime() - 30 * 86400000).toISOString();
    case "month": return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    case "year": return new Date(now.getFullYear(), 0, 1).toISOString();
    default: return new Date(now.getTime() - 30 * 86400000).toISOString();
  }
}

function getPreviousDateFilter(period: string): [string, string] {
  const now = new Date();
  switch (period) {
    case "7d": return [new Date(now.getTime() - 14 * 86400000).toISOString(), new Date(now.getTime() - 7 * 86400000).toISOString()];
    case "30d": return [new Date(now.getTime() - 60 * 86400000).toISOString(), new Date(now.getTime() - 30 * 86400000).toISOString()];
    case "month": {
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 1);
      return [prevStart.toISOString(), prevEnd.toISOString()];
    }
    case "year": {
      const prevStart = new Date(now.getFullYear() - 1, 0, 1);
      const prevEnd = new Date(now.getFullYear(), 0, 1);
      return [prevStart.toISOString(), prevEnd.toISOString()];
    }
    default: return [new Date(now.getTime() - 60 * 86400000).toISOString(), new Date(now.getTime() - 30 * 86400000).toISOString()];
  }
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];

const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
  if (trend === "up") return <TrendingUp className="h-3 w-3" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
};

const trendColor = (trend: "up" | "down" | "stable") => {
  if (trend === "up") return "bg-success/10 text-success";
  if (trend === "down") return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
};

export default function Statistics() {
  const [period, setPeriod] = useState<string>("30d");
  const dateFrom = getDateFilter(period);
  const [prevFrom, prevTo] = getPreviousDateFilter(period);

  const { data: repairs = [], isLoading: loadingRepairs } = useQuery({
    queryKey: ["stats-repairs", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repairs")
        .select("id, status, issue, final_price, estimated_price, parts_used, services_used, labor_cost, payment_method, client_id, created_at, repair_started_at, repair_ended_at, devices(brand, model), clients(name)")
        .gte("created_at", dateFrom)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: prevRepairs = [] } = useQuery({
    queryKey: ["stats-prev-repairs", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repairs")
        .select("id, status, issue, final_price, estimated_price, parts_used, services_used, labor_cost, payment_method, client_id, created_at, repair_started_at, repair_ended_at, devices(brand, model), clients(name)")
        .gte("created_at", prevFrom)
        .lt("created_at", prevTo)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["stats-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("id, name, quantity, min_quantity, buy_price, sell_price, category, compatible_brand");
      if (error) throw error;
      return data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["stats-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["stats-invoices", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, total_ttc, paid_amount, payment_method, status, created_at")
        .gte("created_at", dateFrom)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const isLoading = loadingRepairs;

  // Generate dynamic insights
  const insights = useMemo(() => {
    if (repairs.length === 0 && clients.length === 0) return [];
    return generateInsights(repairs as any, inventory as any, clients as any, invoices as any, prevRepairs as any);
  }, [repairs, inventory, clients, invoices, prevRepairs]);

  // Build charts from real data
  const brandData = useMemo(() => {
    const counts: Record<string, number> = {};
    repairs.forEach(r => {
      const brand = r.devices?.brand || "Autre";
      counts[brand] = (counts[brand] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [repairs]);

  const repairTrends = useMemo(() => {
    const groups: Record<string, Record<string, number>> = {};
    repairs.forEach(r => {
      const d = new Date(r.created_at);
      const key = period === "year"
        ? `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear().toString().slice(2)}`
        : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!groups[key]) groups[key] = {};
      const brand = r.devices?.brand || "Autre";
      groups[key][brand] = (groups[key][brand] || 0) + 1;
    });
    const allBrands = [...new Set(repairs.map(r => r.devices?.brand || "Autre"))].slice(0, 4);
    return {
      data: Object.entries(groups)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([label, brands]) => ({ label, ...brands })),
      brands: allBrands,
    };
  }, [repairs, period]);

  const topParts = useMemo(() => {
    const usage: Record<string, number> = {};
    repairs.forEach(r => {
      if (Array.isArray(r.parts_used)) {
        (r.parts_used as any[]).forEach((p: any) => {
          const name = p.name || "Pièce inconnue";
          usage[name] = (usage[name] || 0) + Number(p.quantity || 1);
        });
      }
    });
    return Object.entries(usage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [repairs]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Statistiques
          </h1>
          <p className="text-muted-foreground text-sm">Analyse dynamique de votre activité</p>
        </div>
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${
                period === p.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-60 w-full rounded-xl" />
      ) : (
        <>
          {/* Dynamic Insights */}
          {insights.length > 0 && (
            <Card className="border-primary/20 bg-primary/[0.02]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Insights du moment
                  <Badge variant="outline" className="text-[10px] ml-1">Mis à jour quotidiennement</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insights.map((insight, i) => (
                    <div key={i} className="p-4 rounded-lg bg-card border">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{insight.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold">{insight.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className={`${trendColor(insight.trend)} text-xs`}>
                              <TrendIcon trend={insight.trend} />
                              <span className="ml-1">{insight.metric}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {repairs.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Aucune donnée sur cette période</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Les statistiques apparaîtront avec l'activité</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Repair Trends - Real data */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Réparations par marque</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={repairTrends.data}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                      {repairTrends.brands.map((brand, i) => (
                        <Bar key={brand} dataKey={brand} name={brand} fill={COLORS[i % COLORS.length]} radius={[2, 2, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Device breakdown - Real data */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Appareils les plus réparés</CardTitle></CardHeader>
                <CardContent>
                  {brandData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie data={brandData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                            {brandData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value}`, "réparations"]} contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-3 justify-center">
                        {brandData.map((item, i) => (
                          <div key={item.name} className="flex items-center gap-1.5 text-xs">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-muted-foreground">{item.name} ({item.value})</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">Pas de données</div>
                  )}
                </CardContent>
              </Card>

              {/* Top Parts - Real data */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2"><CardTitle className="text-base">Pièces les plus utilisées</CardTitle></CardHeader>
                <CardContent>
                  {topParts.length > 0 ? (
                    <div className="space-y-3">
                      {topParts.map((part, i) => (
                        <div key={part.name} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-6 text-muted-foreground">#{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{part.name}</span>
                              <span className="text-sm text-muted-foreground">{part.count} utilisations</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${(part.count / topParts[0].count) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      Aucune pièce utilisée sur cette période
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
