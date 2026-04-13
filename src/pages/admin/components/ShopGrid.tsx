import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { ShopCard, type AdminOrgRow } from "./ShopCard";

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function ShopGrid({ onSelectShop }: { onSelectShop: (orgId: string) => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "trial" | "expired">("all");
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const debouncedSearch = useDebounced(search, 300);

  useEffect(() => setPage(0), [debouncedSearch, filter]);

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ["admin-orgs-grid", debouncedSearch, filter, page],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("admin_get_organizations", {
        _limit: pageSize,
        _offset: page * pageSize,
        _search: debouncedSearch || null,
      });
      if (error) throw error;
      // Client-side status filter (until _status_filter is added to RPC)
      let rows = (data ?? []) as AdminOrgRow[];
      if (filter !== "all") {
        rows = rows.filter((s) => {
          if (filter === "active") return s.subscription_status === "active";
          if (filter === "trial") return s.subscription_status === "trial";
          if (filter === "expired") return s.subscription_status === "trial_expired" || s.subscription_status === "expired";
          return true;
        });
      }
      return rows;
    },
    staleTime: 30_000,
  });

  const total = shops[0]?.total_count ?? 0;
  const maxPage = Math.max(0, Math.ceil(Number(total) / pageSize) - 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Rechercher un atelier (nom, email, SIRET)…"
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-full sm:w-48 h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les ateliers</SelectItem>
            <SelectItem value="active">Abonnés actifs</SelectItem>
            <SelectItem value="trial">En essai</SelectItem>
            <SelectItem value="expired">Expirés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary-subtle text-primary mx-auto mb-4">
            <Building2 className="h-7 w-7" />
          </div>
          <p className="text-muted-foreground font-medium">Aucun atelier trouvé</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {search ? "Essayez une autre recherche" : "Aucun atelier ne correspond à ce filtre"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} onClick={() => onSelectShop(shop.id)} />
            ))}
          </div>

          {maxPage > 0 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Page {page + 1} sur {maxPage + 1} · {total} atelier{Number(total) !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= maxPage} onClick={() => setPage((p) => Math.min(maxPage, p + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
