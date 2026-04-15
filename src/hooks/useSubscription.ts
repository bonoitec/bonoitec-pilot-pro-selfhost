import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SubscriptionState {
  subscribed: boolean;
  planName: string | null;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
  paymentStatus: "active" | "past_due" | null;
  pastDueGraceMs: number | null;
  isLoading: boolean;
}

// Normal poll: every 5 min. When the user is within 24h of a state transition
// (past_due grace ending, trial ending, subscription cancelling), bump to 1 min
// so the frontend reacts quickly to expiry without hammering the edge function.
const POLL_NORMAL_MS = 5 * 60 * 1000;
const POLL_URGENT_MS = 60 * 1000;
const URGENT_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export function useSubscription() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    planName: null,
    subscriptionEnd: null,
    cancelAtPeriodEnd: false,
    paymentStatus: null,
    pastDueGraceMs: null,
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
        paymentStatus: data?.payment_status ?? null,
        pastDueGraceMs: data?.past_due_grace_ms ?? null,
        isLoading: false,
      });
    } catch {
      // Keep previous state on transient failures; just mark no longer loading.
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, [session?.access_token]);

  // Adaptive poll cadence: 5 min normally, 1 min when a state transition is
  // imminent (past_due grace ending OR subscription period ending within 24h).
  // The timer is held in a ref so a mid-cycle urgency flip can clear it and
  // reschedule immediately — otherwise the worst-case latency from "flipped
  // to urgent" to "next poll" would be 5 minutes.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUrgent = useRef(false);
  const checkRef = useRef(checkSubscription);
  checkRef.current = checkSubscription;

  const schedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const ms = isUrgent.current ? POLL_URGENT_MS : POLL_NORMAL_MS;
    timerRef.current = setTimeout(async () => {
      await checkRef.current();
      schedule();
    }, ms);
  }, []);

  // Watch state transitions. When urgency flips from false → true, clear the
  // in-flight normal-cadence timer and reschedule immediately at the urgent
  // cadence. Do nothing when urgency flips the other way: let the current
  // urgent tick finish, then the next schedule() will pick up the normal
  // cadence naturally.
  useEffect(() => {
    const graceUrgent =
      state.paymentStatus === "past_due" &&
      state.pastDueGraceMs !== null &&
      state.pastDueGraceMs < URGENT_THRESHOLD_MS;
    const subEndUrgent = (() => {
      if (!state.subscriptionEnd) return false;
      const endMs = new Date(state.subscriptionEnd).getTime();
      if (Number.isNaN(endMs)) return false;
      return endMs - Date.now() < URGENT_THRESHOLD_MS;
    })();
    const wasUrgent = isUrgent.current;
    const nextUrgent = graceUrgent || subEndUrgent;
    isUrgent.current = nextUrgent;
    if (!wasUrgent && nextUrgent) {
      schedule(); // cancel normal timer, reschedule urgent immediately
    }
  }, [state.paymentStatus, state.pastDueGraceMs, state.subscriptionEnd, schedule]);

  useEffect(() => {
    if (!session) return;
    checkSubscription();
    schedule();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [session, checkSubscription, schedule]);

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
