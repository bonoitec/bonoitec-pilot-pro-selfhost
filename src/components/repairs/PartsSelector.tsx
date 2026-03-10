import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Package, Plus, Trash2, Search, AlertTriangle } from "lucide-react";

export interface PartUsed {
  inventory_id?: string;
  name: string;
  buy_price: number;
  sell_price: number;
  quantity: number;
}

interface Props {
  parts: PartUsed[];
  onChange: (parts: PartUsed[]) => void;
}

export function PartsSelector({ parts, onChange }: Props) {
  const [search, setSearch] = useState("");

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory-for-parts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("id, name, buy_price, sell_price, quantity, min_quantity, category, device_compatibility")
        .gt("quantity", 0)
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
  });

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.device_compatibility?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const addPart = (inventoryId: string) => {
    const item = inventory.find((i) => i.id === inventoryId);
    if (!item) return;
    const existing = parts.find((p) => p.inventory_id === inventoryId);
    if (existing) {
      onChange(parts.map((p) => p.inventory_id === inventoryId ? { ...p, quantity: p.quantity + 1 } : p));
    } else {
      onChange([...parts, { inventory_id: item.id, name: item.name, buy_price: item.buy_price, sell_price: item.sell_price, quantity: 1 }]);
    }
    setSearch("");
  };

  const addManualPart = () => {
    onChange([...parts, { name: "", buy_price: 0, sell_price: 0, quantity: 1 }]);
  };

  const updatePart = (index: number, updates: Partial<PartUsed>) => {
    onChange(parts.map((p, i) => (i === index ? { ...p, ...updates } : p)));
  };

  const removePart = (index: number) => {
    onChange(parts.filter((_, i) => i !== index));
  };

  const totalCost = parts.reduce((s, p) => s + p.buy_price * p.quantity, 0);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Pièces utilisées
          </span>
          {totalCost > 0 && (
            <Badge variant="secondary" className="text-xs font-mono">
              Coût: {totalCost.toFixed(2)} €
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        {/* Search & add from stock */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans le stock..."
            className="pl-9 h-9 text-sm"
          />
        </div>

        {search.length >= 2 && (
          <div className="max-h-32 overflow-y-auto border border-border rounded-md divide-y divide-border">
            {filteredInventory.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">Aucune pièce trouvée</p>
            ) : (
              filteredInventory.slice(0, 8).map((item) => {
                const isLow = item.quantity <= item.min_quantity;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addPart(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-accent transition-colors text-left ${isLow ? "bg-warning/5" : ""}`}
                  >
                    <span className="truncate font-medium flex items-center gap-1.5">
                      {item.name}
                      {isLow && <AlertTriangle className="h-3 w-3 text-warning shrink-0" />}
                    </span>
                    <span className="flex items-center gap-2 shrink-0 ml-2">
                      <span className={`${isLow ? "text-warning font-semibold" : "text-muted-foreground"}`}>×{item.quantity}</span>
                      <span className="font-mono">{item.buy_price.toFixed(2)} €</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Parts list */}
        {parts.length > 0 && (
          <div className="space-y-2">
            {parts.map((part, i) => {
              const invItem = part.inventory_id ? inventory.find((it) => it.id === part.inventory_id) : null;
              const stockLow = invItem ? invItem.quantity <= invItem.min_quantity : false;
              return (
              <div key={i} className={`flex items-center gap-2 p-2 rounded-md border ${stockLow ? "bg-warning/5 border-warning/30" : "bg-muted/50 border-border/40"}`}>
                <div className="flex-1 min-w-0">
                  {part.inventory_id ? (
                    <p className="text-xs font-medium truncate flex items-center gap-1.5">
                      {part.name}
                      {stockLow && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">Stock faible ({invItem?.quantity} restant·s)</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </p>
                  ) : (
                    <Input
                      value={part.name}
                      onChange={(e) => updatePart(i, { name: e.target.value })}
                      placeholder="Nom de la pièce"
                      className="h-7 text-xs"
                    />
                  )}
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={part.buy_price}
                  onChange={(e) => updatePart(i, { buy_price: parseFloat(e.target.value) || 0 })}
                  className="w-20 h-7 text-xs font-mono"
                  title="Coût d'achat"
                />
                <Input
                  type="number"
                  min="1"
                  value={part.quantity}
                  onChange={(e) => updatePart(i, { quantity: parseInt(e.target.value) || 1 })}
                  className="w-14 h-7 text-xs"
                  title="Quantité"
                />
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removePart(i)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full text-xs" onClick={addManualPart}>
          <Plus className="h-3.5 w-3.5 mr-1" />Ajouter manuellement
        </Button>
      </CardContent>
    </Card>
  );
}
