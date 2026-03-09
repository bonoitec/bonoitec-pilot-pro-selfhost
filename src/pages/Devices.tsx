import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Smartphone, Laptop, Gamepad2, Bike } from "lucide-react";

const typeIcons: Record<string, any> = {
  Smartphone: Smartphone,
  Ordinateur: Laptop,
  Console: Gamepad2,
  "Vélo électrique": Bike,
  Tablette: Smartphone,
};

const mockDevices = [
  { id: 1, type: "Smartphone", brand: "Apple", model: "iPhone 14", serial: "IMEI: 354872093456721", client: "Jean Dupont", status: "En réparation", accessories: "Coque, chargeur" },
  { id: 2, type: "Ordinateur", brand: "Apple", model: "MacBook Pro 2023", serial: "SN: C02ZL1TDMD6T", client: "Marie Martin", status: "En diagnostic", accessories: "Chargeur MagSafe" },
  { id: 3, type: "Smartphone", brand: "Samsung", model: "Galaxy S23", serial: "IMEI: 358746092183456", client: "Pierre Duval", status: "Réparé", accessories: "Aucun" },
  { id: 4, type: "Tablette", brand: "Apple", model: "iPad Air 5", serial: "SN: DLXG45HTFK12", client: "Claire Petit", status: "En attente", accessories: "Apple Pencil" },
  { id: 5, type: "Console", brand: "Sony", model: "PS5", serial: "SN: CFI-1216A-2023", client: "Luc Bernard", status: "En diagnostic", accessories: "Manette" },
];

const statusColors: Record<string, string> = {
  "En réparation": "bg-primary/10 text-primary",
  "En diagnostic": "bg-warning/10 text-warning",
  "Réparé": "bg-success/10 text-success",
  "En attente": "bg-muted text-muted-foreground",
};

const Devices = () => {
  const [search, setSearch] = useState("");
  const filtered = mockDevices.filter(
    (d) =>
      d.model.toLowerCase().includes(search.toLowerCase()) ||
      d.brand.toLowerCase().includes(search.toLowerCase()) ||
      d.client.toLowerCase().includes(search.toLowerCase()) ||
      d.serial.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appareils</h1>
          <p className="text-muted-foreground text-sm">{mockDevices.length} appareils enregistrés</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Nouvel appareil</Button>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un appareil..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((device) => {
          const Icon = typeIcons[device.type] || Smartphone;
          return (
            <Card key={device.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{device.brand} {device.model}</h3>
                      <Badge variant="secondary" className={statusColors[device.status]}>{device.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{device.serial}</p>
                    <p className="text-xs text-muted-foreground mt-1">Client : {device.client}</p>
                    <p className="text-xs text-muted-foreground">Accessoires : {device.accessories}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Devices;
