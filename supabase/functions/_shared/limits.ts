// Request body size guard.
// Use readJsonWithLimit(req) instead of req.json() to enforce a max payload size
// before deserializing. Throws a Response object on overflow so handlers can
// `try { ... } catch (e) { if (e instanceof Response) return e; throw e; }`.

export async function readJsonWithLimit<T = unknown>(req: Request, maxBytes = 1_000_000): Promise<T> {
  const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
  if (contentLength > maxBytes) {
    throw new Response(
      JSON.stringify({ error: "Payload too large" }),
      { status: 413, headers: { "Content-Type": "application/json" } },
    );
  }
  const text = await req.text();
  if (text.length > maxBytes) {
    throw new Response(
      JSON.stringify({ error: "Payload too large" }),
      { status: 413, headers: { "Content-Type": "application/json" } },
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
}

// Validate Bearer token and return it (trimmed) or null.
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}
