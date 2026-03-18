import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, LayoutGrid, List, Timer, GripVertical } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CreateRepairWizard } from "@/components/dialogs/CreateRepairWizard";
import { RepairDetailDialog } from "@/components/dialogs/RepairDetailDialog";
import { RestitutionDialog } from "@/components/dialogs/RestitutionDialog";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useToast } from "@/hooks/use-toast";
import { statusLabels, statusLabelsMobile, statusOrder, statusColors, statusHelpText } from "@/lib/repairStatuses";
import { sendTransactionalEmail } from "@/lib/email";

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
  const [restitutionRepair, setRestitutionRepair] = useState<any>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: repairs = [], isLoading } = useQuery({
    queryKey: ["repairs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repairs")
        .select("*, clients(name, email, phone), devices(brand, model)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 10000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      // Only set repair_started_at when the actual repair begins
      if (status === "reparation_en_cours") updates.repair_started_at = new Date().toISOString();
      if (status === "termine" || status === "pret_a_recuperer") updates.repair_ended_at = new Date().toISOString();
      const { error } = await supabase.from("repairs").update(updates).eq("id", id);
      if (error) throw error;

      const repair = repairs.find(r => r.id === id);
      if (repair?.clients?.email) {
        try {
          const device = repair.devices ? `${repair.devices.brand} ${repair.devices.model}` : "votre appareil";
          await sendTransactionalEmail({
            template: "status_update",
            to: repair.clients.email,
            data: {
              clientName: repair.clients.name || "",
              reference: repair.reference,
              device,
              status,
              statusLabel: statusLabels[status] || status,
              message: getAutoEmailMessage(status, device, repair.reference),
              trackingUrl: repair.tracking_code ? `https://bonoitec-pilot-pro.lovable.app/repair/${repair.tracking_code}` : "",
            },
            organizationId: repair.organization_id,
            repairId: repair.id,
          });
        } catch (emailErr) {
          console.error("Auto email failed:", emailErr);
        }
      }
    },
    onMutate: async ({ id, status: newStatus }) => {
      await qc.cancelQueries({ queryKey: ["repairs"] });
      const previous = qc.getQueryData<any[]>(["repairs"]);
      qc.setQueryData<any[]>(["repairs"], (old) =>
        old?.map(r => r.id === id ? { ...r, status: newStatus } : r) ?? []
      );
      return { previous };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["repairs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-repairs"] });
      qc.invalidateQueries({ queryKey: ["sales-repairs"] });
    },
    onError: (e: Error, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["repairs"], context.previous);
      }
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    },
  });

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    const repairId = result.draggableId;
    const repair = repairs.find(r => r.id === repairId);
    if (!repair || repair.status === newStatus) return;

    // Intercept drag to "Restitué" → open restitution workflow
    if (newStatus === "pret_a_recuperer") {
      setRestitutionRepair(repair);
      return;
    }

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
                <div className="">
                  <div className="grid grid-cols-6 gap-3">
                    {statusOrder.map((status) => {
                      const items = filtered.filter((r) => r.status === status);
                      return (
                        <Droppable droppableId={status} key={status}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`space-y-2 min-h-[120px] rounded-lg p-2 transition-all duration-300 ${
                                snapshot.isDraggingOver
                                  ? "bg-primary/5 ring-2 ring-primary/20 scale-[1.01]"
                                  : "hover:bg-muted/30"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className={`text-[10px] ${statusColors[status]}`}>{statusLabels[status]}</Badge>
                                <span className="text-xs text-muted-foreground">{items.length}</span>
                              </div>

                              {/* Help text for empty columns */}
                              {items.length === 0 && !snapshot.isDraggingOver && (
                                <div className="flex flex-col items-center justify-center py-6 px-2 text-center">
                                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                                    {statusHelpText[status]}
                                  </p>
                                </div>
                              )}

                              {/* Drop indicator when dragging over empty column */}
                              {items.length === 0 && snapshot.isDraggingOver && (
                                <div className="flex items-center justify-center py-8 rounded-md border-2 border-dashed border-primary/30 bg-primary/5">
                                  <p className="text-xs text-primary/60 font-medium">Déposez ici</p>
                                </div>
                              )}

                              {items.map((repair, index) => (
                                <Draggable key={repair.id} draggableId={repair.id} index={index}>
                                  {(provided, snapshot) => (
                                    <Card
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`cursor-pointer transition-all duration-200 ${
                                        snapshot.isDragging
                                          ? "shadow-lg ring-2 ring-primary/30 rotate-[1deg] scale-105"
                                          : "hover:shadow-md hover:-translate-y-0.5"
                                      }`}
                                      onClick={() => !snapshot.isDragging && setSelectedRepair(repair)}
                                    >
                                      <CardContent className="p-3">
                                        <p className="text-xs font-mono text-muted-foreground">{repair.reference}</p>
                                        <p className="text-sm font-medium mt-1">{repair.clients?.name ?? "—"}</p>
                                        <p className="text-xs text-muted-foreground">{repair.devices ? `${repair.devices.brand} ${repair.devices.model}` : "—"}</p>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{repair.issue}</p>
                                        {repair.repair_started_at && !repair.repair_ended_at && (
                                          <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                                            <Timer className="h-3 w-3" />
                                            {formatDuration(repair.repair_started_at)}
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

      <CreateRepairWizard open={showCreate} onOpenChange={setShowCreate} />
      <RepairDetailDialog open={!!selectedRepair} onOpenChange={(o) => !o && setSelectedRepair(null)} repair={selectedRepair} />
      <RestitutionDialog open={!!restitutionRepair} onOpenChange={(o) => !o && setRestitutionRepair(null)} repair={restitutionRepair} />
    </div>
  );
};

function getAutoEmailMessage(status: string, device: string, reference: string): string {
  const messages: Record<string, string> = {
    diagnostic: `Votre ${device} est en cours de diagnostic. Nous vous informerons des résultats.`,
    devis_en_attente: `Un devis vous a été envoyé pour la réparation de votre ${device}. Merci de le valider pour que nous puissions poursuivre.`,
    devis_valide: `Votre devis pour la réparation de votre ${device} a été validé. Nous allons préparer l'intervention.`,
    en_cours: `Une ou plusieurs pièces doivent être commandées pour la réparation de votre ${device}. Nous vous informerons dès leur réception.`,
    en_attente_piece: `La commande de pièces pour votre ${device} est en cours de livraison. Nous reprendrons dès réception.`,
    pret_reparation: `Toutes les pièces nécessaires sont disponibles. La réparation de votre ${device} va bientôt débuter.`,
    reparation_en_cours: `La réparation de votre ${device} a débuté. Nous vous tiendrons informé(e) de l'avancement.`,
    termine: `La réparation de votre ${device} est terminée ! Votre appareil est prêt à être récupéré.`,
    pret_a_recuperer: `Votre ${device} vous a été restitué. L'intervention est clôturée. Merci de votre confiance !`,
  };
  return messages[status] || `Le statut de votre réparation (réf. ${reference}) a été mis à jour.`;
}

export default Repairs;
