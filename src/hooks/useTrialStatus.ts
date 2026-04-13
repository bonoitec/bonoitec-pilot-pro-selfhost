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
    staleTime: 5 * 60 * 1000, // 5 min — trial state rarely changes mid-session
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
