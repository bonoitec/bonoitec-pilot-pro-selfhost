import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Phone, Mail, Pencil, Smartphone, ChevronDown, ChevronUp } from "lucide-react";
import { CreateClientDialog } from "@/components/dialogs/CreateClientDialog";
import { EditClientDialog } from "@/components/dialogs/EditClientDialog";
import { CreateDeviceDialog } from "@/components/dialogs/CreateDeviceDialog";

const Clients = () => {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);
  const [addDeviceClientId, setAddDeviceClientId] = useState<string | null>(null);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const highlightRef = useRef<HTMLDivElement>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*, devices(id, brand, model, type, serial_number), repairs(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (highlightId && highlightRef.current && !isLoading) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [highlightId, isLoading]);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search)
  );

  const toggleExpand = (id: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
          {filtered.map((client) => {
            const isExpanded = expandedClients.has(client.id);
            const devices = client.devices ?? [];
            return (
              <Card
                key={client.id}
                ref={highlightId === client.id ? highlightRef : undefined}
                className={`hover:shadow-md transition-all ${highlightId === client.id ? "ring-2 ring-primary shadow-lg" : ""}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{client.name}</h3>
                      {client.address && <p className="text-xs text-muted-foreground mt-1">{client.address}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary">{client.repairs?.length ?? 0} réparations</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditClient(client)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    {client.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{client.phone}</div>}
                    {client.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{client.email}</div>}
                  </div>

                  {/* Devices section */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => toggleExpand(client.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      {devices.length} appareil{devices.length !== 1 ? "s" : ""}
                      {isExpanded ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-1.5">
                        {devices.map((d: any) => (
                          <div key={d.id} className="text-xs bg-secondary/50 rounded-md px-2.5 py-1.5 flex items-center gap-2">
                            <Smartphone className="h-3 w-3 text-primary shrink-0" />
                            <span className="font-medium">{d.brand} {d.model}</span>
                            {d.serial_number && <span className="text-muted-foreground font-mono truncate">({d.serial_number})</span>}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-7 text-xs mt-1"
                          onClick={() => setAddDeviceClientId(client.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />Ajouter un appareil
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateClientDialog open={showCreate} onOpenChange={setShowCreate} />
      <EditClientDialog open={!!editClient} onOpenChange={(o) => !o && setEditClient(null)} client={editClient} />
      <CreateDeviceDialog open={!!addDeviceClientId} onOpenChange={(o) => !o && setAddDeviceClientId(null)} defaultClientId={addDeviceClientId ?? undefined} />
    </div>
  );
};

export default Clients;
