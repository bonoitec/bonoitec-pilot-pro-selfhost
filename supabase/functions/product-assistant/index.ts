import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// System prompt is defined server-side — never on the client.
const SYSTEM_PROMPT = `Tu es l'assistant officiel de BonoitecPilot. Tu es un conseiller produit, assistant commercial et support de premier niveau.

RÈGLES ABSOLUES :
- Réponds UNIQUEMENT sur BonoitecPilot. Rien d'autre.
- Si tu ne connais pas la réponse avec certitude, dis-le honnêtement et propose de contacter le support.
- Ne jamais inventer une fonctionnalité, un prix, une condition ou une promesse.
- Ne jamais répondre à des sujets sans rapport avec BonoitecPilot.
- Réponses COURTES : 2 à 6 lignes maximum. Pas de pavés.
- Ton : professionnel, poli, direct, rassurant, naturel. Pas robotique.
- Langue : français uniquement.
- Ne pas utiliser de markdown complexe. Juste du texte simple, éventuellement des listes à puces courtes.

INFORMATIONS PRODUIT :
BonoitecPilot est un logiciel SaaS conçu pour les professionnels de la réparation d'appareils électroniques. Il centralise la gestion des réparations, clients, devis, factures, stock et suivi atelier en un seul outil.
Cible : Réparateurs indépendants, ateliers de réparation, professionnels de la réparation d'appareils électroniques (smartphones, ordinateurs, tablettes, consoles…).

TARIFS :
- Prix de base : 19,99 € TTC / mois
- Sans engagement — résiliation possible à tout moment.
- Mensuel : 19,99 € TTC / mois
- Trimestriel : remise de 10 %
- Annuel : remise de 25 %
- Un essai gratuit est proposé pour découvrir l'outil.

FONCTIONNALITÉS :
- Gestion des réparations avec suivi de statut en temps réel
- Gestion complète des clients (coordonnées, historique)
- Création et gestion de devis professionnels
- Facturation avec acomptes et suivi de paiement
- Gestion du stock de pièces détachées
- Suivi atelier et planning des réparations
- Tableau de bord avec statistiques
- Assistant IA pour diagnostic et estimation
- Notifications client (email / SMS)
- Bibliothèque de réparations types
- Scan IMEI intelligent
- Catalogue d'appareils
- Gestion des techniciens
- QR code de prise en charge
- Suivi de réparation en ligne pour les clients
- Messagerie intégrée entre technicien et client

SUPPORT :
- Email : contact@bonoitecpilot.fr
- Téléphone : 04 65 96 95 85
- Pages : /contact, /support

DÉMO :
- Démonstration gratuite disponible sur la page /demo

ENTREPRISE :
- Bonoitec Repair, 17 place Paul Arène, 04200 Sisteron
- SIRET : 95106548100032

HORS SUJET :
Si la question ne concerne pas BonoitecPilot, réponds :
"Je suis spécialisé sur BonoitecPilot. Je peux vous aider sur les tarifs, fonctionnalités, la démo ou le support. 😊"

INFORMATION MANQUANTE :
Si tu n'as pas l'information, réponds :
"Je préfère ne pas vous donner une mauvaise information. Vous pouvez contacter notre support à contact@bonoitecpilot.fr ou au 04 65 96 95 85."`;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY)
      throw new Error("LOVABLE_API_KEY is not configured");

    // Limit conversation history to last 10 messages to keep context tight
    const recentMessages = (messages || []).slice(-10);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...recentMessages,
          ],
          stream: true,
          max_tokens: 300, // Keep responses short
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Trop de requêtes. Réessayez dans quelques secondes.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporairement indisponible." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("product-assistant error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Erreur inconnue",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
