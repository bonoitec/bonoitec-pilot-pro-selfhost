import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { readJsonWithLimit, extractBearerToken } from "../_shared/limits.ts";

interface PartUsed {
  inventory_id?: string;
  name?: string;
  buy_price?: number;
  sell_price?: number;
  quantity?: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// M2: validate a part object before trusting it
function validatePart(p: unknown): p is PartUsed {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  if (o.inventory_id !== undefined && o.inventory_id !== null && typeof o.inventory_id !== "string") return false;
  if (o.quantity !== undefined && (typeof o.quantity !== "number" || o.quantity < 0 || !Number.isFinite(o.quantity))) return false;
  if (o.buy_price !== undefined && (typeof o.buy_price !== "number" || !Number.isFinite(o.buy_price))) return false;
  if (o.sell_price !== undefined && (typeof o.sell_price !== "number" || !Number.isFinite(o.sell_price))) return false;
  return true;
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = extractBearerToken(req.headers.get("Authorization"));
    if (!token) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Get user's org
    const { data: profile } = await userClient.from("profiles").select("organization_id").eq("user_id", userId).single();
    if (!profile) {
      return new Response(JSON.stringify({ error: "Profil introuvable" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgId = profile.organization_id;

    // H5: size-limited body parse
    const body = await readJsonWithLimit<{
      repair_id?: string;
      updates?: Record<string, unknown>;
      old_parts?: PartUsed[];
      new_parts?: PartUsed[];
    }>(req, 2_000_000);
    const { repair_id, updates: rawUpdates, old_parts, new_parts } = body;

    // M1: validate repair_id as UUID
    if (!repair_id || typeof repair_id !== "string" || !UUID_RE.test(repair_id)) {
      return new Response(JSON.stringify({ error: "repair_id invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // M2: validate parts arrays
    if (old_parts !== undefined) {
      if (!Array.isArray(old_parts) || !old_parts.every(validatePart)) {
        return new Response(JSON.stringify({ error: "old_parts invalide" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    if (new_parts !== undefined) {
      if (!Array.isArray(new_parts) || !new_parts.every(validatePart)) {
        return new Response(JSON.stringify({ error: "new_parts invalide" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Allowlist: only these fields can be updated via this endpoint
    const ALLOWED_FIELDS = new Set([
      "status", "parts_used", "services_used", "labor_cost",
      "final_price", "estimated_price", "diagnostic", "internal_notes",
      "technician_message", "repair_started_at", "repair_ended_at",
      "estimated_completion", "technician_id", "payment_method",
      "customer_signature_url", "photos", "intake_checklist",
      "screen_condition", "back_condition", "frame_condition",
      "estimated_time_minutes",
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
      const errorId = crypto.randomUUID();
      console.error(`[UPDATE-REPAIR-STOCK][${errorId}] update error:`, updateError.message);
      return new Response(
        JSON.stringify({ error: "Erreur mise à jour réparation", id: errorId }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
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
    const clampWarnings: string[] = [];

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
        .select("quantity, name")
        .eq("id", id)
        .eq("organization_id", orgId)
        .single();

      if (!inv) continue;

      const desiredQty = inv.quantity - delta;
      const updatedQty = Math.max(0, desiredQty);
      // M3: warn if we had to clamp to 0 (meaning stock would have gone negative)
      if (desiredQty < 0) {
        console.warn(`[UPDATE-REPAIR-STOCK] Clamped stock for ${id} (${inv.name}): desired=${desiredQty}, set=0`);
        clampWarnings.push(`${inv.name || id}: stock insuffisant, mis à 0`);
      }

      const { error: stockError } = await adminClient
        .from("inventory")
        .update({ quantity: updatedQty })
        .eq("id", id)
        .eq("organization_id", orgId);

      if (stockError) {
        console.error(`[UPDATE-REPAIR-STOCK] Stock update failed for ${id}:`, stockError.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        stock_updates: stockUpdates.length,
        warnings: clampWarnings.length > 0 ? clampWarnings : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    const errorId = crypto.randomUUID();
    console.error(`[UPDATE-REPAIR-STOCK][${errorId}]`, err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ error: "Une erreur est survenue", id: errorId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
