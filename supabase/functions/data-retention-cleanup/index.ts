import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Retention periods (in days)
const RETENTION_PERIODS = {
  scan_history: 365, // 1 year
  health_diary: 730, // 2 years
  user_preferences: 0, // Keep indefinitely (user settings)
  device_tokens: 90, // 3 months (inactive tokens)
  audit_logs: 90, // 3 months
} as const;

interface RetentionConfig {
  table: string;
  dateColumn: string;
  retentionDays: number;
  notifyDaysBefore?: number;
}

const retentionConfigs: RetentionConfig[] = [
  {
    table: "scan_history",
    dateColumn: "created_at",
    retentionDays: RETENTION_PERIODS.scan_history,
    notifyDaysBefore: 30,
  },
  {
    table: "health_diary",
    dateColumn: "created_at",
    retentionDays: RETENTION_PERIODS.health_diary,
    notifyDaysBefore: 30,
  },
  {
    table: "device_tokens",
    dateColumn: "last_used_at",
    retentionDays: RETENTION_PERIODS.device_tokens,
  },
];

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const results: Record<string, { deleted: number; notified: number }> = {};

    for (const config of retentionConfigs) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);

      // Find records to delete
      const { data: recordsToDelete, error: findError } = await supabaseClient
        .from(config.table)
        .select("id, user_id")
        .lt(config.dateColumn, cutoffDate.toISOString());

      if (findError) {
        console.error(`Error finding records in ${config.table}:`, findError);
        continue;
      }

      if (!recordsToDelete || recordsToDelete.length === 0) {
        results[config.table] = { deleted: 0, notified: 0 };
        continue;
      }

      // Notify users if configured
      let notified = 0;
      if (config.notifyDaysBefore) {
        const notifyDate = new Date();
        notifyDate.setDate(notifyDate.getDate() - (config.retentionDays - config.notifyDaysBefore));

        const { data: recordsToNotify } = await supabaseClient
          .from(config.table)
          .select("user_id")
          .lt(config.dateColumn, notifyDate.toISOString())
          .gte(config.dateColumn, cutoffDate.toISOString());

        if (recordsToNotify) {
          const uniqueUserIds = [...new Set(recordsToNotify.map(r => r.user_id))];
          // TODO: Send notification emails to users
          notified = uniqueUserIds.length;
        }
      }

      // Delete old records
      const { error: deleteError } = await supabaseClient
        .from(config.table)
        .delete()
        .lt(config.dateColumn, cutoffDate.toISOString());

      if (deleteError) {
        console.error(`Error deleting from ${config.table}:`, deleteError);
        results[config.table] = { deleted: 0, notified };
        continue;
      }

      results[config.table] = {
        deleted: recordsToDelete.length,
        notified,
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
