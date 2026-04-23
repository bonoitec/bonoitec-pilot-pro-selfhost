// End-to-end smoke test for the Stripe payment flow.
// 1) creates a temp Supabase user
// 2) calls create-checkout edge function via that user's JWT
// 3) loads the returned Stripe checkout URL in Playwright
// 4) verifies all 3 plans (monthly / quarterly / annual)
// 5) deletes the temp user
// 6) tests stripe-webhook signature verification (good + bad sig)

import { chromium } from "playwright";
import { createHmac, randomUUID } from "node:crypto";

const SUPABASE_URL = "https://rkfkibpcrqkchmtoogxq.supabase.co";
const SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrZmtpYnBjcnFrY2htdG9vZ3hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk4MTM4MSwiZXhwIjoyMDkxNTU3MzgxfQ.cXWAGW3yJpywSNx3d1bHix6o33hqqeizBmBicjwaXOU";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrZmtpYnBjcnFrY2htdG9vZ3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5ODEzODEsImV4cCI6MjA5MTU1NzM4MX0.8dSs6czroMdeI7F8JVnrl4hCMPxXDvxVlDpmEOXE3bU";
const ORIGIN = "https://bonoitecpilot.fr";
const WEBHOOK_SECRET = "whsec_AofqxNUY9kq3G8rN6ZdjvkU1dzZudOrY";

const adminHeaders = {
  apikey: SERVICE_ROLE,
  Authorization: `Bearer ${SERVICE_ROLE}`,
  "Content-Type": "application/json",
};

function log(label, ok, extra = "") {
  const tag = ok ? "PASS" : "FAIL";
  console.log(`[${tag}] ${label}${extra ? " — " + extra : ""}`);
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

async function hitCheckoutUrl(url) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (req) => {
    const msg = req.failure()?.errorText || "";
    if (!msg.includes("net::ERR_ABORTED")) errs.push(`reqfailed: ${req.url()} ${msg}`);
  });
  const resp = await page.goto(url, { waitUntil: "load", timeout: 30000 });
  // Stripe checkout is JS-hydrated. Wait for business name to appear in the DOM.
  let hasBiz = false;
  try {
    await page.waitForFunction(() => /Bonoitec/i.test(document.body?.innerText || ""), { timeout: 12000 });
    hasBiz = true;
  } catch { /* timeout — biz name not visible */ }
  const txt = await page.evaluate(() => document.body.innerText);
  const status = resp?.status() ?? 0;
  const hasEUR = /€|EUR/i.test(txt);
  const hasPrice = /\d+[.,]\d{2}/.test(txt);
  await browser.close();
  return { status, hasBiz, hasEUR, hasPrice, txt, errs };
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
    // === Health checks (no user needed) ===
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

    // === End-to-end checkout for all 3 plans ===
    for (const plan of ["monthly", "quarterly", "annual"]) {
      const r = await callCreateCheckout(jwt, plan);
      const ok = r.status === 200 && /^https:\/\/checkout\.stripe\.com\//.test(r.body?.url || "");
      results.push(log(`create-checkout plan=${plan}`, ok, `status=${r.status} url=${(r.body?.url || r.body?.error || "").slice(0, 60)}`));
      if (!ok) continue;

      let browse;
      try { browse = await hitCheckoutUrl(r.body.url); }
      catch (e) { browse = { status: 0, hasBiz: false, hasEUR: false, hasPrice: false, txt: "", errs: [String(e.message || e)] }; }
      const browseOk = browse.status === 200 && browse.hasBiz && browse.hasEUR && browse.hasPrice;
      results.push(log(`  Stripe page renders for ${plan}`, browseOk,
        `status=${browse.status} biz=${browse.hasBiz} EUR=${browse.hasEUR} price=${browse.hasPrice} errs=${browse.errs.length}`));
      if (browse.errs.length) browse.errs.slice(0, 3).forEach(e => console.log("    " + e));

      // Catch the bug we just fixed: quarterly was previously charged monthly.
      // We assert the price line contains the right interval phrase.
      // Normalize non-breaking spaces (U+00A0) → regular space so regex matches.
      const txt = (browse.txt || "").replace(/[  \s]+/g, " ").toLowerCase();
      const intervalRegex = {
        monthly:   /(par mois|per month|\/mois|\/month)/i,
        quarterly: /(tous les 3 mois|every 3 months|per 3 months|\/3 months)/i,
        annual:    /(par an|per year|\/an|\/year|annuellement|annually)/i,
      }[plan];
      if (intervalRegex && browse.txt) {
        const ok = intervalRegex.test(txt);
        results.push(log(`  Stripe interval phrase present for ${plan}`, ok,
          ok ? "" : `text snippet: "${txt.slice(0, 200).replace(/\s+/g, ' ')}"`));
      }
    }

    // === Invalid plan ===
    {
      const r = await callCreateCheckout(jwt, "platinum");
      results.push(log("invalid plan returns 400", r.status === 400, `got ${r.status} ${r.body?.error || ""}`));
    }

    // === check-subscription: temp user has no stripe_customer_id → false ===
    {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/check-subscription`, {
        method: "POST",
        headers: { apikey: ANON, Authorization: `Bearer ${jwt}`, Origin: ORIGIN },
      });
      const j = await r.json().catch(() => ({}));
      results.push(log("check-subscription returns false for non-subscriber (no Stripe call needed)",
        r.status === 200 && j.subscribed === false, `got ${r.status} ${JSON.stringify(j).slice(0, 80)}`));
    }

    // === customer-portal: temp user has no stripe_customer_id → 404 ===
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

    // === Webhook signature verification + idempotency ===
    // Use a benign event type (default-case in handler → no Stripe API calls)
    // so we can test signature verification without depending on real Stripe IDs.
    {
      const benignEvent = {
        id: `evt_smoke_${Date.now()}`,
        object: "event",
        api_version: "2025-08-27.basil",
        type: "ping",  // unhandled → falls through to default case → 200
        created: Math.floor(Date.now() / 1000),
        data: { object: {} },
      };
      const bad = await callWebhook(JSON.stringify(benignEvent), "t=1,v1=deadbeef");
      results.push(log("webhook rejects bad signature", bad.status === 400, `got ${bad.status}`));

      const { json, header } = makeStripeSignedPayload(benignEvent, WEBHOOK_SECRET);
      const good = await callWebhook(json, header);
      results.push(log("webhook accepts valid signature (benign event → 200)", good.status === 200, `got ${good.status} body=${good.body.slice(0, 100)}`));

      // Idempotency: replaying the SAME event with a fresh signature should
      // be deduped server-side via stripe_webhook_events table.
      const replay = makeStripeSignedPayload(benignEvent, WEBHOOK_SECRET);
      const dup = await callWebhook(replay.json, replay.header);
      results.push(log("webhook dedupes duplicate event id",
        dup.status === 200 && /duplicate/i.test(dup.body),
        `got ${dup.status} body=${dup.body.slice(0, 100)}`));

      // Replay protection: stale timestamp (>5 min old) → Stripe library rejects
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
