import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPart?: any;
}

const categories = ["Écran", "Batterie", "Connecteur", "Nappe", "Vitre", "Coque", "Autre"];

export function CreateStockDialog({ open, onOpenChange, editingPart }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "", category: "Autre", buy_price: "", sell_price: "", quantity: "1", min_quantity: "5",
    supplier: "", sku: "", device_compatibility: "", compatible_brand: "", compatible_model: "",
  });

  useEffect(() => {
    if (editingPart) {
      setForm({
        name: editingPart.name || "",
        category: editingPart.category || "Autre",
        buy_price: String(editingPart.buy_price ?? ""),
        sell_price: String(editingPart.sell_price ?? ""),
        quantity: String(editingPart.quantity ?? "1"),
        min_quantity: String(editingPart.min_quantity ?? "5"),
        supplier: editingPart.supplier || "",
        sku: editingPart.sku || "",
        device_compatibility: editingPart.device_compatibility || "",
        compatible_brand: editingPart.compatible_brand || "",
        compatible_model: editingPart.compatible_model || "",
      });
    } else {
      setForm({ name: "", category: "Autre", buy_price: "", sell_price: "", quantity: "1", min_quantity: "5", supplier: "", sku: "", device_compatibility: "", compatible_brand: "", compatible_model: "" });
    }
  }, [editingPart, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name.trim(),
        category: form.category,
        buy_price: parseFloat(form.buy_price) || 0,
        sell_price: parseFloat(form.sell_price) || 0,
        quantity: parseInt(form.quantity) || 0,
        min_quantity: parseInt(form.min_quantity) || 5,
        supplier: form.supplier.trim() || null,
        sku: form.sku.trim() || null,
        device_compatibility: form.device_compatibility.trim() || null,
        compatible_brand: form.compatible_brand.trim() || null,
        compatible_model: form.compatible_model.trim() || null,
      };
      if (editingPart) {
        const { error } = await supabase.from("inventory").update(payload).eq("id", editingPart.id);
        if (error) throw error;
      } else {
        const { data: orgId } = await supabase.rpc("get_user_org_id");
        if (!orgId) throw new Error("Organisation introuvable");
        payload.organization_id = orgId;
        const { error } = await supabase.from("inventory").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editingPart ? "Pièce modifiée" : "Pièce ajoutée au stock" });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["inventory-for-parts"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingPart ? "Modifier la pièce" : "Ajouter une pièce"}</DialogTitle>
          <DialogDescription>{editingPart ? "Modifiez les informations de la pièce." : "Ajoutez une pièce détachée à votre inventaire."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div><Label>Nom *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Écran iPhone 15..." /></div>
          <div>
            <Label>Catégorie</Label>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Marque compatible</Label><Input value={form.compatible_brand} onChange={e => setForm({ ...form, compatible_brand: e.target.value })} placeholder="Apple, Samsung..." /></div>
            <div><Label>Modèle compatible</Label><Input value={form.compatible_model} onChange={e => setForm({ ...form, compatible_model: e.target.value })} placeholder="iPhone XR..." /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Prix d'achat (€)</Label><Input type="number" step="0.01" value={form.buy_price} onChange={e => setForm({ ...form, buy_price: e.target.value })} placeholder="0.00" /></div>
            <div><Label>Prix de vente (€)</Label><Input type="number" step="0.01" value={form.sell_price} onChange={e => setForm({ ...form, sell_price: e.target.value })} placeholder="0.00" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Quantité</Label><Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
            <div><Label>Seuil minimum</Label><Input type="number" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: e.target.value })} /></div>
          </div>
          <div><Label>Fournisseur</Label><Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Nom du fournisseur" /></div>
          <div><Label>SKU / Référence</Label><Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="Référence interne" className="font-mono" /></div>
          <div><Label>Notes de compatibilité</Label><Input value={form.device_compatibility} onChange={e => setForm({ ...form, device_compatibility: e.target.value })} placeholder="Compatibilité supplémentaire..." /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.name.trim() || mutation.isPending}>
            {mutation.isPending ? "Enregistrement..." : editingPart ? "Modifier" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
