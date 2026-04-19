import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, Search, Smartphone, Laptop, Gamepad2, Watch, Tablet,
  Navigation, Globe, Sparkles,
} from "lucide-react";

const CATEGORIES = ["Console", "GPS", "Montre", "Ordinateur", "Smartphone", "Tablette", "Universel"];
const CATEGORY_ICONS: Record<string, any> = {
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
  release_year: number | null;
  storage_variants: string[];
  color_variants: string[];
}

export default function DeviceCatalog() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");

  const { data: catalog = [], isLoading } = useQuery({
    queryKey: ["device-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("device_catalog")
        .select("id, category, brand, model, release_year, storage_variants, color_variants")
        .eq("is_active", true)
        .order("brand")
        .order("model");
      if (error) throw error;
      return data as CatalogEntry[];
    },
  });

  const brands = useMemo(
    () => [...new Set(catalog.map((d) => d.brand))].sort(),
    [catalog]
  );

  const filtered = useMemo(() => {
    return catalog.filter((d) => {
      if (filterCategory && d.category !== filterCategory) return false;
      if (filterBrand && d.brand !== filterBrand) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          d.brand.toLowerCase().includes(q) ||
          d.model.toLowerCase().includes(q) ||
          `${d.brand} ${d.model}`.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [catalog, search, filterCategory, filterBrand]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Catalogue d'appareils
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {catalog.length} appareils disponibles dans vos formulaires de réparation.
        </p>
      </div>

      {/* Centrally-managed notice */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Catalogue centralisé par BonoitecPilot</p>
          <p className="text-xs text-muted-foreground mt-1">
            Cette liste est tenue à jour par notre équipe et partagée par tous les ateliers.
            Un modèle manque ? Contactez-nous via la page <a href="/support" className="text-primary hover:underline font-medium">Support</a> et nous l'ajouterons.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory || "all"} onValueChange={(v) => setFilterCategory(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterBrand || "all"} onValueChange={(v) => setFilterBrand(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Marque" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <Skeleton className="h-60 w-full" />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {catalog.length === 0
              ? "Le catalogue est en cours de constitution. Revenez bientôt."
              : "Aucun appareil ne correspond à ces filtres."}
          </CardContent>
        </Card>
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
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => {
                    const Icon = CATEGORY_ICONS[entry.category] || Smartphone;
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
                            {Array.isArray(entry.storage_variants) && entry.storage_variants.slice(0, 3).map((s) => (
                              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                            ))}
                            {Array.isArray(entry.storage_variants) && entry.storage_variants.length > 3 && (
                              <Badge variant="outline" className="text-xs">+{entry.storage_variants.length - 3}</Badge>
                            )}
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
    </div>
  );
}
