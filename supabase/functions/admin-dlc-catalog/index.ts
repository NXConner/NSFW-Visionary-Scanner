import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPER_ADMIN_EMAIL = "n8ter8@gmail.com";

type ReqBody =
  | { action: "list" }
  | {
      action: "update";
      packageId: string;
      stripePriceId?: string | null;
      stripeProductId?: string | null;
    };

async function isAdminUser(supabase: any, userId: string, email?: string | null): Promise<boolean> {
  if (email && email.toLowerCase().trim() === SUPER_ADMIN_EMAIL) return true;
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) return false;
  return (data || []).some((r: any) => r.role === "admin" || r.role === "super_admin");
}

function normalizeStripeId(v: unknown): string | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  return s;
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

    if (body.action === "list") {
      const { data, error } = await supabase
        .from("dlc_packages")
        // schema varies across migrations; select * is safest
        .select("*");

      if (error) throw error;

      const rows = ((data || []) as any[]).slice();
      // Schema tolerant sort (some DB variants don't have "name"/"package_name").
      rows.sort((a, b) => {
        const ao = Number(a?.display_order ?? a?.sort_order ?? 0);
        const bo = Number(b?.display_order ?? b?.sort_order ?? 0);
        if (Number.isFinite(ao) && Number.isFinite(bo) && ao !== bo) return ao - bo;
        const an = String(a?.package_name ?? a?.name ?? a?.package_id ?? "").toLowerCase();
        const bn = String(b?.package_name ?? b?.name ?? b?.package_id ?? "").toLowerCase();
        if (an !== bn) return an.localeCompare(bn);
        const ac = String(a?.created_at ?? "");
        const bc = String(b?.created_at ?? "");
        return ac.localeCompare(bc);
      });
      const packages = rows.map(p => {
        const packageId = String(p.package_id ?? "");
        const displayName = String(p.package_name ?? p.name ?? packageId);
        const priceUsd = Number(p.price_usd ?? p.price ?? 0);
        const priceType = String(
          p.price_type ?? (p.pack_type === "subscription" ? "subscription" : "one_time"),
        );
        const stripePriceId = p.stripe_price_id ? String(p.stripe_price_id) : null;
        const stripeProductId = p.stripe_product_id ? String(p.stripe_product_id) : null;
        return {
          packageId,
          displayName,
          priceUsd,
          priceType,
          isActive: Boolean(p.is_active ?? true),
          stripePriceId,
          stripeProductId,
        };
      });

      return new Response(JSON.stringify({ packages }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "update") {
      const packageId = String(body.packageId || "").trim();
      if (!packageId) {
        return new Response(JSON.stringify({ error: "Missing packageId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const stripePriceId = normalizeStripeId(body.stripePriceId);
      const stripeProductId = normalizeStripeId(body.stripeProductId);

      // Basic format sanity (Stripe IDs are opaque but have stable prefixes)
      if (stripePriceId && !stripePriceId.startsWith("price_")) {
        return new Response(JSON.stringify({ error: "stripePriceId must start with price_" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (stripeProductId && !stripeProductId.startsWith("prod_")) {
        return new Response(JSON.stringify({ error: "stripeProductId must start with prod_" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: upErr } = await supabase
        .from("dlc_packages")
        .update({
          stripe_price_id: stripePriceId,
          stripe_product_id: stripeProductId,
          updated_at: new Date().toISOString(),
        })
        .eq("package_id", packageId);

      if (upErr) throw upErr;

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
    console.error("admin-dlc-catalog error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
