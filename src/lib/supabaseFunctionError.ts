/**
 * Extract the real server-side error message from a Supabase functions.invoke()
 * failure. The SDK's default error string is a generic "Edge Function returned
 * a non-2xx status code" — this helper unwraps the Response body (which carries
 * the actual `error` field the edge function put in the JSON) so the user sees
 * something actionable like "Crédits IA épuisés" or "Invalid API key".
 */
export async function readFunctionError(err: unknown, fallback: string): Promise<string> {
  const anyErr = err as { context?: Response; message?: string };
  const res = anyErr?.context;
  if (res && typeof res.json === "function") {
    try {
      const body = await res.clone().json();
      if (body?.error && typeof body.error === "string") return body.error;
      if (body?.message && typeof body.message === "string") return body.message;
    } catch {
      try {
        const text = await res.clone().text();
        if (text && text.length < 300) return text;
      } catch { /* ignore */ }
    }
  }
  return anyErr?.message || fallback;
}
