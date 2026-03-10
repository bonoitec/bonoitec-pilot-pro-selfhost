import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Brand colors from index.css
const BRAND = {
  primary: "#4338ca",       // hsl(234, 85%, 55%)
  primaryLight: "#eef2ff",  // hsl(234, 85%, 95%)
  foreground: "#1e293b",    // hsl(222, 47%, 11%)
  muted: "#64748b",         // hsl(215, 16%, 47%)
  background: "#f8fafc",    // hsl(210, 20%, 98%)
  success: "#22c55e",
  white: "#ffffff",
  border: "#e2e8f0",
};

function emailLayout(content: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>BonoitecPilot</title>
  <style>
    body { margin: 0; padding: 0; background: ${BRAND.background}; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { width: 100%; background: ${BRAND.background}; padding: 32px 0; }
    .container { max-width: 580px; margin: 0 auto; background: ${BRAND.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .header { background: ${BRAND.primary}; padding: 28px 32px; text-align: center; }
    .header h1 { color: ${BRAND.white}; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.3px; }
    .header .subtitle { color: rgba(255,255,255,0.8); font-size: 12px; margin-top: 4px; }
    .body { padding: 32px; }
    .body h2 { color: ${BRAND.foreground}; font-size: 20px; font-weight: 700; margin: 0 0 16px; }
    .body p { color: ${BRAND.muted}; font-size: 14px; line-height: 1.7; margin: 0 0 14px; }
    .btn { display: inline-block; background: ${BRAND.primary}; color: ${BRAND.white} !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 20px 0; }
    .btn:hover { opacity: 0.9; }
    .info-box { background: ${BRAND.primaryLight}; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .info-box p { color: ${BRAND.foreground}; margin: 4px 0; font-size: 13px; }
    .info-box strong { color: ${BRAND.primary}; }
    .divider { border: none; border-top: 1px solid ${BRAND.border}; margin: 24px 0; }
    .footer { background: ${BRAND.background}; padding: 24px 32px; text-align: center; border-top: 1px solid ${BRAND.border}; }
    .footer p { color: ${BRAND.muted}; font-size: 12px; line-height: 1.6; margin: 0; }
    .footer a { color: ${BRAND.primary}; text-decoration: none; }
    @media (max-width: 600px) {
      .container { margin: 0 12px; }
      .body, .footer { padding: 24px 20px; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden">${preheader}</div>` : ""}
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>⚡ BonoitecPilot</h1>
        <div class="subtitle">Gestion professionnelle de réparations</div>
      </div>
      ${content}
      <div class="footer">
        <p>
          BonoitecPilot — Votre atelier connecté<br>
          <a href="mailto:contact@bonoitecpilot.fr">contact@bonoitecpilot.fr</a> · 04 65 96 95 85
        </p>
        <p style="margin-top:12px;font-size:11px;color:#94a3b8;">
          Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Templates ───────────────────────────────────────────────────────

const templates: Record<string, (data: Record<string, string>) => { subject: string; html: string }> = {

  // Devis disponible
  quote_ready: (d) => ({
    subject: `Votre devis ${d.reference} est disponible`,
    html: emailLayout(`
      <div class="body">
        <h2>📋 Votre devis est prêt</h2>
        <p>Bonjour ${d.clientName || ""},</p>
        <p>Nous avons préparé un devis pour la réparation de votre appareil. Retrouvez les détails ci-dessous :</p>
        <div class="info-box">
          <p><strong>Référence :</strong> ${d.reference}</p>
          <p><strong>Appareil :</strong> ${d.device || "—"}</p>
          <p><strong>Montant TTC :</strong> ${d.totalTTC || "—"} €</p>
        </div>
        <p>Ce devis est valable 30 jours. N'hésitez pas à nous contacter pour toute question.</p>
        <p>Cordialement,<br><strong>L'équipe BonoitecPilot</strong></p>
      </div>
    `, `Votre devis ${d.reference} est disponible`),
  }),

  // Réparation terminée
  repair_completed: (d) => ({
    subject: `Réparation ${d.reference} terminée — Appareil prêt`,
    html: emailLayout(`
      <div class="body">
        <h2>✅ Réparation terminée !</h2>
        <p>Bonjour ${d.clientName || ""},</p>
        <p>Bonne nouvelle ! La réparation de votre appareil est terminée et il est prêt à être récupéré.</p>
        <div class="info-box">
          <p><strong>Référence :</strong> ${d.reference}</p>
          <p><strong>Appareil :</strong> ${d.device || "—"}</p>
          <p><strong>Statut :</strong> ✅ Terminée</p>
        </div>
        <p>Vous pouvez venir le récupérer à notre atelier aux horaires d'ouverture.</p>
        ${d.trackingUrl ? `<a href="${d.trackingUrl}" class="btn">Suivre ma réparation</a>` : ""}
        <p>Merci de votre confiance !<br><strong>L'équipe BonoitecPilot</strong></p>
      </div>
    `, `Votre réparation ${d.reference} est terminée`),
  }),

  // Facture envoyée
  invoice_sent: (d) => ({
    subject: `Facture ${d.reference} — BonoitecPilot`,
    html: emailLayout(`
      <div class="body">
        <h2>🧾 Votre facture</h2>
        <p>Bonjour ${d.clientName || ""},</p>
        <p>Veuillez trouver ci-dessous les informations relatives à votre facture :</p>
        <div class="info-box">
          <p><strong>N° Facture :</strong> ${d.reference}</p>
          <p><strong>Montant HT :</strong> ${d.totalHT || "—"} €</p>
          <p><strong>Montant TTC :</strong> ${d.totalTTC || "—"} €</p>
          ${d.paymentMethod ? `<p><strong>Paiement :</strong> ${d.paymentMethod}</p>` : ""}
        </div>
        <p>Pour toute question concernant cette facture, n'hésitez pas à nous contacter.</p>
        <p>Cordialement,<br><strong>L'équipe BonoitecPilot</strong></p>
      </div>
    `, `Facture ${d.reference}`),
  }),

  // Notification de statut (générique)
  status_update: (d) => ({
    subject: `Mise à jour de votre réparation ${d.reference}`,
    html: emailLayout(`
      <div class="body">
        <h2>🔔 Mise à jour de réparation</h2>
        <p>Bonjour ${d.clientName || ""},</p>
        <p>${d.message || "Le statut de votre réparation a été mis à jour."}</p>
        <div class="info-box">
          <p><strong>Référence :</strong> ${d.reference}</p>
          <p><strong>Appareil :</strong> ${d.device || "—"}</p>
          <p><strong>Nouveau statut :</strong> ${d.statusLabel || d.status || "—"}</p>
        </div>
        ${d.trackingUrl ? `<a href="${d.trackingUrl}" class="btn">Suivre ma réparation</a>` : ""}
        <p>Cordialement,<br><strong>L'équipe BonoitecPilot</strong></p>
      </div>
    `, `Réparation ${d.reference} — mise à jour`),
  }),

  // Notification client générique
  client_notification: (d) => ({
    subject: d.subject || "Notification — BonoitecPilot",
    html: emailLayout(`
      <div class="body">
        <h2>📬 ${d.subject || "Message"}</h2>
        <p>Bonjour ${d.clientName || ""},</p>
        <p>${d.message || ""}</p>
        ${d.trackingUrl ? `<a href="${d.trackingUrl}" class="btn">Accéder à mon espace</a>` : ""}
        <p>Cordialement,<br><strong>L'équipe BonoitecPilot</strong></p>
      </div>
    `),
  }),
};

// ─── SMTP Send ───────────────────────────────────────────────────────

async function sendSMTP(to: string, subject: string, html: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: Deno.env.get("SMTP_HOST") || "smtp.hostinger.com",
    port: Number(Deno.env.get("SMTP_PORT") || "587"),
    secure: false, // STARTTLS
    auth: {
      user: Deno.env.get("SMTP_USER") || "",
      pass: Deno.env.get("SMTP_PASS") || "",
    },
  });

  await transporter.sendMail({
    from: `"BonoitecPilot" <${Deno.env.get("SMTP_USER") || "noreply@bonoitecpilot.fr"}>`,
    to,
    replyTo: Deno.env.get("SMTP_REPLY_TO") || "contact@bonoitecpilot.fr",
    subject,
    html,
  });
}

// ─── Handler ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { template, to, data, organization_id, repair_id } = await req.json();

    if (!template || !to) {
      return new Response(
        JSON.stringify({ error: "template and to are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const templateFn = templates[template];
    if (!templateFn) {
      return new Response(
        JSON.stringify({ error: `Unknown template: ${template}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, html } = templateFn(data || {});

    let status = "sent";
    let errorMessage: string | null = null;

    try {
      await sendSMTP(to, subject, html);
    } catch (smtpError) {
      status = "failed";
      errorMessage = smtpError instanceof Error ? smtpError.message : "SMTP error";
      console.error("SMTP error:", errorMessage);
    }

    // Log the email
    if (organization_id) {
      await supabase.from("notification_logs").insert({
        organization_id,
        repair_id: repair_id || null,
        channel: "email",
        recipient: to,
        subject,
        body: html,
        status,
        error_message: errorMessage,
      });
    }

    if (status === "failed") {
      return new Response(
        JSON.stringify({ error: errorMessage, status: "failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, status: "sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Send email error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
