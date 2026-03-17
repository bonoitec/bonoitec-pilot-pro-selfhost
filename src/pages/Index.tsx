import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wrench, Clock, CheckCircle2, DollarSign, AlertTriangle, TrendingUp, Plus, Package, Zap } from "lucide-react";
import { CreateRepairWizard } from "@/components/dialogs/CreateRepairWizard";
import { ProfitabilitySection } from "@/components/dashboard/ProfitabilitySection";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

import { statusLabels, statusColors } from "@/lib/repairStatuses";

const Index = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkSubscription } = useSubscription();

  // Handle checkout success return
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Paiement réussi ! Votre abonnement est maintenant actif.");
      checkSubscription();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, checkSubscription, setSearchParams]);
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
    staleTime: 15000,
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
    staleTime: 30000,
  });

  const inProgress = repairs.filter((r) => ["en_cours", "diagnostic"].includes(r.status));
  const done = repairs.filter((r) => ["termine", "pret_a_recuperer"].includes(r.status));

  const stats = [
    { label: "Réparations", value: String(repairs.length), icon: Wrench, gradient: true },
    { label: "En cours", value: String(inProgress.length), icon: Clock, color: "text-warning" },
    { label: "Terminées", value: String(done.length), icon: CheckCircle2, color: "text-success" },
    { label: "Alertes stock", value: String(lowStock.length), icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Vue d'ensemble de votre atelier</p>
        </div>
        <Button variant="premium" onClick={() => setShowWizard(true)} size="lg" className="rounded-xl">
          <Plus className="h-4 w-4 mr-2" />Créer une réparation
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover-lift">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.gradient ? "gradient-primary text-primary-foreground shadow-sm shadow-primary/20" : "bg-muted"}`}>
                  <stat.icon className={`h-4.5 w-4.5 ${stat.gradient ? "" : stat.color}`} />
                </div>
              </div>
              {loadingRepairs ? <Skeleton className="h-8 w-16 rounded-lg" /> : <p className={`text-3xl font-bold font-display ${stat.gradient ? "gradient-text" : ""}`}>{stat.value}</p>}
              <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">Réparations récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRepairs ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : repairs.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary-subtle text-primary mx-auto mb-4">
                <Wrench className="h-7 w-7" />
              </div>
              <p className="text-muted-foreground font-medium">Aucune réparation pour le moment</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Créez votre première réparation pour commencer</p>
            </div>
          ) : (
            <div className="space-y-2">
              {repairs.slice(0, 5).map((repair) => (
                <div key={repair.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-border/40">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium font-mono">{repair.reference}</span>
                      <Badge variant="secondary" className={`${statusColors[repair.status]} text-[11px]`}>{statusLabels[repair.status]}</Badge>
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
      <ProfitabilitySection />
      <CreateRepairWizard open={showWizard} onOpenChange={setShowWizard} />
    </div>
  );
};

export default Index;
