import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Smartphone, Laptop, Gamepad2, Watch, Tablet, X, ChevronRight } from "lucide-react";

interface CatalogDevice {
  id: string;
  category: string;
  brand: string;
  model: string;
  release_year: number | null;
  storage_variants: string[];
}

interface DeviceCatalogSelectorProps {
  onSelect: (device: { brand: string; model: string; type: string; storage?: string }) => void;
  defaultBrand?: string;
  defaultModel?: string;
}

const categoryIcons: Record<string, any> = {
  Smartphone: Smartphone,
  Tablette: Tablet,
  Ordinateur: Laptop,
  Console: Gamepad2,
  "Montre connectée": Watch,
};

const ALL_CATEGORIES = ["Smartphone", "Tablette", "Ordinateur", "Console", "Montre connectée"];

export function DeviceCatalogSelector({ onSelect, defaultBrand, defaultModel }: DeviceCatalogSelectorProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>(defaultBrand || "");
  const [selectedDevice, setSelectedDevice] = useState<CatalogDevice | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<string>("");

  const { data: catalog = [], isLoading } = useQuery({
    queryKey: ["device-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("device_catalog")
        .select("id, category, brand, model, release_year, storage_variants")
        .eq("is_active", true)
        .order("brand")
        .order("model");
      if (error) throw error;
      return data as CatalogDevice[];
    },
  });

  // Auto-select if defaults match
  useEffect(() => {
    if (defaultBrand && defaultModel && catalog.length > 0) {
      const match = catalog.find(
        d => d.brand.toLowerCase() === defaultBrand.toLowerCase() &&
             d.model.toLowerCase() === defaultModel.toLowerCase()
      );
      if (match) {
        setSelectedCategory(match.category);
        setSelectedBrand(match.brand);
        setSelectedDevice(match);
      }
    }
  }, [defaultBrand, defaultModel, catalog]);

  const brands = useMemo(() => {
    const filtered = selectedCategory
      ? catalog.filter(d => d.category === selectedCategory)
      : catalog;
    return [...new Set(filtered.map(d => d.brand))].sort();
  }, [catalog, selectedCategory]);

  const models = useMemo(() => {
    let filtered = catalog;
    if (selectedCategory) filtered = filtered.filter(d => d.category === selectedCategory);
    if (selectedBrand) filtered = filtered.filter(d => d.brand === selectedBrand);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(d =>
        d.brand.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q) ||
        `${d.brand} ${d.model}`.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [catalog, selectedCategory, selectedBrand, search]);

  const handleSelectDevice = (device: CatalogDevice) => {
    setSelectedDevice(device);
    setSelectedStorage("");
    const storageArr = Array.isArray(device.storage_variants) ? device.storage_variants : [];
    if (storageArr.length === 0) {
      onSelect({ brand: device.brand, model: device.model, type: device.category });
    }
  };

  const handleSelectStorage = (storage: string) => {
    setSelectedStorage(storage);
    if (selectedDevice) {
      onSelect({ brand: selectedDevice.brand, model: selectedDevice.model, type: selectedDevice.category, storage });
    }
  };

  const reset = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedBrand("");
    setSelectedDevice(null);
    setSelectedStorage("");
  };

  // If device is selected and confirmed, show summary
  if (selectedDevice && (selectedStorage || !(Array.isArray(selectedDevice.storage_variants) && selectedDevice.storage_variants.length > 0))) {
    return (
      <div className="border rounded-lg p-3 bg-secondary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(() => { const Icon = categoryIcons[selectedDevice.category] || Smartphone; return <Icon className="h-4 w-4 text-primary" />; })()}
            <span className="font-medium text-sm">{selectedDevice.brand} {selectedDevice.model}</span>
            {selectedStorage && <Badge variant="outline" className="text-xs">{selectedStorage}</Badge>}
            {selectedDevice.release_year && <Badge variant="secondary" className="text-xs">{selectedDevice.release_year}</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={reset}><X className="h-3 w-3" /></Button>
        </div>
      </div>
    );
  }

  // If device selected but needs storage
  if (selectedDevice && Array.isArray(selectedDevice.storage_variants) && selectedDevice.storage_variants.length > 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">
            {selectedDevice.brand} {selectedDevice.model} — Choisir la capacité
          </Label>
          <Button variant="ghost" size="sm" onClick={() => setSelectedDevice(null)}><X className="h-3 w-3" /></Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(selectedDevice.storage_variants as string[]).map(s => (
            <Button key={s} variant="outline" size="sm" onClick={() => handleSelectStorage(s)}>{s}</Button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => {
            onSelect({ brand: selectedDevice.brand, model: selectedDevice.model, type: selectedDevice.category });
          }}>Passer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Rechercher un appareil (ex: iPhone 12, Galaxy S24...)"
          value={search}
          onChange={e => { setSearch(e.target.value); setSelectedDevice(null); }}
          className="pl-8 h-9 text-sm"
        />
      </div>

      {/* Category filter */}
      {!search && (
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={selectedCategory === "" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => { setSelectedCategory(""); setSelectedBrand(""); }}
          >Tout</Button>
          {ALL_CATEGORIES.map(cat => {
            const Icon = categoryIcons[cat] || Smartphone;
            return (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => { setSelectedCategory(cat); setSelectedBrand(""); }}
              >
                <Icon className="h-3 w-3 mr-1" />{cat}
              </Button>
            );
          })}
        </div>
      )}

      {/* Brand filter */}
      {!search && brands.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {brands.map(brand => (
            <Button
              key={brand}
              variant={selectedBrand === brand ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedBrand(selectedBrand === brand ? "" : brand)}
            >{brand}</Button>
          ))}
        </div>
      )}

      {/* Device list */}
      <ScrollArea className="h-[200px] border rounded-md">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Chargement du catalogue...</div>
        ) : models.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Aucun appareil trouvé.
            <br />
            <span className="text-xs">Vous pouvez saisir manuellement la marque et le modèle.</span>
          </div>
        ) : (
          <div className="divide-y">
            {models.map(device => {
              const Icon = categoryIcons[device.category] || Smartphone;
              return (
                <button
                  key={device.id}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-accent/50 transition-colors text-left"
                  onClick={() => handleSelectDevice(device)}
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{device.brand} {device.model}</p>
                    <p className="text-xs text-muted-foreground">
                      {device.category}
                      {device.release_year && ` · ${device.release_year}`}
                      {Array.isArray(device.storage_variants) && device.storage_variants.length > 0 && ` · ${device.storage_variants.length} variantes`}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
