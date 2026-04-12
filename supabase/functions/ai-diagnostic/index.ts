import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { readJsonWithLimit, extractBearerToken } from "../_shared/limits.ts";

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Authentication ────────────────────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const token = extractBearerToken(req.headers.get("Authorization"));
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // ── DB-backed rate limiting per user ───────────────────────────
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: allowed } = await supabaseAdmin.rpc("check_rate_limit", {
      _key: `ai-diagnostic:${userId}`,
      _window_seconds: 60,
      _max_requests: 15,
    });

    if (allowed !== true) {
      console.warn(`[AI-DIAGNOSTIC RATE-LIMIT] Blocked user=${userId}`);
      return new Response(
        JSON.stringify({ error: "Trop de requêtes IA. Réessayez dans quelques secondes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }

    const parsed = await readJsonWithLimit<{ messages?: Array<{ role: string; content: string }>; mode?: string }>(req, 200_000);
    const { messages, mode } = parsed;
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");
    const AI_MODEL = Deno.env.get("OPENROUTER_MODEL") ?? "google/gemini-2.5-flash";

    // Validate message content length
    const safeMessages = (messages || []).slice(-10);
    for (const msg of safeMessages) {
      if (typeof msg.content === "string" && msg.content.length > 5000) {
        return new Response(
          JSON.stringify({ error: "Message trop long (max 5000 caractères)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.info(`[AI-DIAGNOSTIC] user=${userId} mode=${mode}`);

    let systemPrompt = "";

    if (mode === "diagnostic") {
      systemPrompt = `Tu es un expert en réparation d'appareils électroniques (smartphones, ordinateurs, consoles, tablettes).
On te fournit des informations sur un appareil et la description du problème par le technicien.

RÈGLE IMPORTANTE : Si le technicien mentionne une cause spécifique (ex: "dégât d'eau", "chute", "oxydation", "court-circuit"), tu DOIS baser ton analyse autour de cette cause. Ne la contredis pas et ne propose pas des causes sans rapport. Le technicien connaît l'appareil, suis son diagnostic.

Prends en compte TOUTES les informations fournies : type d'appareil, marque, modèle, état physique, checklist, et surtout la description du problème.

Réponds en JSON structuré avec:
- causes_possibles: tableau de causes probables liées au problème décrit (max 5). Si le technicien indique une cause, elle doit être en premier.
- pieces_a_verifier: tableau de pièces à vérifier en lien avec le problème
- solution_probable: la solution la plus probable
- difficulte: "facile", "moyenne", "difficile" ou "expert"
- temps_estime: temps estimé en minutes
- prix_estime: fourchette de prix en euros (ex: "45-89 €")
- conseils: conseils supplémentaires pour le technicien

Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.`;
    } else if (mode === "imei") {
      systemPrompt = `Tu es un expert en identification d'appareils électroniques.
Quand on te donne un numéro IMEI ou de série, identifie l'appareil et retourne en JSON:
- marque: la marque (Apple, Samsung, etc.)
- modele: le modèle exact
- capacite: la capacité de stockage si identifiable
- couleur: la couleur si identifiable
- annee: l'année de sortie
- type: "Smartphone", "Tablette", "Ordinateur", etc.

Si tu ne peux pas identifier l'appareil exactement, fais ta meilleure estimation basée sur le format du numéro.
Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.`;
    } else if (mode === "business-insights") {
      systemPrompt = `Tu es un consultant business spécialisé dans les ateliers de réparation électronique.
Analyse les données fournies et génère des conseils business actionables en français.
Retourne en JSON:
- conseils: tableau d'objets avec { emoji, titre, description, impact }
- tendances: tableau de tendances observées
- opportunites: tableau d'opportunités de croissance

Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.`;
    } else if (mode === "client-description") {
      systemPrompt = `Tu es un assistant pour un atelier de réparation. Génère une description claire, professionnelle et compréhensible par un client non technicien. Réponds uniquement avec le texte de la description, sans titre ni formatage.`;
    } else {
      systemPrompt = `Tu es un assistant IA spécialisé pour les ateliers de réparation d'appareils électroniques (BonoitecPilot).
Tu aides les techniciens avec les diagnostics, les prix, les pièces et les conseils de réparation.
Réponds en français, de manière claire et concise. Utilise le format markdown pour la mise en forme.`;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
          { role: "system", content: systemPrompt },
          ...safeMessages,
        ],
        stream: mode === "chat",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques secondes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés. Ajoutez des crédits dans les paramètres." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "chat") {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    const errorId = crypto.randomUUID();
    console.error(`[AI-DIAGNOSTIC][${errorId}]`, e instanceof Error ? e.message : e);
    return new Response(JSON.stringify({ error: "Une erreur est survenue", id: errorId }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
