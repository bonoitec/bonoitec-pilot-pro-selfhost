// Shared CORS + origin validation helper for all edge functions.
// Reflects request origin only if it's in the allowlist; otherwise pins to the production domain.
// Use buildCorsHeaders(req) instead of a hardcoded `*` constant.

const ALLOWED_ORIGINS = [
  "https://bonoitecpilot.fr",
  "https://www.bonoitecpilot.fr",
  "https://bonoitec-pilot-pro.vercel.app",
  "http://localhost:8081",
  "http://localhost:8080",
  "http://localhost:5173",
];

const ACAH = "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": ACAH,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// Returns the validated request origin for use in URLs (e.g. Stripe success_url).
// Returns null if the origin is missing or not in the allowlist.
export function validateOrigin(req: Request): string | null {
  const origin = req.headers.get("origin");
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return null;
  return origin;
}

export { ALLOWED_ORIGINS };
