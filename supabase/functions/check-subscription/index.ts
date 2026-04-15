import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { extractBearerToken } from "../_shared/limits.ts";

const maskEmail = (e: string) => e.replace(/(.{2})(.*)(@.*)/, "$1***$3");

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const token = extractBearerToken(req.headers.get("Authorization"));
    if (!token) {
      return new Response(
        JSON.stringify({ error: "No authorization header provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "User email not available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    console.log(`[CHECK-SUBSCRIPTION] user=${maskEmail(userEmail)}`);

    // ── DB-backed rate limiting: 15 req/min per user ──────────────
    const { data: allowed } = await supabaseClient.rpc("check_rate_limit", {
      _key: `check-subscription:${userId}`,
      _window_seconds: 60,
      _max_requests: 15,
    });

    if (allowed !== true) {
      console.warn(`[RATE-LIMIT] Blocked userId=${userId} on check-subscription`);
      return new Response(
        JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques secondes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } },
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });

    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;

    // Fetch ALL subscriptions (any status), then pick the most relevant one.
    // Previously we only queried status='active', which silently hid `past_due`
    // (card-decline grace period) and the user could keep using the app without
    // paying until Stripe eventually flipped them to `unpaid`/`canceled` weeks later.
    // Now we consider `active` and `past_due` as subscribed, with a 3-day soft-grace
    // for `past_due` so the user sees a warning banner before access is revoked.
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 5,
    });

    // Pick the best subscription: active > past_due > trialing > anything with a future period end
    const PRIORITY: Record<string, number> = {
      active: 5,
      past_due: 4,
      trialing: 3,
      unpaid: 2,
      canceled: 1,
      incomplete: 0,
      incomplete_expired: 0,
      paused: 0,
    };
    const relevantSubs = [...subscriptions.data].sort(
      (a, b) => (PRIORITY[b.status] ?? 0) - (PRIORITY[a.status] ?? 0),
    );
    const subscription = relevantSubs[0];
    const rawStatus = subscription?.status;

    // Grace period for past_due: user retains access for 72h after first failure,
    // then access is revoked. Gives Stripe's dunning retries a chance to succeed
    // without immediately cutting the user off.
    const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;
    let pastDueGraceRemaining: number | null = null;
    let inPastDueGrace = false;
    if (subscription && rawStatus === "past_due") {
      // Use current_period_end as the "last known paid-through" marker; grace
      // counts from the moment the period ended (i.e. renewal failure moment).
      const periodEndField = subscription.current_period_end;
      let periodEndSec: number | null = null;
      if (typeof periodEndField === "number") periodEndSec = periodEndField;
      else if (typeof periodEndField === "string") {
        const ms = new Date(periodEndField).getTime();
        if (!Number.isNaN(ms)) periodEndSec = Math.floor(ms / 1000);
      }
      if (periodEndSec) {
        const graceDeadlineMs = periodEndSec * 1000 + GRACE_PERIOD_MS;
        pastDueGraceRemaining = Math.max(0, graceDeadlineMs - Date.now());
        inPastDueGrace = pastDueGraceRemaining > 0;
      }
    }

    // "Subscribed" for access-gating purposes:
    //   - active: full access
    //   - past_due within 72h grace: access + warning banner
    //   - anything else: no access
    const hasActiveSub =
      rawStatus === "active" || (rawStatus === "past_due" && inPastDueGrace);

    let subscriptionEnd: string | null = null;
    let planName: string | null = null;
    let stripeSubscriptionId: string | null = null;
    let cancelAtPeriodEnd = false;
    let paymentStatus: "active" | "past_due" | null = null;

    if (hasActiveSub && subscription) {
      stripeSubscriptionId = subscription.id;
      cancelAtPeriodEnd = subscription.cancel_at_period_end === true;
      paymentStatus = rawStatus === "past_due" ? "past_due" : "active";

      const periodEndTs = subscription.current_period_end;
      let parsedEnd: number | null = null;
      if (typeof periodEndTs === "number" && periodEndTs > 0) {
        parsedEnd = periodEndTs;
      } else if (typeof periodEndTs === "string") {
        const ms = new Date(periodEndTs).getTime();
        if (!Number.isNaN(ms)) parsedEnd = Math.floor(ms / 1000);
      } else if (periodEndTs && typeof periodEndTs === "object" && "seconds" in (periodEndTs as Record<string, unknown>)) {
        parsedEnd = (periodEndTs as unknown as { seconds: number }).seconds;
      }
      if (parsedEnd && parsedEnd > 0) {
        subscriptionEnd = new Date(parsedEnd * 1000).toISOString();
      }

      const priceId = subscription.items.data[0]?.price?.id;
      if (priceId === "price_1T9nqPHmh4WVTxBvFDvkWtdP") planName = "monthly";
      else if (priceId === "price_1T9nrsHmh4WVTxBv9mcT2zp1") planName = "quarterly";
      else if (priceId === "price_1T9nslHmh4WVTxBvmPNLhhz2") planName = "annual";
      else planName = "active";

      // Update organization in DB
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("organization_id")
        .eq("user_id", userId)
        .single();

      if (profile?.organization_id) {
        // Build plan_name suffix: _cancelling > _past_due > none.
        // Cancelling takes precedence because user's explicit choice overrides
        // a transient payment retry state.
        const suffix = cancelAtPeriodEnd
          ? "_cancelling"
          : paymentStatus === "past_due"
            ? "_past_due"
            : "";
        await supabaseClient
          .from("organizations")
          .update({
            subscription_status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: stripeSubscriptionId,
            plan_name: `${planName}${suffix}`,
          })
          .eq("id", profile.organization_id);
      }
    } else {
      // Update org to reflect cancelled/expired subscription
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("organization_id")
        .eq("user_id", userId)
        .single();

      if (profile?.organization_id) {
        const { data: org } = await supabaseClient
          .from("organizations")
          .select("subscription_status")
          .eq("id", profile.organization_id)
          .single();

        if (org?.subscription_status === "active") {
          await supabaseClient
            .from("organizations")
            .update({
              subscription_status: "trial_expired",
              plan_name: null,
            })
            .eq("id", profile.organization_id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        subscribed: hasActiveSub,
        plan_name: planName,
        subscription_end: subscriptionEnd,
        cancel_at_period_end: cancelAtPeriodEnd,
        // New fields (backwards-compatible — frontend treats undefined as null):
        payment_status: paymentStatus,
        past_due_grace_ms: pastDueGraceRemaining,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[CHECK-SUBSCRIPTION][${errorId}]`, error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: "Une erreur est survenue", id: errorId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
