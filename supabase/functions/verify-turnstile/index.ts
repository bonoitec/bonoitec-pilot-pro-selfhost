import { buildCorsHeaders } from "../_shared/cors.ts";
import { readJsonWithLimit } from "../_shared/limits.ts";

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await readJsonWithLimit<{ token?: string }>(req, 100_000);
    const { token } = body;

    // M4: length check BEFORE forwarding to Cloudflare
    if (
      !token ||
      typeof token !== "string" ||
      token.length === 0 ||
      token.length > 4096
    ) {
      return new Response(
        JSON.stringify({ success: false, error: "Token invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const secretKey = Deno.env.get("TURNSTILE_SECRET_KEY");
    if (!secretKey) {
      const errorId = crypto.randomUUID();
      console.error(`[VERIFY-TURNSTILE][${errorId}] TURNSTILE_SECRET_KEY not configured`);
      return new Response(
        JSON.stringify({ success: false, error: "Configuration serveur manquante", id: errorId }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      },
    );

    const result = await verifyResponse.json();

    return new Response(
      JSON.stringify({ success: result.success }),
      {
        status: result.success ? 200 : 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    const errorId = crypto.randomUUID();
    console.error(`[VERIFY-TURNSTILE][${errorId}]`, error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ success: false, error: "Erreur de vérification", id: errorId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
