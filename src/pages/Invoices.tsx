import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Download, Eye } from "lucide-react";
import { format } from "date-fns";

const statusLabels: Record<string, string> = {
  brouillon: "Brouillon",
  envoyee: "Envoyée",
  payee: "Payée",
  partiel: "Partiel",
  annulee: "Annulée",
};

const statusColors: Record<string, string> = {
  brouillon: "bg-muted text-muted-foreground",
  envoyee: "bg-info/10 text-info",
  payee: "bg-success/10 text-success",
  partiel: "bg-warning/10 text-warning",
  annulee: "bg-destructive/10 text-destructive",
};

const paymentLabels: Record<string, string> = {
  cb: "CB",
  especes: "Espèces",
  virement: "Virement",
  cheque: "Chèque",
  autre: "Autre",
};

const Invoices = () => {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Factures</h1>
          <p className="text-muted-foreground text-sm">Suivi de facturation et paiements</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Nouvelle facture</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-60 w-full" />
      ) : invoices.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune facture trouvée</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">N°</th>
                    <th className="text-left p-3 font-medium">Client</th>
                    <th className="text-right p-3 font-medium">HT</th>
                    <th className="text-right p-3 font-medium">TTC</th>
                    <th className="text-center p-3 font-medium">Statut</th>
                    <th className="text-center p-3 font-medium">Paiement</th>
                    <th className="text-center p-3 font-medium">Date</th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono text-xs">{inv.reference}</td>
                      <td className="p-3">{inv.clients?.name ?? "—"}</td>
                      <td className="p-3 text-right text-muted-foreground">{Number(inv.total_ht).toFixed(2)} €</td>
                      <td className="p-3 text-right font-medium">{Number(inv.total_ttc).toFixed(2)} €</td>
                      <td className="p-3 text-center">
                        <Badge variant="secondary" className={statusColors[inv.status]}>{statusLabels[inv.status]}</Badge>
                      </td>
                      <td className="p-3 text-center text-xs text-muted-foreground">{inv.payment_method ? paymentLabels[inv.payment_method] ?? inv.payment_method : "—"}</td>
                      <td className="p-3 text-center text-xs text-muted-foreground">{format(new Date(inv.created_at), "dd/MM/yyyy")}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Invoices;
