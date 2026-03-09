import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, CheckCircle2, Search as SearchIcon, Package, Wrench } from "lucide-react";
import { CustomerChat } from "@/components/messaging/CustomerChat";

const statusConfig: Record<string, { label: string; color: string; emoji: string; icon: any }> = {
  nouveau: { label: "Reçu", color: "bg-muted text-muted-foreground", emoji: "⚪", icon: Clock },
  diagnostic: { label: "Diagnostic", color: "bg-warning/10 text-warning border-warning/20", emoji: "🟡", icon: SearchIcon },
  en_cours: { label: "En réparation", color: "bg-primary/10 text-primary border-primary/20", emoji: "🔵", icon: Wrench },
  en_attente_piece: { label: "Pièce commandée", color: "bg-[hsl(25,95%,53%)]/10 text-[hsl(25,95%,53%)] border-[hsl(25,95%,53%)]/20", emoji: "🟠", icon: Package },
  termine: { label: "Terminé", color: "bg-success/10 text-success border-success/20", emoji: "🟢", icon: CheckCircle2 },
  pret_a_recuperer: { label: "Prêt à récupérer", color: "bg-success/10 text-success border-success/20", emoji: "🟢", icon: CheckCircle2 },
};

const statusOrder = ["nouveau", "diagnostic", "en_cours", "en_attente_piece", "termine", "pret_a_recuperer"];

export default function RepairTracking() {
  const { code } = useParams<{ code: string }>();
  const [repair, setRepair] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRepair = async () => {
    if (!code) return;
    const { data, error: err } = await supabase.rpc("get_repair_by_tracking_code", {
      _code: code.toUpperCase(),
    });
    if (err || !data) {
      setError("Réparation introuvable. Vérifiez votre code de suivi.");
    } else {
      setRepair(data);
    }
    setLoading(false);
  };

  // Initial fetch + polling for real-time updates
  useEffect(() => {
    fetchRepair();
    const interval = setInterval(fetchRepair, 10000);
    return () => clearInterval(interval);
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (error || !repair) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-lg font-semibold mb-2">Réparation introuvable</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatus = statusConfig[repair.status] || statusConfig.nouveau;
  const currentIndex = statusOrder.indexOf(repair.status);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold">BonoitecPilot</p>
            <p className="text-[10px] text-muted-foreground">Suivi de réparation</p>
          </div>
          <Badge variant="outline" className="ml-auto font-mono text-xs">{code?.toUpperCase()}</Badge>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <Card className="overflow-hidden">
          <div className={`p-6 text-center ${currentStatus.color} border-0`}>
            <p className="text-4xl mb-2">{currentStatus.emoji}</p>
            <h2 className="text-xl font-bold">{currentStatus.label}</h2>
            {repair.estimated_completion && (
              <p className="text-sm mt-1 opacity-80">
                Estimation : {new Date(repair.estimated_completion).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {statusOrder.filter(s => s !== "pret_a_recuperer").map((s, i) => {
                const cfg = statusConfig[s];
                const isCompleted = i <= currentIndex;
                const isCurrent = i === currentIndex;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                      isCurrent ? "bg-primary text-primary-foreground" : isCompleted ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {isCompleted ? "✓" : i + 1}
                    </div>
                    <span className={`text-sm ${isCurrent ? "font-semibold" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                      {cfg.label}
                    </span>
                    {i < statusOrder.length - 2 && (
                      <div className={`flex-1 h-px ${isCompleted ? "bg-primary/30" : "bg-border"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Détails</h3>
            {repair.device_brand && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Appareil</span>
                <span className="font-medium">{repair.device_brand} {repair.device_model}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Problème</span>
              <span className="font-medium text-right max-w-[60%]">{repair.issue}</span>
            </div>
          </CardContent>
        </Card>

        {repair.technician_message && (
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Message du technicien
              </h3>
              <p className="text-sm text-muted-foreground">{repair.technician_message}</p>
            </CardContent>
          </Card>
        )}

        {repair.photos && Array.isArray(repair.photos) && repair.photos.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Photos</h3>
              <div className="grid grid-cols-2 gap-2">
                {repair.photos.map((url: string, i: number) => (
                  <img key={i} src={url} alt={`Photo ${i + 1}`} className="rounded-lg object-cover w-full h-32" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer messaging */}
        {code && <CustomerChat trackingCode={code} />}
      </div>
    </div>
  );
}
