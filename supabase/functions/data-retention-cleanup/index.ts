import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveEmailFromEnv, sendResendEmail } from "../_shared/email.ts";
import { buildRateLimitHeaders, enforceRateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default retention periods (in days)
const DEFAULT_RETENTION = {
  scan_history: 365,
  health_diary: 730,
  auto_cleanup_enabled: true,
  notify_before_deletion: true,
  notify_days_before: 30,
} as const;

function normalizePreferences(input: Record<string, unknown> | null | undefined) {
  const prefs = input ?? {};
  const scanHistory =
    typeof prefs.scan_history === "number" ? prefs.scan_history : DEFAULT_RETENTION.scan_history;
  const healthDiary =
    typeof prefs.health_diary === "number" ? prefs.health_diary : DEFAULT_RETENTION.health_diary;
  return {
    scan_history: Math.max(0, Math.floor(scanHistory)),
    health_diary: Math.max(0, Math.floor(healthDiary)),
    auto_cleanup_enabled:
      typeof prefs.auto_cleanup_enabled === "boolean"
        ? prefs.auto_cleanup_enabled
        : DEFAULT_RETENTION.auto_cleanup_enabled,
    notify_before_deletion:
      typeof prefs.notify_before_deletion === "boolean"
        ? prefs.notify_before_deletion
        : DEFAULT_RETENTION.notify_before_deletion,
    notify_days_before:
      typeof prefs.notify_days_before === "number"
        ? Math.max(1, Math.floor(prefs.notify_days_before))
        : DEFAULT_RETENTION.notify_days_before,
  };
}

async function sendRetentionEmail(opts: {
  supabaseClient: ReturnType<typeof createClient>;
  userId: string;
  email: string;
  subject: string;
  html: string;
}) {
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  if (!resendKey) throw new Error("RESEND_API_KEY is not configured");

  const from = resolveEmailFromEnv();

  let eventId: string | null = null;
  try {
    const { data: ev, error: evErr } = await opts.supabaseClient
      .from("email_send_events")
      .insert({
        campaign_id: "data-retention-notice",
        user_id: opts.userId,
        to_email: opts.email,
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
    to: opts.email,
    subject: opts.subject,
    html: opts.html,
    from,
    apiKey: resendKey,
  });

  if (eventId) {
    await opts.supabaseClient
      .from("email_send_events")
      .update({
        provider_message_id: sent.id,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", eventId);
  }
}

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
      endpoint: "data-retention-cleanup",
      windowSeconds: 3600,
      maxRequests: 2,
    });
    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded", success: false }), {
        headers: { ...corsHeaders, ...buildRateLimitHeaders(rate), "Content-Type": "application/json" },
        status: 429,
      });
    }

    const results: Record<string, { deleted: number; notified: number }> = {};
    const addResult = (table: string, deleted: number, notified: number) => {
      if (!results[table]) {
        results[table] = { deleted: 0, notified: 0 };
      }
      results[table].deleted += deleted;
      results[table].notified += notified;
    };

    const { data: preferenceRows, error: prefError } = await supabaseClient
      .from("user_preferences")
      .select("user_id, data_retention_preferences");

    if (prefError) {
      throw prefError;
    }

    const now = new Date();

    for (const row of preferenceRows ?? []) {
      const prefs = normalizePreferences(
        row.data_retention_preferences as Record<string, unknown> | null,
      );
      if (!prefs.auto_cleanup_enabled) continue;

      const userId = row.user_id as string;
      const cleanupConfigs = [
        { table: "scan_history", dateColumn: "created_at", retentionDays: prefs.scan_history },
        { table: "health_diary", dateColumn: "created_at", retentionDays: prefs.health_diary },
      ];

      for (const config of cleanupConfigs) {
        if (config.retentionDays === 0) continue;
        const cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);

        let notified = 0;
        if (prefs.notify_before_deletion && prefs.notify_days_before < config.retentionDays) {
          const notifyDate = new Date(now);
          notifyDate.setDate(notifyDate.getDate() - (config.retentionDays - prefs.notify_days_before));

          const { count: notifyCount } = await supabaseClient
            .from(config.table)
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .lt(config.dateColumn, notifyDate.toISOString())
            .gte(config.dateColumn, cutoffDate.toISOString());

          if (notifyCount && notifyCount > 0) {
            const { data: userRes } = await supabaseClient.auth.admin.getUserById(userId);
            const email = userRes?.user?.email;
            if (email) {
              const subject = "Upcoming data retention cleanup";
              const html = `
                <p>Hi there,</p>
                <p>Some of your data is scheduled for deletion in ${prefs.notify_days_before} days due to your retention settings.</p>
                <p>Category: <strong>${config.table.replace("_", " ")}</strong></p>
                <p>If you'd like to keep this data, update your retention settings in the app.</p>
              `;
              await sendRetentionEmail({
                supabaseClient,
                userId,
                email,
                subject,
                html,
              });
              notified = 1;
            }
          }
        }

        const { count: deletedCount, error: deleteError } = await supabaseClient
          .from(config.table)
          .delete({ count: "exact" })
          .eq("user_id", userId)
          .lt(config.dateColumn, cutoffDate.toISOString());

        if (deleteError) {
          console.error(`Error deleting from ${config.table}:`, deleteError);
          addResult(config.table, 0, notified);
        } else {
          addResult(config.table, deletedCount ?? 0, notified);
        }
      }
    }

    // Cleanup stale device tokens (90 days)
    const deviceCutoff = new Date(now);
    deviceCutoff.setDate(deviceCutoff.getDate() - 90);
    const { count: deviceDeleted, error: deviceError } = await supabaseClient
      .from("device_tokens")
      .delete({ count: "exact" })
      .lt("last_used_at", deviceCutoff.toISOString());
    if (deviceError) {
      console.error("Error deleting stale device tokens:", deviceError);
      addResult("device_tokens", 0, 0);
    } else {
      addResult("device_tokens", deviceDeleted ?? 0, 0);
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, ...buildRateLimitHeaders(rate), "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Data retention cleanup error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
