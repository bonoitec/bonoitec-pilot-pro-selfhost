import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateClientDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", email: "", address: "", city: "", postal_code: "", notes: "" });
  const fullName = `${form.first_name.trim()} ${form.last_name.trim()}`.trim();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: orgId } = await supabase.rpc("get_user_org_id");
      if (!orgId) throw new Error("Organisation introuvable");
      const { error } = await supabase.from("clients").insert({
        organization_id: orgId,
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        name: fullName,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        postal_code: form.postal_code.trim() || null,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Client créé avec succès" });
      qc.invalidateQueries({ queryKey: ["clients"] });
      setForm({ first_name: "", last_name: "", phone: "", email: "", address: "", city: "", postal_code: "", notes: "" });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
          <DialogDescription>Remplissez les informations du nouveau client.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Prénom *</Label><Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="Julien" /></div>
            <div><Label>Nom *</Label><Input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Moreau" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="06 XX XX XX XX" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="client@email.com" /></div>
          </div>
          <div><Label>Adresse</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Adresse complète" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Code postal</Label><Input value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} placeholder="75001" /></div>
            <div><Label>Ville</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Paris" /></div>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes..." rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={!fullName || mutation.isPending}>
            {mutation.isPending ? "Enregistrement..." : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
