import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { SignaturePad } from "@/components/SignaturePad";
import { isValidIMEI, lookupTAC, lookupTACBroad } from "@/lib/imei";
import { generatePDF } from "@/lib/pdf";
import {
  User, Smartphone, ClipboardCheck, Star, Camera, Wrench,
  CalendarClock, PenTool, FileText, ChevronLeft, ChevronRight,
  Check, Search, Plus, Upload, X, Sparkles, Loader2, Clock, Gauge, CheckCircle2,
} from "lucide-react";

interface DiagnosticResult {
  causes_possibles: string[];
  pieces_a_verifier: string[];
  solution_probable: string;
  difficulte: string;
  temps_estime: string;
  prix_estime: string;
  conseils: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  { icon: User, label: "Client" },
  { icon: Smartphone, label: "Appareil" },
  { icon: ClipboardCheck, label: "Checklist" },
  { icon: Star, label: "État" },
  { icon: Camera, label: "Photos" },
  { icon: Wrench, label: "Service" },
  { icon: CalendarClock, label: "Planning" },
  { icon: PenTool, label: "Signature" },
  { icon: FileText, label: "Résumé" },
];

const defaultChecklist = [
  "Alimentation / charge", "Écran", "Boutons", "Caméra",
  "Son", "Réseau", "Face ID / empreinte", "Autres problèmes",
];

