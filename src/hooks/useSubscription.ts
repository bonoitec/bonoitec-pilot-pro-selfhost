import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SubscriptionState {
  subscribed: boolean;
  planName: string | null;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isLoading: boolean;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    planName: null,
    subscriptionEnd: null,
    cancelAtPeriodEnd: false,
    isLoading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) return;
    // NOTE: do NOT set isLoading:true here — it causes AppLayout's loading gate
    // to fire on every background refetch and remount the whole Outlet, destroying
    // form state. Keep isLoading sticky after the first successful load.
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      const isSubscribed = data?.subscribed ?? false;
      setState({
        subscribed: isSubscribed,
        planName: data?.plan_name ?? null,
        subscriptionEnd: data?.subscription_end ?? null,
        cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
        isLoading: false,
      });
    } catch {
      // Keep previous state on transient failures; just mark no longer loading.
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, [session?.access_token]);

  // Check on mount and every 5 minutes (was 60s — unnecessarily aggressive).
  // Invalidate trial-status only on user-visible transitions (checkout success),
  // not on background polls, so useTrialStatus doesn't refetch every poll either.
  useEffect(() => {
    if (!session) return;
    checkSubscription();
    const interval = setInterval(checkSubscription, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  const startCheckout = async (plan: "monthly" | "quarterly" | "annual" = "monthly") => {
    if (!session?.access_token) {
      toast.error("Vous devez être connecté pour souscrire.");
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      toast.error("Erreur lors de la création de la session de paiement.");
      console.error(err);
    }
  };

  const openCustomerPortal = async () => {
    if (!session?.access_token) return;
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      toast.error("Erreur lors de l'ouverture du portail de gestion.");
      console.error(err);
    }
  };

  return {
    ...state,
    checkSubscription,
    startCheckout,
    openCustomerPortal,
  };
}
