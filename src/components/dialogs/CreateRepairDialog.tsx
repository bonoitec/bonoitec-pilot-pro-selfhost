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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRepairDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    client_id: "",
    device_id: "",
    technician_id: "",
    issue: "",
    estimated_price: "",
    internal_notes: "",
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: devices = [] } = useQuery({
    queryKey: ["devices-for-client", form.client_id],
    queryFn: async () => {
      const q = supabase.from("devices").select("id, brand, model").order("brand");
      if (form.client_id) q.eq("client_id", form.client_id);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: open,
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

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: orgId } = await supabase.rpc("get_user_org_id");
      if (!orgId) throw new Error("Organisation introuvable");
      const ref = "REP-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6);
      const { error } = await supabase.from("repairs").insert({
        organization_id: orgId,
        reference: ref,
        client_id: form.client_id || null,
        device_id: form.device_id || null,
        technician_id: form.technician_id || null,
        issue: form.issue.trim(),
        estimated_price: form.estimated_price ? parseFloat(form.estimated_price) : null,
        internal_notes: form.internal_notes.trim() || null,
        status: "nouveau",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Réparation créée avec succès" });
      qc.invalidateQueries({ queryKey: ["repairs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-repairs"] });
      setForm({ client_id: "", device_id: "", technician_id: "", issue: "", estimated_price: "", internal_notes: "" });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Nouvelle réparation</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <Label>Client</Label>
            <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v, device_id: "" })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
              <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Appareil</Label>
            <Select value={form.device_id} onValueChange={v => setForm({ ...form, device_id: v })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un appareil" /></SelectTrigger>
              <SelectContent>{devices.map(d => <SelectItem key={d.id} value={d.id}>{d.brand} {d.model}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Technicien</Label>
            <Select value={form.technician_id} onValueChange={v => setForm({ ...form, technician_id: v })}>
              <SelectTrigger><SelectValue placeholder="Assigner un technicien" /></SelectTrigger>
              <SelectContent>{technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Problème décrit *</Label><Textarea value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })} placeholder="Description du problème..." rows={3} /></div>
          <div><Label>Prix estimé (€)</Label><Input type="number" step="0.01" value={form.estimated_price} onChange={e => setForm({ ...form, estimated_price: e.target.value })} placeholder="0.00" /></div>
          <div><Label>Notes internes</Label><Textarea value={form.internal_notes} onChange={e => setForm({ ...form, internal_notes: e.target.value })} placeholder="Notes pour l'équipe..." rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.issue.trim() || mutation.isPending}>
            {mutation.isPending ? "Création..." : "Créer la réparation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
