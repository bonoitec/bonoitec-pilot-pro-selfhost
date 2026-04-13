/**
 * Edge Function: admin-reset-user-password
 *
 * Called by the super-admin dashboard to send a password-reset email to
 * a targeted user. Verifies the caller is super_admin, generates a recovery
 * link via auth admin API, and writes an audit entry.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { extractBearerToken, readJsonWithLimit } from "../_shared/limits.ts";

interface Body {
  user_id: string;
  reason: string;
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 1. Auth: require Bearer token
    const token = extractBearerToken(req.headers.get("Authorization"));
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Verify caller identity
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user: caller }, error: authErr } = await authClient.auth.getUser();
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Verify super_admin role via RPC
    const { data: isAdmin, error: roleErr } = await authClient.rpc("is_super_admin");
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Parse body
    let body: Body;
    try {
      body = await readJsonWithLimit<Body>(req, 10_000);
    } catch (e) {
      if (e instanceof Response) return e;
      throw e;
    }
    if (!body.user_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.user_id)) {
      return new Response(JSON.stringify({ error: "Invalid user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body.reason || body.reason.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Reason is required (min 3 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Service-role client to generate recovery link + log
    const adminClient = createClient(supabaseUrl, serviceKey);

    // 6. Resolve target user email
    const { data: userResult, error: getUserErr } = await adminClient.auth.admin.getUserById(body.user_id);
    if (getUserErr || !userResult?.user?.email) {
      return new Response(JSON.stringify({ error: "Target user not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const targetEmail = userResult.user.email;

    // 7. Generate recovery link (Supabase will send the email via SMTP it's configured to use).
    const { error: genErr } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email: targetEmail,
      options: { redirectTo: "https://bonoitecpilot.fr/auth/reset-password" },
    });
    if (genErr) {
      console.error("generateLink failed", genErr);
      return new Response(JSON.stringify({ error: "Failed to send reset email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 8. Audit log entry (via service-role, not super-admin guarded)
    await adminClient.rpc("admin_log_password_reset", {
      _actor_id: caller.id,
      _target_user_id: body.user_id,
      _target_email: targetEmail,
      _reason: body.reason.trim(),
    });

    return new Response(JSON.stringify({ success: true, email: targetEmail }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-reset-user-password error", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
