import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody = {
  marketplaceId: string;
  successUrl: string;
  cancelUrl: string;
};

function asString(v: unknown, fallback = ""): string {
  const s = typeof v === "string" ? v : v === null || v === undefined ? "" : String(v);
  return s.trim() || fallback;
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as ReqBody;
    const marketplaceId = String(body.marketplaceId || "");
    const successUrl = String(body.successUrl || "");
    const cancelUrl = String(body.cancelUrl || "");

    if (!marketplaceId || !successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userRes, error: authError } = await supabase.auth.getUser(token);
    const user = userRes?.user;
    if (authError || !user) throw new Error("Invalid authentication");

    const { data: item, error: itemError } = await supabase
      .from("routine_marketplace")
      // schema-tolerant: table may evolve; checkout only needs a subset
      .select("*")
      .eq("id", marketplaceId)
      .maybeSingle();

    if (itemError || !item) {
      return new Response(JSON.stringify({ error: "Marketplace item not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!item.is_active) {
      return new Response(JSON.stringify({ error: "Marketplace item not available" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priceValue = Number(item.price ?? 0);
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      return new Response(JSON.stringify({ error: "This item is free; checkout not required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    if (!stripeSecretKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    const isLiveMode =
      stripeSecretKey.startsWith("sk_live_") || stripeSecretKey.startsWith("rk_live_");

    // Shared customer mapping
    let { data: subscriptionRow } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = (subscriptionRow as any)?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from("user_subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        status: "incomplete",
      });
    }

    const mode = item.is_subscription ? "subscription" : "payment";
    const currency = String(item.currency || "USD").toLowerCase();
    const unitAmount = Math.round(priceValue * 100);

    const stripePriceId =
      asString((item as any).stripe_price_id ?? (item as any).stripePriceId, "") || null;

    // Live mode must use pre-created Stripe Prices (no inline price_data in production).
    if (isLiveMode && !stripePriceId) {
      return new Response(
        JSON.stringify({
          error:
            "Stripe price not configured for this routine marketplace item (set routine_marketplace.stripe_price_id)",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const lineItem = stripePriceId
      ? ({ price: stripePriceId, quantity: 1 } as const)
      : ({
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: {
              name: `Routine Marketplace Item ${String(item.id).slice(0, 8)}`,
              metadata: { routine_marketplace_id: String(item.id) },
            },
            recurring:
              mode === "subscription"
                ? {
                    interval:
                      Number(item.subscription_duration_days ?? 30) >= 365 ? "year" : "month",
                  }
                : undefined,
          },
          quantity: 1,
        } as const);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [lineItem as any],
      mode: mode as any,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        purchase_type: "routine_marketplace",
        routine_marketplace_id: String(item.id),
        supabase_user_id: user.id,
        ...(stripePriceId ? { stripe_price_id: stripePriceId } : {}),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("create-routine-marketplace-checkout-session error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
