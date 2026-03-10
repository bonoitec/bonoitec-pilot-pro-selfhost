import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Phone, Mail } from "lucide-react";
import { CreateClientDialog } from "@/components/dialogs/CreateClientDialog";

const Clients = () => {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId]);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*, devices(id), repairs(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm">{clients.length} clients enregistrés</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />Nouveau client</Button>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un client..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>)}
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun client trouvé</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{client.name}</h3>
                    {client.address && <p className="text-xs text-muted-foreground mt-1">{client.address}</p>}
                  </div>
                  <Badge variant="secondary">{client.repairs?.length ?? 0} réparations</Badge>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  {client.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{client.phone}</div>}
                  {client.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{client.email}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateClientDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
};

export default Clients;
