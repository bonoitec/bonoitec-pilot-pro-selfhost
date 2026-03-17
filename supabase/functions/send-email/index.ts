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

const templates: Record<string, (data: Record<string, string>, orgContact?: { phone?: string; email?: string }) => { subject: string; html: string }> = {
  quote_ready: (d, oc) => ({
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
        <p>Ce devis est valable 14 jours. N'hésitez pas à nous contacter pour toute question.</p>
        <p>Cordialement,<br><strong>L'équipe BonoitecPilot</strong></p>
      </div>
    `, `Votre devis ${d.reference} est disponible`, oc),
  }),

  repair_completed: (d, oc) => ({
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
    `, `Votre réparation ${d.reference} est terminée`, oc),
  }),

  invoice_sent: (d, oc) => ({
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
    `, `Facture ${d.reference}`, oc),
  }),

  status_update: (d, oc) => ({
    subject: `Mise à jour — ${d.statusLabel || "Votre réparation"} (${d.reference})`,
    html: emailLayout(`
      <div class="body">
        <h2>🔔 ${d.statusLabel || "Mise à jour de réparation"}</h2>
        <p>Bonjour ${d.clientName || ""},</p>
        <p>${d.message || "Le statut de votre réparation a été mis à jour."}</p>
        <div class="info-box">
          <p><strong>Référence :</strong> ${d.reference}</p>
          <p><strong>Appareil :</strong> ${d.device || "—"}</p>
          <p><strong>Nouveau statut :</strong> ${d.statusLabel || d.status || "—"}</p>
        </div>
        ${d.trackingUrl ? `<a href="${d.trackingUrl}" class="btn">Suivre ma réparation</a>` : ""}
        ${d.googleReviewUrl ? `
        <hr class="divider">
        <p style="text-align:center;">⭐ <strong>Votre avis compte beaucoup pour nous</strong></p>
        <p style="text-align:center;">Si vous êtes satisfait de notre service, n'hésitez pas à nous laisser un petit avis :</p>
        <p style="text-align:center;"><a href="${d.googleReviewUrl}" class="btn" style="background:${BRAND.primary};">Laisser un avis</a></p>
        ` : ""}
        <p>Cordialement,<br><strong>L'équipe BonoitecPilot</strong></p>
      </div>
    `, `Réparation ${d.reference} — ${d.statusLabel || "mise à jour"}`, oc),
  }),

  client_notification: (d, oc) => ({
    subject: d.subject || "Notification — BonoitecPilot",
    html: emailLayout(`
      <div class="body">
        <h2>📬 ${d.subject || "Message"}</h2>
        <p>Bonjour ${d.clientName || ""},</p>
        <p>${d.message || ""}</p>
        ${d.trackingUrl ? `<a href="${d.trackingUrl}" class="btn">Accéder à mon espace</a>` : ""}
        <p>Cordialement,<br><strong>L'équipe BonoitecPilot</strong></p>
      </div>
    `, "", oc),
  }),

  welcome_signup: (d, oc) => ({
    subject: "Bienvenue sur BonoitecPilot — Votre compte a bien été créé ✅",
    html: emailLayout(`
      <div class="body">
        <h2>🎉 Bienvenue sur BonoitecPilot !</h2>
        <p>Bonjour ${d.clientName || ""},</p>
        <p>Votre inscription a bien été prise en compte. Nous sommes ravis de vous accueillir sur notre plateforme de gestion professionnelle pour ateliers de réparation.</p>
        <div class="info-box">
          <p><strong>✅ Votre compte est actif</strong></p>
          <p>Vous bénéficiez d'un essai gratuit de 30 jours avec accès complet à toutes les fonctionnalités.</p>
        </div>
        <p>Vous pouvez dès à présent :</p>
        <p>• Créer vos premiers clients et appareils<br>• Enregistrer des réparations<br>• Générer des devis et factures<br>• Gérer votre stock de pièces</p>
        <a href="https://bonoitec-pilot-pro.lovable.app/dashboard" class="btn">Accéder à mon tableau de bord</a>
        <hr class="divider">
        <p>Si vous avez la moindre question, n'hésitez pas à nous contacter. Nous sommes là pour vous accompagner.</p>
        <p>À très vite,<br><strong>L'équipe BonoitecPilot</strong></p>
      </div>
    `, "Bienvenue ! Votre compte BonoitecPilot est prêt.", oc),
  }),

  repair_created: (d, oc) => ({
    subject: `Réparation enregistrée — ${d.reference}`,
    html: emailLayout(`
      <div class="body">
        <h2>📱 Votre réparation a été enregistrée</h2>
        <p>Bonjour ${d.clientName || ""},</p>
        <p>Nous avons bien enregistré votre demande de réparation. Voici les détails :</p>
        <div class="info-box">
          <p><strong>Référence :</strong> ${d.reference}</p>
          <p><strong>Appareil :</strong> ${d.device || "—"}</p>
          <p><strong>Problème :</strong> ${d.issue || "—"}</p>
          ${d.estimatedDelay ? `<p><strong>⏱ ${d.estimatedDelay}</strong></p>` : ""}
        </div>
        <p>Vous pouvez suivre l'avancement de votre réparation en temps réel grâce au lien ci-dessous :</p>
        ${d.trackingUrl ? `<a href="${d.trackingUrl}" class="btn">Suivre ma réparation</a>` : ""}
        <p>Nous vous tiendrons informé(e) à chaque étape.</p>
        <p>Cordialement,<br><strong>L'équipe BonoitecPilot</strong></p>
      </div>
    `, `Réparation ${d.reference} enregistrée — suivez son avancement`, oc),
  }),

  login_alert: (d, oc) => ({
    subject: "🔐 Connexion détectée sur votre compte BonoitecPilot",
    html: emailLayout(`
      <div class="body">
        <h2>🔐 Connexion à votre compte</h2>
        <p>Bonjour ${d.clientName || ""},</p>
        <p>Une connexion à votre compte BonoitecPilot a été détectée.</p>
        <div class="info-box">
          <p><strong>📅 Date et heure :</strong> ${d.loginTime || new Date().toLocaleString("fr-FR")}</p>
        </div>
        <p><strong>Si c'était bien vous</strong>, aucune action n'est nécessaire. Vous pouvez ignorer cet e-mail.</p>
        <p><strong>Si ce n'était pas vous</strong>, nous vous recommandons de :</p>
        <p>• Changer immédiatement votre mot de passe<br>• Vérifier les appareils connectés à votre compte<br>• Nous contacter rapidement</p>
        <hr class="divider">
        <p style="font-size:12px;color:${BRAND.muted};">Cet e-mail est envoyé automatiquement à chaque connexion pour garantir la sécurité de votre compte.</p>
        <p>Cordialement,<br><strong>L'équipe BonoitecPilot</strong></p>
      </div>
    `, "Une connexion a été détectée sur votre compte", oc),
  }),
};

// ─── Resend Send ────────────────────────────────────────────────────

async function sendResend(to: string, subject: string, html: string, attachments?: Array<{ filename: string; content: string }>): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const payload: Record<string, unknown> = {
    from: FROM_EMAIL,
    to: [to],
    reply_to: REPLY_TO,
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
