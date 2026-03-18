import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useSubscription } from "@/hooks/useSubscription";
import { Clock, CreditCard, Check, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

const plans = [
  {
    id: "monthly" as const,
    label: "Mensuel",
    price: "19,99 €",
    period: "/ mois",
    subtitle: "Sans engagement",
    discount: null,
  },
  {
    id: "quarterly" as const,
    label: "Trimestriel",
    price: "17,99 €",
    period: "/ mois",
    subtitle: "Facturé 53,97 € / trimestre",
    discount: "-10%",
  },
  {
    id: "annual" as const,
    label: "Annuel",
    price: "14,99 €",
    period: "/ mois",
    subtitle: "Facturé 179,88 € / an",
    discount: "-25%",
    popular: true,
  },
];

export function TrialBanner() {
  const { isTrialActive, isSubscribed, daysRemaining, trialEndDate, isLoading } = useTrialStatus();
  const { startCheckout, cancelAtPeriodEnd, subscriptionEnd, planName } = useSubscription();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<"monthly" | "quarterly" | "annual">("annual");
  const [loading, setLoading] = useState(false);

  if (isLoading) return null;

  const planKey = (planName ?? "").replace("_cancelling", "");
  const planLabel =
    planKey === "monthly"
      ? "Mensuel"
      : planKey === "quarterly"
        ? "Trimestriel"
        : planKey === "annual"
          ? "Annuel"
          : "Abonnement";

  const handleSubscribe = async () => {
    setLoading(true);
    await startCheckout(selected);
    setLoading(false);
  };

  // Show cancellation warning banner from real Stripe state (even if org cache is stale)
  if (cancelAtPeriodEnd) {
    const endDate = subscriptionEnd ? new Date(subscriptionEnd) : null;
    const validEnd = endDate && !Number.isNaN(endDate.getTime());

    if (true) {
      const daysLeft = validEnd ? Math.max(0, Math.ceil((endDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
      const endFormatted = validEnd ? format(endDate!, "d MMMM yyyy 'à' HH:mm", { locale: fr }) : null;

    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-xl text-sm flex-wrap">
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
        <span className="text-foreground font-medium">Annulé — actif jusqu'à la fin de période</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-foreground font-medium">{planLabel}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-foreground">
          {endFormatted
            ? `Fin le ${endFormatted} (${daysLeft === 1 ? "1 jour restant" : `${daysLeft} jours restants`})`
            : "Actif jusqu'à la fin de la période en cours"}
        </span>
        <Button
          variant="premium"
          size="sm"
          className="ml-auto rounded-full text-xs px-4"
          onClick={() => setOpen(true)}
        >
          <CreditCard className="h-3 w-3 mr-1" />
          Reprendre l'abonnement
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center font-display">Reprendre votre abonnement</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 mt-2">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelected(plan.id)}
                  className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                    selected === plan.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                        selected === plan.id
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {selected === plan.id && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{plan.label}</span>
                        {plan.discount && (
                          <span className="text-[10px] font-bold bg-success/10 text-success px-1.5 py-0.5 rounded-full">
                            {plan.discount}
                          </span>
                        )}
                        {"popular" in plan && plan.popular && (
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                            Populaire
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{plan.subtitle}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-foreground">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">{plan.period}</span>
                  </div>
                </button>
              ))}
            </div>
            <Button
              variant="premium"
              size="lg"
              className="rounded-xl w-full h-12 mt-2"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Souscrire maintenant
            </Button>
            <p className="text-xs text-muted-foreground/60 text-center">
              Paiement sécurisé via Stripe · Sans engagement sur le mensuel
            </p>
          </DialogContent>
        </Dialog>
      </div>
    );
    }
  }

  if (isSubscribed) return null;

  if (isTrialActive) {
    const endFormatted = trialEndDate
      ? format(new Date(trialEndDate), "d MMMM yyyy", { locale: fr })
      : "";

    return (
      <>
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
            onClick={() => setOpen(true)}
          >
            <CreditCard className="h-3 w-3 mr-1" />
            S'abonner
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center font-display">Choisissez votre abonnement</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 mt-2">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelected(plan.id)}
                  className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                    selected === plan.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                        selected === plan.id
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {selected === plan.id && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{plan.label}</span>
                        {plan.discount && (
                          <span className="text-[10px] font-bold bg-success/10 text-success px-1.5 py-0.5 rounded-full">
                            {plan.discount}
                          </span>
                        )}
                        {"popular" in plan && plan.popular && (
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                            Populaire
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{plan.subtitle}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-foreground">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">{plan.period}</span>
                  </div>
                </button>
              ))}
            </div>
            <Button
              variant="premium"
              size="lg"
              className="rounded-xl w-full h-12 mt-2"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Souscrire maintenant
            </Button>
            <p className="text-xs text-muted-foreground/60 text-center">
              Paiement sécurisé via Stripe · Sans engagement sur le mensuel
            </p>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}
