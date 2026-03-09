import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: string;
}

const deviceTypes = ["Smartphone", "Tablette", "Ordinateur", "Console", "Autre"];

export function CreateDeviceDialog({ open, onOpenChange, defaultClientId }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    client_id: defaultClientId || "",
    type: "Smartphone",
    brand: "",
    model: "",
    serial_number: "",
    condition: "",
    accessories: "",
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

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: orgId } = await supabase.rpc("get_user_org_id");
      if (!orgId) throw new Error("Organisation introuvable");
      const { error } = await supabase.from("devices").insert({
        organization_id: orgId,
        client_id: form.client_id,
        type: form.type,
        brand: form.brand.trim(),
        model: form.model.trim(),
        serial_number: form.serial_number.trim() || null,
        condition: form.condition.trim() || null,
        accessories: form.accessories.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Appareil ajouté avec succès" });
      qc.invalidateQueries({ queryKey: ["devices"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Nouvel appareil</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Client *</Label>
            <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
              <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Type *</Label>
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{deviceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Marque *</Label><Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Apple, Samsung..." /></div>
            <div><Label>Modèle *</Label><Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="iPhone 15, S24..." /></div>
          </div>
          <div><Label>IMEI / N° série</Label><Input value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} placeholder="Numéro de série" className="font-mono" /></div>
          <div><Label>État</Label><Input value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} placeholder="Bon état, rayures..." /></div>
          <div><Label>Accessoires</Label><Input value={form.accessories} onChange={e => setForm({ ...form, accessories: e.target.value })} placeholder="Chargeur, coque..." /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.client_id || !form.brand.trim() || !form.model.trim() || mutation.isPending}>
            {mutation.isPending ? "Enregistrement..." : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
