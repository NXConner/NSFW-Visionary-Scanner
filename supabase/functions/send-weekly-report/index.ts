import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPushToTargets, type PushTarget } from "../_shared/push.ts";
import { buildRateLimitHeaders, enforceRateLimit } from "../_shared/rateLimit.ts";
import {
  isWeeklyDue,
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
      endpoint: "send-weekly-report",
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
        JSON.stringify({ message: "No users with weekly reports enabled", sent: 0 }),
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

      if (!prefs.enabled || !prefs.weeklyReports) continue;

      if (isWeeklyDue(prefs.weeklyReportSchedule, prefs.timezone, now)) {
        dueUserIds.push(entry.user_id);
      }
    }

    if (dueUserIds.length === 0) {
      return new Response(
        JSON.stringify({ message: "No weekly reports due for current time window", sent: 0 }),
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
      title: "📈 Weekly Report Ready",
      body: "Your weekly health report is ready to review.",
      data: {
        type: "weekly_report",
        action: "open_reports",
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
    console.error("Error sending weekly reports:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
