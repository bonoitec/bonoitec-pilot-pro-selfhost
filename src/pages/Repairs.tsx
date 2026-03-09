import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, LayoutGrid, List, Timer } from "lucide-react";
import { CreateRepairDialog } from "@/components/dialogs/CreateRepairDialog";
import { RepairDetailDialog } from "@/components/dialogs/RepairDetailDialog";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useToast } from "@/hooks/use-toast";

const statusLabels: Record<string, string> = {
  nouveau: "Nouveau", diagnostic: "Diagnostic", en_cours: "En cours",
  en_attente_piece: "Attente pièce", termine: "Terminé", pret_a_recuperer: "Prêt",
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

function formatDuration(startedAt: string | null) {
  if (!startedAt) return null;
  const ms = Date.now() - new Date(startedAt).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h${String(m).padStart(2, "0")}`;
}

const Repairs = () => {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<any>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

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

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "en_cours") updates.repair_started_at = new Date().toISOString();
      if (status === "termine" || status === "pret_a_recuperer") updates.repair_ended_at = new Date().toISOString();
      const { error } = await supabase.from("repairs").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["repairs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-repairs"] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    const repairId = result.draggableId;
    const repair = repairs.find(r => r.id === repairId);
    if (!repair || repair.status === newStatus) return;
    updateStatus.mutate({ id: repairId, status: newStatus });
  }, [repairs, updateStatus]);

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
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />Nouvelle réparation</Button>
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
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {statusOrder.map((status) => {
                    const items = filtered.filter((r) => r.status === status);
                    return (
                      <Droppable droppableId={status} key={status}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`space-y-2 min-h-[120px] rounded-lg p-2 transition-colors ${snapshot.isDraggingOver ? "bg-primary/5 ring-2 ring-primary/20" : ""}`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={`text-xs ${statusColors[status]}`}>{statusLabels[status]}</Badge>
                              <span className="text-xs text-muted-foreground">{items.length}</span>
                            </div>
                            {items.map((repair, index) => (
                              <Draggable key={repair.id} draggableId={repair.id} index={index}>
                                {(provided, snapshot) => (
                                  <Card
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`cursor-pointer transition-shadow ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/30" : "hover:shadow-md"}`}
                                    onClick={() => !snapshot.isDragging && setSelectedRepair(repair)}
                                  >
                                    <CardContent className="p-3">
                                      <p className="text-xs font-mono text-muted-foreground">{repair.reference}</p>
                                      <p className="text-sm font-medium mt-1">{repair.clients?.name ?? "—"}</p>
                                      <p className="text-xs text-muted-foreground">{repair.devices ? `${repair.devices.brand} ${repair.devices.model}` : "—"}</p>
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{repair.issue}</p>
                                      {(repair as any).repair_started_at && !(repair as any).repair_ended_at && (
                                        <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                                          <Timer className="h-3 w-3" />
                                          {formatDuration((repair as any).repair_started_at)}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    );
                  })}
                </div>
              </DragDropContext>
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
                            <th className="text-right p-3 font-medium">Prix</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((repair) => (
                            <tr key={repair.id} className="border-b hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedRepair(repair)}>
                              <td className="p-3 font-mono text-xs">{repair.reference}</td>
                              <td className="p-3">{repair.clients?.name ?? "—"}</td>
                              <td className="p-3 text-muted-foreground">{repair.devices ? `${repair.devices.brand} ${repair.devices.model}` : "—"}</td>
                              <td className="p-3 text-muted-foreground max-w-[200px] truncate">{repair.issue}</td>
                              <td className="p-3"><Badge variant="outline" className={`text-xs ${statusColors[repair.status]}`}>{statusLabels[repair.status]}</Badge></td>
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

      <CreateRepairDialog open={showCreate} onOpenChange={setShowCreate} />
      <RepairDetailDialog open={!!selectedRepair} onOpenChange={(o) => !o && setSelectedRepair(null)} repair={selectedRepair} />
    </div>
  );
};

export default Repairs;
