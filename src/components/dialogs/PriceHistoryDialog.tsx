import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: { id: string; name: string; buy_price: number } | null;
}

export function PriceHistoryDialog({ open, onOpenChange, part }: Props) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["price-history", part?.id],
    enabled: !!part?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_price_history")
        .select("*")
        .eq("inventory_id", part!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Chart data: chronological order
  const chartData = [...history]
    .reverse()
    .map((h: any) => ({
      date: format(new Date(h.created_at), "dd/MM/yy", { locale: fr }),
      prix: Number(h.new_price),
    }));

  const getDiffIcon = (oldP: number, newP: number) => {
    if (newP > oldP) return <TrendingUp className="h-3.5 w-3.5 text-destructive" />;
    if (newP < oldP) return <TrendingDown className="h-3.5 w-3.5 text-green-500" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const getDiffPercent = (oldP: number, newP: number) => {
    if (oldP === 0) return null;
    return ((newP - oldP) / oldP) * 100;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Historique des prix d'achat</DialogTitle>
          <DialogDescription>{part?.name} — Prix actuel : {Number(part?.buy_price ?? 0).toFixed(2)} €</DialogDescription>
        </DialogHeader>

        {/* Chart */}
        {!isLoading && chartData.length >= 2 && (
          <div className="h-48 w-full mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" unit=" €" width={60} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 13, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  formatter={(value: number) => [`${value.toFixed(2)} €`, "Prix d'achat"]}
                />
                <Line type="monotone" dataKey="prix" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="max-h-[40vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Aucun changement de prix enregistré pour cette pièce.
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((h: any) => {
                const pct = getDiffPercent(Number(h.old_price), Number(h.new_price));
                const isUp = Number(h.new_price) > Number(h.old_price);
                return (
                  <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20">
                    <div className="shrink-0">{getDiffIcon(Number(h.old_price), Number(h.new_price))}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground line-through">{Number(h.old_price).toFixed(2)} €</span>
                        <span className="font-medium">→ {Number(h.new_price).toFixed(2)} €</span>
                        {pct !== null && (
                          <Badge variant={isUp ? "destructive" : "secondary"} className="text-xs">
                            {isUp ? "+" : ""}{pct.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{format(new Date(h.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}</span>
                        {h.supplier && <span>• {h.supplier}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}