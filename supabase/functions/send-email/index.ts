import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { readJsonWithLimit, extractBearerToken } from "../_shared/limits.ts";

const FROM_EMAIL = "BonoitecPilot <noreply@bonoitecpilot.fr>";
const REPLY_TO = "contact@app.bonoitecpilot.fr";
const APP_URL = Deno.env.get("APP_URL") ?? "https://bonoitecpilot.fr";

const BRAND = {
  primary: "#5B4BE9",       // brand violet (matches PDFs + website)
  primaryDark: "#4A3CD8",   // for the gradient bottom on the banner
  primaryLight: "#EDE9FE",
  foreground: "#0F172A",
  foregroundSoft: "#151B2E",
  inkElevated: "#1E1B4B",
  muted: "#64748B",
  background: "#F8FAFC",
  white: "#FFFFFF",
  border: "#E2E8F0",
};

// ── Security helpers ────────────────────────────────────────────────────

// HTML escape — applied to ALL user/org-controlled values inside templates.
function esc(s: unknown): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// URL validator: only allow http/https URLs in href attributes (no javascript:, data:, etc.)
function safeUrl(u: unknown): string {
  if (!u || typeof u !== "string") return "";
  const trimmed = u.trim();
  if (!/^https?:\/\//i.test(trimmed)) return "";
  return esc(trimmed);
}

// Email validator — RFC-ish + reject CR/LF (header injection guard)
const EMAIL_RE = /^[^\s@<>"'\\]+@[^\s@<>"'\\]+\.[^\s@<>"'\\]+$/;
function isValidEmail(s: unknown): s is string {
  if (typeof s !== "string") return false;
  if (s.length === 0 || s.length > 254) return false;
  if (/[\r\n\t]/.test(s)) return false;
  return EMAIL_RE.test(s);
}

const maskEmail = (e: string) => e.replace(/(.{2})(.*)(@.*)/, "$1***$3");

function emailLayout(
  content: string,
  preheader = "",
  orgContact?: { name?: string; phone?: string; email?: string },
  _unused: boolean = true,
): string {
  const escapedName = orgContact?.name ? esc(orgContact.name) : "";
  const escapedEmail = orgContact?.email ? esc(orgContact.email) : "";
  const escapedPhone = orgContact?.phone ? esc(orgContact.phone) : "";
  const hasShopContact = Boolean(escapedName || escapedEmail || escapedPhone);

  // Contact line: email · phone (middot-separated)
  const contactLineItems: string[] = [];
  if (escapedEmail) {
    contactLineItems.push(
      `<a href="mailto:${escapedEmail}" style="color:${BRAND.primary};text-decoration:none;font-weight:600;">${escapedEmail}</a>`,
    );
  }
  if (escapedPhone) {
    contactLineItems.push(`<span style="color:${BRAND.muted};">${escapedPhone}</span>`);
  }
  const contactLine = contactLineItems.join(' <span style="color:#cbd5e1;">&middot;</span> ');

  // Hero shop block: shown in footer so the client knows exactly who repaired their phone
  const shopHero = hasShopContact
    ? `
      ${escapedName ? `<p style="margin:0 0 6px 0;color:${BRAND.foreground};font-size:16px;font-weight:700;letter-spacing:-0.2px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;">${escapedName}</p>` : ""}
      ${contactLine ? `<p style="margin:0 0 18px 0;font-size:13px;line-height:1.6;font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;">${contactLine}</p>` : ""}
      <hr style="border:none;border-top:1px solid ${BRAND.border};margin:0 auto 16px;max-width:160px;" />
    `
    : "";

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
  ${preheader ? `<div style="display:none;font-size:1px;color:${BRAND.background};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${esc(preheader)}&#847; &#847; &#847;</div>` : ""}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BRAND.background};padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="580" style="max-width:580px;width:100%;background-color:${BRAND.white};border-radius:12px;overflow:hidden;border:1px solid ${BRAND.border};">
          <!-- Top brand-violet accent stripe -->
          <tr>
            <td bgcolor="${BRAND.primary}" style="background-color:${BRAND.primary};height:5px;line-height:5px;font-size:0;">&nbsp;</td>
          </tr>
          <!-- Header: clean white banner with full-color BonoitecPilot wordmark + tagline -->
          <tr>
            <td bgcolor="${BRAND.white}" style="background-color:${BRAND.white};padding:0;text-align:center;border-bottom:1px solid ${BRAND.border};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;width:100%;max-width:460px;">
                <tr>
                  <td align="center" style="padding:42px 28px 10px;line-height:0;">
                    <img src="https://bonoitecpilot.fr/email-logo.png?v=8" width="260" alt="BonoitecPilot" style="display:block;border:0;outline:none;text-decoration:none;width:260px;max-width:100%;height:auto;margin:0 auto;" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:14px 28px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                      <tr>
                        <td bgcolor="${BRAND.primary}" style="width:60px;height:3px;background-color:${BRAND.primary};line-height:3px;font-size:0;border-radius:3px;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:12px 28px 32px;">
                    <p style="margin:0;color:${BRAND.muted};font-size:11px;line-height:1.6;letter-spacing:1.2px;text-transform:uppercase;font-weight:600;font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;">Gestion professionnelle de r&eacute;parations</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td>
              ${content}
            </td>
          </tr>
          <!-- Footer: shop-hero block, then subtle BonoitecPilot attribution -->
          <tr>
            <td style="background-color:${BRAND.background};padding:32px 32px 24px;text-align:center;border-top:1px solid ${BRAND.border};">
              ${shopHero}
              <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;">
                Envoy&eacute; via <a href="https://bonoitecpilot.fr" style="color:${BRAND.muted};text-decoration:none;font-weight:600;">BonoitecPilot</a>
              </p>
              <p style="margin:4px 0 0 0;color:#cbd5e1;font-size:10px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;">
                Email automatique &mdash; merci de ne pas r&eacute;pondre directement
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

const templates: Record<string, (data: Record<string, string>, orgContact?: { name?: string; phone?: string; email?: string }) => { subject: string; html: string }> = {
  quote_ready: (d, oc) => ({
    subject: `Votre devis ${esc(d.reference)} est disponible`,
    html: emailLayout(`
      <div style="${BODY_STYLE}">
        <h2 style="${H2_STYLE}">&#128203; Votre devis est pr&ecirc;t</h2>
        <p style="${P_STYLE}">Bonjour ${esc(d.clientName) || ""},</p>
        <p style="${P_STYLE}">Nous avons pr&eacute;par&eacute; un devis pour la r&eacute;paration de votre appareil. Retrouvez les d&eacute;tails ci-dessous :</p>
        <div style="${INFO_BOX_STYLE}">
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">R&eacute;f&eacute;rence :</strong> ${esc(d.reference)}</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Appareil :</strong> ${esc(d.device) || "&mdash;"}</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Montant TTC :</strong> ${esc(d.totalTTC) || "&mdash;"} &euro;</p>
        </div>
        <p style="${P_STYLE}">Ce devis est valable 14 jours. N'h&eacute;sitez pas &agrave; nous contacter pour toute question.</p>
        <p style="${P_STYLE}">Cordialement,<br /><strong>L&rsquo;&eacute;quipe BonoitecPilot</strong></p>
      </div>
    `, `Votre devis ${d.reference} est disponible`, oc, true),
  }),

  repair_completed: (d, oc) => ({
    subject: `Réparation ${esc(d.reference)} terminée — Appareil prêt`,
    html: emailLayout(`
      <div style="${BODY_STYLE}">
        <h2 style="${H2_STYLE}">&#9989; R&eacute;paration termin&eacute;e !</h2>
        <p style="${P_STYLE}">Bonjour ${esc(d.clientName) || ""},</p>
        <p style="${P_STYLE}">Bonne nouvelle ! La r&eacute;paration de votre appareil est termin&eacute;e et il est pr&ecirc;t &agrave; &ecirc;tre r&eacute;cup&eacute;r&eacute;.</p>
        <div style="${INFO_BOX_STYLE}">
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">R&eacute;f&eacute;rence :</strong> ${esc(d.reference)}</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Appareil :</strong> ${esc(d.device) || "&mdash;"}</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Statut :</strong> &#9989; Termin&eacute;e</p>
        </div>
        <p style="${P_STYLE}">Vous pouvez venir le r&eacute;cup&eacute;rer &agrave; notre atelier aux horaires d'ouverture.</p>
        ${safeUrl(d.trackingUrl) ? `<a href="${safeUrl(d.trackingUrl)}" style="${BTN_STYLE}">Suivre ma r&eacute;paration</a>` : ""}
        <p style="${P_STYLE}">Merci de votre confiance !<br /><strong>L&rsquo;&eacute;quipe BonoitecPilot</strong></p>
      </div>
    `, `Votre réparation ${d.reference} est terminée`, oc, true),
  }),

  invoice_sent: (d, oc) => ({
    subject: `Facture ${esc(d.reference)} — BonoitecPilot`,
    html: emailLayout(`
      <div style="${BODY_STYLE}">
        <h2 style="${H2_STYLE}">&#129534; Votre facture</h2>
        <p style="${P_STYLE}">Bonjour ${esc(d.clientName) || ""},</p>
        <p style="${P_STYLE}">Veuillez trouver ci-dessous les informations relatives &agrave; votre facture :</p>
        <div style="${INFO_BOX_STYLE}">
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">N&deg; Facture :</strong> ${esc(d.reference)}</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Montant HT :</strong> ${esc(d.totalHT) || "&mdash;"} &euro;</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Montant TTC :</strong> ${esc(d.totalTTC) || "&mdash;"} &euro;</p>
          ${d.paymentMethod ? `<p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Paiement :</strong> ${esc(d.paymentMethod)}</p>` : ""}
        </div>
        <p style="${P_STYLE}">Pour toute question concernant cette facture, n'h&eacute;sitez pas &agrave; nous contacter.</p>
        <p style="${P_STYLE}">Cordialement,<br /><strong>L&rsquo;&eacute;quipe BonoitecPilot</strong></p>
      </div>
    `, `Facture ${d.reference}`, oc, true),
  }),

  status_update: (d, oc) => ({
    subject: `Mise à jour — ${esc(d.statusLabel) || "Votre réparation"} (${esc(d.reference)})`,
    html: emailLayout(`
      <div style="${BODY_STYLE}">
        <h2 style="${H2_STYLE}">&#128276; ${esc(d.statusLabel) || "Mise &agrave; jour de r&eacute;paration"}</h2>
        <p style="${P_STYLE}">Bonjour ${esc(d.clientName) || ""},</p>
        <p style="${P_STYLE}">${esc(d.message) || "Le statut de votre r&eacute;paration a &eacute;t&eacute; mis &agrave; jour."}</p>
        <div style="${INFO_BOX_STYLE}">
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">R&eacute;f&eacute;rence :</strong> ${esc(d.reference)}</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Appareil :</strong> ${esc(d.device) || "&mdash;"}</p>
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Nouveau statut :</strong> ${esc(d.statusLabel) || esc(d.status) || "&mdash;"}</p>
        </div>
        ${safeUrl(d.trackingUrl) ? `<a href="${safeUrl(d.trackingUrl)}" style="${BTN_STYLE}">Suivre ma r&eacute;paration</a>` : ""}
        ${safeUrl(d.googleReviewUrl) ? `
        <hr style="${DIVIDER_STYLE}" />
        <p style="${P_STYLE}text-align:center;">&#11088; <strong>Votre avis compte beaucoup pour nous</strong></p>
        <p style="${P_STYLE}text-align:center;">Si vous &ecirc;tes satisfait de notre service, n'h&eacute;sitez pas &agrave; nous laisser un petit avis :</p>
        <p style="text-align:center;"><a href="${safeUrl(d.googleReviewUrl)}" style="${BTN_STYLE}">Laisser un avis</a></p>
        ` : ""}
        <p style="${P_STYLE}">Cordialement,<br /><strong>L&rsquo;&eacute;quipe BonoitecPilot</strong></p>
      </div>
    `, `Réparation ${d.reference} — ${d.statusLabel || "mise à jour"}`, oc, true),
  }),

  client_notification: (d, oc) => ({
    subject: esc(d.subject) || "Notification — BonoitecPilot",
    html: emailLayout(`
      <div style="${BODY_STYLE}">
        <h2 style="${H2_STYLE}">&#128236; ${esc(d.subject) || "Message"}</h2>
        <p style="${P_STYLE}">Bonjour ${esc(d.clientName) || ""},</p>
        <p style="${P_STYLE}">${esc(d.message) || ""}</p>
        ${safeUrl(d.trackingUrl) ? `<a href="${safeUrl(d.trackingUrl)}" style="${BTN_STYLE}">Acc&eacute;der &agrave; mon espace</a>` : ""}
        <p style="${P_STYLE}">Cordialement,<br /><strong>L&rsquo;&eacute;quipe BonoitecPilot</strong></p>
      </div>
    `, "", oc, true),
  }),

  // Platform-facing (sent to the shop owner, not to their clients)
  welcome_signup: (d, oc) => ({
    subject: "Bienvenue sur BonoitecPilot — Votre compte a bien été créé ✅",
    html: emailLayout(`
      <div style="${BODY_STYLE}">
        <h2 style="${H2_STYLE}">&#127881; Bienvenue sur BonoitecPilot !</h2>
        <p style="${P_STYLE}">Bonjour ${esc(d.clientName) || ""},</p>
        <p style="${P_STYLE}">Votre inscription a bien &eacute;t&eacute; prise en compte. Nous sommes ravis de vous accueillir sur notre plateforme de gestion professionnelle pour ateliers de r&eacute;paration.</p>
        <div style="${INFO_BOX_STYLE}">
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">&#9989; Votre compte est actif</strong></p>
          <p style="${INFO_P_STYLE}">Vous b&eacute;n&eacute;ficiez d'un essai gratuit de 14 jours avec acc&egrave;s complet &agrave; toutes les fonctionnalit&eacute;s.</p>
        </div>
        <p style="${P_STYLE}">Vous pouvez d&egrave;s &agrave; pr&eacute;sent :</p>
        <p style="${P_STYLE}">&bull; Cr&eacute;er vos premiers clients et appareils<br />&bull; Enregistrer des r&eacute;parations<br />&bull; G&eacute;n&eacute;rer des devis et factures<br />&bull; G&eacute;rer votre stock de pi&egrave;ces</p>
        <a href="${esc(APP_URL)}/dashboard" style="${BTN_STYLE}">Acc&eacute;der &agrave; mon tableau de bord</a>
        <hr style="${DIVIDER_STYLE}" />
        <p style="${P_STYLE}">Si vous avez la moindre question, n'h&eacute;sitez pas &agrave; nous contacter. Nous sommes l&agrave; pour vous accompagner.</p>
        <p style="${P_STYLE}">&Agrave; tr&egrave;s vite,<br /><strong>L'&eacute;quipe BonoitecPilot</strong></p>
      </div>
    `, "Bienvenue ! Votre compte BonoitecPilot est prêt.", oc, false),
  }),

  // Client-facing
  repair_created: (d, oc) => {
    const url = safeUrl(d.trackingUrl);
    // QR code generated via qrserver.com — opens the link in the phone's
    // native browser (Safari/Chrome) when scanned, bypassing Gmail/Outlook
    // in-app webviews that can break React + Supabase realtime apps.
    const qr = url
      ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(url)}`
      : "";
    return {
      subject: `Réparation enregistrée — ${esc(d.reference)}`,
      html: emailLayout(`
        <div style="${BODY_STYLE}">
          <h2 style="${H2_STYLE}">&#128241; Votre r&eacute;paration a &eacute;t&eacute; enregistr&eacute;e</h2>
          <p style="${P_STYLE}">Bonjour ${esc(d.clientName) || ""},</p>
          <p style="${P_STYLE}">Nous avons bien enregistr&eacute; votre demande de r&eacute;paration. Voici les d&eacute;tails :</p>
          <div style="${INFO_BOX_STYLE}">
            <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">R&eacute;f&eacute;rence :</strong> ${esc(d.reference)}</p>
            <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Appareil :</strong> ${esc(d.device) || "&mdash;"}</p>
            <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">Probl&egrave;me :</strong> ${esc(d.issue) || "&mdash;"}</p>
            ${d.estimatedDelay ? `<p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">&#9201; ${esc(d.estimatedDelay)}</strong></p>` : ""}
          </div>
          ${url ? `
            <p style="${P_STYLE}">Suivez l&#39;avancement de votre r&eacute;paration en temps r&eacute;el :</p>
            <div style="text-align:center;margin:24px 0;padding:20px;background:#f8f9fc;border-radius:12px;border:1px solid #e5e7ef;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.muted};">Scannez avec votre t&eacute;l&eacute;phone</p>
              <p style="margin:0 0 16px;font-size:11px;color:${BRAND.muted};">(ou cliquez sur le bouton ci-dessous)</p>
              <img src="${esc(qr)}" alt="QR code de suivi" width="180" height="180" style="display:inline-block;border-radius:8px;background:#fff;padding:8px;" />
              <p style="margin:14px 0 0;font-size:11px;color:${BRAND.muted};">Code de suivi&nbsp;: <strong style="color:${BRAND.primary};font-family:ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:0.05em;">${esc(d.trackingCode) || ""}</strong></p>
            </div>
            <a href="${url}" style="${BTN_STYLE}">Suivre ma r&eacute;paration</a>
            <p style="margin:12px 0 0;font-size:12px;color:${BRAND.muted};text-align:center;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:<br /><a href="${url}" style="color:${BRAND.primary};word-break:break-all;">${url}</a></p>
          ` : ""}
          <p style="${P_STYLE}">Nous vous tiendrons inform&eacute;(e) &agrave; chaque &eacute;tape.</p>
          <p style="${P_STYLE}">Cordialement,<br /><strong>L&rsquo;&eacute;quipe BonoitecPilot</strong></p>
        </div>
      `, `Réparation ${d.reference} enregistrée — suivez son avancement`, oc, true),
    };
  },

  // Platform-facing
  login_alert: (d, oc) => ({
    subject: "🔐 Connexion détectée sur votre compte BonoitecPilot",
    html: emailLayout(`
      <div style="${BODY_STYLE}">
        <h2 style="${H2_STYLE}">&#128274; Connexion &agrave; votre compte</h2>
        <p style="${P_STYLE}">Bonjour ${esc(d.clientName) || ""},</p>
        <p style="${P_STYLE}">Une connexion &agrave; votre compte BonoitecPilot a &eacute;t&eacute; d&eacute;tect&eacute;e.</p>
        <div style="${INFO_BOX_STYLE}">
          <p style="${INFO_P_STYLE}"><strong style="color:${BRAND.primary};">&#128197; Date et heure :</strong> ${esc(d.loginTime) || new Date().toLocaleString("fr-FR")}</p>
        </div>
        <p style="${P_STYLE}"><strong>Si c'&eacute;tait bien vous</strong>, aucune action n'est n&eacute;cessaire. Vous pouvez ignorer cet e-mail.</p>
        <p style="${P_STYLE}"><strong>Si ce n'&eacute;tait pas vous</strong>, nous vous recommandons de :</p>
        <p style="${P_STYLE}">&bull; Changer imm&eacute;diatement votre mot de passe<br />&bull; V&eacute;rifier les appareils connect&eacute;s &agrave; votre compte<br />&bull; Nous contacter rapidement</p>
        <hr style="${DIVIDER_STYLE}" />
        <p style="font-size:12px;color:${BRAND.muted};font-family:'Segoe UI',Tahoma,Geneva,Verdana,Arial,sans-serif;">Cet e-mail est envoy&eacute; automatiquement &agrave; chaque connexion pour garantir la s&eacute;curit&eacute; de votre compte.</p>
        <p style="${P_STYLE}">Cordialement,<br /><strong>L'&eacute;quipe BonoitecPilot</strong></p>
      </div>
    `, "Une connexion a été détectée sur votre compte", oc, false),
  }),
};


// ─── Resend Send ────────────────────────────────────────────────────

async function sendResend(to: string, subject: string, html: string, attachments?: Array<{ filename: string; content: string }>, replyTo?: string, fromName?: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  // Reply-to also needs validation against header injection
  const safeReplyTo = isValidEmail(replyTo) ? replyTo : REPLY_TO;

  // Strip characters that could inject extra headers or break the From line,
  // then clamp length to a reasonable display width. Always ship on the
  // DKIM-verified domain — only the display name is dynamic.
  const safeFromName = fromName
    ? String(fromName).replace(/[<>"\r\n\t]/g, "").trim().slice(0, 60)
    : "";
  const fromHeader = safeFromName
    ? `${safeFromName} <noreply@bonoitecpilot.fr>`
    : FROM_EMAIL;

  // C3-extended: strip CR/LF from subject to prevent header injection via user-controlled
  // fields (e.g. d.reference) that flow into template subject lines.
  const safeSubject = String(subject).replace(/[\r\n\t]/g, " ").slice(0, 998);

  const payload: Record<string, unknown> = {
    from: fromHeader,
    to: [to],
    reply_to: safeReplyTo,
    subject: safeSubject,
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
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ── Authentication check ──────────────────────────────────────
    const token = extractBearerToken(req.headers.get("Authorization"));
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userId = claimsData.claims.sub as string;

    // ── Parse request body (size-limited; allow up to 15MB for attachments) ──
    const supabase = createClient(supabaseUrl, serviceKey);
    const { template, to, data, organization_id, repair_id, attachments } =
      await readJsonWithLimit<{
        template?: string;
        to?: string;
        data?: Record<string, string>;
        organization_id?: string;
        repair_id?: string;
        attachments?: Array<{ filename: string; content: string }>;
      }>(req, 15_000_000);

    if (!template || !to) {
      return new Response(
        JSON.stringify({ error: "template and to are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── C3: Validate `to` against email format AND header injection ──
    if (!isValidEmail(to)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const effectiveOrgId = profile.organization_id;

    // Optional payload org must match authenticated org
    if (organization_id && organization_id !== effectiveOrgId) {
      return new Response(
        JSON.stringify({ error: "Forbidden: organization mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const templateFn = templates[template];
    if (!templateFn) {
      return new Response(
        JSON.stringify({ error: "Unknown template" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch organization identity + contact for the footer
    let orgContact: { name?: string; phone?: string; email?: string } | undefined;
    const { data: orgData } = await supabase
      .from("organizations")
      .select("name, phone, email")
      .eq("id", effectiveOrgId)
      .single();

    if (orgData && (orgData.name || orgData.phone || orgData.email)) {
      orgContact = {
        name: orgData.name || undefined,
        phone: orgData.phone || undefined,
        email: orgData.email || undefined,
      };
    }

    const { subject, html } = templateFn(data || {}, orgContact);

    let status = "sent";
    let errorMessage: string | null = null;

    try {
      // From: always "BonoitecPilot <noreply@bonoitecpilot.fr>".
      // Reply-to: shop email if valid, so clients reply directly to the shop.
      const replyTo = orgContact?.email && isValidEmail(orgContact.email) ? orgContact.email : undefined;
      await sendResend(to, subject, html, attachments, replyTo);
    } catch (sendError) {
      status = "failed";
      errorMessage = sendError instanceof Error ? sendError.message : "Resend error";
      const errorId = crypto.randomUUID();
      console.error(`[SEND-EMAIL][${errorId}] ${maskEmail(to)} ${errorMessage}`);
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
      const errorId = crypto.randomUUID();
      return new Response(
        JSON.stringify({ error: "Failed to send email", id: errorId, status: "failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, status: "sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    const errorId = crypto.randomUUID();
    console.error(`[SEND-EMAIL][${errorId}]`, error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: "Une erreur est survenue", id: errorId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
