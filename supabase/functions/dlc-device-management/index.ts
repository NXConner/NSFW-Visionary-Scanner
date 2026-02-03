import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody =
  | { action: "list" }
  | { action: "deactivate"; deviceRowId: string }
  | { action: "setPrimary"; licenseId: string; deviceId: string };

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  const rateLimitResponse = await applyRateLimit({
    req,
    endpoint: "dlc-device-management",
    ...DEFAULT_EDGE_RATE_LIMIT,
    headers: corsHeaders,
  });
  if (rateLimitResponse) return rateLimitResponse;

    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userRes, error: authError } = await supabase.auth.getUser(token);
    const user = userRes?.user;
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ReqBody;

    if (body.action === "list") {
      // List licenses (package schema) when present; fall back to legacy if needed.
      const licensesRes = await supabase
        .from("dlc_licenses")
        .select("id, package_id, license_type, is_active, max_devices")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const licenses = (licensesRes.data || []) as any[];

      const devicesRes = await supabase
        .from("dlc_license_devices")
        .select(
          "id, license_id, device_id, device_name, device_type, device_platform, platform, is_active, is_primary, last_seen_at, last_used_at, last_validation_at, activated_at",
        )
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false })
        .order("last_used_at", { ascending: false })
        .order("last_seen_at", { ascending: false });

      const devices = (devicesRes.data || []) as any[];

      return new Response(JSON.stringify({ licenses, devices }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "deactivate") {
      const deviceRowId = String(body.deviceRowId || "").trim();
      if (!deviceRowId) {
        return new Response(JSON.stringify({ error: "Missing deviceRowId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("dlc_license_devices")
        .update({
          is_active: false,
          is_primary: false,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", deviceRowId)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "setPrimary") {
      const licenseId = String(body.licenseId || "").trim();
      const deviceId = String(body.deviceId || "").trim();
      if (!licenseId || !deviceId) {
        return new Response(JSON.stringify({ error: "Missing licenseId/deviceId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Ensure license belongs to user
      const { data: lic } = await supabase
        .from("dlc_licenses")
        .select("id")
        .eq("id", licenseId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!lic?.id) {
        return new Response(JSON.stringify({ error: "License not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Clear existing primary, then set requested.
      const now = new Date().toISOString();
      await supabase
        .from("dlc_license_devices")
        .update({ is_primary: false, last_seen_at: now })
        .eq("user_id", user.id)
        .eq("license_id", licenseId);

      const { error: setErr } = await supabase
        .from("dlc_license_devices")
        .update({ is_primary: true, last_seen_at: now, last_used_at: now, last_validation_at: now })
        .eq("user_id", user.id)
        .eq("license_id", licenseId)
        .eq("device_id", deviceId)
        .eq("is_active", true);

      if (setErr) throw new Error(setErr.message);

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("dlc-device-management error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
