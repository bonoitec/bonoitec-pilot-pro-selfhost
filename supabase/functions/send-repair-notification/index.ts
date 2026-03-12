import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ── Authentication check ──────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { repair_id, new_status, message, channel } = await req.json();

    if (!repair_id || !new_status) {
      return new Response(
        JSON.stringify({ error: "repair_id and new_status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the repair belongs to the user's organization
    if (repair.organization_id !== profile.organization_id) {
      return new Response(
        JSON.stringify({ error: "Forbidden: organization mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = repair.clients;
    if (!client) {
      return new Response(
        JSON.stringify({ error: "No client associated" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Notification error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
