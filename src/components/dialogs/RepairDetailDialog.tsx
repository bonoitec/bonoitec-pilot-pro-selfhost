import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const statusLabels: Record<string, string> = {
  nouveau: "Nouveau",
  diagnostic: "Diagnostic",
  en_cours: "En cours",
  en_attente_piece: "En attente de pièce",
  termine: "Terminé",
  pret_a_recuperer: "Prêt à récupérer",
};
const statusOrder = ["nouveau", "diagnostic", "en_cours", "en_attente_piece", "termine", "pret_a_recuperer"];

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

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("repairs").update({
        status: status as any,
        diagnostic: diagnostic.trim() || null,
        technician_message: techMessage.trim() || null,
      }).eq("id", repair.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Réparation mise à jour" });
      qc.invalidateQueries({ queryKey: ["repairs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-repairs"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  if (!repair) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono">{repair.reference}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Client:</span> <span className="font-medium">{repair.clients?.name ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Appareil:</span> <span className="font-medium">{repair.devices ? `${repair.devices.brand} ${repair.devices.model}` : "—"}</span></div>
          </div>
          <div className="text-sm"><span className="text-muted-foreground">Problème:</span> <p className="mt-1">{repair.issue}</p></div>
          
          <Separator />

          <div>
            <Label>Statut</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{statusOrder.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Diagnostic</Label><Textarea value={diagnostic} onChange={e => setDiagnostic(e.target.value)} placeholder="Résultat du diagnostic..." rows={3} /></div>
          <div><Label>Message pour le client</Label><Textarea value={techMessage} onChange={e => setTechMessage(e.target.value)} placeholder="Message visible par le client..." rows={2} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Mise à jour..." : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
