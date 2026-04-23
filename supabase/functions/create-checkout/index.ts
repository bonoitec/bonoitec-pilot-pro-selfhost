import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";
import { buildCorsHeaders, validateOrigin } from "../_shared/cors.ts";
import { readJsonWithLimit, extractBearerToken } from "../_shared/limits.ts";

const PLANS: Record<string, string> = {
  monthly: "price_1T9nqPHmh4WVTxBvFDvkWtdP",
  // €53.97 every 3 months. Old price (price_1T9nrsHmh4WVTxBv9mcT2zp1) was
  // misconfigured as monthly interval — archived in Stripe.
  quarterly: "price_1TPKJmHmh4WVTxBvy6IPbNSG",
  annual: "price_1T9nslHmh4WVTxBvmPNLhhz2",
};

const maskEmail = (e: string) => e.replace(/(.{2})(.*)(@.*)/, "$1***$3");

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Origin validation FIRST (open-redirect protection) ──────────────
    // Must run before anything else so unknown origins are rejected even
    // if downstream dependencies (Stripe key, etc.) are misconfigured.
    const origin = validateOrigin(req);
    if (!origin) {
      return new Response(
        JSON.stringify({ error: "Invalid origin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // ── Authentication ────────────────────────────────────────────
    const token = extractBearerToken(req.headers.get("Authorization"));
    if (!token) {
      return new Response(
        JSON.stringify({ error: "No authorization header provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const userEmail = claimsData.claims.email as string;
    const userId = claimsData.claims.sub as string;
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "User email not available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    console.log(`[CREATE-CHECKOUT] user=${maskEmail(userEmail)}`);

    // ── DB-backed rate limiting per user: 5 req/min ────────────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: allowed } = await supabaseAdmin.rpc("check_rate_limit", {
      _key: `create-checkout:${userId}`,
      _window_seconds: 60,
      _max_requests: 5,
    });
    // fail-closed: any value other than explicit `true` is treated as blocked
    if (allowed !== true) {
      console.warn(`[RATE-LIMIT] Blocked userId=${userId} on create-checkout`);
      return new Response(
        JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques secondes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } },
      );
    }

    const body = await readJsonWithLimit<{ plan?: string }>(req, 10_000);
    const plan = body.plan || "monthly";
    const priceId = PLANS[plan];
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "Invalid plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // ── H7: verify the price still exists and is active in Stripe ──
    try {
      const stripePrice = await stripe.prices.retrieve(priceId);
      if (!stripePrice.active) {
        console.error(`[CREATE-CHECKOUT] price ${priceId} is inactive`);
        return new Response(
          JSON.stringify({ error: "Plan unavailable" }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } catch (e) {
      console.error(`[CREATE-CHECKOUT] price retrieve failed: ${e instanceof Error ? e.message : e}`);
      return new Response(
        JSON.stringify({ error: "Plan unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Prefer DB-stored customer ID over email lookup ──────────────
    // Email lookup is brittle: a user who changed their Supabase email
    // would silently get a NEW Stripe customer, orphaning their old sub.
    // Read organizations.stripe_customer_id first; only fall back to the
    // email lookup for first-time bootstrap (no DB record yet).
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("organization_id")
      .eq("user_id", userId)
      .maybeSingle();
    const organizationId = (profile as { organization_id?: string } | null)?.organization_id ?? null;
    let customerId: string | undefined;
    if (organizationId) {
      const { data: orgRow } = await supabaseAdmin
        .from("organizations")
        .select("stripe_customer_id")
        .eq("id", organizationId)
        .maybeSingle();
      customerId = (orgRow as { stripe_customer_id?: string | null } | null)?.stripe_customer_id ?? undefined;
    }
    if (!customerId) {
      // Bootstrap: first-time subscriber. Avoid creating a duplicate
      // Stripe customer if one already exists for this email.
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      customerId = customers.data.length > 0 ? customers.data[0].id : undefined;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/tarifs?checkout=cancel`,
      metadata: { user_id: userId, plan },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    if (error instanceof Response) return error; // from readJsonWithLimit
    const errorId = crypto.randomUUID();
    console.error(`[CREATE-CHECKOUT][${errorId}]`, error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: "Une erreur est survenue", id: errorId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
