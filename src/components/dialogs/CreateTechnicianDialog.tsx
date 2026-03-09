import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTechnicianDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", specialty: "" });

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: orgId } = await supabase.rpc("get_user_org_id");
      if (!orgId) throw new Error("Organisation introuvable");
      const { error } = await supabase.from("technicians").insert({
        organization_id: orgId,
        name: form.name.trim(),
        specialty: form.specialty.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Technicien ajouté" });
      qc.invalidateQueries({ queryKey: ["technicians"] });
      setForm({ name: "", specialty: "" });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Ajouter un technicien</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nom *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom complet" /></div>
          <div><Label>Spécialité</Label><Input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="Écrans, micro-soudure..." /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.name.trim() || mutation.isPending}>
            {mutation.isPending ? "Ajout..." : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
