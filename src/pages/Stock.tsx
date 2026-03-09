import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, AlertTriangle, Package } from "lucide-react";

const mockParts = [
  { id: 1, name: "Écran iPhone 14", category: "Écrans", buyPrice: 45, sellPrice: 89, qty: 12, minQty: 5, supplier: "GSM Parts Pro" },
  { id: 2, name: "Batterie iPhone 13", category: "Batteries", buyPrice: 15, sellPrice: 39, qty: 3, minQty: 5, supplier: "GSM Parts Pro" },
  { id: 3, name: "Écran Samsung S23", category: "Écrans", buyPrice: 55, sellPrice: 99, qty: 8, minQty: 5, supplier: "MobileParts EU" },
  { id: 4, name: "Connecteur charge USB-C", category: "Connecteurs", buyPrice: 3, sellPrice: 25, qty: 25, minQty: 10, supplier: "AliExpress Pro" },
  { id: 5, name: "Batterie MacBook Pro 2023", category: "Batteries", buyPrice: 65, sellPrice: 129, qty: 2, minQty: 3, supplier: "Apple Parts Direct" },
  { id: 6, name: "Pâte thermique Arctic", category: "Consommables", buyPrice: 5, sellPrice: 15, qty: 18, minQty: 5, supplier: "Amazon Pro" },
  { id: 7, name: "Écran iPad Air 5", category: "Écrans", buyPrice: 80, sellPrice: 149, qty: 1, minQty: 3, supplier: "GSM Parts Pro" },
];

const Stock = () => {
  const [search, setSearch] = useState("");
  const filtered = mockParts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = mockParts.filter((p) => p.qty <= p.minQty);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock</h1>
          <p className="text-muted-foreground text-sm">Inventaire des pièces détachées</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Ajouter une pièce</Button>
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

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium">Pièce</th>
                  <th className="text-left p-3 font-medium">Catégorie</th>
                  <th className="text-right p-3 font-medium">Achat</th>
                  <th className="text-right p-3 font-medium">Vente</th>
                  <th className="text-right p-3 font-medium">Marge</th>
                  <th className="text-center p-3 font-medium">Quantité</th>
                  <th className="text-left p-3 font-medium">Fournisseur</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((part) => {
                  const margin = Math.round(((part.sellPrice - part.buyPrice) / part.sellPrice) * 100);
                  const isLow = part.qty <= part.minQty;
                  return (
                    <tr key={part.id} className="border-b hover:bg-muted/20 transition-colors cursor-pointer">
                      <td className="p-3 font-medium">{part.name}</td>
                      <td className="p-3"><Badge variant="secondary" className="text-xs">{part.category}</Badge></td>
                      <td className="p-3 text-right text-muted-foreground">{part.buyPrice} €</td>
                      <td className="p-3 text-right">{part.sellPrice} €</td>
                      <td className="p-3 text-right text-success font-medium">{margin}%</td>
                      <td className="p-3 text-center">
                        <Badge variant={isLow ? "destructive" : "secondary"} className="text-xs">
                          {isLow && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {part.qty}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{part.supplier}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stock;
