import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { readJsonWithLimit, extractBearerToken } from "../_shared/limits.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_STATUSES = new Set([
  "nouveau", "diagnostic", "en_cours", "en_attente_piece",
  "termine", "pret_a_recuperer", "devis_en_attente", "devis_valide",
  "pret_reparation", "reparation_en_cours",
]);

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

    const supabase = createClient(supabaseUrl, serviceKey);

    // ── Verify user belongs to an organization ────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("user_id", userId)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Forbidden: no profile found" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await readJsonWithLimit<{
      repair_id?: string;
      new_status?: string;
      message?: string;
      channel?: string;
    }>(req, 100_000);
    const { repair_id, new_status, message, channel } = body;

    // M1: validate inputs BEFORE any DB query
    if (!repair_id || typeof repair_id !== "string" || !UUID_RE.test(repair_id)) {
      return new Response(
        JSON.stringify({ error: "repair_id invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!new_status || typeof new_status !== "string" || !ALLOWED_STATUSES.has(new_status)) {
      return new Response(
        JSON.stringify({ error: "new_status invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (message !== undefined && (typeof message !== "string" || message.length > 5000)) {
      return new Response(
        JSON.stringify({ error: "message invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (channel !== undefined && channel !== "email" && channel !== "sms") {
      return new Response(
        JSON.stringify({ error: "channel invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch repair with client info
    const { data: repair, error: repairError } = await supabase
      .from("repairs")
      .select("*, clients(name, email, phone), devices(brand, model)")
      .eq("id", repair_id)
      .single();

    if (repairError || !repair) {
      return new Response(
        JSON.stringify({ error: "Repair not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify the repair belongs to the user's organization
    if (repair.organization_id !== profile.organization_id) {
      return new Response(
        JSON.stringify({ error: "Forbidden: organization mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const client = repair.clients;
    if (!client) {
      return new Response(
        JSON.stringify({ error: "No client associated" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const notificationChannel = channel || (client.email ? "email" : "sms");
    const notificationMessage = message || `Mise à jour de votre réparation ${repair.reference}: statut changé.`;

    // Log as system message in conversation
    await supabase.from("repair_messages").insert({
      repair_id,
      organization_id: repair.organization_id,
      sender_type: "system",
      sender_name: "Notification automatique",
      channel: notificationChannel,
      content: notificationMessage,
    });

    // Log the notification (without leaking recipient)
    await supabase.from("notification_logs").insert({
      repair_id,
      organization_id: repair.organization_id,
      channel: notificationChannel,
      recipient: client.email || client.phone || "",
      subject: `Mise à jour réparation ${repair.reference}`,
      body: notificationMessage,
      status: "pending",
    });

    return new Response(
      JSON.stringify({ success: true, channel: notificationChannel }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    const errorId = crypto.randomUUID();
    console.error(`[SEND-REPAIR-NOTIFICATION][${errorId}]`, error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: "Une erreur est survenue", id: errorId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
