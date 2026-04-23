import { useEffect, useState, useCallback } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getStripe } from "@/lib/stripe";

type Plan = "monthly" | "quarterly" | "annual";

interface Props {
  open: boolean;
  plan: Plan | null;
  onClose: () => void;
}

export function CheckoutDialog({ open, plan, onClose }: Props) {
  const { session } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset state when the dialog closes so the next open starts fresh.
  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  // Create the checkout session as soon as the dialog opens with a plan.
  useEffect(() => {
    if (!open || !plan || !session?.access_token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: { plan },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (cancelled) return;
        if (error) throw error;
        if (!data?.client_secret) throw new Error("Réponse de paiement invalide.");
        setClientSecret(data.client_secret as string);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erreur inconnue.";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, plan, session?.access_token]);

  const onComplete = useCallback(() => {
    // Stripe iframe finished. Move the parent window to the success page so
    // the user immediately sees their now-active subscription instead of
    // waiting for the iframe's return_url redirect to bubble up.
    window.location.href = "/dashboard?checkout=success";
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl p-0 sm:max-w-2xl gap-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Paiement</DialogTitle>
          <DialogDescription>Finaliser votre abonnement BonoitecPilot</DialogDescription>
        </VisuallyHidden>

        {error && (
          <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm font-medium">Une erreur est survenue</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 text-sm text-primary underline"
            >
              Fermer
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Préparation du paiement…</p>
          </div>
        )}

        {clientSecret && !error && (
          <div className="max-h-[85vh] overflow-y-auto">
            <EmbeddedCheckoutProvider
              stripe={getStripe()}
              options={{ clientSecret, onComplete }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
