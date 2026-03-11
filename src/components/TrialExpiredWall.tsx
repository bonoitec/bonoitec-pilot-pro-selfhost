import { AlertTriangle, CreditCard, LogOut, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
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

export function TrialExpiredWall() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { startCheckout } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<"monthly" | "quarterly" | "annual">("monthly");

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSubscribe = async () => {
    setLoading(true);
    await startCheckout(selected);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-xl w-full">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mx-auto">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold font-display">
              Votre essai gratuit est terminé
            </h1>
            <p className="text-muted-foreground">
              Choisissez votre rythme de paiement pour continuer à utiliser BonoitecPilot.
            </p>
          </div>

          {/* Plan selector */}
          <div className="grid gap-3">
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
                      {plan.popular && (
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

          <div className="flex flex-col gap-3">
            <Button
              variant="premium"
              size="lg"
              className="rounded-xl w-full h-12"
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
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl w-full"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/60 text-center">
            Paiement sécurisé via Stripe · Vos données sont conservées
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
