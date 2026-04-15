import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TrialStatus {
  subscriptionStatus: "trial" | "active" | "expired";
  trialStartDate: string | null;
  trialEndDate: string | null;
  daysRemaining: number;
  isTrialActive: boolean;
  isExpired: boolean;
  isSubscribed: boolean;
}

export function useTrialStatus(): TrialStatus & { isLoading: boolean } {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["trial-status", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_org_safe_data").single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    // Adaptive stale time: 5 min normally, but drop to 1 min when we're within
    // 24h of the trial ending (so the UI reacts quickly to expiry without
    // forcing the user to reload).
    staleTime: (query) => {
      const d = query.state.data as { trial_end_date?: string | null } | undefined;
      if (!d?.trial_end_date) return 5 * 60 * 1000;
      const endMs = new Date(d.trial_end_date).getTime();
      if (Number.isNaN(endMs)) return 5 * 60 * 1000;
      const remainingMs = endMs - Date.now();
      // Within 24h of expiry: refetch every minute. Already expired: refetch
      // every 30s so the wall appears promptly.
      if (remainingMs < 0) return 30 * 1000;
      if (remainingMs < 24 * 60 * 60 * 1000) return 60 * 1000;
      return 5 * 60 * 1000;
    },
    refetchInterval: (query) => {
      const d = query.state.data as { trial_end_date?: string | null } | undefined;
      if (!d?.trial_end_date) return false;
      const endMs = new Date(d.trial_end_date).getTime();
      if (Number.isNaN(endMs)) return false;
      const remainingMs = endMs - Date.now();
      if (remainingMs < 0) return 30 * 1000;
      if (remainingMs < 24 * 60 * 60 * 1000) return 60 * 1000;
      return false; // No background polling when far from expiry
    },
    refetchOnWindowFocus: false, // never retrigger AppLayout's loading gate on focus
  });

  const now = new Date();
  const trialEndDate = data?.trial_end_date ?? null;
  const trialStartDate = data?.trial_start_date ?? null;
  const rawStatus = data?.subscription_status ?? "trial";

  // Normalize: handle "trial_expired" from DB as "expired" for the UI
  const subscriptionStatus: TrialStatus["subscriptionStatus"] =
    rawStatus === "active" ? "active" :
    rawStatus === "trial_expired" ? "expired" :
    "trial";

  const endDate = trialEndDate ? new Date(trialEndDate) : null;
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isSubscribed = subscriptionStatus === "active";
  const isTrialActive = subscriptionStatus === "trial" && daysRemaining > 0;
  const isExpired = (subscriptionStatus === "trial" && daysRemaining <= 0 && !isSubscribed) || subscriptionStatus === "expired";

  return {
    subscriptionStatus,
    trialStartDate,
    trialEndDate,
    daysRemaining,
    isTrialActive,
    isExpired,
    isSubscribed,
    isLoading,
  };
}
