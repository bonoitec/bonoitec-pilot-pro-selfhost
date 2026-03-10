import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Pencil, Trash2, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const deviceCategories = ["Smartphone", "Tablette", "Ordinateur portable", "Console", "Montre connectée", "Autre"];

interface ServiceForm {
  name: string;
  description: string;
  default_price: string;
  estimated_time_minutes: string;
  compatible_categories: string[];
  compatible_brand: string;
  compatible_model: string;
}

const emptyForm: ServiceForm = { name: "", description: "", default_price: "", estimated_time_minutes: "30", compatible_categories: [], compatible_brand: "", compatible_model: "" };

const Services = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: orgId } = await supabase.rpc("get_user_org_id");
      if (!orgId) throw new Error("Organisation introuvable");
      const payload = {
        organization_id: orgId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        default_price: parseFloat(form.default_price) || 0,
        estimated_time_minutes: parseInt(form.estimated_time_minutes) || 30,
        compatible_categories: form.compatible_categories,
      };
      if (editingId) {
        const { error } = await supabase.from("services").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editingId ? "Service modifié" : "Service créé" });
      qc.invalidateQueries({ queryKey: ["services"] });
      closeDialog();
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Service supprimé" });
      qc.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const openEdit = (s: any) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      description: s.description || "",
      default_price: String(s.default_price),
      estimated_time_minutes: String(s.estimated_time_minutes),
      compatible_categories: (s.compatible_categories as string[]) || [],
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const filtered = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground text-sm">Gérez vos prestations de réparation</p>
        </div>
        <Button onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-2" />Ajouter un service</Button>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un service..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun service trouvé. Créez votre premier service.</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(s => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wrench className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      {s.description && <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <Badge variant="secondary" className="text-xs">{Number(s.default_price).toFixed(2)} €</Badge>
                  <Badge variant="outline" className="text-xs">{s.estimated_time_minutes} min</Badge>
                </div>
                {(s.compatible_categories as string[])?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(s.compatible_categories as string[]).map(c => (
                      <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={o => { if (!o) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Modifier le service" : "Nouveau service"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nom *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Remplacement écran OLED..." /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Détails du service..." rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Prix par défaut (€)</Label><Input type="number" step="0.01" value={form.default_price} onChange={e => setForm(f => ({ ...f, default_price: e.target.value }))} placeholder="0.00" /></div>
              <div><Label>Durée estimée (min)</Label><Input type="number" value={form.estimated_time_minutes} onChange={e => setForm(f => ({ ...f, estimated_time_minutes: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Catégories compatibles</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {deviceCategories.map(cat => (
                  <div key={cat} className="flex items-center gap-1.5">
                    <Checkbox
                      checked={form.compatible_categories.includes(cat)}
                      onCheckedChange={checked => {
                        setForm(f => ({
                          ...f,
                          compatible_categories: checked
                            ? [...f.compatible_categories, cat]
                            : f.compatible_categories.filter(c => c !== cat),
                        }));
                      }}
                    />
                    <span className="text-xs">{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Annuler</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.name.trim() || saveMutation.isPending}>
              {saveMutation.isPending ? "Enregistrement..." : editingId ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
