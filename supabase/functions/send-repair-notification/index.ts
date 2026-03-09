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
    const supabase = createClient(supabaseUrl, serviceKey);

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

    const client = repair.clients;
    if (!client) {
      return new Response(
        JSON.stringify({ error: "No client associated" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recipient = client.email || client.phone || "";
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

    // Log the notification
    await supabase.from("notification_logs").insert({
      repair_id,
      organization_id: repair.organization_id,
      channel: notificationChannel,
      recipient,
      subject: `Mise à jour réparation ${repair.reference}`,
      body: notificationMessage,
      status: "pending",
    });

    // Here you would integrate with actual email/SMS/WhatsApp providers
    // For now, the notification is logged and visible in the messaging system

    return new Response(
      JSON.stringify({ success: true, channel: notificationChannel, recipient }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Notification error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
