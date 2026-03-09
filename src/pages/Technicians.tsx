import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Star, Wrench } from "lucide-react";

const mockTechnicians = [
  { id: 1, name: "Sophie Moreau", specialty: "Smartphones", repairs: 35, avgTime: "45 min", rating: 4.9, active: 3 },
  { id: 2, name: "Marc Lefèvre", specialty: "Ordinateurs", repairs: 28, avgTime: "1h15", rating: 4.7, active: 2 },
  { id: 3, name: "Lucas Garcia", specialty: "Consoles", repairs: 22, avgTime: "55 min", rating: 4.5, active: 1 },
  { id: 4, name: "Emma Dubois", specialty: "Tablettes", repairs: 31, avgTime: "40 min", rating: 4.8, active: 2 },
];

const Technicians = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Techniciens</h1>
          <p className="text-muted-foreground text-sm">Équipe de réparation</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Ajouter un technicien</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockTechnicians.map((tech) => (
          <Card key={tech.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                    {tech.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="font-semibold">{tech.name}</h3>
                    <p className="text-xs text-muted-foreground">{tech.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-warning">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="text-sm font-medium">{tech.rating}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-lg bg-secondary/50">
                  <p className="text-lg font-bold">{tech.repairs}</p>
                  <p className="text-xs text-muted-foreground">Ce mois</p>
                </div>
                <div className="p-2 rounded-lg bg-secondary/50">
                  <p className="text-lg font-bold">{tech.avgTime}</p>
                  <p className="text-xs text-muted-foreground">Temps moy.</p>
                </div>
                <div className="p-2 rounded-lg bg-secondary/50">
                  <p className="text-lg font-bold">{tech.active}</p>
                  <p className="text-xs text-muted-foreground">En cours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Technicians;
