import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, ArrowRight } from "lucide-react";

const mockQuotes = [
  { id: "DEV-001", client: "Jean Dupont", device: "iPhone 14", description: "Remplacement écran", total: "189 €", status: "Envoyé", date: "09/03/2026" },
  { id: "DEV-002", client: "Marie Martin", device: "MacBook Pro", description: "Diagnostic + réparation carte mère", total: "350 €", status: "En attente", date: "08/03/2026" },
  { id: "DEV-003", client: "Luc Bernard", device: "PS5", description: "Nettoyage + pâte thermique", total: "79 €", status: "Accepté", date: "07/03/2026" },
  { id: "DEV-004", client: "Claire Petit", device: "iPad Air", description: "Remplacement écran tactile", total: "249 €", status: "Refusé", date: "06/03/2026" },
];

const statusColors: Record<string, string> = {
  "En attente": "bg-muted text-muted-foreground",
  "Envoyé": "bg-info/10 text-info",
  "Accepté": "bg-success/10 text-success",
  "Refusé": "bg-destructive/10 text-destructive",
};

const Quotes = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Devis</h1>
          <p className="text-muted-foreground text-sm">Créez et gérez vos devis</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Nouveau devis</Button>
      </div>

      <div className="space-y-3">
        {mockQuotes.map((quote) => (
          <Card key={quote.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{quote.id}</span>
                    <Badge variant="secondary" className={statusColors[quote.status]}>{quote.status}</Badge>
                  </div>
                  <p className="text-sm mt-1">{quote.client} — {quote.device}</p>
                  <p className="text-xs text-muted-foreground">{quote.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-bold">{quote.total}</p>
                  <p className="text-xs text-muted-foreground">{quote.date}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" title="Envoyer"><Send className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" title="Convertir en réparation"><ArrowRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Quotes;
