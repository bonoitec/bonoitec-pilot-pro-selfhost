import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { CreateStockDialog } from "@/components/dialogs/CreateStockDialog";
import { useToast } from "@/hooks/use-toast";

const Stock = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);

  const { data: parts = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inventory").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Pièce supprimée" });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const filtered = parts.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.compatible_brand as string || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.compatible_model as string || "").toLowerCase().includes(search.toLowerCase())
  );
  const lowStock = parts.filter((p) => p.quantity <= p.min_quantity);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock</h1>
          <p className="text-muted-foreground text-sm">Inventaire des pièces détachées</p>
        </div>
        <Button onClick={() => { setEditingPart(null); setShowCreate(true); }}><Plus className="h-4 w-4 mr-2" />Ajouter une pièce</Button>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium">Stock faible pour {lowStock.length} pièce(s)</p>
              <p className="text-xs text-muted-foreground">{lowStock.map((p) => p.name).join(", ")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher une pièce..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <Card><CardContent className="p-5"><Skeleton className="h-40 w-full" /></CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune pièce trouvée</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">Pièce</th>
                    <th className="text-left p-3 font-medium">Catégorie</th>
                    <th className="text-left p-3 font-medium">Compatibilité</th>
                    <th className="text-right p-3 font-medium">Achat</th>
                    <th className="text-right p-3 font-medium">Vente</th>
                    <th className="text-right p-3 font-medium">Marge</th>
                    <th className="text-center p-3 font-medium">Quantité</th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((part) => {
                    const margin = part.sell_price > 0 ? Math.round(((part.sell_price - part.buy_price) / part.sell_price) * 100) : 0;
                    const isLow = part.quantity <= part.min_quantity;
                    const compat = [part.compatible_brand as string, part.compatible_model as string].filter(Boolean).join(" ");
                    return (
                      <tr key={part.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium">{part.name}</td>
                        <td className="p-3"><Badge variant="secondary" className="text-xs">{part.category}</Badge></td>
                        <td className="p-3 text-xs text-muted-foreground">{compat || "—"}</td>
                        <td className="p-3 text-right text-muted-foreground">{Number(part.buy_price).toFixed(2)} €</td>
                        <td className="p-3 text-right">{Number(part.sell_price).toFixed(2)} €</td>
                        <td className="p-3 text-right text-success font-medium">{margin}%</td>
                        <td className="p-3 text-center">
                          <Badge variant={isLow ? "destructive" : "secondary"} className="text-xs">
                            {isLow && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {part.quantity}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingPart(part); setShowCreate(true); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(part.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
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

      <CreateStockDialog open={showCreate} onOpenChange={setShowCreate} editingPart={editingPart} />
    </div>
  );
};

export default Stock;
