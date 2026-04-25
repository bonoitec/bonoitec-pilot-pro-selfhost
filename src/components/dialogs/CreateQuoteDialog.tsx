import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, User, FileText, Smartphone } from "lucide-react";

interface Line { description: string; quantity: number; unit_price: number; note?: string; }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const storageOptions = ["16 Go", "32 Go", "64 Go", "128 Go", "256 Go", "512 Go", "1 To"];
const conditionOptions = ["Neuf", "Excellent", "Bon", "Correct", "Mauvais", "HS"];

export function CreateQuoteDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ description: "", quantity: 1, unit_price: 0 }]);

  // Device fields
  const [deviceBrand, setDeviceBrand] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [deviceImei, setDeviceImei] = useState("");
  const [deviceStorage, setDeviceStorage] = useState("");
  const [deviceColor, setDeviceColor] = useState("");
  const [deviceCondition, setDeviceCondition] = useState("");
  const [deviceIssue, setDeviceIssue] = useState("");
  const [deviceAccessories, setDeviceAccessories] = useState("");
  const [devicePassword, setDevicePassword] = useState("non");
  const [deviceObservations, setDeviceObservations] = useState("");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => { const { data } = await supabase.from("clients").select("id, name").order("name"); return data || []; },
    enabled: open,
  });

  const { data: devices = [] } = useQuery({
    queryKey: ["devices-for-client", clientId],
    queryFn: async () => {
      const q = supabase.from("devices").select("id, brand, model, serial_number");
      if (clientId) q.eq("client_id", clientId);
      const { data } = await q;
      return data || [];
    },
    enabled: open,
  });

  const { data: org } = useQuery({
    queryKey: ["organization"],
    queryFn: async () => { const { data } = await supabase.rpc("get_org_safe_data").single(); return data; },
    enabled: open,
  });

  // Auto-fill device fields when selecting an existing device
  const handleDeviceSelect = (id: string) => {
    setDeviceId(id);
    const d = devices.find(dev => dev.id === id);
    if (d) {
      setDeviceBrand(d.brand || "");
      setDeviceModel(d.model || "");
      setDeviceImei(d.serial_number || "");
    }
  };

  const vatEnabled = (org as any)?.vat_enabled ?? true;
  const vatRate = org?.vat_rate ?? 20;
  const totalHT = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const totalTTC = vatEnabled ? totalHT * (1 + vatRate / 100) : totalHT;

  const addLine = () => setLines([...lines, { description: "", quantity: 1, unit_price: 0 }]);
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof Line, value: string | number) => {
    const updated = [...lines];
    (updated[i] as any)[field] = value;
    setLines(updated);
  };

  const resetForm = () => {
    setLines([{ description: "", quantity: 1, unit_price: 0 }]);
    setClientId(""); setDeviceId(""); setNotes("");
    setDeviceBrand(""); setDeviceModel(""); setDeviceImei("");
    setDeviceStorage(""); setDeviceColor(""); setDeviceCondition("");
    setDeviceIssue(""); setDeviceAccessories(""); setDevicePassword("non");
    setDeviceObservations("");
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: orgId } = await supabase.rpc("get_user_org_id");
      if (!orgId) throw new Error("Organisation introuvable");
      const ref = (org?.quote_prefix || "DEV-") + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

      // Store device metadata in notes as JSON
      const deviceMeta = {
        __quoteDeviceInfo: {
          brand: deviceBrand.trim(),
          model: deviceModel.trim(),
          imei: deviceImei.trim(),
          storage: deviceStorage,
          color: deviceColor.trim(),
          condition: deviceCondition,
          issue: deviceIssue.trim(),
          accessories: deviceAccessories.trim(),
          passwordGiven: devicePassword,
          observations: deviceObservations.trim(),
        },
        __userNotes: notes.trim() || undefined,
      };

      const { error } = await supabase.from("quotes").insert({
        organization_id: orgId, reference: ref, client_id: clientId || null,
        device_id: deviceId || null,
        lines: JSON.parse(JSON.stringify(lines.filter(l => l.description.trim()))),
        total_ht: totalHT, total_ttc: totalTTC, vat_rate: vatRate,
        notes: JSON.stringify(deviceMeta),
        status: "brouillon",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Devis créé avec succès" });
      qc.invalidateQueries({ queryKey: ["quotes"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Nouveau devis</DialogTitle>
          <DialogDescription>Créez un devis professionnel avec les détails de l'appareil et de la prestation.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto pr-1 pb-2" style={{ maxHeight: "calc(85vh - 140px)" }}>
          {/* Client */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />Client
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Select value={clientId} onValueChange={v => { setClientId(v); setDeviceId(""); }}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Device info */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />Appareil
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {devices.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Appareil existant (optionnel)</Label>
                  <Select value={deviceId} onValueChange={handleDeviceSelect}>
                    <SelectTrigger><SelectValue placeholder="Choisir ou remplir manuellement" /></SelectTrigger>
                    <SelectContent>{devices.map(d => <SelectItem key={d.id} value={d.id}>{d.brand} {d.model}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Marque *</Label>
                  <Input value={deviceBrand} onChange={e => setDeviceBrand(e.target.value)} placeholder="Apple, Samsung..." maxLength={100} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Modèle exact *</Label>
                  <Input value={deviceModel} onChange={e => setDeviceModel(e.target.value)} placeholder="iPhone 15 Pro Max..." maxLength={100} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">IMEI / N° de série</Label>
                  <Input value={deviceImei} onChange={e => setDeviceImei(e.target.value)} placeholder="354012345678901" maxLength={50} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Capacité de stockage</Label>
                  <Select value={deviceStorage} onValueChange={setDeviceStorage}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{storageOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Couleur</Label>
                  <Input value={deviceColor} onChange={e => setDeviceColor(e.target.value)} placeholder="Noir, Blanc..." maxLength={50} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">État esthétique</Label>
                  <Select value={deviceCondition} onValueChange={setDeviceCondition}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{conditionOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Panne signalée</Label>
                <Textarea value={deviceIssue} onChange={e => setDeviceIssue(e.target.value)} placeholder="Décrivez la panne..." rows={2} maxLength={500} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Accessoires laissés</Label>
                  <Input value={deviceAccessories} onChange={e => setDeviceAccessories(e.target.value)} placeholder="Chargeur, coque..." maxLength={200} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Code / mot de passe confié</Label>
                  <Select value={devicePassword} onValueChange={setDevicePassword}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="non">Non</SelectItem>
                      <SelectItem value="oui">Oui</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Observations</Label>
                <Textarea value={deviceObservations} onChange={e => setDeviceObservations(e.target.value)} placeholder="Observations complémentaires..." rows={2} maxLength={500} />
              </div>
            </CardContent>
          </Card>

          {/* Lines */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />Lignes du devis
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="space-y-1.5 pb-2 border-b border-border/40 last:border-b-0">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1"><Input placeholder="Description (ex. Remplacement écran)" value={line.description} onChange={e => updateLine(i, "description", e.target.value)} maxLength={300} /></div>
                    <div className="w-20"><Input type="number" min="1" value={line.quantity} onChange={e => updateLine(i, "quantity", parseInt(e.target.value) || 1)} /></div>
                    <div className="w-24"><Input type="number" step="0.01" placeholder="Prix" value={line.unit_price || ""} onChange={e => updateLine(i, "unit_price", parseFloat(e.target.value) || 0)} /></div>
                    <Button variant="ghost" size="icon" onClick={() => removeLine(i)} disabled={lines.length === 1}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <Input
                    placeholder="Note / garantie (optionnel — ex. Garantie 12 mois sur la pièce et la main-d'œuvre)"
                    value={line.note ?? ""}
                    onChange={e => updateLine(i, "note", e.target.value)}
                    className="h-8 text-xs text-muted-foreground"
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addLine}><Plus className="h-3 w-3 mr-1" />Ajouter une ligne</Button>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card className="border-border/60 bg-muted/20">
            <CardContent className="px-4 py-3 flex justify-end gap-6 text-sm">
              <div>Total HT: <span className="font-bold">{totalHT.toFixed(2)} €</span></div>
              {vatEnabled ? (
                <>
                  <div>TVA ({vatRate}%): <span className="font-medium">{(totalTTC - totalHT).toFixed(2)} €</span></div>
                  <div>Total TTC: <span className="font-bold text-base">{totalTTC.toFixed(2)} €</span></div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground italic">TVA non applicable (art. 293B)</div>
              )}
            </CardContent>
          </Card>

          <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes additionnelles..." rows={2} maxLength={1000} /></div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={!lines.some(l => l.description.trim()) || mutation.isPending}>
            {mutation.isPending ? "Création..." : "Créer le devis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
