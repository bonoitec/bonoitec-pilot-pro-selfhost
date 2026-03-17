import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FROM_EMAIL = "BonoitecPilot <noreply@bonoitecpilot.fr>";
const REPLY_TO = "contact@app.bonoitecpilot.fr";

const BRAND = {
  primary: "#4338ca",
  primaryLight: "#eef2ff",
  foreground: "#1e293b",
  muted: "#64748b",
  background: "#f8fafc",
  white: "#ffffff",
  border: "#e2e8f0",
};

function emailLayout(content: string, preheader = "", orgContact?: { phone?: string; email?: string }): string {
  const footerLines: string[] = [];
  if (orgContact?.email) {
    footerLines.push(`<a href="mailto:${orgContact.email}" style="color:${BRAND.primary};text-decoration:none;">${orgContact.email}</a>`);
  }
  if (orgContact?.phone) {
    footerLines.push(orgContact.phone);
  }
  const contactLine = footerLines.length > 0
    ? footerLines.join(" &middot; ")
    : `<a href="mailto:contact@app.bonoitecpilot.fr" style="color:${BRAND.primary};text-decoration:none;">contact@app.bonoitecpilot.fr</a>`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>BonoitecPilot</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.background};font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  ${preheader ? `<div style="display:none;font-size:1px;color:${BRAND.background};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}&#847; &#847; &#847;</div>` : ""}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BRAND.background};padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="580" style="max-width:580px;width:100%;background-color:${BRAND.white};border-radius:12px;overflow:hidden;border:1px solid ${BRAND.border};">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND.primary};padding:28px 32px;text-align:center;">
              <h1 style="color:${BRAND.white};font-size:22px;font-weight:700;margin:0;letter-spacing:-0.3px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;">&#9889; BonoitecPilot</h1>
              <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:4px 0 0 0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;">Gestion professionnelle de r&eacute;parations</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td>
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:${BRAND.background};padding:24px 32px;text-align:center;border-top:1px solid ${BRAND.border};">
              <p style="color:${BRAND.muted};font-size:12px;line-height:1.6;margin:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;">
                BonoitecPilot &mdash; Votre atelier connect&eacute;<br />
                ${contactLine}
              </p>
              <p style="margin-top:12px;font-size:11px;color:#94a3b8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;">
                Cet email a &eacute;t&eacute; envoy&eacute; automatiquement. Merci de ne pas y r&eacute;pondre directement.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const BODY_STYLE = `padding:32px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;`;
const H2_STYLE = `color:${BRAND.foreground};font-size:20px;font-weight:700;margin:0 0 16px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;`;
const P_STYLE = `color:${BRAND.muted};font-size:14px;line-height:1.7;margin:0 0 14px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;`;
const INFO_BOX_STYLE = `background-color:${BRAND.primaryLight};border-radius:8px;padding:16px 20px;margin:20px 0;`;
const INFO_P_STYLE = `color:${BRAND.foreground};margin:4px 0;font-size:13px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;`;
const BTN_STYLE = `display:inline-block;background-color:${BRAND.primary};color:${BRAND.white};text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;margin:20px 0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;`;
const DIVIDER_STYLE = `border:none;border-top:1px solid ${BRAND.border};margin:24px 0;`;

