import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { userId } = await req.json();

    // Verify the user is deleting their own account
    if (userId !== user.id) {
      throw new Error("Unauthorized: Can only delete your own account");
    }

    // Delete all user data from tables
    const tablesToClean = [
      "user_subscriptions",
      "device_tokens",
      "user_preferences",
      "scan_history",
      "health_diary",
      "user_roles",
      "profiles",
    ];

    for (const table of tablesToClean) {
      try {
        const { error } = await supabaseClient.from(table).delete().eq("user_id", user.id);

        if (error && error.code !== "PGRST116") {
          console.error(`Error deleting from ${table}:`, error);
        }
      } catch (error) {
        console.error(`Failed to delete from ${table}:`, error);
      }
    }

    // Cancel active subscription if exists
    try {
      const { data: subscription } = await supabaseClient
        .from("user_subscriptions")
        .select("stripe_subscription_id")
        .eq("user_id", user.id)
        .single();

      if (subscription?.stripe_subscription_id) {
        // Import Stripe
        const Stripe = (await import("https://esm.sh/stripe@12.0.0")).default;
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
          apiVersion: "2023-10-16",
        });

        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
        console.log("Subscription cancelled:", subscription.stripe_subscription_id);
      }
    } catch (error) {
      console.warn("No subscription to cancel or error cancelling:", error);
    }

    // Delete the auth user
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account deleted successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error deleting account:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
