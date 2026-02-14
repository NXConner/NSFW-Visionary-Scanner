import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { buildRateLimitHeaders, enforceRateLimit } from "../_shared/rateLimit.ts";
import { deliverBroadcastNotification } from "../_shared/broadcastNotificationsDispatch.ts";
import type { BroadcastNotificationRow } from "../_shared/broadcastNotifications.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function nowIso(): string {
  return new Date().toISOString();
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const rate = await enforceRateLimit({
      identifier: "system",
      endpoint: "dispatch-broadcast-notifications",
      windowSeconds: 60,
      maxRequests: 6,
    });
    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: {
          ...corsHeaders,
          ...buildRateLimitHeaders(rate),
          "Content-Type": "application/json",
        },
      });
    }

    const now = nowIso();

    // Grab a small batch of due scheduled notifications.
    const { data: due, error: dueErr } = await supabaseAdmin
      .from("app_broadcast_notifications")
      .select("*")
      .eq("status", "scheduled")
      .eq("is_deleted", false)
      .lte("scheduled_for", now)
      .order("scheduled_for", { ascending: true })
      .limit(10);
    if (dueErr) throw dueErr;

    const results: Array<{
      id: string;
      ok: boolean;
      skipped?: boolean;
      error?: string;
      targetCount?: number;
    }> = [];

    for (const row of (due ?? []) as unknown as BroadcastNotificationRow[]) {
      const id = String((row as any).id ?? "");
      if (!id) continue;

      // Atomic transition: scheduled -> sent (idempotent if called multiple times).
      const { data: updated, error: updErr } = await supabaseAdmin
        .from("app_broadcast_notifications")
        .update({
          status: "sent",
          sent_at: nowIso(),
          scheduled_for: null,
          updated_at: nowIso(),
          last_error: null,
        })
        .eq("id", id)
        .eq("status", "scheduled")
        .select("*")
        .maybeSingle();

      if (updErr) {
        results.push({ id, ok: false, error: updErr.message });
        continue;
      }
      if (!updated) {
        results.push({ id, ok: true, skipped: true });
        continue;
      }

      try {
        const deliveryRes = await deliverBroadcastNotification({
          supabaseAdmin,
          row: updated as unknown as BroadcastNotificationRow,
          dryRun: false,
        });
        results.push({ id, ok: true, targetCount: deliveryRes.targetCount });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // Store the last error for visibility in admin UI.
        try {
          await supabaseAdmin
            .from("app_broadcast_notifications")
            .update({ last_error: msg, updated_at: nowIso() })
            .eq("id", id);
        } catch {
          // ignore
        }
        results.push({ id, ok: false, error: msg });
      }
    }

    return new Response(JSON.stringify({ ok: true, now, processed: results.length, results }), {
      status: 200,
      headers: {
        ...corsHeaders,
        ...buildRateLimitHeaders(rate),
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
