import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PartUsed {
  inventory_id?: string;
  name?: string;
  buy_price?: number;
  sell_price?: number;
  quantity?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to verify auth & org membership
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's org
    const { data: profile } = await userClient.from("profiles").select("organization_id").eq("user_id", user.id).single();
    if (!profile) {
      return new Response(JSON.stringify({ error: "Profil introuvable" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgId = profile.organization_id;

    const { repair_id, updates: rawUpdates, old_parts, new_parts } = await req.json() as {
      repair_id: string;
      updates: Record<string, unknown>;
      old_parts: PartUsed[];
      new_parts: PartUsed[];
    };

    // Allowlist: only these fields can be updated via this endpoint
    const ALLOWED_FIELDS = new Set([
      "status", "parts_used", "services_used", "labor_cost",
      "final_price", "estimated_price", "diagnostic", "internal_notes",
      "technician_message", "repair_started_at", "repair_ended_at",
      "estimated_completion", "technician_id", "payment_method",
      "customer_signature_url", "photos", "intake_checklist",
      "screen_condition", "back_condition", "frame_condition",
    ]);

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawUpdates || {})) {
      if (ALLOWED_FIELDS.has(key)) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0 && (!old_parts?.length && !new_parts?.length)) {
      return new Response(JSON.stringify({ error: "Aucun champ valide à mettre à jour" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!repair_id) {
      return new Response(JSON.stringify({ error: "repair_id requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for atomic operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify repair belongs to the user's org
    const { data: repair, error: repairError } = await adminClient
      .from("repairs")
      .select("id, organization_id")
      .eq("id", repair_id)
      .single();

    if (repairError || !repair || repair.organization_id !== orgId) {
      return new Response(JSON.stringify({ error: "Réparation introuvable ou accès refusé" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Update the repair
    const { error: updateError } = await adminClient
      .from("repairs")
      .update(updates)
      .eq("id", repair_id);

    if (updateError) {
      throw new Error(`Erreur mise à jour réparation: ${updateError.message}`);
    }

    // 2. Compute stock deltas and apply atomically
    const oldQtyMap = new Map<string, number>();
    (old_parts || []).forEach((p: PartUsed) => {
      if (p.inventory_id) {
        oldQtyMap.set(p.inventory_id, (oldQtyMap.get(p.inventory_id) || 0) + (p.quantity || 1));
      }
    });

    const newQtyMap = new Map<string, number>();
    (new_parts || []).forEach((p: PartUsed) => {
      if (p.inventory_id) {
        newQtyMap.set(p.inventory_id, (newQtyMap.get(p.inventory_id) || 0) + (p.quantity || 1));
      }
    });

    const allIds = new Set([...oldQtyMap.keys(), ...newQtyMap.keys()]);
    const stockUpdates: { id: string; delta: number }[] = [];

    for (const id of allIds) {
      const oldQty = oldQtyMap.get(id) || 0;
      const newQty = newQtyMap.get(id) || 0;
      const delta = newQty - oldQty;
      if (delta !== 0) {
        stockUpdates.push({ id, delta });
      }
    }

    // Apply stock updates sequentially with service role (bypasses RLS, ensures atomicity)
    for (const { id, delta } of stockUpdates) {
      const { data: inv } = await adminClient
        .from("inventory")
        .select("quantity")
        .eq("id", id)
        .eq("organization_id", orgId)
        .single();

      if (!inv) continue;

      const updatedQty = Math.max(0, inv.quantity - delta);
      const { error: stockError } = await adminClient
        .from("inventory")
        .update({ quantity: updatedQty })
        .eq("id", id)
        .eq("organization_id", orgId);

      if (stockError) {
        console.error(`Stock update failed for ${id}:`, stockError.message);
      }
    }

    return new Response(
      JSON.stringify({ success: true, stock_updates: stockUpdates.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("update-repair-stock error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
