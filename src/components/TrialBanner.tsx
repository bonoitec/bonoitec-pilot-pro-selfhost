import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useSubscription } from "@/hooks/useSubscription";
import { Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function TrialBanner() {
  const { isTrialActive, isSubscribed, daysRemaining, trialEndDate, isLoading } = useTrialStatus();
  const { startCheckout } = useSubscription();

  if (isLoading) return null;
  if (isSubscribed) return null;

  if (isTrialActive) {
    const endFormatted = trialEndDate
      ? format(new Date(trialEndDate), "d MMMM yyyy", { locale: fr })
      : "";

    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm flex-wrap">
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
        <Button
          variant="premium"
          size="sm"
          className="ml-auto rounded-full text-xs px-4"
          onClick={() => startCheckout("annual")}
        >
          <CreditCard className="h-3 w-3 mr-1" />
          S'abonner
        </Button>
      </div>
    );
  }

  return null;
}
