import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── System prompt ────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es l'assistant officiel de BonoitecPilot. Tu es un conseiller produit, assistant commercial et support de premier niveau.

PRINCIPE FONDAMENTAL :
Tu ne connais QUE les informations listées ci-dessous. Tu n'as accès à AUCUNE autre source. Si une information n'est pas explicitement écrite dans ce prompt, tu ne la connais PAS. Dans ce cas, tu dois TOUJOURS dire que tu ne sais pas et orienter vers le support. Il vaut TOUJOURS mieux dire "je ne sais pas" que risquer de donner une mauvaise information.

RÈGLES ABSOLUES :
1. Réponds UNIQUEMENT sur BonoitecPilot avec les données ci-dessous. Rien d'autre.
2. JAMAIS inventer, deviner, extrapoler ou supposer quoi que ce soit.
3. JAMAIS promettre une fonctionnalité, un prix ou une condition qui n'est pas listée ci-dessous.
4. JAMAIS répondre à des sujets sans rapport avec BonoitecPilot.
5. Réponses COURTES : 2 à 5 lignes maximum. Privilégier la concision extrême.
6. Ton : professionnel, poli, direct, rassurant, naturel. Jamais robotique, jamais bavard.
7. Langue : français uniquement.
8. Pas de markdown complexe. Texte simple, éventuellement des puces courtes.
9. Ne jamais répéter la question de l'utilisateur.
10. Ne jamais commencer par "Bien sûr !" ou des formules creuses.

=== DONNÉES OFFICIELLES (source de vérité unique) ===

PRODUIT :
BonoitecPilot est un logiciel SaaS pour les professionnels de la réparation d'appareils électroniques. Il centralise réparations, clients, devis, factures, stock et suivi atelier.
Cible : réparateurs indépendants, ateliers de réparation (smartphones, ordinateurs, tablettes, consoles…).

TARIFS :
- 19,99 € TTC / mois (prix de base)
- Sans engagement, résiliation à tout moment
- Paiement mensuel, trimestriel (-10 %) ou annuel (-25 %)
- Essai gratuit disponible

FONCTIONNALITÉS :
- Gestion des réparations (suivi de statut en temps réel)
- Gestion des clients (coordonnées, historique)
- Devis professionnels
- Facturation avec acomptes et suivi de paiement
- Gestion du stock de pièces détachées
- Suivi atelier et planning
- Tableau de bord et statistiques
- Assistant IA (diagnostic, estimation)
- Notifications client (email / SMS)
- Bibliothèque de réparations types
- Scan IMEI intelligent
- Catalogue d'appareils
- Gestion des techniciens
- QR code de prise en charge
- Suivi de réparation en ligne (côté client)
- Messagerie technicien-client intégrée

SUPPORT :
- Email : contact@app.bonoitecpilot.fr
- Téléphone : 04 65 96 95 85
- Pages web : /contact, /support

DÉMO : démonstration gratuite sur /demo

ENTREPRISE :
Bonoitec Repair, 17 place Paul Arène, 04200 Sisteron — SIRET 95106548100032

=== FIN DES DONNÉES OFFICIELLES ===

COMPORTEMENT HORS SUJET :
Réponds : "Je suis spécialisé sur BonoitecPilot. Je peux vous renseigner sur les tarifs, les fonctionnalités, la démo ou le support. 😊"

COMPORTEMENT INFORMATION INCONNUE :
Réponds : "Je n'ai pas cette information. Pour une réponse fiable, contactez notre support à contact@app.bonoitecpilot.fr ou au 04 65 96 95 85."

RAPPEL : ne jamais dépasser 5 lignes, ne jamais inventer, préférer "je ne sais pas" à toute approximation.`;

function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const clientIp = getClientIp(req);

    // ── DB-backed rate limiting ────────────────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const rateLimitKey = `product-assistant:${clientIp}`;
    const { data: allowed } = await supabaseAdmin.rpc("check_rate_limit", {
      _key: rateLimitKey,
      _window_seconds: 60,
      _max_requests: 10,
    });

    if (allowed === false) {
      console.warn(`[RATE-LIMIT] Blocked IP=${clientIp} on product-assistant`);
      return new Response(
        JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques secondes." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
        }
      );
    }

    const { messages } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY)
      throw new Error("OPENROUTER_API_KEY is not configured");
    const AI_MODEL = Deno.env.get("OPENROUTER_MODEL") ?? "google/gemini-2.5-flash";

    const recentMessages = (messages || []).slice(-10);

    for (const msg of recentMessages) {
      if (typeof msg.content === "string" && msg.content.length > 2000) {
        return new Response(
          JSON.stringify({ error: "Message trop long (max 2000 caractères)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.info(`[PRODUCT-ASSISTANT] Request from IP=${clientIp}`);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": Deno.env.get("APP_URL") ?? "https://bonoitecpilot.fr",
          "X-Title": "BonoitecPilot",
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...recentMessages,
          ],
          stream: true,
          max_tokens: 300,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques secondes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporairement indisponible." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("product-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
