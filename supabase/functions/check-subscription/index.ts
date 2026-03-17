import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Service role client for DB operations
  const supabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header provided");

    // Validate JWT using anon-key client with getClaims (works with ES256 on Lovable Cloud)
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error("Invalid authentication token");

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;
    if (!userEmail) throw new Error("User email not available in token");
    logStep("User authenticated", { email: userEmail });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd: string | null = null;
    let planName: string | null = null;
    let stripeSubscriptionId: string | null = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      stripeSubscriptionId = subscription.id;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      const priceId = subscription.items.data[0].price.id;

      // Map price to plan name
      if (priceId === "price_1T9nqPHmh4WVTxBvFDvkWtdP") planName = "monthly";
      else if (priceId === "price_1T9nrsHmh4WVTxBv9mcT2zp1") planName = "quarterly";
      else if (priceId === "price_1T9nslHmh4WVTxBvmPNLhhz2") planName = "annual";
      else planName = "active";

      logStep("Active subscription found", { stripeSubscriptionId, planName, subscriptionEnd });

      // Update organization in DB
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("organization_id")
        .eq("user_id", userId)
        .single();

      if (profile?.organization_id) {
        await supabaseClient
          .from("organizations")
          .update({
            subscription_status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: stripeSubscriptionId,
            plan_name: planName,
          })
          .eq("id", profile.organization_id);
        logStep("Organization updated", { orgId: profile.organization_id });
      }
    } else {
      logStep("No active subscription found");
    }

    return new Response(
      JSON.stringify({
        subscribed: hasActiveSub,
        plan_name: planName,
        subscription_end: subscriptionEnd,
        stripe_subscription_id: stripeSubscriptionId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
