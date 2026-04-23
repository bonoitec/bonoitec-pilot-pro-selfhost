// Stripe webhook handler — keeps the organizations table in sync with Stripe
// in real time instead of relying on the check-subscription poll.
//
// Events handled:
//   checkout.session.completed        → mark org active immediately after payment
//   customer.subscription.created     → alt entrypoint for first paid sub
//   customer.subscription.updated     → plan change, cancel_at_period_end flip, past_due
//   customer.subscription.deleted     → subscription ended (revoke access)
//   invoice.payment_succeeded         → renewal succeeded (clear past_due anchor)
//   invoice.payment_failed            → card declined (set past_due_since + email user)
//
// Signature verification uses STRIPE_WEBHOOK_SECRET. Any request without a
// valid Stripe-Signature is rejected with 400. Processing errors return 500
// so Stripe retries (Stripe only retries 5xx, never 4xx).

import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const PLAN_BY_PRICE: Record<string, string> = {
  price_1T9nqPHmh4WVTxBvFDvkWtdP: "monthly",
  price_1TPKJmHmh4WVTxBvy6IPbNSG: "quarterly",
  // Legacy quarterly price (archived in Stripe — billed monthly by mistake).
  // Kept here so any historical webhook event still resolves to "quarterly".
  price_1T9nrsHmh4WVTxBv9mcT2zp1: "quarterly",
  price_1T9nslHmh4WVTxBvmPNLhhz2: "annual",
};

const BRAND = {
  primary: "#4338ca",
  primaryLight: "#eef2ff",
  foreground: "#1e293b",
  muted: "#64748b",
  background: "#f8fafc",
  white: "#ffffff",
  border: "#e2e8f0",
};

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderPaymentFailedEmail(opts: {
  amountDue: number;
  currency: string;
  nextAttempt: Date | null;
  portalUrl: string | null;
}): { subject: string; html: string } {
  const amount = (opts.amountDue / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: opts.currency.toUpperCase(),
  });
  const nextAttemptStr = opts.nextAttempt
    ? opts.nextAttempt.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const subject = "⚠️ Paiement échoué — mettez à jour votre moyen de paiement";

  const actionBlock = opts.portalUrl
    ? `<a href="${esc(opts.portalUrl)}" style="display:inline-block;background:${BRAND.primary};color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;margin:20px 0;">Mettre à jour mon moyen de paiement</a>`
    : "";

  const nextAttemptBlock = nextAttemptStr
    ? `<p style="color:${BRAND.muted};font-size:13px;line-height:1.6;margin:0 0 14px;">Stripe réessaiera automatiquement le <strong>${esc(nextAttemptStr)}</strong>. Passé ce délai, votre accès à BonoitecPilot sera suspendu.</p>`
    : `<p style="color:${BRAND.muted};font-size:13px;line-height:1.6;margin:0 0 14px;">Sans action de votre part dans les 72h, votre accès à BonoitecPilot sera suspendu.</p>`;

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:${BRAND.background};font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;">
  <table role="presentation" width="100%" style="background:${BRAND.background};padding:32px 0;"><tr><td align="center">
    <table role="presentation" width="580" style="max-width:580px;background:${BRAND.white};border-radius:12px;overflow:hidden;border:1px solid ${BRAND.border};">
      <tr><td style="background:${BRAND.primary};padding:44px 32px 36px;text-align:center;">
        <img src="https://bonoitecpilot.fr/email-wordmark.png" width="280" height="44" alt="BonoitecPilot" style="display:block;margin:0 auto;border:0;"/>
        <p style="color:rgba(255,255,255,0.80);font-size:12px;margin:10px 0 0 0;letter-spacing:0.4px;">Gestion professionnelle de réparations</p>
      </td></tr>
      <tr><td>
        <div style="padding:32px;">
          <h2 style="color:${BRAND.foreground};font-size:20px;font-weight:700;margin:0 0 16px;">⚠️ Paiement non abouti</h2>
          <p style="color:${BRAND.muted};font-size:14px;line-height:1.7;margin:0 0 14px;">Bonjour,</p>
          <p style="color:${BRAND.muted};font-size:14px;line-height:1.7;margin:0 0 14px;">Nous n'avons pas pu encaisser le renouvellement de votre abonnement BonoitecPilot. Votre banque a refusé le débit (carte expirée, fonds insuffisants ou blocage de sécurité).</p>
          <div style="background:${BRAND.primaryLight};border-radius:8px;padding:16px 20px;margin:20px 0;">
            <p style="color:${BRAND.foreground};margin:4px 0;font-size:13px;"><strong style="color:${BRAND.primary};">Montant :</strong> ${esc(amount)}</p>
          </div>
          ${nextAttemptBlock}
          <p style="color:${BRAND.muted};font-size:14px;line-height:1.7;margin:0 0 14px;">Pour éviter toute interruption, mettez à jour votre carte bancaire directement depuis le portail client :</p>
          ${actionBlock}
          <p style="color:${BRAND.muted};font-size:13px;line-height:1.6;margin:0 0 14px;">Si vous rencontrez un problème, répondez simplement à cet email — nous sommes là pour vous aider.</p>
          <p style="color:${BRAND.muted};font-size:14px;line-height:1.7;margin:14px 0 0;">Cordialement,<br /><strong>L'équipe BonoitecPilot</strong></p>
        </div>
      </td></tr>
      <tr><td style="background:${BRAND.background};padding:24px 32px;text-align:center;border-top:1px solid ${BRAND.border};">
        <p style="color:${BRAND.muted};font-size:12px;line-height:1.7;margin:0;">
          BonoitecPilot — Votre atelier connecté<br />
          Support&nbsp;: <a href="mailto:contact@app.bonoitecpilot.fr" style="color:${BRAND.primary};text-decoration:none;">contact@app.bonoitecpilot.fr</a>
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  return { subject, html };
}

