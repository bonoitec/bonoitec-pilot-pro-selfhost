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
      const { data, error } = await supabase
        .from("organizations")
        .select("trial_start_date, trial_end_date, subscription_status")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const now = new Date();
  const trialEndDate = data?.trial_end_date ?? null;
  const trialStartDate = data?.trial_start_date ?? null;
  const subscriptionStatus = (data?.subscription_status ?? "trial") as TrialStatus["subscriptionStatus"];

  const endDate = trialEndDate ? new Date(trialEndDate) : null;
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isSubscribed = subscriptionStatus === "active";
  const isTrialActive = subscriptionStatus === "trial" && daysRemaining > 0;
  const isExpired = subscriptionStatus === "trial" && daysRemaining <= 0 && !isSubscribed;

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
