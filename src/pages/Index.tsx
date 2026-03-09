import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wrench, Clock, CheckCircle2, DollarSign, AlertTriangle, TrendingUp, Plus } from "lucide-react";
import { CreateRepairWizard } from "@/components/dialogs/CreateRepairWizard";

const statusLabels: Record<string, string> = {
  nouveau: "Nouveau",
  diagnostic: "Diagnostic",
  en_cours: "En cours",
  en_attente_piece: "En attente de pièce",
  termine: "Terminé",
  pret_a_recuperer: "Prêt à récupérer",
};

const statusColors: Record<string, string> = {
  nouveau: "bg-info/10 text-info",
  diagnostic: "bg-warning/10 text-warning",
  en_cours: "bg-primary/10 text-primary",
  en_attente_piece: "bg-muted text-muted-foreground",
  termine: "bg-success/10 text-success",
  pret_a_recuperer: "bg-accent text-accent-foreground",
};

const Index = () => {
  const [showWizard, setShowWizard] = useState(false);
  const { data: repairs = [], isLoading: loadingRepairs } = useQuery({
    queryKey: ["dashboard-repairs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repairs")
        .select("*, clients(name), devices(brand, model)")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: lowStock = [] } = useQuery({
    queryKey: ["dashboard-low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("name, quantity, min_quantity");
      if (error) throw error;
      return (data ?? []).filter((p) => p.quantity <= p.min_quantity);
    },
  });

  const inProgress = repairs.filter((r) => ["en_cours", "diagnostic"].includes(r.status));
  const done = repairs.filter((r) => ["termine", "pret_a_recuperer"].includes(r.status));

  const stats = [
    { label: "Réparations", value: String(repairs.length), icon: Wrench, color: "text-primary" },
    { label: "En cours", value: String(inProgress.length), icon: Clock, color: "text-warning" },
    { label: "Terminées", value: String(done.length), icon: CheckCircle2, color: "text-success" },
    { label: "Alertes stock", value: String(lowStock.length), icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Vue d'ensemble de votre atelier</p>
        </div>
        <Button onClick={() => setShowWizard(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />Créer une réparation
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              {loadingRepairs ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stat.value}</p>}
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Réparations récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRepairs ? (
            <Skeleton className="h-40 w-full" />
          ) : repairs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucune réparation pour le moment</p>
          ) : (
            <div className="space-y-3">
              {repairs.slice(0, 5).map((repair) => (
                <div key={repair.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium font-mono">{repair.reference}</span>
                      <Badge variant="secondary" className={statusColors[repair.status]}>{statusLabels[repair.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {repair.clients?.name ?? "—"} — {repair.devices ? `${repair.devices.brand} ${repair.devices.model}` : "—"} — {repair.issue}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2 shrink-0">{repair.technician_id ? "Assigné" : "—"}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