async function sendResendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const safeSubject = String(subject).replace(/[\r\n\t]/g, " ").slice(0, 998);
  const payload = {
    from: "BonoitecPilot <noreply@bonoitecpilot.fr>",
    to: [to],
    reply_to: "contact@app.bonoitecpilot.fr",
    subject: safeSubject,
    html,
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error (${res.status}): ${body}`);
  }
}

function planNameFromSubscription(sub: Stripe.Subscription): string {
  const priceId = sub.items.data[0]?.price?.id;
  if (priceId && PLAN_BY_PRICE[priceId]) return PLAN_BY_PRICE[priceId];
  return "active";
}

// Resolve the org from the event's customer ID. Tries two paths:
//   1) stripe_customer_id column on organizations (set after the very first
//      successful checkout — this should cover 99% of events)
//   2) For checkout.session.completed / customer.subscription.created events
//      only, we pass an optional user_id from session.metadata.user_id and
//      look up via profiles. This handles the bootstrap case where the org
//      doesn't yet have stripe_customer_id set.
// Returns null if neither path resolves — the event is logged and ignored.
async function findOrgByCustomerId(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
  metadataUserId: string | null,
): Promise<{ organizationId: string; email: string | null } | null> {
  const { data: byCustomer } = await supabase
    .from("organizations")
    .select("id, email")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (byCustomer?.id) {
    return { organizationId: byCustomer.id as string, email: (byCustomer as { email: string | null }).email };
  }

  if (metadataUserId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("user_id", metadataUserId)
      .maybeSingle();
    const orgId = (profile as { organization_id?: string } | null)?.organization_id;
    if (orgId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("email")
        .eq("id", orgId)
        .maybeSingle();
      return { organizationId: orgId, email: (org as { email: string | null } | null)?.email ?? null };
    }
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    console.error("[STRIPE-WEBHOOK] missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return new Response("Server misconfigured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.warn("[STRIPE-WEBHOOK] missing stripe-signature header");
    return new Response("Missing signature", { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.warn(`[STRIPE-WEBHOOK] signature verification failed: ${msg}`);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  console.log(`[STRIPE-WEBHOOK] event=${event.type} id=${event.id}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (!customerId) break;
        // create-checkout sets session.metadata.user_id — use it to resolve
        // the org on the very first payment when stripe_customer_id is not
        // yet in the DB.
        const userIdFromMetadata = (session.metadata?.user_id as string | undefined) ?? null;
        const orgInfo = await findOrgByCustomerId(supabase, customerId, userIdFromMetadata);
        if (!orgInfo) {
          console.warn(`[STRIPE-WEBHOOK] no org found for customer=${customerId} metadata_user=${userIdFromMetadata}`);
          break;
        }
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const plan = planNameFromSubscription(sub);
          await supabase
            .from("organizations")
            .update({
              subscription_status: "active",
              stripe_customer_id: customerId,
              stripe_subscription_id: sub.id,
              plan_name: sub.cancel_at_period_end ? `${plan}_cancelling` : plan,
              past_due_since: null, // fresh sub, clear any stale marker
            })
            .eq("id", orgInfo.organizationId);
        }
        break;
      }

      case "customer.subscription.created": {
        // Alt entrypoint when Stripe emits subscription.created before
        // checkout.session.completed (rare but documented race).
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const orgInfo = await findOrgByCustomerId(supabase, customerId, null);
        if (!orgInfo) {
          // Metadata lookup not available on subscription events — rely on
          // the checkout.session.completed event to land first. This event
          // gets retried by Stripe until we 200, so we ACK to avoid retry
          // storm when the corresponding session event is on its way.
          console.warn(`[STRIPE-WEBHOOK] subscription.created for unknown customer=${customerId} — will rely on subsequent session event`);
          break;
        }
        const plan = planNameFromSubscription(sub);
        await supabase
          .from("organizations")
          .update({
            subscription_status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            plan_name: sub.cancel_at_period_end ? `${plan}_cancelling` : plan,
            past_due_since: null,
          })
          .eq("id", orgInfo.organizationId);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const orgInfo = await findOrgByCustomerId(supabase, customerId, null);
        if (!orgInfo) break;

        // Load the current DB state before deciding whether to clobber it.
        // In particular: a user on `trial` should NOT be flipped to
        // `trial_expired` by a canceled paid-sub attempt — their free trial
        // period is independent.
        const { data: currentOrg } = await supabase
          .from("organizations")
          .select("subscription_status, past_due_since, trial_end_date")
          .eq("id", orgInfo.organizationId)
          .maybeSingle();
        const currentStatus =
          (currentOrg as { subscription_status?: string } | null)?.subscription_status ?? null;
        const currentPastDueSince =
          (currentOrg as { past_due_since?: string | null } | null)?.past_due_since ?? null;

        const plan = planNameFromSubscription(sub);
        const updates: Record<string, unknown> = {
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
        };

        if (sub.status === "active" || sub.status === "trialing") {
          updates.subscription_status = "active";
          updates.plan_name = sub.cancel_at_period_end ? `${plan}_cancelling` : plan;
          updates.past_due_since = null; // recovered from any prior past_due
        } else if (sub.status === "past_due") {
          updates.subscription_status = "active"; // keep access during grace
          updates.plan_name = `${plan}_past_due`;
          // Anchor the grace window to the FIRST past_due transition, not
          // every subsequent subscription.updated event. Preserve the
          // existing timestamp if one is already set.
          if (!currentPastDueSince) {
            updates.past_due_since = new Date(event.created * 1000).toISOString();
          }
        } else {
          // canceled / unpaid / incomplete / incomplete_expired / paused
          // Do NOT flip a user still in their free trial — their trial
          // should continue even if a paid-sub attempt is canceled.
          if (currentStatus === "trial") {
            updates.plan_name = null;
            updates.past_due_since = null;
            updates.stripe_subscription_id = null;
          } else {
            updates.subscription_status = "trial_expired";
            updates.plan_name = null;
            updates.past_due_since = null;
            updates.stripe_subscription_id = null;
          }
        }

        await supabase.from("organizations").update(updates).eq("id", orgInfo.organizationId);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const orgInfo = await findOrgByCustomerId(supabase, customerId, null);
        if (!orgInfo) break;
        // Same trial-preservation guard as subscription.updated.
        const { data: currentOrg } = await supabase
          .from("organizations")
          .select("subscription_status")
          .eq("id", orgInfo.organizationId)
          .maybeSingle();
        const currentStatus = (currentOrg as { subscription_status?: string } | null)?.subscription_status ?? null;
        const updates: Record<string, unknown> = {
          plan_name: null,
          past_due_since: null,
          stripe_subscription_id: null,
        };
        if (currentStatus !== "trial") {
          updates.subscription_status = "trial_expired";
        }
        await supabase.from("organizations").update(updates).eq("id", orgInfo.organizationId);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;
        const orgInfo = await findOrgByCustomerId(supabase, customerId, null);
        if (!orgInfo) break;
        // Clear any past_due suffix/anchor after a successful retry
        const { data: org } = await supabase
          .from("organizations")
          .select("plan_name")
          .eq("id", orgInfo.organizationId)
          .maybeSingle();
        const cleanPlan = (org as { plan_name?: string | null } | null)?.plan_name?.replace(/_past_due$/, "") ?? null;
        await supabase
          .from("organizations")
          .update({
            subscription_status: "active",
            plan_name: cleanPlan,
            past_due_since: null,
          })
          .eq("id", orgInfo.organizationId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;
        const orgInfo = await findOrgByCustomerId(supabase, customerId, null);
        if (!orgInfo) break;

        // Anchor grace to the event timestamp, once. Subsequent failed retries
        // don't reset the counter.
        const { data: currentOrg } = await supabase
          .from("organizations")
          .select("past_due_since, plan_name")
          .eq("id", orgInfo.organizationId)
          .maybeSingle();
        const existingPastDueSince =
          (currentOrg as { past_due_since?: string | null } | null)?.past_due_since ?? null;
        const existingPlan = (currentOrg as { plan_name?: string | null } | null)?.plan_name ?? "monthly";
        const basePlan = existingPlan.replace(/(_cancelling|_past_due)$/, "");

        const updates: Record<string, unknown> = {
          plan_name: `${basePlan}_past_due`,
        };
        if (!existingPastDueSince) {
          updates.past_due_since = new Date(event.created * 1000).toISOString();
        }
        await supabase.from("organizations").update(updates).eq("id", orgInfo.organizationId);

        // Send the payment_failed email to the invoice's billing email.
        // invoice.next_payment_attempt is the next retry timestamp (Stripe
        // populates this directly on the invoice — no need to retrieve the
        // subscription separately).
        const recipient = invoice.customer_email ?? orgInfo.email ?? null;
        if (recipient) {
          const nextAttempt = invoice.next_payment_attempt
            ? new Date(invoice.next_payment_attempt * 1000)
            : null;

          let portalUrl: string | null = null;
          try {
            const portal = await stripe.billingPortal.sessions.create({
              customer: customerId,
              return_url: "https://bonoitecpilot.fr/dashboard",
            });
            portalUrl = portal.url;
          } catch (e) {
            console.warn(`[STRIPE-WEBHOOK] could not create portal session: ${e instanceof Error ? e.message : e}`);
          }

          const { subject, html } = renderPaymentFailedEmail({
            amountDue: invoice.amount_due ?? 0,
            currency: invoice.currency ?? "eur",
            nextAttempt,
            portalUrl,
          });

          try {
            await sendResendEmail(recipient, subject, html);
            console.log(`[STRIPE-WEBHOOK] payment_failed email sent org=${orgInfo.organizationId} to=${recipient.replace(/(.{2})(.*)(@.*)/, "$1***$3")}`);
            // Note: intentionally NOT inserting into notification_logs — that
            // table has notification_logs.repair_id NOT NULL, and billing
            // emails have no repair attached. Audit trail lives in webhook logs.
          } catch (e) {
            console.error(`[STRIPE-WEBHOOK] failed to send payment_failed email: ${e instanceof Error ? e.message : e}`);
          }
        }
        break;
      }

      default:
        // Not an event we care about — still 200 to acknowledge
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorId = crypto.randomUUID();
    console.error(
      `[STRIPE-WEBHOOK][${errorId}] event=${event.type}`,
      err instanceof Error ? err.message : err,
    );
    return new Response(JSON.stringify({ error: "Processing failed", id: errorId }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
