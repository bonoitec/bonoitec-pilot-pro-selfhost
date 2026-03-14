import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Percent, Package, BarChart3 } from "lucide-react";
import { calculateMargin, getPartsTotal } from "@/lib/margin";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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

function fmt(n: number) {
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k €";
  return n.toFixed(0) + " €";
}

export function ProfitabilitySection() {
  const [period, setPeriod] = useState<string>("30d");

  const { data: org } = useQuery({
    queryKey: ["org-vat-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_org_safe_data").single();
      if (error) throw error;
      return data;
    },
    staleTime: 60000,
  });

  const { data: repairs = [], isLoading } = useQuery({
    queryKey: ["profitability-repairs", period],
    queryFn: async () => {
      const from = getDateFilter(period);
      const { data, error } = await supabase
        .from("repairs")
        .select("id, reference, final_price, estimated_price, parts_used, labor_cost, status, created_at, clients(name)")
        .gte("created_at", from)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const vatEnabled = org?.vat_enabled ?? false;
  const vatRate = org?.vat_rate ?? 20;

  // Calculate margins for all completed repairs
  const completedRepairs = repairs.filter(r =>
    ["termine", "pret_a_recuperer"].includes(r.status) && (r.final_price ?? r.estimated_price ?? 0) > 0
  );

  const marginData = completedRepairs.map(r => {
    const sellingPrice = r.final_price ?? r.estimated_price ?? 0;
    const partsCost = getPartsTotal(r.parts_used);
    const laborCost = Number((r as any).labor_cost ?? 0);
    const result = calculateMargin({ sellingPrice, partsCost, laborCost, vatEnabled, vatRate });
    return { ...r, margin: result };
  });

  const totalRevenue = marginData.reduce((s, r) => s + r.margin.revenueHT, 0);
  const totalCost = marginData.reduce((s, r) => s + r.margin.totalCost, 0);
  const totalMargin = marginData.reduce((s, r) => s + r.margin.grossMargin, 0);
  const avgMarginPercent = marginData.length > 0
    ? marginData.reduce((s, r) => s + r.margin.marginPercent, 0) / marginData.length
    : 0;

  const sorted = [...marginData].sort((a, b) => b.margin.grossMargin - a.margin.grossMargin);
  const bestRepairs = sorted.slice(0, 3);
  const worstRepairs = sorted.slice(-3).reverse();

  // Chart data: group by week/day depending on period
  const chartData = (() => {
    if (marginData.length === 0) return [];
    const groups: Record<string, { label: string; revenue: number; margin: number; cost: number }> = {};
    marginData.forEach(r => {
      const d = new Date(r.created_at);
      const key = period === "year"
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!groups[key]) groups[key] = { label: key, revenue: 0, margin: 0, cost: 0 };
      groups[key].revenue += r.margin.revenueHT;
      groups[key].margin += r.margin.grossMargin;
      groups[key].cost += r.margin.totalCost;
    });
    return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
  })();

  const kpis = [
    {
      label: vatEnabled ? "CA HT" : "Chiffre d'affaires",
      value: fmt(totalRevenue),
      icon: DollarSign,
      gradient: true,
    },
    {
      label: "Coût pièces",
      value: fmt(totalCost),
      icon: Package,
      color: "text-muted-foreground",
    },
    {
      label: "Marge totale",
      value: fmt(totalMargin),
      icon: totalMargin >= 0 ? TrendingUp : TrendingDown,
      color: totalMargin >= 0 ? "text-success" : "text-destructive",
    },
    {
      label: "Marge moyenne",
      value: `${avgMarginPercent.toFixed(1)}%`,
      icon: Percent,
      color: avgMarginPercent >= 40 ? "text-success" : avgMarginPercent >= 20 ? "text-warning" : "text-destructive",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <BarChart3 className="h-4.5 w-4.5 text-primary" />
            Rentabilité
            {vatEnabled && (
              <Badge variant="outline" className="text-[10px] ml-1">TVA {vatRate}%</Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            {periods.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium ${
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
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : completedRepairs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Aucune réparation terminée sur cette période
          </div>
        ) : (
          <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {kpis.map(kpi => (
                <div key={kpi.label} className="rounded-xl bg-muted/30 p-3 border border-border/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <kpi.icon className={`h-3.5 w-3.5 ${kpi.gradient ? "text-primary" : kpi.color}`} />
                    <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
                  </div>
                  <p className={`text-lg font-bold ${kpi.gradient ? "gradient-text" : ""}`}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            {chartData.length > 1 && (
              <div className="h-48 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                      formatter={(value: number) => `${value.toFixed(0)} €`}
                    />
                    <Bar dataKey="revenue" name="CA" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="margin" name="Marge" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Best / Worst */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-success flex items-center gap-1 mb-2">
                  <TrendingUp className="h-3 w-3" />Plus rentables
                </p>
                <div className="space-y-1.5">
                  {bestRepairs.map(r => (
                    <div key={r.id} className="flex items-center justify-between text-sm bg-success/5 rounded-lg px-3 py-2 border border-success/10">
                      <div className="min-w-0">
                        <span className="font-mono text-xs text-muted-foreground">{r.reference}</span>
                        <p className="text-xs truncate">{(r as any).clients?.name ?? "—"}</p>
                      </div>
                      <span className="text-success font-bold text-sm shrink-0 ml-2">+{r.margin.grossMargin.toFixed(0)} €</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-destructive flex items-center gap-1 mb-2">
                  <TrendingDown className="h-3 w-3" />Moins rentables
                </p>
                <div className="space-y-1.5">
                  {worstRepairs.map(r => (
                    <div key={r.id} className="flex items-center justify-between text-sm bg-destructive/5 rounded-lg px-3 py-2 border border-destructive/10">
                      <div className="min-w-0">
                        <span className="font-mono text-xs text-muted-foreground">{r.reference}</span>
                        <p className="text-xs truncate">{(r as any).clients?.name ?? "—"}</p>
                      </div>
                      <span className={`font-bold text-sm shrink-0 ml-2 ${r.margin.grossMargin >= 0 ? "text-warning" : "text-destructive"}`}>
                        {r.margin.grossMargin >= 0 ? "+" : ""}{r.margin.grossMargin.toFixed(0)} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
