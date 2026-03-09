import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Phone, Mail } from "lucide-react";

const mockClients = [
  { id: 1, name: "Jean Dupont", phone: "06 12 34 56 78", email: "jean@email.com", address: "12 Rue de Paris, 75001", repairs: 5, total: "845 €" },
  { id: 2, name: "Marie Martin", phone: "06 98 76 54 32", email: "marie@email.com", address: "8 Av. Victor Hugo, 69002", repairs: 3, total: "520 €" },
  { id: 3, name: "Pierre Duval", phone: "07 11 22 33 44", email: "pierre@email.com", address: "45 Bd Gambetta, 33000", repairs: 2, total: "158 €" },
  { id: 4, name: "Claire Petit", phone: "06 55 66 77 88", email: "claire@email.com", address: "3 Place Bellecour, 69002", repairs: 7, total: "1 230 €" },
  { id: 5, name: "Luc Bernard", phone: "07 99 88 77 66", email: "luc@email.com", address: "22 Rue de la République, 13001", repairs: 1, total: "79 €" },
];

const Clients = () => {
  const [search, setSearch] = useState("");

  const filtered = mockClients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm">{mockClients.length} clients enregistrés</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="h-4 w-4 mr-2" />Exporter</Button>
          <Button><Plus className="h-4 w-4 mr-2" />Nouveau client</Button>
        </div>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un client..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{client.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{client.address}</p>
                </div>
                <Badge variant="secondary">{client.repairs} réparations</Badge>
              </div>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{client.phone}</div>
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{client.email}</div>
              </div>
              <div className="mt-3 pt-3 border-t flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total dépensé</span>
                <span className="text-sm font-semibold">{client.total}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Clients;
