import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile, getSignedFileUrl, getSignedFileUrls } from "@/lib/storage";
import { generateIntakePDF } from "@/lib/pdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PenTool } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Timer, Star, ClipboardCheck, Camera, CreditCard, Upload, MessageSquare, FileText, AlertTriangle, Printer } from "lucide-react";
import { RepairChat } from "@/components/messaging/RepairChat";
import { StatusNotificationSuggester } from "@/components/messaging/StatusNotificationSuggester";
import { MarginAnalysisCard } from "@/components/repairs/MarginAnalysisCard";
import { PartsSelector, type PartUsed } from "@/components/repairs/PartsSelector";
import { ServiceSelector, type ServiceUsed } from "@/components/repairs/ServiceSelector";
import { statusLabels, statusOrder } from "@/lib/repairStatuses";
import { RestitutionDialog } from "@/components/dialogs/RestitutionDialog";

const paymentMethods = [
  { value: "cb", label: "Carte bancaire" },
  { value: "especes", label: "Espèces" },
  { value: "virement", label: "Virement bancaire" },
  { value: "cheque", label: "Chèque" },
  { value: "autre", label: "Autre" },
];

function LiveTimer({ startedAt, estimatedMinutes }: { startedAt: string; estimatedMinutes?: number | null }) {
  const [elapsed, setElapsed] = useState("");
  const [overTime, setOverTime] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const ms = Date.now() - new Date(startedAt).getTime();
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setElapsed(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      if (estimatedMinutes && estimatedMinutes > 0) {
        const elapsedMin = ms / 60000;
        setProgress(Math.min((elapsedMin / estimatedMinutes) * 100, 150));
        setOverTime(elapsedMin > estimatedMinutes);
      }
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [startedAt, estimatedMinutes]);

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${overTime ? "bg-destructive/10 border-destructive/20" : "bg-primary/10 border-primary/20"}`}>
      <Timer className={`h-5 w-5 ${overTime ? "text-destructive" : "text-primary"}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Durée de réparation</p>
          {estimatedMinutes && estimatedMinutes > 0 && (
            <p className="text-[10px] text-muted-foreground">
              Estimé : {estimatedMinutes} min
            </p>
          )}
        </div>
        <p className={`text-lg font-mono font-bold ${overTime ? "text-destructive" : "text-primary"}`}>{elapsed}</p>
        {estimatedMinutes && estimatedMinutes > 0 && (
          <div className="mt-1.5">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  overTime ? "bg-destructive" : progress > 80 ? "bg-warning" : "bg-primary"
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            {overTime && (
              <div className="flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-[10px] text-destructive font-medium">Temps estimé dépassé</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const ConditionStars = React.forwardRef<HTMLDivElement, { value: number | null; label: string }>(
  ({ value, label }, ref) => {
    if (!value) return null;
    return (
      <div ref={ref} className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-24">{label}</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} className={`h-4 w-4 ${s <= value ? "text-warning fill-warning" : "text-muted-foreground/20"}`} />
          ))}
        </div>
      </div>
    );
  }
);
ConditionStars.displayName = "ConditionStars";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repair: any;
}

export function RepairDetailDialog({ open, onOpenChange, repair }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState(repair?.status || "nouveau");
  const [diagnostic, setDiagnostic] = useState(repair?.diagnostic || "");
  const [techMessage, setTechMessage] = useState(repair?.technician_message || "");
  const [finalPrice, setFinalPrice] = useState(repair?.final_price?.toString() || "");
  const [paymentMethod, setPaymentMethod] = useState(repair?.payment_method || "");
  const [laborCost, setLaborCost] = useState(repair?.labor_cost?.toString() || "0");
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>(() => {
    const raw = repair?.parts_used;
    return Array.isArray(raw) ? raw.map((p: any) => ({ inventory_id: p.inventory_id, name: p.name || "", buy_price: Number(p.buy_price ?? p.cost ?? 0), sell_price: Number(p.sell_price ?? 0), quantity: Number(p.quantity ?? 1) })) : [];
  });
  const [servicesUsed, setServicesUsed] = useState<ServiceUsed[]>(() => {
    const raw = repair?.services_used;
    return Array.isArray(raw) ? raw.map((s: any) => ({ service_id: s.service_id, name: s.name || "", price: Number(s.price ?? 0), estimated_time_minutes: Number(s.estimated_time_minutes ?? 30) })) : [];
  });
  const [showPayment, setShowPayment] = useState(false);
  const [showRestitution, setShowRestitution] = useState(false);
  const { data: org } = useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_org_safe_data").single();
      if (error) throw error;
      return data;
    },
    staleTime: 60000,
  });
  const [showNotification, setShowNotification] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");

  useEffect(() => {
    if (repair) {
      setStatus(repair.status);
      setDiagnostic(repair.diagnostic || "");
      setTechMessage(repair.technician_message || "");
      setFinalPrice(repair.final_price?.toString() || "");
      setPaymentMethod(repair.payment_method || "");
      setLaborCost(repair.labor_cost?.toString() || "0");
      const raw = repair.parts_used;
      setPartsUsed(Array.isArray(raw) ? raw.map((p: any) => ({ inventory_id: p.inventory_id, name: p.name || "", buy_price: Number(p.buy_price ?? p.cost ?? 0), sell_price: Number(p.sell_price ?? 0), quantity: Number(p.quantity ?? 1) })) : []);
      const rawSvc = repair.services_used;
      setServicesUsed(Array.isArray(rawSvc) ? rawSvc.map((s: any) => ({ service_id: s.service_id, name: s.name || "", price: Number(s.price ?? 0), estimated_time_minutes: Number(s.estimated_time_minutes ?? 30) })) : []);
      setShowPayment(false);
      setShowNotification(false);
      setPendingStatus("");
    }
  }, [repair]);

  const mutation = useMutation({
    mutationFn: async () => {
      const updates: any = {
        status,
        diagnostic: diagnostic.trim() || null,
        technician_message: techMessage.trim() || null,
        final_price: finalPrice ? parseFloat(finalPrice) : null,
        labor_cost: laborCost ? parseFloat(laborCost) : 0,
        parts_used: partsUsed,
        services_used: servicesUsed,
      };
      // Only set repair_started_at when the actual repair begins
      if (status === "reparation_en_cours" && repair.status !== "reparation_en_cours" && !repair.repair_started_at) {
        updates.repair_started_at = new Date().toISOString();
      }
      if ((status === "termine" || status === "pret_a_recuperer") && repair.status !== status) {
        updates.repair_ended_at = new Date().toISOString();
      }
      if (paymentMethod) updates.payment_method = paymentMethod;

      // Atomic server-side repair update + stock deduction
      const oldParts = Array.isArray(repair.parts_used)
        ? repair.parts_used.map((p: any) => ({ inventory_id: p.inventory_id, quantity: Number(p.quantity ?? 1) }))
        : [];

      const { data, error } = await supabase.functions.invoke("update-repair-stock", {
        body: {
          repair_id: repair.id,
          updates,
          old_parts: oldParts,
          new_parts: partsUsed.map(p => ({ inventory_id: p.inventory_id, quantity: p.quantity })),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["repairs"] });
      const previous = qc.getQueryData<any[]>(["repairs"]);
      qc.setQueryData<any[]>(["repairs"], (old) =>
        old?.map(r => r.id === repair.id ? { ...r, status } : r) ?? []
      );
      return { previous };
    },
    onSuccess: () => {
      toast({ title: "Réparation mise à jour" });
      qc.invalidateQueries({ queryKey: ["repairs"] });
      qc.invalidateQueries({ queryKey: ["sales-repairs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-repairs"] });
      qc.invalidateQueries({ queryKey: ["inventory-for-parts"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      if (status !== repair.status) {
        setPendingStatus(status);
        setShowNotification(true);
      } else {
        onOpenChange(false);
      }
    },
    onError: (e: Error, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["repairs"], context.previous);
      }
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "pret_a_recuperer") {
      // Open the restitution workflow instead of inline payment
      setShowRestitution(true);
      return;
    }
    setStatus(newStatus);
    setShowPayment(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !repair) return;
    const path = `repairs/${repair.id}/${Date.now()}-${file.name}`;
    try {
      const storedPath = await uploadFile(path, file);
      const currentPhotos = (repair.photos as string[]) || [];
      await supabase.from("repairs").update({ photos: [...currentPhotos, storedPath] } as any).eq("id", repair.id);
      qc.invalidateQueries({ queryKey: ["repairs"] });
      toast({ title: "Photo ajoutée" });
    } catch (err: any) {
      toast({ title: "Erreur upload", description: err.message, variant: "destructive" });
    }
  };

  // Resolve signed URLs for photos and signature
  const rawPhotos = repair ? (repair.photos as string[]) || [] : [];
  const [resolvedPhotos, setResolvedPhotos] = useState<string[]>([]);
  const [resolvedSignature, setResolvedSignature] = useState<string | null>(null);

  useEffect(() => {
    if (rawPhotos.length > 0) {
      getSignedFileUrls(rawPhotos).then(setResolvedPhotos);
    } else {
      setResolvedPhotos([]);
    }
    if (repair?.customer_signature_url) {
      getSignedFileUrl(repair.customer_signature_url).then(setResolvedSignature);
    } else {
      setResolvedSignature(null);
    }
  }, [repair?.photos, repair?.customer_signature_url]);

  if (!repair) return null;

  const intakeChecklist = repair.intake_checklist as string[] | null;

  return (
    <>
    <Dialog open={open && !showRestitution} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono">{repair.reference}</span>
            {repair.tracking_code && (
              <Badge variant="outline" className="text-[10px] font-mono">Suivi: {repair.tracking_code}</Badge>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">Détails de la réparation {repair.reference}</DialogDescription>
        </DialogHeader>

        {showNotification && pendingStatus && (
          <StatusNotificationSuggester
            repair={repair}
            newStatus={pendingStatus}
            onDismiss={() => {
              setShowNotification(false);
              onOpenChange(false);
            }}
          />
        )}

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1"><FileText className="h-3.5 w-3.5 mr-1" />Détails</TabsTrigger>
            <TabsTrigger value="messages" className="flex-1"><MessageSquare className="h-3.5 w-3.5 mr-1" />Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: "calc(85vh - 200px)" }}>
              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Client:</span> <span className="font-medium">{repair.clients?.name ?? "—"}</span></div>
                <div><span className="text-muted-foreground">Appareil:</span> <span className="font-medium">{repair.devices ? `${repair.devices.brand} ${repair.devices.model}` : "—"}</span></div>
              </div>
              <div className="text-sm"><span className="text-muted-foreground">Problème:</span> <p className="mt-1">{repair.issue}</p></div>

              {/* Timer - active when started but not ended */}
              {repair.repair_started_at && !repair.repair_ended_at && (
                <LiveTimer startedAt={repair.repair_started_at} estimatedMinutes={repair.estimated_time_minutes} />
              )}
              {repair.repair_started_at && repair.repair_ended_at && (
                <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 p-3">
                  <Timer className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-xs text-muted-foreground">Durée totale</p>
                    <p className="text-sm font-mono font-bold text-success">
                      {(() => {
                        const ms = new Date(repair.repair_ended_at).getTime() - new Date(repair.repair_started_at).getTime();
                        const h = Math.floor(ms / 3600000);
                        const m = Math.floor((ms % 3600000) / 60000);
                        return `${h}h${String(m).padStart(2, "0")}`;
                      })()}
                    </p>
                  </div>
                </div>
              )}

              {/* Intake Checklist */}
              {intakeChecklist && intakeChecklist.length > 0 && (
                <Card className="border-border/60">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" />{(org as any)?.checklist_label || "Checklist de prise en charge"}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <div className="flex flex-wrap gap-2">
                      {intakeChecklist.map((item, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Condition */}
              {(repair.screen_condition || repair.frame_condition || repair.back_condition) && (
                <Card className="border-border/60">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4 text-warning" />État de l'appareil</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-1">
                    <ConditionStars value={repair.screen_condition} label="Écran" />
                    <ConditionStars value={repair.frame_condition} label="Châssis" />
                    <ConditionStars value={repair.back_condition} label="Vitre arrière" />
                  </CardContent>
                </Card>
              )}

              {/* Photos */}
              <Card className="border-border/60">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2"><Camera className="h-4 w-4 text-primary" />Photos</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  {resolvedPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {resolvedPhotos.map((url, i) => (
                        <img key={i} src={url} alt={`Photo ${i + 1}`} className="w-full h-24 object-cover rounded-lg border border-border" />
                      ))}
                    </div>
                  )}
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline">
                    <Upload className="h-4 w-4" />Ajouter une photo
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </CardContent>
              </Card>

              {/* Customer Signature */}
              {resolvedSignature && (
                <Card className="border-border/60">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2"><PenTool className="h-4 w-4 text-primary" />Signature du client</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <img src={resolvedSignature} alt="Signature client" className="max-h-[100px] border border-border rounded-lg p-2 bg-card" />
                  </CardContent>
                </Card>
              )}

              {/* Parts from stock */}
              <PartsSelector parts={partsUsed} onChange={setPartsUsed} deviceBrand={repair.devices?.brand} deviceModel={repair.devices?.model} />

              {/* Services */}
              <ServiceSelector services={servicesUsed} onChange={setServicesUsed} deviceBrand={repair.devices?.brand} deviceModel={repair.devices?.model} />

              {/* Labor cost */}
              <div>
                <Label className="text-xs">Coût main-d'œuvre (€)</Label>
                <Input type="number" step="0.01" value={laborCost} onChange={e => setLaborCost(e.target.value)} placeholder="0.00" />
              </div>

              {/* Margin Analysis */}
              <MarginAnalysisCard repair={{ ...repair, parts_used: partsUsed, services_used: servicesUsed, labor_cost: laborCost ? parseFloat(laborCost) : 0, final_price: finalPrice ? parseFloat(finalPrice) : repair.final_price }} />

              <Separator />

              {/* Status */}
              <div>
                <Label>Statut</Label>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{statusOrder.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* Restitution button - shown when status is already pret_a_recuperer but no payment yet */}
              {repair.status === "pret_a_recuperer" && !repair.payment_method && (
                <Button variant="outline" className="w-full border-warning/30 text-warning hover:bg-warning/10" onClick={() => setShowRestitution(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Finaliser le paiement & la facture
                </Button>
              )}

              <div><Label>Diagnostic</Label><Textarea value={diagnostic} onChange={e => setDiagnostic(e.target.value)} placeholder="Résultat du diagnostic..." rows={3} /></div>
              <div><Label>Message pour le client</Label><Textarea value={techMessage} onChange={e => setTechMessage(e.target.value)} placeholder="Message visible par le client..." rows={2} /></div>
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <RepairChat repairId={repair.id} organizationId={repair.organization_id} compact />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Mise à jour..." : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <RestitutionDialog
      open={showRestitution}
      onOpenChange={(o) => {
        setShowRestitution(o);
        if (!o) {
          // Refresh data after restitution
          qc.invalidateQueries({ queryKey: ["repairs"] });
          onOpenChange(false);
        }
      }}
      repair={repair}
    />
    </>
  );
}
