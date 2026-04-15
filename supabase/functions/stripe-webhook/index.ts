// Stripe webhook handler — keeps the organizations table in sync with Stripe
// in real time instead of relying on the check-subscription poll.
//
// Events handled:
//   checkout.session.completed        → mark org active immediately after payment
//   customer.subscription.updated     → plan change, cancel_at_period_end flip, past_due
//   customer.subscription.deleted     → subscription ended (revoke access)
//   invoice.payment_succeeded         → renewal succeeded (clear past_due suffix)
//   invoice.payment_failed            → card declined — flag + email the user
//
// Signature verification uses STRIPE_WEBHOOK_SECRET. Reject any request
// without a valid Stripe-Signature header.

import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const PLAN_BY_PRICE: Record<string, string> = {
  price_1T9nqPHmh4WVTxBvFDvkWtdP: "monthly",
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

// Minimal email template for payment_failed. Inlined rather than calling the
// send-email function because send-email requires a user JWT and this webhook
// runs with a service-role context.
function renderPaymentFailedEmail(opts: {
  customerEmail: string;
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

  const subject = "\u26A0\uFE0F Paiement \u00e9chou\u00e9 \u2014 mettez \u00e0 jour votre moyen de paiement";

  const actionBlock = opts.portalUrl
    ? `<a href="${esc(opts.portalUrl)}" style="display:inline-block;background:${BRAND.primary};color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;margin:20px 0;">Mettre \u00e0 jour mon moyen de paiement</a>`
    : "";

  const nextAttemptBlock = nextAttemptStr
    ? `<p style="color:${BRAND.muted};font-size:13px;line-height:1.6;margin:0 0 14px;">Stripe r\u00e9essaiera automatiquement le <strong>${esc(nextAttemptStr)}</strong>. Pass\u00e9 ce d\u00e9lai, votre acc\u00e8s &agrave; BonoitecPilot sera suspendu.</p>`
    : `<p style="color:${BRAND.muted};font-size:13px;line-height:1.6;margin:0 0 14px;">Sans action de votre part dans les 72h, votre acc\u00e8s &agrave; BonoitecPilot sera suspendu.</p>`;

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:${BRAND.background};font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;">
  <table role="presentation" width="100%" style="background:${BRAND.background};padding:32px 0;"><tr><td align="center">
    <table role="presentation" width="580" style="max-width:580px;background:${BRAND.white};border-radius:12px;overflow:hidden;border:1px solid ${BRAND.border};">
      <tr><td style="background:${BRAND.primary};padding:44px 32px 36px;text-align:center;">
        <img src="https://bonoitecpilot.fr/email-wordmark.png" width="280" height="44" alt="BonoitecPilot" style="display:block;margin:0 auto;border:0;"/>
        <p style="color:rgba(255,255,255,0.80);font-size:12px;margin:10px 0 0 0;letter-spacing:0.4px;">Gestion professionnelle de r&eacute;parations</p>
      </td></tr>
      <tr><td>
        <div style="padding:32px;">
          <h2 style="color:${BRAND.foreground};font-size:20px;font-weight:700;margin:0 0 16px;">&#9888;&#65039; Paiement non abouti</h2>
          <p style="color:${BRAND.muted};font-size:14px;line-height:1.7;margin:0 0 14px;">Bonjour,</p>
          <p style="color:${BRAND.muted};font-size:14px;line-height:1.7;margin:0 0 14px;">Nous n'avons pas pu encaisser le renouvellement de votre abonnement BonoitecPilot. Votre banque a refus\u00e9 le d\u00e9bit (carte expir\u00e9e, fonds insuffisants ou blocage de s\u00e9curit\u00e9).</p>
          <div style="background:${BRAND.primaryLight};border-radius:8px;padding:16px 20px;margin:20px 0;">
            <p style="color:${BRAND.foreground};margin:4px 0;font-size:13px;"><strong style="color:${BRAND.primary};">Montant :</strong> ${esc(amount)}</p>
          </div>
          ${nextAttemptBlock}
          <p style="color:${BRAND.muted};font-size:14px;line-height:1.7;margin:0 0 14px;">Pour \u00e9viter toute interruption, mettez \u00e0 jour votre carte bancaire directement depuis le portail client :</p>
          ${actionBlock}
          <p style="color:${BRAND.muted};font-size:13px;line-height:1.6;margin:0 0 14px;">Si vous rencontrez un probl\u00e8me, r\u00e9pondez simplement \u00e0 cet email \u2014 nous sommes l\u00e0 pour vous aider.</p>
          <p style="color:${BRAND.muted};font-size:14px;line-height:1.7;margin:14px 0 0;">Cordialement,<br /><strong>L'\u00e9quipe BonoitecPilot</strong></p>
        </div>
      </td></tr>
      <tr><td style="background:${BRAND.background};padding:24px 32px;text-align:center;border-top:1px solid ${BRAND.border};">
        <p style="color:${BRAND.muted};font-size:12px;line-height:1.7;margin:0;">
          BonoitecPilot &mdash; Votre atelier connect&eacute;<br />
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

async function findOrgByCustomerId(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
  email: string | null,
): Promise<{ organizationId: string; email: string | null } | null> {
  // First try by stripe_customer_id (most reliable)
  const { data: byCustomer } = await supabase
    .from("organizations")
    .select("id, email")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (byCustomer?.id) return { organizationId: byCustomer.id, email: byCustomer.email ?? email };

  // Fallback: by email (first checkout, stripe_customer_id not yet set)
  if (email) {
    const { data: byEmail } = await supabase
      .from("profiles")
      .select("organization_id, organizations!inner(id, email)")
      .eq("profiles.organization_id", "organizations.id")
      .limit(1);
    // Too complex — simpler: look up the user by auth.users email
    const { data: usersList } = await supabase.auth.admin.listUsers({ perPage: 200 });
    const match = usersList?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id, organizations(email)")
        .eq("user_id", match.id)
        .maybeSingle();
      if (profile?.organization_id) {
        const orgEmail = (profile as { organizations?: { email?: string } }).organizations?.email ?? email;
        return { organizationId: profile.organization_id as string, email: orgEmail };
      }
    }
  }
  return null;
}

Deno.serve(async (req) => {
  // Stripe webhooks are server-to-server; no CORS preflight needed.
  // Only accept POST from Stripe.
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
        const email = session.customer_details?.email ?? session.customer_email ?? null;
        const orgInfo = await findOrgByCustomerId(supabase, customerId, email);
        if (!orgInfo) {
          console.warn(`[STRIPE-WEBHOOK] no org found for customer=${customerId}`);
          break;
        }
        // Retrieve the subscription to get plan details
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
            })
            .eq("id", orgInfo.organizationId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const orgInfo = await findOrgByCustomerId(supabase, customerId, null);
        if (!orgInfo) break;
        const plan = planNameFromSubscription(sub);
        // Map Stripe status → app status
        let appStatus: "active" | "trial_expired" = "active";
        let suffix = "";
        if (sub.status === "active" || sub.status === "trialing") {
          appStatus = "active";
          if (sub.cancel_at_period_end) suffix = "_cancelling";
        } else if (sub.status === "past_due") {
          appStatus = "active"; // keep access during grace period
          suffix = "_past_due";
        } else {
          // canceled, unpaid, incomplete, incomplete_expired, paused
          appStatus = "trial_expired";
        }
        await supabase
          .from("organizations")
          .update({
            subscription_status: appStatus,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            plan_name: appStatus === "active" ? `${plan}${suffix}` : null,
          })
          .eq("id", orgInfo.organizationId);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const orgInfo = await findOrgByCustomerId(supabase, customerId, null);
        if (!orgInfo) break;
        await supabase
          .from("organizations")
          .update({
            subscription_status: "trial_expired",
            plan_name: null,
            stripe_subscription_id: null,
          })
          .eq("id", orgInfo.organizationId);
        break;
      }

      case "invoice.payment_succeeded": {
        // Clear any _past_due suffix from plan_name after a successful retry
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;
        const orgInfo = await findOrgByCustomerId(supabase, customerId, invoice.customer_email ?? null);
        if (!orgInfo) break;
        const { data: org } = await supabase
          .from("organizations")
          .select("plan_name")
          .eq("id", orgInfo.organizationId)
          .maybeSingle();
        if (org?.plan_name?.endsWith("_past_due")) {
          const cleaned = org.plan_name.replace("_past_due", "");
          await supabase
            .from("organizations")
            .update({ plan_name: cleaned, subscription_status: "active" })
            .eq("id", orgInfo.organizationId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;
        const email = invoice.customer_email ?? null;
        const orgInfo = await findOrgByCustomerId(supabase, customerId, email);
        if (!orgInfo) break;

        // Stripe's next_payment_attempt is on the subscription, not the invoice. Fetch it.
        let nextAttempt: Date | null = null;
        if (invoice.subscription) {
          const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          if (sub.latest_invoice && typeof sub.latest_invoice === "object") {
            const latest = sub.latest_invoice as Stripe.Invoice;
            if (latest.next_payment_attempt) {
              nextAttempt = new Date(latest.next_payment_attempt * 1000);
            }
          }
        }

        // Mark org as past_due in DB (preserves access during grace period)
        const { data: orgRow } = await supabase
          .from("organizations")
          .select("plan_name")
          .eq("id", orgInfo.organizationId)
          .maybeSingle();
        const basePlan = (orgRow?.plan_name ?? "monthly").replace(/(_cancelling|_past_due)$/, "");
        await supabase
          .from("organizations")
          .update({ plan_name: `${basePlan}_past_due` })
          .eq("id", orgInfo.organizationId);

        // Send payment_failed email. Use billing_details email from the invoice
        // if available (more reliable than fallback).
        const recipient = email ?? orgInfo.email ?? null;
        if (recipient) {
          // Generate a Stripe Customer Portal link so the user can update their card
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
            customerEmail: recipient,
            amountDue: invoice.amount_due ?? 0,
            currency: invoice.currency ?? "eur",
            nextAttempt,
            portalUrl,
          });

          try {
            await sendResendEmail(recipient, subject, html);
            // Log in notification_logs so the shop can see we alerted them
            await supabase.from("notification_logs").insert({
              organization_id: orgInfo.organizationId,
              channel: "email",
              recipient,
              subject,
              body: html,
              status: "sent",
            });
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
    // Return 500 so Stripe retries. Do NOT return 400 — Stripe only retries 5xx.
    return new Response(JSON.stringify({ error: "Processing failed", id: errorId }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
