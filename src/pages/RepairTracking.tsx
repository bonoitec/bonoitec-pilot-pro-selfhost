import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckCircle2, Search as SearchIcon, Wrench, Circle } from "lucide-react";
import { CustomerChat } from "@/components/messaging/CustomerChat";
import {
  clientTimelineSteps,
  getCheckedUpTo,
  getTrackingBannerLabel,
} from "@/lib/repairStatuses";

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

  // ── Cumulative checkbox logic ──────────────────────────────────
  const checkedUpTo = getCheckedUpTo(repair.status);
  const bannerLabel = getTrackingBannerLabel(repair.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold">BonoitecPilot</p>
            <p className="text-[10px] text-muted-foreground">Suivi de réparation</p>
          </div>
          <Badge variant="outline" className="ml-auto font-mono text-xs">
            {code?.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Status banner */}
        <Card className="overflow-hidden">
          <div className="p-6 text-center bg-primary/10 text-primary">
            <h2 className="text-xl font-bold">{bannerLabel}</h2>
            {repair.estimated_completion && (
              <p className="text-sm mt-1 opacity-80">
                Estimation :{" "}
                {new Date(repair.estimated_completion).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </Card>

        {/* Cumulative timeline checkboxes */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {clientTimelineSteps.map((step, stepIndex) => {
                const isChecked = stepIndex <= checkedUpTo;
                const isCurrent = stepIndex === checkedUpTo;

                return (
                  <div key={step.key} className="flex items-center gap-3">
                    {/* Checkbox indicator */}
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-colors ${
                        isChecked
                          ? isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </div>

                    {/* Step label */}
                    <span
                      className={`text-sm flex-1 ${
                        isCurrent
                          ? "font-semibold text-foreground"
                          : isChecked
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.emoji} {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Device details */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Détails</h3>
            {repair.device_brand && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Appareil</span>
                <span className="font-medium">
                  {repair.device_brand} {repair.device_model}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Problème</span>
              <span className="font-medium text-right max-w-[60%]">{repair.issue}</span>
            </div>
          </CardContent>
        </Card>

        {/* Technician message */}
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

        {/* Photos */}
        {repair.photos && Array.isArray(repair.photos) && repair.photos.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Photos</h3>
              <div className="grid grid-cols-2 gap-2">
                {repair.photos.map((url: string, i: number) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="rounded-lg object-cover w-full h-32"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat */}
        {code && <CustomerChat trackingCode={code} repairId={repair.id} />}
      </div>
    </div>
  );
}
