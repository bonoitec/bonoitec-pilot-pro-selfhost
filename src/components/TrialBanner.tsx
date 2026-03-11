import { useTrialStatus } from "@/hooks/useTrialStatus";
import { Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function TrialBanner() {
  const { isTrialActive, isSubscribed, daysRemaining, trialEndDate, isLoading } = useTrialStatus();

  if (isLoading) return null;

  // Subscribed users see nothing
  if (isSubscribed) return null;

  // Trial active
  if (isTrialActive) {
    const endFormatted = trialEndDate
      ? format(new Date(trialEndDate), "d MMMM yyyy", { locale: fr })
      : "";

    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm">
        <Clock className="h-4 w-4 text-primary shrink-0" />
        <span className="text-foreground font-medium">Essai gratuit en cours</span>
        <span className="text-muted-foreground">—</span>
        <span className="text-foreground">
          {daysRemaining === 1
            ? "Il vous reste 1 jour"
            : `Il vous reste ${daysRemaining} jours`}
        </span>
        {endFormatted && (
          <>
            <span className="text-muted-foreground hidden sm:inline">·</span>
            <span className="text-muted-foreground text-xs hidden sm:inline">
              Fin le {endFormatted}
            </span>
          </>
        )}
      </div>
    );
  }

  return null;
}
