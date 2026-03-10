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

interface Line { description: string; quantity: number; unit_price: number; }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateQuoteDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ description: "", quantity: 1, unit_price: 0 }]);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => { const { data } = await supabase.from("clients").select("id, name").order("name"); return data || []; },
    enabled: open,
  });

  const { data: devices = [] } = useQuery({
    queryKey: ["devices-for-client", clientId],
    queryFn: async () => {
      const q = supabase.from("devices").select("id, brand, model");
      if (clientId) q.eq("client_id", clientId);
      const { data } = await q;
      return data || [];
    },
    enabled: open,
  });

  const { data: org } = useQuery({
    queryKey: ["organization"],
    queryFn: async () => { const { data } = await supabase.from("organizations").select("*").single(); return data; },
    enabled: open,
  });

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

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: orgId } = await supabase.rpc("get_user_org_id");
      if (!orgId) throw new Error("Organisation introuvable");
      const ref = (org?.quote_prefix || "DEV-") + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      const { error } = await supabase.from("quotes").insert({
        organization_id: orgId, reference: ref, client_id: clientId || null,
        device_id: deviceId || null,
        lines: JSON.parse(JSON.stringify(lines.filter(l => l.description.trim()))),
        total_ht: totalHT, total_ttc: totalTTC, vat_rate: vatRate,
        notes: notes.trim() || null, status: "brouillon",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Devis créé avec succès" });
      qc.invalidateQueries({ queryKey: ["quotes"] });
      onOpenChange(false);
      setLines([{ description: "", quantity: 1, unit_price: 0 }]);
      setClientId(""); setDeviceId(""); setNotes("");
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Nouveau devis</DialogTitle>
          <DialogDescription>Créez un devis pour un client avec les détails de prestation.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto pr-1 pb-2" style={{ maxHeight: "calc(85vh - 140px)" }}>
          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />Client & Appareil
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Client</Label>
                <Select value={clientId} onValueChange={v => { setClientId(v); setDeviceId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Appareil</Label>
                <Select value={deviceId} onValueChange={setDeviceId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{devices.map(d => <SelectItem key={d.id} value={d.id}>{d.brand} {d.model}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />Lignes du devis
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1"><Input placeholder="Description" value={line.description} onChange={e => updateLine(i, "description", e.target.value)} /></div>
                  <div className="w-20"><Input type="number" min="1" value={line.quantity} onChange={e => updateLine(i, "quantity", parseInt(e.target.value) || 1)} /></div>
                  <div className="w-24"><Input type="number" step="0.01" placeholder="Prix" value={line.unit_price || ""} onChange={e => updateLine(i, "unit_price", parseFloat(e.target.value) || 0)} /></div>
                  <Button variant="ghost" size="icon" onClick={() => removeLine(i)} disabled={lines.length === 1}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addLine}><Plus className="h-3 w-3 mr-1" />Ajouter une ligne</Button>
            </CardContent>
          </Card>

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

          <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." rows={2} /></div>
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
