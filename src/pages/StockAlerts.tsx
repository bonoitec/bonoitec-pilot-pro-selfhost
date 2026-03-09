import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package, ShoppingBag, CheckCircle2 } from "lucide-react";

const StockAlerts = () => {
  const { data: inventory = [], isLoading: loadingInv } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inventory").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: articles = [], isLoading: loadingArt } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const lowParts = inventory.filter(p => p.quantity <= p.min_quantity);
  const lowArticles = articles.filter(a => a.quantity <= a.min_quantity);
  const isLoading = loadingInv || loadingArt;
  const totalAlerts = lowParts.length + lowArticles.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Alertes stock</h1>
        <p className="text-muted-foreground text-sm">Surveillez les niveaux de stock critiques</p>
      </div>

      {isLoading ? <Skeleton className="h-40 w-full" /> : totalAlerts === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
            <p className="font-medium text-success">Tous les stocks sont à niveau</p>
            <p className="text-sm text-muted-foreground mt-1">Aucune alerte de stock faible pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
              <div>
                <p className="font-medium">{totalAlerts} alerte(s) de stock faible</p>
                <p className="text-sm text-muted-foreground">
                  {lowParts.length} pièce(s) détachée(s) · {lowArticles.length} article(s)
                </p>
              </div>
            </CardContent>
          </Card>

          {lowParts.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" />Pièces détachées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lowParts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category}{p.supplier ? ` · ${p.supplier}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />{p.quantity} restant(s)
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">Seuil : {p.min_quantity}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {lowArticles.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><ShoppingBag className="h-4 w-4" />Articles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lowArticles.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <div>
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.category}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />{a.quantity} restant(s)
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">Seuil : {a.min_quantity}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default StockAlerts;
