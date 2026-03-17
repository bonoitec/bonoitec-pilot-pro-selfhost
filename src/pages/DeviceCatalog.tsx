import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, BookOpen, Smartphone, Laptop, Gamepad2, Watch, Tablet, Navigation, Globe, Database } from "lucide-react";
import { SEED_DEVICES } from "@/data/deviceCatalogSeed";

const categories = ["Console", "GPS", "Montre", "Ordinateur", "Smartphone", "Tablette", "Universel"];
const categoryIcons: Record<string, any> = {
  Console: Gamepad2,
  GPS: Navigation,
  Montre: Watch,
  Ordinateur: Laptop,
  Smartphone,
  Tablette: Tablet,
  Universel: Globe,
};

interface CatalogEntry {
  id: string;
  category: string;
  brand: string;
  model: string;
  model_number: string | null;
  release_year: number | null;
  storage_variants: string[];
  color_variants: string[];
  is_active: boolean;
}

const emptyForm = {
  category: "Smartphone",
  brand: "",
  model: "",
  model_number: "",
  release_year: "",
  storage_variants: "",
  color_variants: "",
};

export default function DeviceCatalog() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: orgId } = useQuery({
    queryKey: ["user-org-id"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_org_id");
      if (error) throw error;
      return data as string;
    },
  });

  const { data: catalog = [], isLoading } = useQuery({
    queryKey: ["device-catalog-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("device_catalog")
        .select("*")
        .order("brand")
        .order("model");
      if (error) throw error;
      return data as CatalogEntry[];
    },
  });

  const brands = [...new Set(catalog.map(d => d.brand))].sort();

  const filtered = catalog.filter(d => {
    if (filterCategory && d.category !== filterCategory) return false;
    if (filterBrand && d.brand !== filterBrand) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.brand.toLowerCase().includes(q) || d.model.toLowerCase().includes(q) || `${d.brand} ${d.model}`.toLowerCase().includes(q);
    }
    return true;
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const storageArr = form.storage_variants.split(",").map(s => s.trim()).filter(Boolean);
      const colorArr = form.color_variants.split(",").map(s => s.trim()).filter(Boolean);
      const payload = {
        category: form.category,
        brand: form.brand.trim(),
        model: form.model.trim(),
        model_number: form.model_number.trim() || null,
        release_year: form.release_year ? parseInt(form.release_year) : null,
        storage_variants: storageArr,
        color_variants: colorArr,
        organization_id: orgId!,
      };
      if (editingId) {
        const { error } = await supabase.from("device_catalog").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("device_catalog").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editingId ? "Appareil modifié" : "Appareil ajouté" });
      qc.invalidateQueries({ queryKey: ["device-catalog-admin"] });
      qc.invalidateQueries({ queryKey: ["device-catalog"] });
      setShowDialog(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("device_catalog").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Appareil supprimé" });
      qc.invalidateQueries({ queryKey: ["device-catalog-admin"] });
      qc.invalidateQueries({ queryKey: ["device-catalog"] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const prefillMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Organisation introuvable");
      const BATCH_SIZE = 50;
      const rows = SEED_DEVICES.map(d => ({
        category: d.category,
        brand: d.brand,
        model: d.model,
        release_year: d.release_year ?? null,
        storage_variants: d.storage_variants ?? [],
        color_variants: [],
        organization_id: orgId,
      }));
      let added = 0;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase.from("device_catalog").upsert(batch, {
          onConflict: "brand,model,organization_id",
          ignoreDuplicates: true,
        }).select("id");
        if (error) throw error;
        added += (data?.length ?? 0);
      }
      return added;
    },
    onSuccess: (added) => {
      const skipped = SEED_DEVICES.length - added;
      toast({ title: "Catalogue pré-rempli", description: `${added} modèles ajoutés${skipped > 0 ? `, ${skipped} déjà existants` : ""}.` });
      qc.invalidateQueries({ queryKey: ["device-catalog-admin"] });
      qc.invalidateQueries({ queryKey: ["device-catalog"] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const openEdit = (entry: CatalogEntry) => {
    setEditingId(entry.id);
    setForm({
      category: entry.category,
      brand: entry.brand,
      model: entry.model,
      model_number: entry.model_number || "",
      release_year: entry.release_year?.toString() || "",
      storage_variants: Array.isArray(entry.storage_variants) ? entry.storage_variants.join(", ") : "",
      color_variants: Array.isArray(entry.color_variants) ? entry.color_variants.join(", ") : "",
    });
    setShowDialog(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Catalogue appareils
          </h1>
          <p className="text-muted-foreground text-sm">{catalog.length} appareils référencés</p>
        </div>
        <div className="flex gap-2">
          {catalog.length === 0 && (
            <Button variant="outline" onClick={() => prefillMutation.mutate()} disabled={prefillMutation.isPending}>
              <Database className="h-4 w-4 mr-2" />
              {prefillMutation.isPending ? "Chargement..." : `Pré-remplir (${SEED_DEVICES.length} modèles)`}
            </Button>
          )}
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={v => setFilterCategory(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterBrand} onValueChange={v => setFilterBrand(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Marque" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <Skeleton className="h-60 w-full" />
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun appareil trouvé</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">Appareil</th>
                    <th className="text-left p-3 font-medium">Catégorie</th>
                    <th className="text-left p-3 font-medium">Année</th>
                    <th className="text-left p-3 font-medium">Stockages</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(entry => {
                    const Icon = categoryIcons[entry.category] || Smartphone;
                    return (
                      <tr key={entry.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{entry.brand}</span>
                            <span className="text-muted-foreground">{entry.model}</span>
                          </div>
                        </td>
                        <td className="p-3"><Badge variant="secondary" className="text-xs">{entry.category}</Badge></td>
                        <td className="p-3 text-muted-foreground">{entry.release_year || "—"}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(entry.storage_variants) && entry.storage_variants.slice(0, 3).map((s: string) => (
                              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                            ))}
                            {Array.isArray(entry.storage_variants) && entry.storage_variants.length > 3 && (
                              <Badge variant="outline" className="text-xs">+{entry.storage_variants.length - 3}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(entry)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { if (confirm("Supprimer cet appareil ?")) deleteMutation.mutate(entry.id); }}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Modifier l'appareil" : "Ajouter un appareil"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Catégorie *</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Marque *</Label><Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Apple, Samsung..." /></div>
              <div><Label>Modèle *</Label><Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="iPhone 15 Pro..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>N° modèle</Label><Input value={form.model_number} onChange={e => setForm({ ...form, model_number: e.target.value })} placeholder="A2849..." /></div>
              <div><Label>Année</Label><Input type="number" value={form.release_year} onChange={e => setForm({ ...form, release_year: e.target.value })} placeholder="2024" /></div>
            </div>
            <div><Label>Stockages (séparés par des virgules)</Label><Input value={form.storage_variants} onChange={e => setForm({ ...form, storage_variants: e.target.value })} placeholder="128 Go, 256 Go, 512 Go" /></div>
            <div><Label>Couleurs (séparées par des virgules)</Label><Input value={form.color_variants} onChange={e => setForm({ ...form, color_variants: e.target.value })} placeholder="Noir, Blanc, Bleu" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.brand.trim() || !form.model.trim() || saveMutation.isPending}>
              {saveMutation.isPending ? "Enregistrement..." : editingId ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
