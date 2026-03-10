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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, AlertTriangle, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const defaultCategories = ["Chargeur", "Câble", "Coque", "Protection écran", "Adaptateur", "Accessoire", "Autre"];

interface ArticleForm {
  name: string; description: string; price: string; quantity: string; min_quantity: string; category: string; sku: string;
}
const emptyForm: ArticleForm = { name: "", description: "", price: "", quantity: "0", min_quantity: "5", category: "Autre", sku: "" };

const Articles = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ArticleForm>(emptyForm);

  const { data: org } = useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("*").single();
      if (error) throw error;
      return data;
    },
    staleTime: 60000,
  });

  const categories = ((org as any)?.article_categories as string[] | undefined)?.length
    ? (org as any).article_categories as string[]
    : defaultCategories;

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("*").order("name");
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
        price: parseFloat(form.price) || 0,
        quantity: parseInt(form.quantity) || 0,
        min_quantity: parseInt(form.min_quantity) || 5,
        category: form.category,
        sku: form.sku.trim() || null,
      };
      if (editingId) {
        const { error } = await supabase.from("articles").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("articles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editingId ? "Article modifié" : "Article créé" });
      qc.invalidateQueries({ queryKey: ["articles"] });
      closeDialog();
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Article supprimé" });
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const openEdit = (a: any) => {
    setEditingId(a.id);
    setForm({ name: a.name, description: a.description || "", price: String(a.price), quantity: String(a.quantity), min_quantity: String(a.min_quantity), category: a.category, sku: a.sku || "" });
    setShowDialog(true);
  };

  const closeDialog = () => { setShowDialog(false); setEditingId(null); setForm(emptyForm); };

  const filtered = articles.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase()));
  const lowStock = articles.filter(a => a.quantity <= a.min_quantity);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Articles</h1>
          <p className="text-muted-foreground text-sm">Produits et accessoires en vente</p>
        </div>
        <Button onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-2" />Ajouter un article</Button>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium">Stock faible pour {lowStock.length} article(s)</p>
              <p className="text-xs text-muted-foreground">{lowStock.map(a => a.name).join(", ")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un article..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? <Skeleton className="h-40 w-full" /> : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun article trouvé</CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium">Article</th>
                <th className="text-left p-3 font-medium">Catégorie</th>
                <th className="text-right p-3 font-medium">Prix</th>
                <th className="text-center p-3 font-medium">Stock</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(a => {
                  const isLow = a.quantity <= a.min_quantity;
                  return (
                    <tr key={a.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{a.name}</p>
                            {a.description && <p className="text-xs text-muted-foreground line-clamp-1">{a.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3"><Badge variant="secondary" className="text-xs">{a.category}</Badge></td>
                      <td className="p-3 text-right font-medium">{Number(a.price).toFixed(2)} €</td>
                      <td className="p-3 text-center">
                        <Badge variant={isLow ? "destructive" : "secondary"} className="text-xs">
                          {isLow && <AlertTriangle className="h-3 w-3 mr-1" />}{a.quantity}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(a.id)}><Trash2 className="h-3 w-3" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      )}

      <Dialog open={showDialog} onOpenChange={o => { if (!o) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Modifier l'article" : "Nouvel article"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nom *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Chargeur USB-C..." /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div>
              <Label>Catégorie</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Prix (€)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div><Label>Quantité</Label><Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} /></div>
              <div><Label>Seuil alerte</Label><Input type="number" value={form.min_quantity} onChange={e => setForm(f => ({ ...f, min_quantity: e.target.value }))} /></div>
            </div>
            <div><Label>SKU</Label><Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className="font-mono" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Annuler</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.name.trim() || saveMutation.isPending}>
              {saveMutation.isPending ? "..." : editingId ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Articles;
