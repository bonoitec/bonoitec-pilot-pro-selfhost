import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, TrendingDown, DollarSign, Percent, Package,
  BarChart3, Calculator, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { calculateMargin, getPartsTotal, type MarginResult } from "@/lib/margin";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { ClientSection } from "@/components/profitability/ClientSection";
import { EncaissementSection } from "@/components/profitability/EncaissementSection";

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
  return n.toFixed(2).replace(/\.00$/, "") + " €";
}

const COLORS = ["hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

const Profitability = () => {
  const [period, setPeriod] = useState<string>("30d");
  const dateFrom = getDateFilter(period);

  const { data: org } = useQuery({
    queryKey: ["org-vat-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("vat_enabled, vat_rate")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 60000,
  });

  const { data: repairs = [], isLoading } = useQuery({
    queryKey: ["profitability-full", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repairs")
        .select("id, reference, final_price, estimated_price, parts_used, labor_cost, status, created_at, clients(name), devices(brand, model)")
        .gte("created_at", dateFrom)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const vatEnabled = org?.vat_enabled ?? false;
  const vatRate = org?.vat_rate ?? 20;

  const completed = repairs.filter(r =>
    ["termine", "pret_a_recuperer"].includes(r.status) && (r.final_price ?? r.estimated_price ?? 0) > 0
  );

  const marginData = completed.map(r => {
    const sellingPrice = r.final_price ?? r.estimated_price ?? 0;
    const partsCost = getPartsTotal(r.parts_used);
    const laborCost = Number((r as any).labor_cost ?? 0);
    return {
      ...r,
      margin: calculateMargin({ sellingPrice, partsCost, laborCost, vatEnabled, vatRate }),
    };
  });

  const totalRevenue = marginData.reduce((s, r) => s + r.margin.revenueHT, 0);
  const totalCost = marginData.reduce((s, r) => s + r.margin.totalCost, 0);
  const totalMargin = marginData.reduce((s, r) => s + r.margin.grossMargin, 0);
  const avgPercent = marginData.length > 0
    ? marginData.reduce((s, r) => s + r.margin.marginPercent, 0) / marginData.length
    : 0;
  const totalProfit = marginData.reduce((s, r) => s + r.margin.estimatedProfit, 0);

  const goodCount = marginData.filter(r => r.margin.level === "good").length;
  const mediumCount = marginData.filter(r => r.margin.level === "medium").length;
  const lowCount = marginData.filter(r => r.margin.level === "low").length;

  const pieData = [
    { name: "Rentable", value: goodCount },
    { name: "À surveiller", value: mediumCount },
    { name: "Peu rentable", value: lowCount },
  ].filter(d => d.value > 0);

  const sorted = [...marginData].sort((a, b) => b.margin.grossMargin - a.margin.grossMargin);

  const timelineData = (() => {
    const groups: Record<string, { label: string; revenue: number; margin: number; count: number }> = {};
    marginData.forEach(r => {
      const d = new Date(r.created_at);
      const key = period === "year"
        ? `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
        : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!groups[key]) groups[key] = { label: key, revenue: 0, margin: 0, count: 0 };
      groups[key].revenue += r.margin.revenueHT;
      groups[key].margin += r.margin.grossMargin;
      groups[key].count++;
    });
    return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
  })();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Marges & Rentabilité
          </h1>
          <div className="text-muted-foreground text-sm flex items-center gap-1">
            Analysez vos performances financières
            {vatEnabled && <Badge variant="outline" className="text-[10px]">TVA {vatRate}%</Badge>}
          </div>
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
      ) : completed.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calculator className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Aucune réparation terminée sur cette période</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Les données apparaîtront ici dès qu'une réparation sera complétée</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Row - Évaluation des ventes */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: vatEnabled ? "CA HT" : "Chiffre d'affaires", value: fmt(totalRevenue), icon: DollarSign, gradient: true },
              { label: "Coût total", value: fmt(totalCost), icon: Package, color: "text-muted-foreground" },
              { label: "Marge totale", value: fmt(totalMargin), icon: totalMargin >= 0 ? TrendingUp : TrendingDown, color: totalMargin >= 0 ? "text-success" : "text-destructive" },
              { label: "Marge moyenne", value: `${avgPercent.toFixed(1)}%`, icon: Percent, color: avgPercent >= 40 ? "text-success" : avgPercent >= 20 ? "text-warning" : "text-destructive" },
              { label: "Bénéfice estimé", value: fmt(totalProfit), icon: totalProfit >= 0 ? ArrowUpRight : ArrowDownRight, color: totalProfit >= 0 ? "text-success" : "text-destructive" },
            ].map(kpi => (
              <Card key={kpi.label} className="hover-lift">
                <CardContent className="p-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl mb-2 ${kpi.gradient ? "gradient-primary text-primary-foreground shadow-sm shadow-primary/20" : "bg-muted"}`}>
                    <kpi.icon className={`h-4 w-4 ${kpi.gradient ? "" : kpi.color}`} />
                  </div>
                  <p className={`text-xl font-bold font-display ${kpi.gradient ? "gradient-text" : ""}`}>{kpi.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Encaissement */}
          <EncaissementSection period={period} dateFrom={dateFrom} />

          {/* Client Section */}
          <ClientSection period={period} dateFrom={dateFrom} />

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display">Évolution</CardTitle>
              </CardHeader>
              <CardContent>
                {timelineData.length > 1 ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(v: number) => `${v.toFixed(0)} €`} />
                        <Line type="monotone" dataKey="revenue" name="CA" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="margin" name="Marge" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(v: number) => `${v.toFixed(0)} €`} />
                        <Bar dataKey="revenue" name="CA" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="margin" name="Marge" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display">Répartition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 flex items-center justify-center">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" label={false}>
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">Pas de données</p>
                  )}
                </div>
                <div className="flex justify-center gap-3 mt-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                      {d.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detail table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display">Détail par réparation</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium">Réf</th>
                      <th className="text-left p-3 font-medium">Client</th>
                      <th className="text-right p-3 font-medium">{vatEnabled ? "Prix HT" : "Prix"}</th>
                      <th className="text-right p-3 font-medium">Coût</th>
                      <th className="text-right p-3 font-medium">Marge</th>
                      <th className="text-right p-3 font-medium">%</th>
                      <th className="text-center p-3 font-medium">État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map(r => (
                      <tr key={r.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono text-xs">{r.reference}</td>
                        <td className="p-3">{(r as any).clients?.name ?? "—"}</td>
                        <td className="p-3 text-right">{fmt(r.margin.revenueHT)}</td>
                        <td className="p-3 text-right text-muted-foreground">{fmt(r.margin.totalCost)}</td>
                        <td className={`p-3 text-right font-medium ${r.margin.levelColor}`}>{fmt(r.margin.grossMargin)}</td>
                        <td className={`p-3 text-right font-medium ${r.margin.levelColor}`}>{r.margin.marginPercent.toFixed(1)}%</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className={`text-[10px] ${r.margin.levelColor} border-current/20`}>
                            {r.margin.levelLabel}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Profitability;
