import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.0.0";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, idempotency-key",
};

type Json = Record<string, unknown>;

type BillingDetails = {
  name?: string;
  email?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
};

const asString = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
const asNumber = (v: unknown): number | undefined => (typeof v === "number" ? v : undefined);

function jsonResponse(status: number, body: Json): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function badRequest(message: string, details?: Json): Response {
  return jsonResponse(400, { error: message, ...(details ? { details } : {}) });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse(401, { error: "Unauthorized" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse(500, { error: "Server misconfigured: missing Supabase env" });
    }

  const rateLimitResponse = await applyRateLimit({
    req,
    endpoint: "create-payment-intent",
    ...DEFAULT_EDGE_RATE_LIMIT,
    headers: corsHeaders,
  });
  if (rateLimitResponse) return rateLimitResponse;

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey)
      return jsonResponse(500, { error: "Server misconfigured: missing Stripe env" });

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) return jsonResponse(401, { error: "Invalid authentication" });

    const body = (await req.json()) as Json;
    const amount = asNumber(body.amount);
    const currency = (asString(body.currency) || "usd").toLowerCase();
    const paymentMethodId = asString(body.paymentMethodId);
    const billingDetails = (body.billingDetails as BillingDetails | undefined) ?? undefined;

    if (!amount || !Number.isFinite(amount) || amount < 50) {
      return badRequest("Invalid amount (expected cents >= 50)", { amount });
    }
    if (!/^[a-z]{3}$/i.test(currency)) return badRequest("Invalid currency", { currency });
    if (!paymentMethodId) return badRequest("Missing paymentMethodId");

    const idempotencyKey =
      req.headers.get("idempotency-key") || asString(body.idempotencyKey) || undefined;

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Ensure a Stripe customer exists for the user
    let { data: subscriptionRow } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = subscriptionRow?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: billingDetails?.name,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Best-effort upsert of customer reference
      await supabase.from("user_subscriptions").upsert(
        {
          user_id: user.id,
          stripe_customer_id: customerId,
          status: "incomplete",
        },
        { onConflict: "user_id" },
      );
    }

    // Create a PaymentIntent. The client will confirm it with confirmCardPayment.
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(amount),
        currency,
        customer: customerId,
        payment_method: paymentMethodId,
        // Let the client confirm with the provided payment method
        confirmation_method: "automatic",
        confirm: false,
        receipt_email: billingDetails?.email ?? user.email ?? undefined,
        description: "MorphoScan Pro purchase",
        metadata: {
          supabase_user_id: user.id,
        },
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );

    return jsonResponse(200, {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("create-payment-intent error:", error);
    return jsonResponse(400, { error: message });
  }
});
