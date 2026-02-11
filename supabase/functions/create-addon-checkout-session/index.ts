import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.0.0";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody = {
  addonId: string;
  planType: "monthly" | "annual" | "lifetime";
  successUrl: string;
  cancelUrl: string;
};

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as ReqBody;
    const addonId = String(body.addonId || "");
    const planType = body.planType;
    const successUrl = String(body.successUrl || "");
    const cancelUrl = String(body.cancelUrl || "");

    if (!addonId || !planType || !successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rateLimitResponse = await applyRateLimit({
      req,
      endpoint: "create-addon-checkout-session",
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

    const { data: addon, error: addonErr } = await supabase
      .from("premium_add_ons")
      .select(
        "addon_id, addon_name, addon_description, monthly_price, annual_price, lifetime_price, stripe_monthly_price_id, stripe_annual_price_id, stripe_lifetime_price_id",
      )
      .eq("addon_id", addonId)
      .eq("is_active", true)
      .maybeSingle();

    if (addonErr || !addon) {
      return new Response(JSON.stringify({ error: "Add-on not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    if (!stripeSecretKey) throw new Error("Stripe not configured");
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

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

    const stripePriceId =
      planType === "monthly"
        ? (addon.stripe_monthly_price_id as string | null)
        : planType === "annual"
          ? (addon.stripe_annual_price_id as string | null)
          : (addon.stripe_lifetime_price_id as string | null);

    if (!stripePriceId) {
      throw new Error("Stripe price not configured for this add-on plan");
    }

    const mode = planType === "lifetime" ? "payment" : "subscription";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      mode: mode as any,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        purchase_type: "addon",
        addon_id: addonId,
        plan_type: planType,
        supabase_user_id: user.id,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("create-addon-checkout-session error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
