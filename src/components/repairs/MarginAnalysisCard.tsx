import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, DollarSign, Percent, Calculator, Package, Wrench as WrenchIcon } from "lucide-react";
import { calculateMargin, getPartsTotal, getServicesTotal, type MarginResult } from "@/lib/margin";

interface Props {
  repair: any;
}

function fmt(n: number) {
  return n.toFixed(2).replace(/\.00$/, "") + " €";
}

export function MarginAnalysisCard({ repair }: Props) {
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

  const sellingPrice = repair.final_price ?? repair.estimated_price ?? 0;
  const partsCost = getPartsTotal(repair.parts_used);
  const laborCost = Number(repair.labor_cost ?? 0);
  const servicesTotal = getServicesTotal(repair.services_used);

  // If no selling price set but services exist, use services total as revenue
  const effectiveSellingPrice = sellingPrice > 0 ? sellingPrice : servicesTotal;

  if (sellingPrice <= 0 && partsCost <= 0 && laborCost <= 0) return null;

  const vatEnabled = org?.vat_enabled ?? false;
  const vatRate = org?.vat_rate ?? 20;

  const margin: MarginResult = calculateMargin({
    sellingPrice,
    partsCost,
    laborCost,
    vatEnabled,
    vatRate,
  });

  const LevelIcon = margin.level === "good" ? TrendingUp : margin.level === "medium" ? Minus : TrendingDown;

  const bgLevel = margin.level === "good"
    ? "bg-success/10 border-success/20"
    : margin.level === "medium"
    ? "bg-warning/10 border-warning/20"
    : "bg-destructive/10 border-destructive/20";

  return (
    <Card className={`border ${bgLevel}`}>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Analyse de marge
          </span>
          <Badge variant="outline" className={`text-xs ${margin.levelColor} border-current/20`}>
            <LevelIcon className="h-3 w-3 mr-1" />
            {margin.levelLabel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Revenue */}
          <div className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {vatEnabled ? "Prix de vente TTC" : "Prix de vente"}
            </p>
            <p className="font-semibold">{fmt(sellingPrice)}</p>
          </div>

          {vatEnabled && (
            <div className="space-y-0.5">
              <p className="text-[11px] text-muted-foreground">Prix HT</p>
              <p className="font-semibold">{fmt(margin.revenueHT)}</p>
            </div>
          )}

          {/* Costs */}
          <div className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Package className="h-3 w-3" />Coût pièces
            </p>
            <p className="font-medium">{fmt(partsCost)}</p>
          </div>

          {laborCost > 0 && (
            <div className="space-y-0.5">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <WrenchIcon className="h-3 w-3" />Main-d'œuvre
              </p>
              <p className="font-medium">{fmt(laborCost)}</p>
            </div>
          )}

          <div className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground">Coût total</p>
            <p className="font-medium">{fmt(margin.totalCost)}</p>
          </div>

          {vatEnabled && (
            <div className="space-y-0.5">
              <p className="text-[11px] text-muted-foreground">TVA ({vatRate}%)</p>
              <p className="font-medium">{fmt(margin.vatAmount)}</p>
            </div>
          )}
        </div>

        {/* Margin bar */}
        <div className="mt-3 pt-3 border-t border-border/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Percent className="h-3 w-3" />Taux de marge
            </span>
            <span className={`text-sm font-bold ${margin.levelColor}`}>
              {margin.marginPercent.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                margin.level === "good" ? "bg-success" : margin.level === "medium" ? "bg-warning" : "bg-destructive"
              }`}
              style={{ width: `${Math.min(Math.max(margin.marginPercent, 0), 100)}%` }}
            />
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">Marge brute</p>
            <p className={`text-lg font-bold ${margin.levelColor}`}>{fmt(margin.grossMargin)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">Bénéfice estimé</p>
            <p className={`text-lg font-bold ${margin.levelColor}`}>{fmt(margin.estimatedProfit)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
