import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPushToTargets, type PushTarget } from "../_shared/push.ts";
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

    const rate = await enforceRateLimit({
      identifier: "system",
      endpoint: "send-health-reminder",
      windowSeconds: 60,
      maxRequests: 5,
    });
    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        headers: { ...corsHeaders, ...buildRateLimitHeaders(rate), "Content-Type": "application/json" },
        status: 429,
      });
    }

    const now = new Date();
    const DEFAULT_PREFS = {
      enabled: false,
      scanReminders: true,
      healthAlerts: true,
      healthSchedule: { hour: 8, minute: 0 },
      timezone: "UTC",
    };

    const { data: users, error: usersError } = await supabaseClient
      .from("user_preferences")
      .select("user_id, notification_preferences");

    if (usersError) {
      throw usersError;
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users with health reminders enabled", sent: 0 }),
        {
          headers: { ...corsHeaders, ...buildRateLimitHeaders(rate), "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    const dueUserIds: string[] = [];

    for (const entry of users) {
      const prefs = (entry.notification_preferences ?? {}) as Record<string, unknown>;
      const enabled = typeof prefs.enabled === "boolean" ? prefs.enabled : DEFAULT_PREFS.enabled;
      const scanReminders =
        typeof prefs.scanReminders === "boolean" ? prefs.scanReminders : DEFAULT_PREFS.scanReminders;
      const healthAlerts =
        typeof prefs.healthAlerts === "boolean" ? prefs.healthAlerts : DEFAULT_PREFS.healthAlerts;
      const schedule = (prefs.healthSchedule as { hour?: number; minute?: number }) || {};
      const timezone = typeof prefs.timezone === "string" ? prefs.timezone : DEFAULT_PREFS.timezone;
      const hour =
        typeof schedule.hour === "number" ? schedule.hour : DEFAULT_PREFS.healthSchedule.hour;
      const minute =
        typeof schedule.minute === "number" ? schedule.minute : DEFAULT_PREFS.healthSchedule.minute;

      if (!enabled || (!scanReminders && !healthAlerts)) continue;

      const localNow = new Date(
        now.toLocaleString("en-US", { timeZone: timezone || "UTC" }),
      );
      if (localNow.getHours() === hour && localNow.getMinutes() === minute) {
        dueUserIds.push(entry.user_id);
      }
    }

    if (dueUserIds.length === 0) {
      return new Response(
        JSON.stringify({ message: "No reminders due for current time window", sent: 0 }),
        {
          headers: { ...corsHeaders, ...buildRateLimitHeaders(rate), "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // Get device tokens for these users
    const { data: tokens, error: tokensError } = await supabaseClient
      .from("device_tokens")
      .select("token, user_id, platform")
      .in("user_id", dueUserIds);

    if (tokensError) {
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: "No device tokens found", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Send notifications via send-push-notification function
    const targets: PushTarget[] = tokens
      .filter(t => t.token)
      .map(t => ({
        token: t.token,
        platform:
          t.platform === "ios" || t.platform === "android" || t.platform === "web"
            ? t.platform
            : "android",
      }));

    const notificationResponse = await sendPushToTargets(targets, {
      title: "📊 Health Check Reminder",
      body: "Time for your daily health tracking!",
      data: {
        type: "health_reminder",
        action: "open_scanner",
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        users_notified: dueUserIds.length,
        tokens_sent: targets.length,
        notification_response: notificationResponse,
      }),
      {
        headers: { ...corsHeaders, ...buildRateLimitHeaders(rate), "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error sending health reminders:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