const deviceCategories = ["Smartphone", "Tablette", "Ordinateur portable", "Console", "Montre connectée", "Autre"];

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-32">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s} type="button" onClick={() => onChange(s)}
            className={`h-7 w-7 transition-colors ${s <= value ? "text-warning" : "text-muted-foreground/30"}`}
          >
            <Star className="h-6 w-6 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function CreateRepairWizard({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);

  // Step 1 — Client
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({ name: "", phone: "", email: "", address: "", postal_code: "", city: "", country: "France" });

  // Step 2 — Device
  const [device, setDevice] = useState({ category: "Smartphone", brand: "", model: "", serial_number: "", storage: "" });
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Step 3 — Checklist
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [diagnosticReason, setDiagnosticReason] = useState("");

  // Step 4 — Condition
  const [screenCondition, setScreenCondition] = useState(5);
  const [frameCondition, setFrameCondition] = useState(5);
  const [backCondition, setBackCondition] = useState(5);

  // Step 5 — Photos
  const [photos, setPhotos] = useState<{ file: File; preview: string; label: string }[]>([]);

  // Step 6 — Service
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [repairType, setRepairType] = useState("");
  const [issue, setIssue] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [laborCost, setLaborCost] = useState("");

  // Step 7 — Planning
  const [technicianId, setTechnicianId] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [plannedDate, setPlannedDate] = useState("");

  // Step 8 — Signature
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Step 9 — Result
  const [createdRepair, setCreatedRepair] = useState<any>(null);

  // Queries
  const { data: org } = useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_org_safe_data").single();
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const checklistItems: string[] = (org as any)?.intake_checklist_items ?? defaultChecklist;

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name, phone, email, address").order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: existingDevices = [] } = useQuery({
    queryKey: ["devices-for-client", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const { data, error } = await supabase.from("devices").select("id, brand, model, serial_number, type").eq("client_id", selectedClientId).order("brand");
      if (error) throw error;
      return data;
    },
    enabled: open && !!selectedClientId,
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: async () => {
      const { data, error } = await supabase.from("technicians").select("id, name").eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: dbServices = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const toggleService = (svc: any) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === svc.id);
      if (exists) return prev.filter(s => s.id !== svc.id);
      return [...prev, svc];
    });
    // Auto-calculate price from selected services
    setTimeout(() => {
      setSelectedServices(prev => {
        const total = prev.reduce((sum, s) => sum + Number(s.default_price || 0), 0);
        setEstimatedPrice(total > 0 ? String(total) : estimatedPrice);
        return prev;
      });
    }, 0);
  };

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients.slice(0, 8);
    const q = clientSearch.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)).slice(0, 8);
  }, [clients, clientSearch]);

  const isNewClient = !selectedClientId;
  const clientDisplay = selectedClientId
    ? clients.find(c => c.id === selectedClientId)?.name ?? ""
    : newClient.name;

  // IMEI auto-detect
  const handleSerialChange = (val: string) => {
    setDevice(d => ({ ...d, serial_number: val }));
    if (val.length >= 15 && isValidIMEI(val.replace(/\s/g, ""))) {
      const info = lookupTAC(val.replace(/\s/g, "")) || lookupTACBroad(val.replace(/\s/g, ""));
      if (info) {
        setDevice(d => ({ ...d, brand: info.brand, model: info.model, category: info.type }));
        toast({ title: "IMEI détecté", description: `${info.brand} ${info.model}` });
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, label: string) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const preview = URL.createObjectURL(file);
      setPhotos(p => [...p, { file, preview, label }]);
    });
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos(p => { URL.revokeObjectURL(p[index].preview); return p.filter((_, i) => i !== index); });
  };

  // Validation per step
  const canProceed = (): boolean => {
    switch (step) {
      case 0: return !!(selectedClientId || newClient.name.trim());
      case 1: return !!(selectedDeviceId || (device.brand.trim() && device.model.trim()));
      case 5: return !!issue.trim();
      default: return true;
    }
  };

  // Create repair mutation
  const mutation = useMutation({
    mutationFn: async () => {
      const { data: orgId } = await supabase.rpc("get_user_org_id");
      if (!orgId) throw new Error("Organisation introuvable");

      // 1. Create or link client
      let clientId = selectedClientId;
      if (!clientId) {
        const { data: newC, error: cErr } = await supabase.from("clients").insert({
          organization_id: orgId, name: newClient.name.trim(),
          phone: newClient.phone.trim() || null, email: newClient.email.trim() || null,
          address: [newClient.address, newClient.postal_code, newClient.city, newClient.country].filter(Boolean).join(", ") || null,
        }).select("id").single();
        if (cErr) throw cErr;
        clientId = newC.id;
      }

      // 2. Create or link device
      let deviceId = selectedDeviceId;
      if (!deviceId && device.brand.trim() && device.model.trim()) {
        const { data: newD, error: dErr } = await supabase.from("devices").insert({
          organization_id: orgId, client_id: clientId,
          type: device.category, brand: device.brand.trim(), model: device.model.trim(),
          serial_number: device.serial_number.trim() || null,
          condition: device.storage.trim() || null,
        }).select("id").single();
        if (dErr) throw dErr;
        deviceId = newD.id;
      }

      // 3. Upload photos
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const path = `repairs/${orgId}/${Date.now()}-${photo.file.name}`;
        try {
          const storedPath = await uploadFile(path, photo.file, { contentType: photo.file.type });
          photoUrls.push(storedPath);
        } catch { /* skip failed upload */ }
      }

      // 4. Upload signature
      let signatureUrl: string | null = null;
      if (signatureDataUrl) {
        const blob = await (await fetch(signatureDataUrl)).blob();
        const path = `signatures/${orgId}/${Date.now()}.png`;
        try {
          signatureUrl = await uploadFile(path, blob, { contentType: "image/png" });
        } catch { /* skip failed upload */ }
      }

      // 5. Build intake checklist
      const intakeChecklist = Object.entries(checklist)
        .filter(([, v]) => v)
        .map(([k]) => k === "Diagnostic impossible" ? `${k}: ${diagnosticReason}` : k);

      // 6. Create repair
      const ref = "REP-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6);
      const { data: repair, error: rErr } = await supabase.from("repairs").insert({
        organization_id: orgId, reference: ref,
        client_id: clientId, device_id: deviceId,
        technician_id: technicianId || null,
        issue: `${repairType ? repairType + " — " : ""}${issue.trim()}`,
        estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : null,
        labor_cost: laborCost ? parseFloat(laborCost) : 0,
        status: "nouveau",
        intake_checklist: intakeChecklist,
        screen_condition: screenCondition,
        frame_condition: frameCondition,
        back_condition: backCondition,
        customer_signature_url: signatureUrl,
        photos: photoUrls,
        estimated_completion: plannedDate || null,
        internal_notes: estimatedTime ? `Temps estimé: ${estimatedTime}` : null,
      } as any).select("*, clients(name, phone, email, address), devices(brand, model)").single();
      if (rErr) throw rErr;
      return repair;
    },
    onSuccess: async (repair) => {
      toast({ title: "Réparation créée avec succès" });
      qc.invalidateQueries({ queryKey: ["repairs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-repairs"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["devices-for-client"] });
      setCreatedRepair(repair);
      setStep(8); // Go to summary

      // Send creation email to client if they have an email
      const clientEmail = repair.clients?.email || newClient.email.trim();
      if (clientEmail) {
        try {
          const deviceLabel = repair.devices ? `${repair.devices.brand} ${repair.devices.model}` : `${device.brand} ${device.model}`;
          const trackingUrl = repair.tracking_code ? `https://bonoitec-pilot-pro.lovable.app/repair/${repair.tracking_code}` : "";
          await supabase.functions.invoke("send-email", {
            body: {
              template: "repair_created",
              to: clientEmail,
              data: {
                clientName: repair.clients?.name || newClient.name,
                reference: repair.reference,
                device: deviceLabel,
                issue: repair.issue,
                trackingUrl,
              },
              organization_id: repair.organization_id,
              repair_id: repair.id,
            },
          });
        } catch (emailErr) {
          console.error("Email de création échoué:", emailErr);
        }
      }
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const handleNext = () => {
    if (step === 7) {
      // Submit
      mutation.mutate();
    } else if (step < 8) {
      setStep(s => s + 1);
    }
  };

  const handleClose = () => {
    // Reset everything
    setStep(0);
    setClientSearch(""); setSelectedClientId(null);
    setNewClient({ name: "", phone: "", email: "", address: "", postal_code: "", city: "", country: "France" });
    setDevice({ category: "Smartphone", brand: "", model: "", serial_number: "", storage: "" });
    setSelectedDeviceId(null);
    setChecklist({}); setDiagnosticReason("");
    setScreenCondition(5); setFrameCondition(5); setBackCondition(5);
    photos.forEach(p => URL.revokeObjectURL(p.preview));
    setPhotos([]);
    setRepairType(""); setIssue(""); setEstimatedPrice(""); setLaborCost(""); setSelectedServices([]);
    setTechnicianId(""); setEstimatedTime(""); setPlannedDate("");
    setSignatureDataUrl(null); setCreatedRepair(null);
    onOpenChange(false);
  };

  const handleGenerateQuote = async () => {
    if (!createdRepair || !org) {
      toast({ title: "Erreur", description: "Données de réparation ou organisation manquantes", variant: "destructive" });
      return;
    }
    try {
      const vatRate = org.vat_rate ?? 20;

      // Build lines from selected services or fallback to single line
      let lines: { description: string; quantity: number; unit_price: number }[];
      if (selectedServices.length > 0) {
        lines = selectedServices.map(s => ({
          description: s.name + (s.description ? ` — ${s.description}` : ""),
          quantity: 1,
          unit_price: Number(s.default_price) || 0,
        }));
      } else {
        const price = estimatedPrice ? parseFloat(estimatedPrice) : 0;
        lines = [{ description: `${repairType ? repairType + " — " : ""}${issue}`, quantity: 1, unit_price: price }];
      }

      const totalHT = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
      const totalTTC = org.vat_enabled ? totalHT * (1 + vatRate / 100) : totalHT;

      // Save quote to DB
      const { data: orgId } = await supabase.rpc("get_user_org_id");
      if (!orgId) throw new Error("Organisation introuvable");

      const qRef = (org.quote_prefix || "DEV-") + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 5).toUpperCase();

      const { error: insertError } = await supabase.from("quotes").insert({
        organization_id: orgId, reference: qRef,
        client_id: createdRepair.client_id, device_id: createdRepair.device_id,
        repair_id: createdRepair.id,
        lines: lines as any, total_ht: totalHT, total_ttc: totalTTC, vat_rate: vatRate,
        status: "brouillon",
      } as any);
      if (insertError) throw insertError;

      qc.invalidateQueries({ queryKey: ["quotes"] });

      // Build intake info for PDF
      const intakeChecklist = Object.entries(checklist).filter(([, v]) => v).map(([k]) => k === "Diagnostic impossible" ? `${k}: ${diagnosticReason}` : k);
      const photoUrls = (createdRepair.photos as string[]) || [];

      // Generate PDF with full intake info
      await generatePDF(org as any, {
        type: "quote", reference: qRef,
        date: new Date().toLocaleDateString("fr-FR"),
        clientName: createdRepair.clients?.name,
        clientAddress: createdRepair.clients?.address,
        clientPhone: createdRepair.clients?.phone,
        clientEmail: createdRepair.clients?.email,
        lines, totalHT, totalTTC, vatRate,
        intake: {
          deviceBrand: createdRepair.devices?.brand || device.brand,
          deviceModel: createdRepair.devices?.model || device.model,
          serialNumber: device.serial_number || undefined,
          deviceCategory: device.category,
          checklist: intakeChecklist,
          screenCondition,
          frameCondition,
          backCondition,
          photoUrls,
          signatureUrl: createdRepair.customer_signature_url,
        },
      });
      toast({ title: "Devis généré et téléchargé" });
    } catch (e: any) {
      console.error("Erreur génération devis:", e);
      toast({ title: "Erreur lors de la génération du devis", description: e?.message || "Erreur inconnue", variant: "destructive" });
    }
  };

  const progress = step < 8 ? ((step + 1) / 8) * 100 : 100;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="w-[calc(100%-1rem)] sm:w-full sm:max-w-3xl max-h-[85vh] sm:max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header with stepper */}
        <div className="border-b border-border px-3 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Nouvelle réparation</DialogTitle>
            <DialogDescription className="sr-only">Assistant de création de réparation</DialogDescription>
          </DialogHeader>
          <div className="mt-3">
            <Progress value={progress} className="h-1.5" />
            <div className="flex justify-between mt-2 overflow-x-auto">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isDone = i < step || step === 8;
                const isCurrent = i === step;
                return (
                  <button
                    key={i} type="button"
                    onClick={() => step !== 8 && i <= step && setStep(i)}
                    className={`flex flex-col items-center gap-0.5 sm:gap-1 min-w-[36px] sm:min-w-[56px] transition-colors ${
                      isCurrent ? "text-primary" : isDone ? "text-success" : "text-muted-foreground/40"
                    } ${i <= step && step !== 8 ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <div className={`h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${
                      isCurrent ? "border-primary bg-primary/10" : isDone ? "border-success bg-success/10" : "border-muted"
                    }`}>
                      {isDone && !isCurrent ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : <Icon className="h-3 w-3 sm:h-4 sm:w-4" />}
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-medium leading-tight hidden sm:block">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step content */}
        <div className="px-3 sm:px-6 py-3 sm:py-5 overflow-y-auto flex-1 min-h-0">
          {/* Step 1: Client */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher un client existant..." value={clientSearch} onChange={e => { setClientSearch(e.target.value); setSelectedClientId(null); }} className="pl-9" />
              </div>
              {filteredClients.length > 0 && !selectedClientId && (
                <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
                  {filteredClients.map(c => (
                    <button key={c.id} type="button" className="w-full text-left px-4 py-2.5 hover:bg-accent/50 transition-colors" onClick={() => { setSelectedClientId(c.id); setClientSearch(c.name); }}>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{[c.phone, c.email].filter(Boolean).join(" · ")}</p>
                    </button>
                  ))}
                </div>
              )}
              {selectedClientId && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                    <Check className="h-3 w-3 mr-1" />Client sélectionné
                  </Badge>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedClientId(null); setClientSearch(""); }}>Changer</Button>
                </div>
              )}
              {!selectedClientId && (
                <Card className="border-dashed">
                  <CardContent className="pt-4 pb-4 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Plus className="h-3 w-3" />Nouveau client</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label className="text-xs">Nom *</Label>
                        <Input value={newClient.name} onChange={e => setNewClient(c => ({ ...c, name: e.target.value }))} placeholder="Nom du client" />
                      </div>
                      <div>
                        <Label className="text-xs">Téléphone</Label>
                        <Input value={newClient.phone} onChange={e => setNewClient(c => ({ ...c, phone: e.target.value }))} placeholder="06..." />
                      </div>
                      <div>
                        <Label className="text-xs">Email</Label>
                        <Input type="email" value={newClient.email} onChange={e => setNewClient(c => ({ ...c, email: e.target.value }))} placeholder="email@..." />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Adresse</Label>
                        <Input value={newClient.address} onChange={e => setNewClient(c => ({ ...c, address: e.target.value }))} placeholder="Rue..." />
                      </div>
                      <div>
                        <Label className="text-xs">Code postal</Label>
                        <Input value={newClient.postal_code} onChange={e => setNewClient(c => ({ ...c, postal_code: e.target.value }))} placeholder="75000" />
                      </div>
                      <div>
                        <Label className="text-xs">Ville</Label>
                        <Input value={newClient.city} onChange={e => setNewClient(c => ({ ...c, city: e.target.value }))} placeholder="Paris" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Device */}
          {step === 1 && (
            <div className="space-y-4">
              {existingDevices.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Appareils existants du client</p>
                  <div className="space-y-2">
                    {existingDevices.map(d => (
                      <button key={d.id} type="button"
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${selectedDeviceId === d.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"}`}
                        onClick={() => setSelectedDeviceId(selectedDeviceId === d.id ? null : d.id)}
                      >
                        <p className="text-sm font-medium">{d.brand} {d.model}</p>
                        <p className="text-xs text-muted-foreground">{d.type}{d.serial_number ? ` · ${d.serial_number}` : ""}</p>
                      </button>
                    ))}
                  </div>
                  <div className="relative my-4"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">ou ajouter un nouvel appareil</span></div></div>
                </div>
              )}
              {!selectedDeviceId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Catégorie</Label>
                    <Select value={device.category} onValueChange={v => setDevice(d => ({ ...d, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{deviceCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">IMEI / N° série</Label>
                    <Input value={device.serial_number} onChange={e => handleSerialChange(e.target.value)} placeholder="Entrez l'IMEI pour auto-détection" />
                  </div>
                  <div>
                    <Label className="text-xs">Marque *</Label>
                    <Input value={device.brand} onChange={e => setDevice(d => ({ ...d, brand: e.target.value }))} placeholder="Apple, Samsung..." />
                  </div>
                  <div>
                    <Label className="text-xs">Modèle *</Label>
                    <Input value={device.model} onChange={e => setDevice(d => ({ ...d, model: e.target.value }))} placeholder="iPhone 15 Pro..." />
                  </div>
                  <div>
                    <Label className="text-xs">Stockage (optionnel)</Label>
                    <Input value={device.storage} onChange={e => setDevice(d => ({ ...d, storage: e.target.value }))} placeholder="256 Go" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Checklist */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Cochez les éléments vérifiés lors de la prise en charge</p>
              {[...checklistItems, "Diagnostic impossible"].map(item => (
                <div key={item} className="flex items-center gap-3 py-1">
                  <Checkbox id={`wiz-${item}`} checked={!!checklist[item]} onCheckedChange={(v) => setChecklist(c => ({ ...c, [item]: !!v }))} />
                  <label htmlFor={`wiz-${item}`} className="text-sm cursor-pointer">{item}</label>
                </div>
              ))}
              {checklist["Diagnostic impossible"] && (
                <Textarea value={diagnosticReason} onChange={e => setDiagnosticReason(e.target.value)} placeholder="Précisez pourquoi le diagnostic est impossible..." rows={2} className="mt-2" />
              )}
            </div>
          )}

          {/* Step 4: Condition */}
          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">Évaluez l'état physique de l'appareil (1 = endommagé, 5 = comme neuf)</p>
              <StarRating value={screenCondition} onChange={setScreenCondition} label="Écran" />
              <StarRating value={frameCondition} onChange={setFrameCondition} label="Châssis" />
              <StarRating value={backCondition} onChange={setBackCondition} label="Vitre arrière" />
            </div>
          )}

          {/* Step 5: Photos */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Ajoutez des photos de l'appareil pour documenter son état</p>
              <div className="grid grid-cols-3 gap-3">
                {["Face avant", "Face arrière", "Dommages"].map(label => (
                  <label key={label} className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:bg-accent/30 transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground text-center">{label}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, label)} />
                  </label>
                ))}
              </div>
              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((p, i) => (
                    <div key={i} className="relative group">
                      <img src={p.preview} alt={p.label} className="h-20 w-full object-cover rounded-lg border border-border" />
                      <button type="button" onClick={() => removePhoto(i)} className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                      <p className="text-[10px] text-muted-foreground mt-1 text-center truncate">{p.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 6: Service */}
          {step === 5 && (
            <div className="space-y-4">
              {dbServices.length > 0 && (() => {
                const devBrand = (selectedDeviceId ? existingDevices.find(d => d.id === selectedDeviceId)?.brand : device.brand) || "";
                const devModel = (selectedDeviceId ? existingDevices.find(d => d.id === selectedDeviceId)?.model : device.model) || "";
                const brandLower = devBrand.toLowerCase();
                const modelLower = devModel.toLowerCase();

                const scored = dbServices.map(svc => {
                  const sb = ((svc as any).compatible_brand || "").toLowerCase();
                  const sm = ((svc as any).compatible_model || "").toLowerCase();
                  let score = 0;
                  if (brandLower && sb && sb.includes(brandLower)) score += 2;
                  if (modelLower && sm && sm.includes(modelLower)) score += 3;
                  if (brandLower && svc.name.toLowerCase().includes(brandLower)) score += 1;
                  if (modelLower && svc.name.toLowerCase().includes(modelLower)) score += 2;
                  return { ...svc, _score: score };
                }).sort((a, b) => b._score - a._score);

                const suggested = scored.filter(s => s._score > 0);
                const others = scored.filter(s => s._score === 0);

                return (
                <div>
                  {suggested.length > 0 && (
                    <div className="mb-3">
                      <Label className="text-xs mb-2 block flex items-center gap-1">
                        <span className="text-warning">✨</span> Services suggérés pour {devBrand} {devModel}
                      </Label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {suggested.map(svc => {
                          const selected = selectedServices.find(s => s.id === svc.id);
                          return (
                            <button key={svc.id} type="button" onClick={() => toggleService(svc)}
                              className={`text-left p-3 rounded-lg border transition-colors ${selected ? "border-primary bg-primary/5" : "border-warning/30 bg-warning/5 hover:bg-warning/10"}`}>
                              <p className="text-sm font-medium">{svc.name}</p>
                              <p className="text-xs text-muted-foreground">{Number(svc.default_price).toFixed(2)} € · {svc.estimated_time_minutes} min</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {others.length > 0 && (
                    <div>
                      <Label className="text-xs mb-2 block">Autres services disponibles</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {others.map(svc => {
                          const selected = selectedServices.find(s => s.id === svc.id);
                          return (
                            <button key={svc.id} type="button" onClick={() => toggleService(svc)}
                              className={`text-left p-3 rounded-lg border transition-colors ${selected ? "border-primary bg-primary/5" : "border-border hover:bg-accent/30"}`}>
                              <p className="text-sm font-medium">{svc.name}</p>
                              <p className="text-xs text-muted-foreground">{Number(svc.default_price).toFixed(2)} € · {svc.estimated_time_minutes} min</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {selectedServices.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedServices.map(s => (
                        <Badge key={s.id} variant="secondary" className="text-xs">{s.name} — {Number(s.default_price).toFixed(2)} €</Badge>
                      ))}
                    </div>
                  )}
                  <div className="relative my-3"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">ou saisie manuelle</span></div></div>
                </div>
                );
              })()}
              <div>
                <Label className="text-xs">Type de réparation</Label>
                <Select value={repairType} onValueChange={setRepairType}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner le type" /></SelectTrigger>
                  <SelectContent>
                    {["Remplacement écran", "Remplacement batterie", "Port de charge", "Dégât des eaux", "Connecteur", "Caméra", "Bouton", "Logiciel", "Autre"].map(t =>
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Description du problème *</Label>
                <Textarea value={issue} onChange={e => setIssue(e.target.value)} placeholder="Décrivez le problème en détail..." rows={3} />
              </div>
              <div>
                <Label className="text-xs">Prix estimé (€){selectedServices.length > 0 ? " (calculé automatiquement)" : ""}</Label>
                <Input type="number" step="0.01" value={estimatedPrice} onChange={e => setEstimatedPrice(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs">Coût main-d'œuvre (€)</Label>
                <Input type="number" step="0.01" value={laborCost} onChange={e => setLaborCost(e.target.value)} placeholder="0.00" />
              </div>
            </div>
          )}

          {/* Step 7: Planning */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Technicien assigné</Label>
                <Select value={technicianId} onValueChange={setTechnicianId}>
                  <SelectTrigger><SelectValue placeholder="Assigner un technicien" /></SelectTrigger>
                  <SelectContent>{technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Temps de réparation estimé</Label>
                <Input value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} placeholder="Ex: 1h30, 45 min..." />
              </div>
              <div>
                <Label className="text-xs">Date de fin prévue</Label>
                <Input type="date" value={plannedDate} onChange={e => setPlannedDate(e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 8: Signature */}
          {step === 7 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Demandez au client de signer pour confirmer le dépôt de l'appareil</p>
              <SignaturePad onSave={setSignatureDataUrl} onClear={() => setSignatureDataUrl(null)} savedSignature={signatureDataUrl} height={180} />
            </div>
          )}

          {/* Step 9: Summary */}
          {step === 8 && createdRepair && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                <Check className="h-6 w-6 text-success" />
                <div>
                  <p className="font-medium text-success">Réparation créée avec succès</p>
                  <p className="text-sm text-muted-foreground">Référence : {createdRepair.reference}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card><CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="text-sm font-medium">{createdRepair.clients?.name ?? clientDisplay}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">Appareil</p>
                  <p className="text-sm font-medium">{createdRepair.devices ? `${createdRepair.devices.brand} ${createdRepair.devices.model}` : `${device.brand} ${device.model}`}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">Problème</p>
                  <p className="text-sm">{createdRepair.issue}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">Prix estimé</p>
                  <p className="text-sm font-medium">{createdRepair.estimated_price ? `${createdRepair.estimated_price} €` : "—"}</p>
                </CardContent></Card>
              </div>
              <Button onClick={handleGenerateQuote} className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />Générer le devis PDF
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-3 sm:px-6 py-3 sm:py-4 border-t border-border gap-2 shrink-0">
          {step === 8 ? (
            <Button onClick={handleClose}>Fermer</Button>
          ) : (
            <>
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Précédent
                </Button>
              )}
              <Button variant="outline" onClick={handleClose}>Annuler</Button>
              <Button onClick={handleNext} disabled={!canProceed() || mutation.isPending}>
                {step === 7 ? (mutation.isPending ? "Création..." : "Créer la réparation") : <>Suivant<ChevronRight className="h-4 w-4 ml-1" /></>}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
