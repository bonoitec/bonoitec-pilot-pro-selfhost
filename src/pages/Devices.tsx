import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Smartphone, Laptop, Gamepad2, Bike } from "lucide-react";
import { CreateDeviceDialog } from "@/components/dialogs/CreateDeviceDialog";

const typeIcons: Record<string, any> = {
  Smartphone: Smartphone,
  Ordinateur: Laptop,
  Console: Gamepad2,
  "Vélo électrique": Bike,
  Tablette: Smartphone,
};

const Devices = () => {
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

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("devices").select("*, clients(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = devices.filter(
    (d) =>
      d.model.toLowerCase().includes(search.toLowerCase()) ||
      d.brand.toLowerCase().includes(search.toLowerCase()) ||
      (d.clients?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.serial_number ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appareils</h1>
          <p className="text-muted-foreground text-sm">{devices.length} appareils enregistrés</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />Nouvel appareil</Button>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un appareil..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>)}
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun appareil trouvé</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((device) => {
            const Icon = typeIcons[device.type] || Smartphone;
            return (
              <Card
                key={device.id}
                ref={highlightId === device.id ? highlightRef : undefined}
                className={`hover:shadow-md transition-all cursor-pointer ${highlightId === device.id ? "ring-2 ring-primary shadow-lg" : ""}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{device.brand} {device.model}</h3>
                      {device.serial_number && <p className="text-xs text-muted-foreground mt-0.5 font-mono">{device.serial_number}</p>}
                      <p className="text-xs text-muted-foreground mt-1">Client : {device.clients?.name ?? "—"}</p>
                      {device.accessories && <p className="text-xs text-muted-foreground">Accessoires : {device.accessories}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateDeviceDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
};

export default Devices;
