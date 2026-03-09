import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface Line {
  description: string;
  quantity: number;
  unit_price: number;
}

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

  const totalHT = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const totalTTC = totalHT * 1.2;

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
      const { data: org } = await supabase.from("organizations").select("quote_prefix").single();
      const ref = (org?.quote_prefix || "DEV-") + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      const { error } = await supabase.from("quotes").insert({
        organization_id: orgId,
        reference: ref,
        client_id: clientId || null,
        device_id: deviceId || null,
        lines: JSON.parse(JSON.stringify(lines.filter(l => l.description.trim()))),
        total_ht: totalHT,
        total_ttc: totalTTC,
        vat_rate: 20,
        notes: notes.trim() || null,
        status: "brouillon",
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Nouveau devis</DialogTitle></DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Client</Label>
              <Select value={clientId} onValueChange={v => { setClientId(v); setDeviceId(""); }}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Appareil</Label>
              <Select value={deviceId} onValueChange={setDeviceId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{devices.map(d => <SelectItem key={d.id} value={d.id}>{d.brand} {d.model}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Lignes du devis</Label>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1"><Input placeholder="Description" value={line.description} onChange={e => updateLine(i, "description", e.target.value)} /></div>
                  <div className="w-20"><Input type="number" min="1" value={line.quantity} onChange={e => updateLine(i, "quantity", parseInt(e.target.value) || 1)} /></div>
                  <div className="w-24"><Input type="number" step="0.01" placeholder="Prix" value={line.unit_price || ""} onChange={e => updateLine(i, "unit_price", parseFloat(e.target.value) || 0)} /></div>
                  <Button variant="ghost" size="icon" onClick={() => removeLine(i)} disabled={lines.length === 1}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addLine} className="mt-2"><Plus className="h-3 w-3 mr-1" />Ajouter une ligne</Button>
          </div>

          <div className="flex justify-end gap-6 text-sm border-t pt-3">
            <div>Total HT: <span className="font-bold">{totalHT.toFixed(2)} €</span></div>
            <div>TVA (20%): <span className="font-medium">{(totalTTC - totalHT).toFixed(2)} €</span></div>
            <div>Total TTC: <span className="font-bold text-lg">{totalTTC.toFixed(2)} €</span></div>
          </div>

          <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={!lines.some(l => l.description.trim()) || mutation.isPending}>
            {mutation.isPending ? "Création..." : "Créer le devis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
