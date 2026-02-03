import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPushToTargets, type PushTarget } from "../_shared/push.ts";
import { buildRateLimitHeaders, enforceRateLimit } from "../_shared/rateLimit.ts";
import {
  isMedicationDue,
  normalizeNotificationPreferences,
} from "../_shared/notificationPreferences.ts";

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
      endpoint: "send-medication-reminder",
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
    const { data: users, error: usersError } = await supabaseClient
      .from("user_preferences")
      .select("user_id, notification_preferences");

    if (usersError) {
      throw usersError;
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users with medication reminders enabled", sent: 0 }),
        {
          headers: { ...corsHeaders, ...buildRateLimitHeaders(rate), "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    const dueUserIds: string[] = [];

    for (const entry of users) {
      const prefs = normalizeNotificationPreferences(
        (entry.notification_preferences ?? {}) as Record<string, unknown>,
      );

      if (!prefs.enabled || !prefs.medicationReminders || !prefs.medicationSchedule) continue;

      if (isMedicationDue(prefs.medicationSchedule, prefs.timezone, now)) {
        dueUserIds.push(entry.user_id);
      }
    }

    if (dueUserIds.length === 0) {
      return new Response(
        JSON.stringify({ message: "No medication reminders due for current time window", sent: 0 }),
        {
          headers: { ...corsHeaders, ...buildRateLimitHeaders(rate), "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

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
      title: "💊 Medication Reminder",
      body: "Time for your scheduled medication.",
      data: {
        type: "medication_reminder",
        action: "open_medication",
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
    console.error("Error sending medication reminders:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
