import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Token manquant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const secretKey = Deno.env.get("TURNSTILE_SECRET_KEY");
    if (!secretKey) {
      console.error("TURNSTILE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Configuration serveur manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      }
    );

    const result = await verifyResponse.json();

    return new Response(
      JSON.stringify({ success: result.success }),
      {
        status: result.success ? 200 : 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erreur de vérification" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
