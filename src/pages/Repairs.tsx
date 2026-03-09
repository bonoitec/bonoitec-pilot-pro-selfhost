import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, LayoutGrid, List, Calendar } from "lucide-react";

const statuses = [
  "Nouveau",
  "Diagnostic",
  "En cours",
  "En attente de pièce",
  "Terminé",
  "Prêt à récupérer",
] as const;

const statusColors: Record<string, string> = {
  "Nouveau": "bg-info/10 text-info border-info/20",
  "Diagnostic": "bg-warning/10 text-warning border-warning/20",
  "En cours": "bg-primary/10 text-primary border-primary/20",
  "En attente de pièce": "bg-muted text-muted-foreground border-border",
  "Terminé": "bg-success/10 text-success border-success/20",
  "Prêt à récupérer": "bg-accent text-accent-foreground border-accent-foreground/20",
};

const mockRepairs = [
  { id: "REP-001", client: "Jean Dupont", device: "iPhone 14", issue: "Écran cassé", status: "En cours", tech: "Sophie", date: "2026-03-09", price: "189 €" },
  { id: "REP-002", client: "Marie Martin", device: "MacBook Pro", issue: "Ne démarre plus", status: "Diagnostic", tech: "Marc", date: "2026-03-09", price: "—" },
  { id: "REP-003", client: "Pierre Duval", device: "Samsung S23", issue: "Batterie gonflée", status: "Terminé", tech: "Lucas", date: "2026-03-08", price: "79 €" },
  { id: "REP-004", client: "Claire Petit", device: "iPad Air", issue: "Écran tactile HS", status: "En attente de pièce", tech: "Emma", date: "2026-03-08", price: "149 €" },
  { id: "REP-005", client: "Luc Bernard", device: "PS5", issue: "Surchauffe", status: "Nouveau", tech: "—", date: "2026-03-09", price: "—" },
  { id: "REP-006", client: "Anne Leroy", device: "iPhone 13", issue: "Connecteur charge HS", status: "Prêt à récupérer", tech: "Sophie", date: "2026-03-07", price: "69 €" },
];

const Repairs = () => {
  const [search, setSearch] = useState("");

  const filtered = mockRepairs.filter(
    (r) =>
      r.client.toLowerCase().includes(search.toLowerCase()) ||
      r.device.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Réparations</h1>
          <p className="text-muted-foreground text-sm">Gérez toutes vos interventions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle réparation
        </Button>
      </div>

      <Tabs defaultValue="kanban">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <TabsList>
            <TabsTrigger value="kanban"><LayoutGrid className="h-4 w-4 mr-1" />Kanban</TabsTrigger>
            <TabsTrigger value="list"><List className="h-4 w-4 mr-1" />Liste</TabsTrigger>
            <TabsTrigger value="calendar"><Calendar className="h-4 w-4 mr-1" />Calendrier</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="kanban" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {statuses.map((status) => {
              const items = filtered.filter((r) => r.status === status);
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={`text-xs ${statusColors[status]}`}>
                      {status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{items.length}</span>
                  </div>
                  {items.map((repair) => (
                    <Card key={repair.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <p className="text-xs font-mono text-muted-foreground">{repair.id}</p>
                        <p className="text-sm font-medium mt-1">{repair.client}</p>
                        <p className="text-xs text-muted-foreground">{repair.device}</p>
                        <p className="text-xs text-muted-foreground mt-1">{repair.issue}</p>
                        {repair.tech !== "—" && (
                          <p className="text-xs text-primary mt-2">👤 {repair.tech}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium">ID</th>
                      <th className="text-left p-3 font-medium">Client</th>
                      <th className="text-left p-3 font-medium">Appareil</th>
                      <th className="text-left p-3 font-medium">Problème</th>
                      <th className="text-left p-3 font-medium">Statut</th>
                      <th className="text-left p-3 font-medium">Technicien</th>
                      <th className="text-left p-3 font-medium">Prix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((repair) => (
                      <tr key={repair.id} className="border-b hover:bg-muted/20 transition-colors cursor-pointer">
                        <td className="p-3 font-mono text-xs">{repair.id}</td>
                        <td className="p-3">{repair.client}</td>
                        <td className="p-3 text-muted-foreground">{repair.device}</td>
                        <td className="p-3 text-muted-foreground">{repair.issue}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-xs ${statusColors[repair.status]}`}>
                            {repair.status}
                          </Badge>
                        </td>
                        <td className="p-3">{repair.tech}</td>
                        <td className="p-3 font-medium">{repair.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Vue calendrier — Bientôt disponible</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Repairs;
