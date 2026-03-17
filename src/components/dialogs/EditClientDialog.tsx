import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  notes: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function EditClientDialog({ open, onOpenChange, client }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", city: "", postal_code: "", notes: "" });

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name || "",
        phone: client.phone || "",
        email: client.email || "",
        address: client.address || "",
        city: client.city || "",
        postal_code: client.postal_code || "",
        notes: client.notes || "",
      });
    }
  }, [client]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!client) return;
      const { error } = await supabase.from("clients").update({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        postal_code: form.postal_code.trim() || null,
        notes: form.notes.trim() || null,
      }).eq("id", client.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Client modifié avec succès" });
      qc.invalidateQueries({ queryKey: ["clients"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
          <DialogDescription>Modifiez les informations du client.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Nom *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom complet" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="06 XX XX XX XX" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="client@email.com" /></div>
          </div>
          <div><Label>Adresse</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Adresse complète" /></div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes..." rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.name.trim() || mutation.isPending}>
            {mutation.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
