// End-to-end smoke test for the embedded Stripe payment flow.
// 1) creates a temp Supabase user
// 2) calls create-checkout (returns client_secret + session_id for embedded UI)
// 3) verifies the resulting Stripe session has all expected config
// 4) tests check-subscription early-return for non-subscribers
// 5) tests customer-portal 404 for non-subscribers
// 6) tests stripe-webhook signature verification + idempotency + replay
// 7) deletes the temp user

import { createHmac, randomUUID } from "node:crypto";

const SUPABASE_URL = "https://rkfkibpcrqkchmtoogxq.supabase.co";
const SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrZmtpYnBjcnFrY2htdG9vZ3hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk4MTM4MSwiZXhwIjoyMDkxNTU3MzgxfQ.cXWAGW3yJpywSNx3d1bHix6o33hqqeizBmBicjwaXOU";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrZmtpYnBjcnFrY2htdG9vZ3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5ODEzODEsImV4cCI6MjA5MTU1NzM4MX0.8dSs6czroMdeI7F8JVnrl4hCMPxXDvxVlDpmEOXE3bU";
const ORIGIN = "https://bonoitecpilot.fr";
// Secrets must come from env (never commit them). Both are required.
//   STRIPE_SECRET_KEY   — Stripe live secret (sk_live_*)
//   STRIPE_WEBHOOK_SECRET — webhook signing secret (whsec_*)
const SK = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
if (!SK || !WEBHOOK_SECRET) {
  console.error("Missing STRIPE_SECRET_KEY and/or STRIPE_WEBHOOK_SECRET in env.");
  console.error("Run: STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_... node smoke-stripe.mjs");
  process.exit(2);
}
const PRICE_ID = {
  monthly: "price_1T9nqPHmh4WVTxBvFDvkWtdP",
  quarterly: "price_1TPKJmHmh4WVTxBvy6IPbNSG",
  annual: "price_1T9nslHmh4WVTxBvmPNLhhz2",
};

const adminHeaders = {
  apikey: SERVICE_ROLE,
  Authorization: `Bearer ${SERVICE_ROLE}`,
  "Content-Type": "application/json",
};

function log(label, ok, extra = "") {
  const tag = ok ? "PASS" : "FAIL";
  console.log(`[${tag}] ${label}${extra ? " - " + extra : ""}`);
  return ok;
}

async function createUser(email, password) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`create user ${r.status}: ${JSON.stringify(j)}`);
  return j.id;
}

async function deleteUser(id) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
  return r.ok;
}

async function signIn(email, password) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`signin ${r.status}: ${JSON.stringify(j)}`);
  return j.access_token;
}

async function callCreateCheckout(jwt, plan, originHeader = ORIGIN) {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
    method: "POST",
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
      Origin: originHeader,
    },
    body: JSON.stringify({ plan }),
  });
  const text = await r.text();
  let j; try { j = JSON.parse(text); } catch { j = { raw: text }; }
  return { status: r.status, body: j };
}

function makeStripeSignedPayload(payload, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const json = JSON.stringify(payload);
  const signed = `${timestamp}.${json}`;
  const sig = createHmac("sha256", secret).update(signed).digest("hex");
  return { json, header: `t=${timestamp},v1=${sig}` };
}

async function callWebhook(body, sigHeader) {
  const headers = { "Content-Type": "application/json" };
  if (sigHeader) headers["stripe-signature"] = sigHeader;
  const r = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
    method: "POST",
    headers,
    body,
  });
  const text = await r.text();
  return { status: r.status, body: text.slice(0, 200) };
}

