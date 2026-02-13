import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Get the user from the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      throw new Error("Invalid user token");
    }

    const { subscriptionId, newPlanId } = await req.json();

    if (!subscriptionId || !newPlanId) {
      throw new Error("Subscription ID and new plan ID are required");
    }

    // Get the plan details
    const plans = {
      pro: { priceId: Deno.env.get("STRIPE_PRO_PRICE_ID") },
      premium: { priceId: Deno.env.get("STRIPE_PREMIUM_PRICE_ID") },
    };

    const newPlan = plans[newPlanId as keyof typeof plans];
    if (!newPlan) {
      throw new Error("Invalid plan ID");
    }

    // Verify the subscription belongs to the user
    const { data: subscription, error: subError } = await supabaseClient
      .from("user_subscriptions")
      .select("stripe_subscription_id, user_id, stripe_subscription_id")
      .eq("stripe_subscription_id", subscriptionId)
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription) {
      throw new Error("Subscription not found or does not belong to user");
    }

    // Get the current subscription from Stripe
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Update the subscription in Stripe
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: currentSubscription.items.data[0].id,
          price: newPlan.priceId,
        },
      ],
      proration_behavior: "always_invoice",
    });

    // Update the subscription in the database
    const { error: dbError } = await supabaseClient
      .from("user_subscriptions")
      .update({
        plan_id: newPlanId,
        status: updatedSubscription.status,
        current_period_start: new Date(updatedSubscription.current_period_start * 1000),
        current_period_end: new Date(updatedSubscription.current_period_end * 1000),
        updated_at: new Date(),
      })
      .eq("stripe_subscription_id", subscriptionId);

    if (dbError) {
      console.error("Error updating subscription in database:", dbError);
      throw dbError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          plan_id: newPlanId,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error updating subscription:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
