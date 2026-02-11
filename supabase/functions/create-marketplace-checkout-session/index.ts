import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.0.0";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody = {
  itemId: string;
  successUrl: string;
  cancelUrl: string;
};

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as ReqBody;
    const itemId = String(body.itemId || "");
    const successUrl = String(body.successUrl || "");
    const cancelUrl = String(body.cancelUrl || "");

    if (!itemId || !successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rateLimitResponse = await applyRateLimit({
      req,
      endpoint: "create-marketplace-checkout-session",
      ...DEFAULT_EDGE_RATE_LIMIT,
      headers: corsHeaders,
    });
    if (rateLimitResponse) return rateLimitResponse;

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

    // Load marketplace item (must be active + approved)
    const { data: item, error: itemError } = await supabase
      .from("marketplace_items")
      .select(
        "id, title, description, price, currency, is_subscription, subscription_duration_days, is_free, is_active, is_approved",
      )
      .eq("id", itemId)
      .maybeSingle();

    if (itemError || !item) {
      return new Response(JSON.stringify({ error: "Item not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!item.is_active || !item.is_approved) {
      return new Response(JSON.stringify({ error: "Item not available" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priceUsd = Number(item.price ?? 0);
    const isFree = Boolean(item.is_free || priceUsd <= 0);
    if (isFree) {
      return new Response(JSON.stringify({ error: "Free item does not require checkout" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    if (!stripeSecretKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Reuse/ensure Stripe customer via user_subscriptions stripe_customer_id (shared with subscriptions/DLC)
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
    const unitAmount = Math.round(priceUsd * 100);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) throw new Error("Invalid item price");

    const recurring =
      mode === "subscription"
        ? {
            interval: Number(item.subscription_duration_days ?? 30) >= 365 ? "year" : "month",
          }
        : undefined;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: {
              name: String(item.title),
              description: String(item.description || ""),
              metadata: { marketplace_item_id: String(item.id) },
            },
            recurring: recurring as any,
          },
          quantity: 1,
        } as any,
      ],
      mode: mode as any,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        purchase_type: "marketplace",
        marketplace_item_id: String(item.id),
        supabase_user_id: user.id,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("create-marketplace-checkout-session error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