(async () => {
  const results = [];
  const ts = Date.now();
  const email = `stripe-smoke-${ts}@bonoitec-test.invalid`;
  const password = `Smoke!${randomUUID()}`;
  let userId = null;

  try {
    // === Health checks ===
    {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
        method: "POST",
        headers: { apikey: ANON, "Content-Type": "application/json", Origin: ORIGIN },
        body: JSON.stringify({ plan: "monthly" }),
      });
      const j = await r.json().catch(() => ({}));
      results.push(log("create-checkout requires auth (no Bearer)", r.status === 401, `got ${r.status} ${j.error || ""}`));
    }
    {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
        method: "POST",
        headers: { apikey: ANON, "Content-Type": "application/json", Origin: "https://evil.example" },
        body: JSON.stringify({ plan: "monthly" }),
      });
      results.push(log("create-checkout rejects bad origin", r.status === 403, `got ${r.status}`));
    }
    {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      results.push(log("stripe-webhook rejects missing signature", r.status === 400 || r.status === 401, `got ${r.status}`));
    }

    // === Create temp user + sign in ===
    userId = await createUser(email, password);
    log("created temp user", true, userId);
    const jwt = await signIn(email, password);
    log("signed in temp user", true, "");

    // === End-to-end checkout for all 3 plans (embedded UI) ===
    // create-checkout returns { client_secret, session_id }. We pull the
    // session back via Stripe API and verify all session config:
    // ui_mode=embedded, locale=fr, tax_id_collection, ToS consent,
    // billing address required, correct line item.
    for (const plan of ["monthly", "quarterly", "annual"]) {
      const r = await callCreateCheckout(jwt, plan);
      const cs = r.body?.client_secret;
      const sid = r.body?.session_id;
      const ok = r.status === 200 && typeof cs === "string" && cs.length > 20
        && typeof sid === "string" && sid.startsWith("cs_");
      results.push(log(`create-checkout plan=${plan} returns embedded client_secret`, ok,
        `status=${r.status} session=${sid || r.body?.error || ""}`));
      if (!ok) continue;

      const sresp = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sid}?expand[]=line_items`,
        { headers: { Authorization: `Basic ${Buffer.from(SK + ":").toString("base64")}` } });
      const session = await sresp.json();
      const planPrice = session.line_items?.data?.[0]?.price?.id;
      const cfgOk = session.ui_mode === "embedded"
        && session.locale === "fr"
        && session.tax_id_collection?.enabled === true
        && session.allow_promotion_codes === true
        && session.consent_collection?.terms_of_service === "required"
        && session.billing_address_collection === "required"
        && planPrice === PRICE_ID[plan];
      results.push(log(`  session config correct for ${plan}`, cfgOk, cfgOk ? "" :
        `ui_mode=${session.ui_mode} locale=${session.locale} tax=${session.tax_id_collection?.enabled} promo=${session.allow_promotion_codes} consent=${session.consent_collection?.terms_of_service} addr=${session.billing_address_collection} price=${planPrice}`));
    }

    // === Invalid plan ===
    {
      const r = await callCreateCheckout(jwt, "platinum");
      results.push(log("invalid plan returns 400", r.status === 400, `got ${r.status} ${r.body?.error || ""}`));
    }

    // === check-subscription: temp user has no stripe_customer_id ===
    {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/check-subscription`, {
        method: "POST",
        headers: { apikey: ANON, Authorization: `Bearer ${jwt}`, Origin: ORIGIN },
      });
      const j = await r.json().catch(() => ({}));
      results.push(log("check-subscription returns false for non-subscriber (no Stripe call needed)",
        r.status === 200 && j.subscribed === false, `got ${r.status} ${JSON.stringify(j).slice(0, 80)}`));
    }

    // === customer-portal: temp user has no stripe_customer_id ===
    {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/customer-portal`, {
        method: "POST",
        headers: { apikey: ANON, Authorization: `Bearer ${jwt}`, Origin: ORIGIN, "Content-Type": "application/json" },
        body: "{}",
      });
      const j = await r.json().catch(() => ({}));
      results.push(log("customer-portal returns 404 for non-subscriber (no email lookup)",
        r.status === 404, `got ${r.status} ${j.error || ""}`));
    }

    // === Webhook signature + idempotency + replay protection ===
    {
      const benignEvent = {
        id: `evt_smoke_${Date.now()}`,
        object: "event",
        api_version: "2025-08-27.basil",
        type: "ping",
        created: Math.floor(Date.now() / 1000),
        data: { object: {} },
      };
      const bad = await callWebhook(JSON.stringify(benignEvent), "t=1,v1=deadbeef");
      results.push(log("webhook rejects bad signature", bad.status === 400, `got ${bad.status}`));

      const { json, header } = makeStripeSignedPayload(benignEvent, WEBHOOK_SECRET);
      const good = await callWebhook(json, header);
      results.push(log("webhook accepts valid signature (benign event)", good.status === 200, `got ${good.status} body=${good.body.slice(0, 100)}`));

      const replay = makeStripeSignedPayload(benignEvent, WEBHOOK_SECRET);
      const dup = await callWebhook(replay.json, replay.header);
      results.push(log("webhook dedupes duplicate event id",
        dup.status === 200 && /duplicate/i.test(dup.body),
        `got ${dup.status} body=${dup.body.slice(0, 100)}`));

      const stale = makeStripeSignedPayload(benignEvent, WEBHOOK_SECRET, Math.floor(Date.now() / 1000) - 600);
      const old = await callWebhook(stale.json, stale.header);
      results.push(log("webhook rejects stale timestamp (replay protection)", old.status === 400, `got ${old.status}`));
    }
  } catch (e) {
    console.error("FATAL", e.message);
    results.push(false);
  } finally {
    if (userId) {
      await deleteUser(userId);
      log("cleanup: deleted temp user", true, userId);
    }
  }

  const pass = results.filter(Boolean).length;
  const total = results.length;
  console.log(`\n=== ${pass}/${total} passed ===`);
  process.exit(pass === total ? 0 : 1);
})();
