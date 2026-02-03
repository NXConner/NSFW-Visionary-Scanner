import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveEmailFromEnv, sendResendEmail } from "../_shared/email.ts";
import { buildRateLimitHeaders, enforceRateLimit } from "../_shared/rateLimit.ts";

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

    const rate = await enforceRateLimit({
      identifier: user.id,
      endpoint: "delete-user-account",
      windowSeconds: 3600,
      maxRequests: 2,
    });
    if (!rate.allowed) {
      return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, ...buildRateLimitHeaders(rate), "Content-Type": "application/json" },
      });
    }

    const sendDeletionEmail = async (email: string) => {
      const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
      if (!resendKey) return false;
      const from = resolveEmailFromEnv();
      const subject = "Your account has been deleted";
      const html = `
        <p>Hello,</p>
        <p>This is a confirmation that your account and associated data have been deleted.</p>
        <p>If you did not request this, please contact support immediately.</p>
      `;
      try {
        let eventId: string | null = null;
        try {
          const { data: ev, error: evErr } = await supabaseClient
            .from("email_send_events")
            .insert({
              campaign_id: "account-deletion",
              user_id: user.id,
              to_email: email,
              provider: "resend",
              provider_message_id: null,
              status: "queued",
              error_message: null,
              sent_at: null,
            })
            .select("*")
            .single();
          if (!evErr && ev?.id) eventId = ev.id;
        } catch (error) {
          console.warn("Failed to log email send event:", error);
        }

        const sent = await sendResendEmail({
          to: email,
          subject,
          html,
          from,
          apiKey: resendKey,
        });

        if (eventId) {
          await supabaseClient
            .from("email_send_events")
            .update({
              provider_message_id: sent.id,
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", eventId);
        }
        return true;
      } catch (error) {
        console.warn("Account deletion email failed:", error);
        return false;
      }
    };

    if (user.email) {
      await sendDeletionEmail(user.email);
    }

    // Delete all user data from tables
    const tablesToClean = [
      "api_usage_analytics",
      "api_keys",
      "app_analytics_events",
      "dlc_analytics_events",
      "dlc_backup_status",
      "dlc_content_library",
      "dlc_download_queue",
      "dlc_purchases",
      "device_tokens",
      "email_analytics",
      "health_diary",
      "scan_history",
      "user_preferences",
      "user_roles",
      "user_subscriptions",
      "webhooks",
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
        headers: { ...corsHeaders, ...buildRateLimitHeaders(rate), "Content-Type": "application/json" },
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
