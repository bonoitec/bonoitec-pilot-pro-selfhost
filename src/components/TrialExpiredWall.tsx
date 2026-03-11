import { AlertTriangle, CreditCard, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useState } from "react";

export function TrialExpiredWall() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { startCheckout } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSubscribe = async () => {
    setLoading(true);
    await startCheckout("annual");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mx-auto">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-display">
              Votre essai gratuit est terminé
            </h1>
            <p className="text-muted-foreground">
              Votre période d'essai de 30 jours a expiré. Pour continuer à utiliser
              BonoitecPilot, veuillez souscrire à un abonnement.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="premium"
              size="lg"
              className="rounded-xl"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Souscrire — 14,99 €/mois
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/60">
            Vos données sont conservées. Elles seront accessibles dès la souscription d'un abonnement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
