import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Send, ArrowRight } from "lucide-react";
import { format } from "date-fns";

const statusLabels: Record<string, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
};

const statusColors: Record<string, string> = {
  brouillon: "bg-muted text-muted-foreground",
  envoye: "bg-info/10 text-info",
  accepte: "bg-success/10 text-success",
  refuse: "bg-destructive/10 text-destructive",
};

const Quotes = () => {
  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, clients(name), devices(brand, model)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Devis</h1>
          <p className="text-muted-foreground text-sm">Créez et gérez vos devis</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Nouveau devis</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : quotes.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun devis trouvé</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{quote.reference}</span>
                    <Badge variant="secondary" className={statusColors[quote.status]}>{statusLabels[quote.status]}</Badge>
                  </div>
                  <p className="text-sm mt-1">{quote.clients?.name ?? "—"} — {quote.devices ? `${quote.devices.brand} ${quote.devices.model}` : "—"}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold">{Number(quote.total_ttc).toFixed(2)} €</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(quote.created_at), "dd/MM/yyyy")}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" title="Envoyer"><Send className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Convertir"><ArrowRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Quotes;
