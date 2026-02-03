import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPER_ADMIN_EMAIL = "n8ter8@gmail.com";

type ReqBody =
  | { action: "list" }
  | { action: "set"; packageId: string; enabled: boolean }
  | { action: "set_all"; enabled: boolean }
  | { action: "reset" };

const MASTER_ID = "__nsfw_master__";

async function isAdminUser(supabase: any, userId: string, email?: string | null): Promise<boolean> {
  if (email && email.toLowerCase().trim() === SUPER_ADMIN_EMAIL) return true;
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) return false;
  return (data || []).some((r: any) => r.role === "admin" || r.role === "super_admin");
}

function toBool(v: unknown): boolean {
  return Boolean(v);
}

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
    endpoint: "admin-dlc-toggles",
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

    const okAdmin = await isAdminUser(supabase, user.id, user.email);
    if (!okAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ReqBody;

    // Active NSFW packages
    const { data: pkgRows, error: pkgErr } = await supabase
      .from("dlc_packages")
      .select("package_id,name,category,is_active")
      .eq("is_active", true);
    if (pkgErr) throw pkgErr;

    const nsfwPackages = (pkgRows || [])
      .map((r: any) => ({
        packageId: String(r.package_id),
        packageName: String(r.name ?? r.package_id),
        contentRating: String(r.content_rating ?? "18+"),
        displayOrder: Number(r.display_order ?? 0),
        isActive: toBool(r.is_active ?? true),
      }))
      .filter(p => p.isActive && (p.contentRating === "18+" || p.contentRating === "adult"))
      .sort(
        (a, b) => a.displayOrder - b.displayOrder || a.packageName.localeCompare(b.packageName),
      );

    if (body.action === "list") {
      const { data: toggles } = await supabase
        .from("admin_dlc_package_toggles")
        .select("package_id,is_enabled")
        .eq("user_id", user.id)
        .limit(2000);

      const map = new Map<string, boolean>();
      for (const t of (toggles || []) as any[]) {
        map.set(String(t.package_id), Boolean(t.is_enabled));
      }

      const masterEnabled = map.get(MASTER_ID) ?? false;

      return new Response(
        JSON.stringify({
          master: { packageId: MASTER_ID, enabled: masterEnabled },
          packages: nsfwPackages.map(p => ({
            packageId: p.packageId,
            packageName: p.packageName,
            contentRating: p.contentRating,
            enabled: map.get(p.packageId) ?? false,
          })),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (body.action === "set") {
      const packageId = String(body.packageId || "").trim();
      if (!packageId) {
        return new Response(JSON.stringify({ error: "Missing packageId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const enabled = Boolean(body.enabled);

      const { error } = await supabase.from("admin_dlc_package_toggles").upsert(
        {
          user_id: user.id,
          package_id: packageId,
          is_enabled: enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,package_id" },
      );
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "set_all") {
      const enabled = Boolean(body.enabled);
      const rows = nsfwPackages.map(p => ({
        user_id: user.id,
        package_id: p.packageId,
        is_enabled: enabled,
        updated_at: new Date().toISOString(),
      }));

      if (rows.length > 0) {
        const { error } = await supabase.from("admin_dlc_package_toggles").upsert(rows, {
          onConflict: "user_id,package_id",
        });
        if (error) throw error;
      }

      return new Response(JSON.stringify({ ok: true, count: rows.length }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "reset") {
      const { error } = await supabase
        .from("admin_dlc_package_toggles")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
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
    console.error("admin-dlc-toggles error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
