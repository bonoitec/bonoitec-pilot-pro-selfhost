import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Eye } from "lucide-react";

const mockInvoices = [
  { id: "FAC-001", client: "Pierre Duval", device: "Samsung S23", description: "Remplacement batterie", total: "79 €", tva: "13,17 €", status: "Payée", date: "08/03/2026", method: "CB" },
  { id: "FAC-002", client: "Anne Leroy", device: "iPhone 13", description: "Connecteur de charge", total: "69 €", tva: "11,50 €", status: "Payée", date: "07/03/2026", method: "Espèces" },
  { id: "FAC-003", client: "Jean Dupont", device: "iPhone 14", description: "Remplacement écran", total: "189 €", tva: "31,50 €", status: "En attente", date: "09/03/2026", method: "—" },
  { id: "FAC-004", client: "Claire Petit", device: "iPad Air", description: "Écran tactile", total: "249 €", tva: "41,50 €", status: "Partiel", date: "08/03/2026", method: "CB" },
];

const statusColors: Record<string, string> = {
  "Payée": "bg-success/10 text-success",
  "En attente": "bg-warning/10 text-warning",
  "Partiel": "bg-info/10 text-info",
};

const Invoices = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Factures</h1>
          <p className="text-muted-foreground text-sm">Suivi de facturation et paiements</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Nouvelle facture</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium">N°</th>
                  <th className="text-left p-3 font-medium">Client</th>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-right p-3 font-medium">HT</th>
                  <th className="text-right p-3 font-medium">TVA</th>
                  <th className="text-right p-3 font-medium">TTC</th>
                  <th className="text-center p-3 font-medium">Statut</th>
                  <th className="text-center p-3 font-medium">Paiement</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono text-xs">{inv.id}</td>
                    <td className="p-3">{inv.client}</td>
                    <td className="p-3 text-muted-foreground">{inv.description}</td>
                    <td className="p-3 text-right text-muted-foreground">{inv.tva}</td>
                    <td className="p-3 text-right text-muted-foreground">{inv.tva}</td>
                    <td className="p-3 text-right font-medium">{inv.total}</td>
                    <td className="p-3 text-center">
                      <Badge variant="secondary" className={statusColors[inv.status]}>{inv.status}</Badge>
                    </td>
                    <td className="p-3 text-center text-xs text-muted-foreground">{inv.method}</td>
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
    </div>
  );
};

export default Invoices;
