import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Rate limiting by user ID: 5 req/min ──────────────────────────────
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const userHits = new Map<string, number[]>();

setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [uid, ts] of userHits) {
    const filtered = ts.filter((t) => t > cutoff);
    if (filtered.length === 0) userHits.delete(uid);
    else userHits.set(uid, filtered);
  }
}, 120_000);

function checkUserRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  let timestamps = userHits.get(userId) ?? [];
  timestamps = timestamps.filter((t) => t > now - WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((timestamps[0] + WINDOW_MS - now) / 1000);
    userHits.set(userId, timestamps);
    return { allowed: false, retryAfter };
  }

  timestamps.push(now);
  userHits.set(userId, timestamps);
  return { allowed: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header provided");

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error("Invalid authentication token");

    const userEmail = claimsData.claims.email as string;
    const userId = claimsData.claims.sub as string;
    if (!userEmail) throw new Error("User email not available");

    // ── Rate limit check ───────────────────────────────────────────
    const rateCheck = checkUserRateLimit(userId);
    if (!rateCheck.allowed) {
      console.warn(`[RATE-LIMIT] Blocked userId=${userId} on customer-portal`);
      return new Response(
        JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques secondes." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rateCheck.retryAfter ?? 60) },
        }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (customers.data.length === 0) throw new Error("No Stripe customer found");

    const origin = req.headers.get("origin") || "https://bonoitec-pilot-pro.lovable.app";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${origin}/dashboard`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
