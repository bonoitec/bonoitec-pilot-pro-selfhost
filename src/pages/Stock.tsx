import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Search, AlertTriangle, Pencil, Trash2, Package, ShoppingCart,
  XCircle, AlertOctagon, CheckCircle2, History
} from "lucide-react";
import { CreateStockDialog } from "@/components/dialogs/CreateStockDialog";
import { PriceHistoryDialog } from "@/components/dialogs/PriceHistoryDialog";
import { useToast } from "@/hooks/use-toast";

const Stock = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);
  const [historyPart, setHistoryPart] = useState<any>(null);
  const [tab, setTab] = useState("inventaire");

  const { data: parts = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inventory").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: purchases = [], isLoading: loadingPurchases } = useQuery({
    queryKey: ["purchase_history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_history" as any)
        .select("*, inventory(name)")
        .order("purchased_at", { ascending: false });
      if (error) throw error;
      return data as any[];
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
      (p.compatible_brand ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.compatible_model ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const outOfStock = parts.filter(p => p.quantity === 0);
  const critical = parts.filter(p => p.quantity > 0 && p.quantity <= p.min_quantity);
  const sufficient = parts.filter(p => p.quantity > p.min_quantity);

  // Purchase history stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
  const monthExpenses = purchases
    .filter((p: any) => p.purchased_at >= startOfMonth)
    .reduce((s: number, p: any) => s + Number(p.total_ht || 0), 0);
  const yearExpenses = purchases
    .filter((p: any) => p.purchased_at >= startOfYear)
    .reduce((s: number, p: any) => s + Number(p.total_ht || 0), 0);

  const filteredPurchases = purchases.filter((p: any) => {
    const q = historySearch.toLowerCase();
    if (!q) return true;
    return (p.inventory?.name ?? "").toLowerCase().includes(q) ||
      (p.supplier ?? "").toLowerCase().includes(q) ||
      (p.order_number ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock</h1>
          <p className="text-muted-foreground text-sm">Gestion des pièces détachées</p>
        </div>
        <Button onClick={() => { setEditingPart(null); setShowCreate(true); }}>
          <Plus className="h-4 w-4 mr-2" />Ajouter une pièce
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inventaire" className="gap-1.5"><Package className="h-4 w-4" />Inventaire</TabsTrigger>
          <TabsTrigger value="alertes" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" />Alertes
            {(outOfStock.length + critical.length) > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">{outOfStock.length + critical.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="historique" className="gap-1.5"><History className="h-4 w-4" />Historique d'achat</TabsTrigger>
        </TabsList>

        {/* ──── INVENTAIRE ──── */}
        <TabsContent value="inventaire" className="space-y-4 mt-4">
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
                        <th className="text-left p-3 font-medium">Compatible</th>
                        <th className="text-right p-3 font-medium">Prix achat</th>
                        <th className="text-right p-3 font-medium">Prix vente</th>
                        <th className="text-center p-3 font-medium">Quantité</th>
                        <th className="text-center p-3 font-medium">Seuil</th>
                        <th className="text-left p-3 font-medium">Fournisseur</th>
                        <th className="text-center p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((part) => {
                        const isOut = part.quantity === 0;
                        const isLow = part.quantity > 0 && part.quantity <= part.min_quantity;
                        const compat = [part.compatible_brand, part.compatible_model].filter(Boolean).join(" ");
                        return (
                          <tr key={part.id} className="border-b hover:bg-muted/20 transition-colors">
                            <td className="p-3 font-medium">{part.name}</td>
                            <td className="p-3"><Badge variant="secondary" className="text-xs">{part.category}</Badge></td>
                            <td className="p-3 text-xs text-muted-foreground">{compat || "—"}</td>
                            <td className="p-3 text-right text-muted-foreground">{Number(part.buy_price).toFixed(2)} €</td>
                            <td className="p-3 text-right">{Number(part.sell_price).toFixed(2)} €</td>
                            <td className="p-3 text-center">
                              <Badge variant={isOut ? "destructive" : isLow ? "outline" : "secondary"} className={`text-xs ${isLow ? "border-orange-400 text-orange-600 dark:text-orange-400" : ""}`}>
                                {(isOut || isLow) && <AlertTriangle className="h-3 w-3 mr-1" />}
                                {part.quantity}
                              </Badge>
                            </td>
                            <td className="p-3 text-center text-muted-foreground text-xs">{part.min_quantity}</td>
                            <td className="p-3 text-xs text-muted-foreground">{part.supplier || "—"}</td>
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
        </TabsContent>

        {/* ──── ALERTES ──── */}
        <TabsContent value="alertes" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-destructive/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{outOfStock.length}</p>
                  <p className="text-xs text-muted-foreground">Rupture de stock</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-400/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-400/10">
                  <AlertOctagon className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-500">{critical.length}</p>
                  <p className="text-xs text-muted-foreground">Stock critique</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-500/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-500">{sufficient.length}</p>
                  <p className="text-xs text-muted-foreground">Stock suffisant</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rupture */}
          {outOfStock.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-1.5"><XCircle className="h-4 w-4" />Rupture de stock</h3>
              <div className="space-y-2">
                {outOfStock.map(p => (
                  <Card key={p.id} className="border-destructive/20 bg-destructive/5">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.category}{p.supplier ? ` · ${p.supplier}` : ""}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="text-xs">0 en stock</Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">Seuil : {p.min_quantity}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Critique */}
          {critical.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-orange-500 mb-2 flex items-center gap-1.5"><AlertOctagon className="h-4 w-4" />Stock critique</h3>
              <div className="space-y-2">
                {critical.map(p => (
                  <Card key={p.id} className="border-orange-400/20 bg-orange-400/5">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.category}{p.supplier ? ` · ${p.supplier}` : ""}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs border-orange-400 text-orange-600 dark:text-orange-400">
                          <AlertTriangle className="h-3 w-3 mr-1" />{p.quantity} restant(s)
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">Seuil : {p.min_quantity}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {outOfStock.length === 0 && critical.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="font-medium text-emerald-600 dark:text-emerald-400">Tous les stocks sont à niveau</p>
                <p className="text-sm text-muted-foreground mt-1">Aucune alerte de stock pour le moment</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ──── HISTORIQUE D'ACHAT ──── */}
        <TabsContent value="historique" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Dépenses ce mois</p>
                <p className="text-2xl font-bold mt-1">{monthExpenses.toFixed(2)} €</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Dépenses cette année</p>
                <p className="text-2xl font-bold mt-1">{yearExpenses.toFixed(2)} €</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Nb commandes total</p>
                <p className="text-2xl font-bold mt-1">{purchases.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher dans l'historique..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} className="pl-9" />
          </div>

          {loadingPurchases ? (
            <Card><CardContent className="p-5"><Skeleton className="h-40 w-full" /></CardContent></Card>
          ) : filteredPurchases.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-medium text-muted-foreground">Aucun achat enregistré</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">Pièce</th>
                        <th className="text-center p-3 font-medium">Qté</th>
                        <th className="text-right p-3 font-medium">Prix unit.</th>
                        <th className="text-right p-3 font-medium">Total HT</th>
                        <th className="text-left p-3 font-medium">Fournisseur</th>
                        <th className="text-left p-3 font-medium">N° commande</th>
                        <th className="text-left p-3 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchases.map((p: any) => (
                        <tr key={p.id} className="border-b hover:bg-muted/20 transition-colors">
                          <td className="p-3 text-xs">{new Date(p.purchased_at).toLocaleDateString("fr-FR")}</td>
                          <td className="p-3 font-medium">{p.inventory?.name ?? "—"}</td>
                          <td className="p-3 text-center">{p.quantity}</td>
                          <td className="p-3 text-right">{Number(p.unit_price).toFixed(2)} €</td>
                          <td className="p-3 text-right font-medium">{Number(p.total_ht).toFixed(2)} €</td>
                          <td className="p-3 text-xs text-muted-foreground">{p.supplier || "—"}</td>
                          <td className="p-3 text-xs font-mono text-muted-foreground">{p.order_number || "—"}</td>
                          <td className="p-3 text-xs text-muted-foreground truncate max-w-[150px]">{p.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <CreateStockDialog open={showCreate} onOpenChange={setShowCreate} editingPart={editingPart} />
      <PriceHistoryDialog open={!!historyPart} onOpenChange={(o) => !o && setHistoryPart(null)} part={historyPart} />
    </div>
  );
};

export default Stock;