const templates: Record<string, (data: Record<string, string>, orgContact?: { phone?: string; email?: string }) => { subject: string; html: string }> = {
  quote_ready: (d, oc) => ({
    subject: `Votre devis ${d.reference} est disponible`,
    html: emailLayout(`
      <div style="${BODY_STYLE}">
        <h2 style="${H2_STYLE}">&#128203; Votre devis est pr&ecirc;t</h2>
        <p style="${P_STYLE}">Bonjour ${d.clientName || ""},</p>
        <p style="${P_STYLE}">Nous avons pr&eacute;par&eacute; un devis pour la r&eacute;paration de votre appareil. Retrouvez les d&eacute;tails ci-dessous :</p>
        <div style="${INFO_BOX_STYLE}">
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">R&eacute;f&eacute;rence :</strong> ${d.reference}</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Appareil :</strong> ${d.device || "&mdash;"}</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Montant TTC :</strong> ${d.totalTTC || "&mdash;"} &euro;</p>
        </div>
        <p style="${P_STYLE}">Ce devis est valable 14 jours. N'h&eacute;sitez pas &agrave; nous contacter pour toute question.</p>
        <p style="${P_STYLE}">Cordialement,<br /><strong>L'&eacute;quipe BonoitecPilot</strong></p>
      </div>
    `, `Votre devis ${d.reference} est disponible`, oc),
  }),

  repair_completed: (d, oc) => ({
    subject: `Réparation ${d.reference} terminée — Appareil prêt`,
    html: emailLayout(`
      <div style="${BODY_STYLE}">
        <h2 style="${H2_STYLE}">&#9989; R&eacute;paration termin&eacute;e !</h2>
        <p style="${P_STYLE}">Bonjour ${d.clientName || ""},</p>
        <p style="${P_STYLE}">Bonne nouvelle ! La r&eacute;paration de votre appareil est termin&eacute;e et il est pr&ecirc;t &agrave; &ecirc;tre r&eacute;cup&eacute;r&eacute;.</p>
        <div style="${INFO_BOX_STYLE}">
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">R&eacute;f&eacute;rence :</strong> ${d.reference}</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Appareil :</strong> ${d.device || "&mdash;"}</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Statut :</strong> &#9989; Termin&eacute;e</p>
        </div>
        <p style="${P_STYLE}">Vous pouvez venir le r&eacute;cup&eacute;rer &agrave; notre atelier aux horaires d'ouverture.</p>
        ${d.trackingUrl ? `<a href="${d.trackingUrl}" style="${BTN_STYLE}">Suivre ma r&eacute;paration</a>` : ""}
        <p style="${P_STYLE}">Merci de votre confiance !<br /><strong>L'&eacute;quipe BonoitecPilot</strong></p>
      </div>
    `, `Votre réparation ${d.reference} est terminée`, oc),
  }),

  invoice_sent: (d, oc) => ({
    subject: `Facture ${d.reference} — BonoitecPilot`,
    html: emailLayout(`
      <div style="${BODY_STYLE}">
        <h2 style="${H2_STYLE}">&#129534; Votre facture</h2>
        <p style="${P_STYLE}">Bonjour ${d.clientName || ""},</p>
        <p style="${P_STYLE}">Veuillez trouver ci-dessous les informations relatives &agrave; votre facture :</p>
        <div style="${INFO_BOX_STYLE}">
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">N&deg; Facture :</strong> ${d.reference}</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Montant HT :</strong> ${d.totalHT || "&mdash;"} &euro;</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Montant TTC :</strong> ${d.totalTTC || "&mdash;"} &euro;</p>
          ${d.paymentMethod ? `<p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Paiement :</strong> ${d.paymentMethod}</p>` : ""}
        </div>
        <p style="${P_STYLE}">Pour toute question concernant cette facture, n'h&eacute;sitez pas &agrave; nous contacter.</p>
        <p style="${P_STYLE}">Cordialement,<br /><strong>L'&eacute;quipe BonoitecPilot</strong></p>
      </div>
    `, `Facture ${d.reference}`, oc),
  }),

  status_update: (d, oc) => ({
    subject: `Mise à jour — ${d.statusLabel || "Votre réparation"} (${d.reference})`,
    html: emailLayout(`
      <div style="${BODY_STYLE}">
        <h2 style="${H2_STYLE}">&#128276; ${d.statusLabel || "Mise &agrave; jour de r&eacute;paration"}</h2>
        <p style="${P_STYLE}">Bonjour ${d.clientName || ""},</p>
        <p style="${P_STYLE}">${d.message || "Le statut de votre r&eacute;paration a &eacute;t&eacute; mis &agrave; jour."}</p>
        <div style="${INFO_BOX_STYLE}">
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">R&eacute;f&eacute;rence :</strong> ${d.reference}</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Appareil :</strong> ${d.device || "&mdash;"}</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Nouveau statut :</strong> ${d.statusLabel || d.status || "&mdash;"}</p>
        </div>
        ${d.trackingUrl ? `<a href="${d.trackingUrl}" style="${BTN_STYLE}">Suivre ma r&eacute;paration</a>` : ""}
        ${d.googleReviewUrl ? `
        <hr style="${DIVIDER_STYLE}" />
        <p style="${P_STYLE}text-align:center;">&#11088; <strong>Votre avis compte beaucoup pour nous</strong></p>
        <p style="${P_STYLE}text-align:center;">Si vous &ecirc;tes satisfait de notre service, n'h&eacute;sitez pas &agrave; nous laisser un petit avis :</p>
        <p style="text-align:center;"><a href="${d.googleReviewUrl}" style="${BTN_STYLE}">Laisser un avis</a></p>
        ` : ""}
        <p style="${P_STYLE}">Cordialement,<br /><strong>L'&eacute;quipe BonoitecPilot</strong></p>
      </div>
    `, `Réparation ${d.reference} — ${d.statusLabel || "mise à jour"}`, oc),
  }),

  client_notification: (d, oc) => ({
    subject: d.subject || "Notification — BonoitecPilot",
    html: emailLayout(`
      <div style="${BODY_STYLE}">
        <h2 style="${H2_STYLE}">&#128236; ${d.subject || "Message"}</h2>
        <p style="${P_STYLE}">Bonjour ${d.clientName || ""},</p>
        <p style="${P_STYLE}">${d.message || ""}</p>
        ${d.trackingUrl ? `<a href="${d.trackingUrl}" style="${BTN_STYLE}">Acc&eacute;der &agrave; mon espace</a>` : ""}
        <p style="${P_STYLE}">Cordialement,<br /><strong>L'&eacute;quipe BonoitecPilot</strong></p>
      </div>
    `, "", oc),
  }),

  welcome_signup: (d, oc) => ({
    subject: "Bienvenue sur BonoitecPilot — Votre compte a bien été créé ✅",
    html: emailLayout(`
      <div style="${BODY_STYLE}">
        <h2 style="${H2_STYLE}">&#127881; Bienvenue sur BonoitecPilot !</h2>
        <p style="${P_STYLE}">Bonjour ${d.clientName || ""},</p>
        <p style="${P_STYLE}">Votre inscription a bien &eacute;t&eacute; prise en compte. Nous sommes ravis de vous accueillir sur notre plateforme de gestion professionnelle pour ateliers de r&eacute;paration.</p>
        <div style="${INFO_BOX_STYLE}">
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">&#9989; Votre compte est actif</strong></p>
          <p style="${INFO_P_STYLE}">Vous b&eacute;n&eacute;ficiez d'un essai gratuit de 30 jours avec acc&egrave;s complet &agrave; toutes les fonctionnalit&eacute;s.</p>
        </div>
        <p style="${P_STYLE}">Vous pouvez d&egrave;s &agrave; pr&eacute;sent :</p>
        <p style="${P_STYLE}">&bull; Cr&eacute;er vos premiers clients et appareils<br />&bull; Enregistrer des r&eacute;parations<br />&bull; G&eacute;n&eacute;rer des devis et factures<br />&bull; G&eacute;rer votre stock de pi&egrave;ces</p>
        <a href="https://bonoitec-pilot-pro.lovable.app/dashboard" style="${BTN_STYLE}">Acc&eacute;der &agrave; mon tableau de bord</a>
        <hr style="${DIVIDER_STYLE}" />
        <p style="${P_STYLE}">Si vous avez la moindre question, n'h&eacute;sitez pas &agrave; nous contacter. Nous sommes l&agrave; pour vous accompagner.</p>
        <p style="${P_STYLE}">&Agrave; tr&egrave;s vite,<br /><strong>L'&eacute;quipe BonoitecPilot</strong></p>
      </div>
    `, "Bienvenue ! Votre compte BonoitecPilot est prêt.", oc),
  }),

  repair_created: (d, oc) => ({
    subject: `Réparation enregistrée — ${d.reference}`,
    html: emailLayout(`
      <div style="${BODY_STYLE}">
        <h2 style="${H2_STYLE}">&#128241; Votre r&eacute;paration a &eacute;t&eacute; enregistr&eacute;e</h2>
        <p style="${P_STYLE}">Bonjour ${d.clientName || ""},</p>
        <p style="${P_STYLE}">Nous avons bien enregistr&eacute; votre demande de r&eacute;paration. Voici les d&eacute;tails :</p>
        <div style="${INFO_BOX_STYLE}">
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">R&eacute;f&eacute;rence :</strong> ${d.reference}</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Appareil :</strong> ${d.device || "&mdash;"}</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Probl&egrave;me :</strong> ${d.issue || "&mdash;"}</p>
          ${d.estimatedDelay ? `<p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">&#9201; ${d.estimatedDelay}</strong></p>` : ""}
        </div>
        <p style="${P_STYLE}">Vous pouvez suivre l'avancement de votre r&eacute;paration en temps r&eacute;el gr&acirc;ce au lien ci-dessous :</p>
        ${d.trackingUrl ? `<a href="${d.trackingUrl}" style="${BTN_STYLE}">Suivre ma r&eacute;paration</a>` : ""}
        <p style="${P_STYLE}">Nous vous tiendrons inform&eacute;(e) &agrave; chaque &eacute;tape.</p>
        <p style="${P_STYLE}">Cordialement,<br /><strong>L'&eacute;quipe BonoitecPilot</strong></p>
      </div>
    `, `Réparation ${d.reference} enregistrée — suivez son avancement`, oc),
  }),

  login_alert: (d, oc) => ({
    subject: "🔐 Connexion détectée sur votre compte BonoitecPilot",
    html: emailLayout(`
      <div style="${BODY_STYLE}">
        <h2 style="${H2_STYLE}">&#128274; Connexion &agrave; votre compte</h2>
        <p style="${P_STYLE}">Bonjour ${d.clientName || ""},</p>
        <p style="${P_STYLE}">Une connexion &agrave; votre compte BonoitecPilot a &eacute;t&eacute; d&eacute;tect&eacute;e.</p>
        <div style="${INFO_BOX_STYLE}">
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">&#128197; Date et heure :</strong> ${d.loginTime || new Date().toLocaleString("fr-FR")}</p>
        </div>
        <p style="${P_STYLE}"><strong>Si c'&eacute;tait bien vous</strong>, aucune action n'est n&eacute;cessaire. Vous pouvez ignorer cet e-mail.</p>
        <p style="${P_STYLE}"><strong>Si ce n'&eacute;tait pas vous</strong>, nous vous recommandons de :</p>
        <p style="${P_STYLE}">&bull; Changer imm&eacute;diatement votre mot de passe<br />&bull; V&eacute;rifier les appareils connect&eacute;s &agrave; votre compte<br />&bull; Nous contacter rapidement</p>
        <hr style="${DIVIDER_STYLE}" />
        <p style="font-size:12px;color:${BRAND.muted};font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;">Cet e-mail est envoy&eacute; automatiquement &agrave; chaque connexion pour garantir la s&eacute;curit&eacute; de votre compte.</p>
        <p style="${P_STYLE}">Cordialement,<br /><strong>L'&eacute;quipe BonoitecPilot</strong></p>
      </div>
    `, "Une connexion a été détectée sur votre compte", oc),
  }),
};

// ─── Resend Send ────────────────────────────────────────────────────

async function sendResend(to: string, subject: string, html: string, attachments?: Array<{ filename: string; content: string }>, replyTo?: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const payload: Record<string, unknown> = {
    from: FROM_EMAIL,
    to: [to],
    reply_to: replyTo || REPLY_TO,
    subject,
    html,
  };

  if (attachments && Array.isArray(attachments) && attachments.length > 0) {
    payload.attachments = attachments.map((a: { filename: string; content: string }) => ({
      filename: a.filename,
      content: a.content,
    }));
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Resend error (${res.status}): ${body}`);
  }
}

// ─── Handler ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ── Authentication check ──────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // ── Parse request body ────────────────────────────────────────
    const supabase = createClient(supabaseUrl, serviceKey);

    const { template, to, data, organization_id, repair_id, attachments } = await req.json();

    if (!template || !to) {
      return new Response(
        JSON.stringify({ error: "template and to are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Resolve tenant context from authenticated user (source of truth) ──
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("user_id", userId)
      .single();

    if (!profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: "Forbidden: no organization context" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const effectiveOrgId = profile.organization_id;

    // Optional payload org must match authenticated org
    if (organization_id && organization_id !== effectiveOrgId) {
      return new Response(
        JSON.stringify({ error: "Forbidden: organization mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If a repair is provided, it must belong to the same organization
    if (repair_id) {
      const { data: repair } = await supabase
        .from("repairs")
        .select("id, organization_id")
        .eq("id", repair_id)
        .single();

      if (!repair || repair.organization_id !== effectiveOrgId) {
        return new Response(
          JSON.stringify({ error: "Forbidden: repair organization mismatch" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const templateFn = templates[template];
    if (!templateFn) {
      return new Response(
        JSON.stringify({ error: `Unknown template: ${template}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch organization contact info for dynamic footer
    let orgContact: { phone?: string; email?: string } | undefined;
    const { data: orgData } = await supabase
      .from("organizations")
      .select("phone, email")
      .eq("id", effectiveOrgId)
      .single();

    if (orgData && (orgData.phone || orgData.email)) {
      orgContact = { phone: orgData.phone || undefined, email: orgData.email || undefined };
    }

    const { subject, html } = templateFn(data || {}, orgContact);

    let status = "sent";
    let errorMessage: string | null = null;

    try {
      await sendResend(to, subject, html, attachments);
    } catch (sendError) {
      status = "failed";
      errorMessage = sendError instanceof Error ? sendError.message : "Resend error";
      console.error("Resend error:", errorMessage);
    }

    // Log the email in the authenticated user's organization only
    await supabase.from("notification_logs").insert({
      organization_id: effectiveOrgId,
      repair_id: repair_id || null,
      channel: "email",
      recipient: to,
      subject,
      body: html,
      status,
      error_message: errorMessage,
    });
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
