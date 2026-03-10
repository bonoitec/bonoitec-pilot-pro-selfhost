import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wrench, Search, Plus, Trash2, Sparkles } from "lucide-react";

export interface ServiceUsed {
  service_id?: string;
  name: string;
  price: number;
  estimated_time_minutes: number;
}

interface Props {
  services: ServiceUsed[];
  onChange: (services: ServiceUsed[]) => void;
  deviceBrand?: string;
  deviceModel?: string;
}

export function ServiceSelector({ services, onChange, deviceBrand, deviceModel }: Props) {
  const [search, setSearch] = useState("");

  const { data: dbServices = [] } = useQuery({
    queryKey: ["services-for-selector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
  });

  // Smart filtering: compatible services first, then others
  const brandLower = (deviceBrand || "").toLowerCase();
  const modelLower = (deviceModel || "").toLowerCase();

  const scoredServices = dbServices.map((svc) => {
    const svcBrand = ((svc as any).compatible_brand || "").toLowerCase();
    const svcModel = ((svc as any).compatible_model || "").toLowerCase();
    let score = 0;
    if (brandLower && svcBrand && svcBrand.includes(brandLower)) score += 2;
    if (modelLower && svcModel && svcModel.includes(modelLower)) score += 3;
    // Also check name for model/brand keywords
    const nameLower = svc.name.toLowerCase();
    if (brandLower && nameLower.includes(brandLower)) score += 1;
    if (modelLower && nameLower.includes(modelLower)) score += 2;
    return { ...svc, _score: score };
  });

  const filtered = scoredServices
    .filter((svc) =>
      !search.trim() ||
      svc.name.toLowerCase().includes(search.toLowerCase()) ||
      ((svc as any).compatible_brand || "").toLowerCase().includes(search.toLowerCase()) ||
      ((svc as any).compatible_model || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b._score - a._score);

  const suggested = filtered.filter((s) => s._score > 0);
  const others = filtered.filter((s) => s._score === 0);

  const addService = (svc: any) => {
    const existing = services.find((s) => s.service_id === svc.id);
    if (existing) return;
    onChange([...services, {
      service_id: svc.id,
      name: svc.name,
      price: Number(svc.default_price) || 0,
      estimated_time_minutes: svc.estimated_time_minutes || 30,
    }]);
    setSearch("");
  };

  const addManualService = () => {
    onChange([...services, { name: "", price: 0, estimated_time_minutes: 30 }]);
  };

  const updateService = (index: number, updates: Partial<ServiceUsed>) => {
    onChange(services.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const removeService = (index: number) => {
    onChange(services.filter((_, i) => i !== index));
  };

  const totalPrice = services.reduce((s, svc) => s + svc.price, 0);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            Services / Prestations
          </span>
          {totalPrice > 0 && (
            <Badge variant="secondary" className="text-xs font-mono">
              Total: {totalPrice.toFixed(2)} €
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un service..."
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Suggested services */}
        {suggested.length > 0 && !search && (
          <div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1.5">
              <Sparkles className="h-3 w-3 text-warning" />
              Services suggérés pour {deviceBrand} {deviceModel}
            </p>
            <div className="space-y-1">
              {suggested.slice(0, 5).map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => addService(svc)}
                  disabled={!!services.find((s) => s.service_id === svc.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs border border-warning/20 bg-warning/5 rounded-md hover:bg-warning/10 transition-colors text-left disabled:opacity-50"
                >
                  <span className="truncate font-medium">{svc.name}</span>
                  <span className="font-mono shrink-0 ml-2">{Number(svc.default_price).toFixed(2)} €</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search results */}
        {search.length >= 2 && (
          <div className="max-h-32 overflow-y-auto border border-border rounded-md divide-y divide-border">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">Aucun service trouvé</p>
            ) : (
              filtered.slice(0, 8).map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => addService(svc)}
                  disabled={!!services.find((s) => s.service_id === svc.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-accent transition-colors text-left disabled:opacity-50"
                >
                  <span className="truncate font-medium">{svc.name}</span>
                  <span className="font-mono shrink-0 ml-2">{Number(svc.default_price).toFixed(2)} €</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Selected services */}
        {services.length > 0 && (
          <div className="space-y-2">
            {services.map((svc, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border/40">
                <div className="flex-1 min-w-0">
                  {svc.service_id ? (
                    <p className="text-xs font-medium truncate">{svc.name}</p>
                  ) : (
                    <Input
                      value={svc.name}
                      onChange={(e) => updateService(i, { name: e.target.value })}
                      placeholder="Nom du service"
                      className="h-7 text-xs"
                    />
                  )}
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={svc.price}
                  onChange={(e) => updateService(i, { price: parseFloat(e.target.value) || 0 })}
                  className="w-20 h-7 text-xs font-mono"
                  title="Prix"
                />
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeService(i)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full text-xs" onClick={addManualService}>
          <Plus className="h-3.5 w-3.5 mr-1" />Ajouter manuellement
        </Button>
      </CardContent>
    </Card>
  );
}
