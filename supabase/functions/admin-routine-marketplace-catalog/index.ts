import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody =
  | { action: "list" }
  | {
      action: "update";
      id: string;
      stripePriceId?: string | null;
      stripeProductId?: string | null;
    };

async function isAdminUser(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) return false;
  return (data || []).some((r: any) => r.role === "admin" || r.role === "super_admin");
}

function normalizeStripeId(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
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

    const okAdmin = await isAdminUser(supabase, user.id);
    if (!okAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ReqBody;

    if (body.action === "list") {
      const { data, error } = await supabase
        .from("routine_marketplace")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(250);
      if (error) throw error;

      const items = ((data || []) as any[]).map(row => {
        const price = Number(row.price ?? 0);
        const isSub = Boolean(row.is_subscription);
        const shortId = String(row.id ?? "").slice(0, 8);
        return {
          id: String(row.id),
          displayName: `Routine ${shortId}`,
          priceValue: Number.isFinite(price) ? price : 0,
          currency: String(row.currency ?? "USD"),
          priceType: isSub ? "subscription" : "one_time",
          isActive: Boolean(row.is_active ?? true),
          isApproved: true,
          stripePriceId: row.stripe_price_id ? String(row.stripe_price_id) : null,
          stripeProductId: row.stripe_product_id ? String(row.stripe_product_id) : null,
          category: String(row.marketplace_category ?? ""),
        };
      });

      return new Response(JSON.stringify({ items }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "update") {
      const id = String(body.id || "").trim();
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const stripePriceId = normalizeStripeId(body.stripePriceId);
      const stripeProductId = normalizeStripeId(body.stripeProductId);

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
        .from("routine_marketplace")
        .update({
          stripe_price_id: stripePriceId,
          stripe_product_id: stripeProductId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
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
    console.error("admin-routine-marketplace-catalog error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
