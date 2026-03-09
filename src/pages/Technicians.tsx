import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Wrench } from "lucide-react";

const Technicians = () => {
  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ["technicians"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technicians")
        .select("*, repairs(id)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Techniciens</h1>
          <p className="text-muted-foreground text-sm">Équipe de réparation</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Ajouter un technicien</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-28 w-full" /></CardContent></Card>)}
        </div>
      ) : technicians.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun technicien trouvé</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {technicians.map((tech) => (
            <Card key={tech.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                      {tech.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="font-semibold">{tech.name}</h3>
                      <p className="text-xs text-muted-foreground">{tech.specialty ?? "Général"}</p>
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${tech.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {tech.active ? "Actif" : "Inactif"}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wrench className="h-4 w-4" />
                  <span>{tech.repairs?.length ?? 0} réparations assignées</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Technicians;
