import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, LayoutGrid, List, Calendar } from "lucide-react";

const statusLabels: Record<string, string> = {
  nouveau: "Nouveau",
  diagnostic: "Diagnostic",
  en_cours: "En cours",
  en_attente_piece: "En attente de pièce",
  termine: "Terminé",
  pret_a_recuperer: "Prêt à récupérer",
};

const statusOrder = ["nouveau", "diagnostic", "en_cours", "en_attente_piece", "termine", "pret_a_recuperer"];

const statusColors: Record<string, string> = {
  nouveau: "bg-info/10 text-info border-info/20",
  diagnostic: "bg-warning/10 text-warning border-warning/20",
  en_cours: "bg-primary/10 text-primary border-primary/20",
  en_attente_piece: "bg-muted text-muted-foreground border-border",
  termine: "bg-success/10 text-success border-success/20",
  pret_a_recuperer: "bg-accent text-accent-foreground border-accent-foreground/20",
};

const Repairs = () => {
  const [search, setSearch] = useState("");

  const { data: repairs = [], isLoading } = useQuery({
    queryKey: ["repairs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repairs")
        .select("*, clients(name), devices(brand, model)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = repairs.filter(
    (r) =>
      (r.clients?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.devices ? `${r.devices.brand} ${r.devices.model}` : "").toLowerCase().includes(search.toLowerCase()) ||
      r.reference.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Réparations</h1>
          <p className="text-muted-foreground text-sm">Gérez toutes vos interventions</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Nouvelle réparation</Button>
      </div>

      <Tabs defaultValue="kanban">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <TabsList>
            <TabsTrigger value="kanban"><LayoutGrid className="h-4 w-4 mr-1" />Kanban</TabsTrigger>
            <TabsTrigger value="list"><List className="h-4 w-4 mr-1" />Liste</TabsTrigger>
          </TabsList>
        </div>

        {isLoading ? (
          <div className="mt-4"><Skeleton className="h-60 w-full" /></div>
        ) : (
          <>
            <TabsContent value="kanban" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {statusOrder.map((status) => {
                  const items = filtered.filter((r) => r.status === status);
                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={`text-xs ${statusColors[status]}`}>{statusLabels[status]}</Badge>
                        <span className="text-xs text-muted-foreground">{items.length}</span>
                      </div>
                      {items.map((repair) => (
                        <Card key={repair.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-3">
                            <p className="text-xs font-mono text-muted-foreground">{repair.reference}</p>
                            <p className="text-sm font-medium mt-1">{repair.clients?.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{repair.devices ? `${repair.devices.brand} ${repair.devices.model}` : "—"}</p>
                            <p className="text-xs text-muted-foreground mt-1">{repair.issue}</p>
                            {repair.technician_id && (
                              <p className="text-xs text-primary mt-2">👤 Technicien assigné</p>
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
              {filtered.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune réparation trouvée</CardContent></Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left p-3 font-medium">Réf</th>
                            <th className="text-left p-3 font-medium">Client</th>
                            <th className="text-left p-3 font-medium">Appareil</th>
                            <th className="text-left p-3 font-medium">Problème</th>
                            <th className="text-left p-3 font-medium">Statut</th>
                            <th className="text-left p-3 font-medium">Technicien</th>
                            <th className="text-right p-3 font-medium">Prix</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((repair) => (
                            <tr key={repair.id} className="border-b hover:bg-muted/20 transition-colors cursor-pointer">
                              <td className="p-3 font-mono text-xs">{repair.reference}</td>
                              <td className="p-3">{repair.clients?.name ?? "—"}</td>
                              <td className="p-3 text-muted-foreground">{repair.devices ? `${repair.devices.brand} ${repair.devices.model}` : "—"}</td>
                              <td className="p-3 text-muted-foreground">{repair.issue}</td>
                              <td className="p-3">
                                <Badge variant="outline" className={`text-xs ${statusColors[repair.status]}`}>{statusLabels[repair.status]}</Badge>
                              </td>
                              <td className="p-3">{repair.technician_id ? "Assigné" : "—"}</td>
                              <td className="p-3 text-right font-medium">{repair.final_price ? `${repair.final_price} €` : repair.estimated_price ? `~${repair.estimated_price} €` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Repairs;
