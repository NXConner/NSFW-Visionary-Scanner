import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getPrivilegedFlags } from "../_shared/privileged.ts";
import { buildRateLimitHeaders, enforceRateLimit } from "../_shared/rateLimit.ts";
import {
  countAllUsers,
  normalizeChannels,
  validateBroadcastInput,
  type BroadcastNotificationAudience,
  type BroadcastNotificationRow,
  type BroadcastNotificationStatus,
  type BroadcastNotificationType,
} from "../_shared/broadcastNotifications.ts";
import { deliverBroadcastNotification } from "../_shared/broadcastNotificationsDispatch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody =
  | { action: "list"; limit?: number; includeDeleted?: boolean }
  | { action: "save_draft"; notification: Record<string, unknown> }
  | { action: "schedule"; notification: Record<string, unknown> }
  | { action: "send_now"; notification: Record<string, unknown>; dryRun?: boolean }
  | { action: "cancel"; id: string }
  | { action: "delete"; id: string };

function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function asBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  return false;
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeSpecificTargets(params: {
  audienceUserIds: string[];
  audienceEmails?: string[];
}): { userIds: string[]; emails: string[] } {
  const userIds = Array.from(
    new Set(params.audienceUserIds.map(v => asString(v).trim()).filter(Boolean)),
  );
  const emails = Array.from(
    new Set(
      (params.audienceEmails ?? []).map(v => asString(v).trim().toLowerCase()).filter(Boolean),
    ),
  );
  return { userIds, emails };
}

async function resolveSpecificUserIdsFromEmails(params: {
  supabaseAdmin: any;
  emails: string[];
  max: number;
}): Promise<string[]> {
  if (params.emails.length === 0) return [];
  const unique = params.emails.slice(0, params.max);
  const { data, error } = await params.supabaseAdmin
    .from("profiles")
    .select("user_id,email")
    .in("email", unique);
  if (error) throw error;
  const ids = (data ?? []).map((r: any) => asString(r?.user_id).trim()).filter(Boolean);
  return Array.from(new Set(ids));
}

async function listBroadcastNotifications(params: {
  supabaseAdmin: any;
  limit: number;
  includeDeleted: boolean;
}): Promise<BroadcastNotificationRow[]> {
  let q = params.supabaseAdmin
    .from("app_broadcast_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(params.limit);

  if (!params.includeDeleted) q = q.eq("is_deleted", false);

  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as unknown as BroadcastNotificationRow[]) ?? [];
}

async function upsertNotificationRow(params: {
  supabaseAdmin: any;
  requesterId: string;
  normalized: ReturnType<typeof validateBroadcastInput>;
  mode: "draft" | "schedule" | "send";
  dryRun?: boolean;
}): Promise<BroadcastNotificationRow> {
  const ts = nowIso();

  const status: BroadcastNotificationStatus =
    params.mode === "draft" ? "draft" : params.mode === "schedule" ? "scheduled" : "sent";

  const base = {
    title: params.normalized.title,
    message: params.normalized.message,
    type: params.normalized.type as BroadcastNotificationType,
    audience: params.normalized.audience as BroadcastNotificationAudience,
    audience_user_ids: params.normalized.audienceUserIds,
    channels: params.normalized.channels,
    status,
    scheduled_for: status === "scheduled" ? (params.normalized.scheduledForIso ?? ts) : null,
    sent_at: status === "sent" ? ts : null,
    last_error: null,
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
    updated_at: ts,
  } as Record<string, unknown>;

  const isInsert = !params.normalized.id;
  if (isInsert) {
    base.created_by = params.requesterId;
    base.created_at = ts;
  }

  if (params.dryRun) {
    // For "send_now" dry runs, return a synthetic row (not persisted) for UI preview.
    return {
      id: params.normalized.id ?? "dry-run",
      created_by: params.requesterId,
      title: params.normalized.title,
      message: params.normalized.message,
      type: params.normalized.type,
      audience: params.normalized.audience,
      audience_user_ids: params.normalized.audienceUserIds,
      channels: params.normalized.channels,
      status,
      scheduled_for: (base.scheduled_for as string | null) ?? null,
      sent_at: (base.sent_at as string | null) ?? null,
      target_count: 0,
      read_count: 0,
      last_error: null,
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
      metadata: {},
      created_at: ts,
      updated_at: ts,
    };
  }

  const q = isInsert
    ? params.supabaseAdmin.from("app_broadcast_notifications").insert(base)
    : params.supabaseAdmin
        .from("app_broadcast_notifications")
        .update(base)
        .eq("id", params.normalized.id);

  const { data, error } = await q.select("*").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Unable to save notification");
  return data as BroadcastNotificationRow;
}

async function countDeviceTokens(supabaseAdmin: any): Promise<number | null> {
  try {
    const { count, error } = await supabaseAdmin.from("device_tokens").select("token", {
      count: "exact",
      head: true,
    });
    if (error) return null;
    return typeof count === "number" ? count : null;
  } catch {
    return null;
  }
}

async function sendBroadcastNow(params: {
  supabaseAdmin: any;
  requesterId: string;
  normalized: ReturnType<typeof validateBroadcastInput>;
  dryRun: boolean;
}) {
  // Persist as sent (unless dryRun)
  const row = await upsertNotificationRow({
    supabaseAdmin: params.supabaseAdmin,
    requesterId: params.requesterId,
    normalized: { ...params.normalized, status: "sent" as any, scheduledForIso: null },
    mode: "send",
    dryRun: params.dryRun,
  });
  const deliveryRes = await deliverBroadcastNotification({
    supabaseAdmin: params.supabaseAdmin,
    row,
    dryRun: params.dryRun,
  });

  return {
    notification: row,
    targetCount: deliveryRes.targetCount,
    delivery: deliveryRes.delivery,
    lastError: deliveryRes.lastError,
    recipients: { users: deliveryRes.audienceUserIds.length, capped: deliveryRes.cappedUsers },
  };
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: userRes, error: authError } = await supabaseAdmin.auth.getUser(token);
    const requester = userRes?.user ?? null;
    if (authError || !requester) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { isPrivileged } = await getPrivilegedFlags(supabaseAdmin, requester.id, requester.email);
    if (!isPrivileged) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rate = await enforceRateLimit({
      identifier: requester.id,
      endpoint: "admin-notifications",
      windowSeconds: 60,
      maxRequests: 30,
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

    const body = (await req.json()) as ReqBody;

    if (body.action === "list") {
      const limit = clampInt((body as any).limit, 1, 500, 200);
      const includeDeleted = asBool((body as any).includeDeleted);
      const notifications = await listBroadcastNotifications({
        supabaseAdmin,
        limit,
        includeDeleted,
      });
      const [totalUsers, totalTokens] = await Promise.all([
        countAllUsers(supabaseAdmin),
        countDeviceTokens(supabaseAdmin),
      ]);
      return new Response(
        JSON.stringify({ ok: true, notifications, stats: { totalUsers, totalTokens } }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            ...buildRateLimitHeaders(rate),
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (body.action === "save_draft") {
      const incoming = (body as any).notification as Record<string, unknown>;
      const audience = asString(incoming.audience)
        .trim()
        .toLowerCase() as BroadcastNotificationAudience;
      let audienceUserIds: string[] = Array.isArray(
        incoming.audienceUserIds ?? incoming.audience_user_ids,
      )
        ? ((incoming.audienceUserIds ?? incoming.audience_user_ids) as unknown[])
            .map(v => asString(v).trim())
            .filter(Boolean)
        : [];
      const emailsRaw: string[] = Array.isArray((incoming as any).audienceEmails)
        ? ((incoming as any).audienceEmails as unknown[])
            .map(v => asString(v).trim().toLowerCase())
            .filter(Boolean)
        : [];
      if (audience === "specific") {
        const targets = normalizeSpecificTargets({ audienceUserIds, audienceEmails: emailsRaw });
        const idsFromEmails = await resolveSpecificUserIdsFromEmails({
          supabaseAdmin,
          emails: targets.emails,
          max: 200,
        });
        audienceUserIds = Array.from(new Set([...targets.userIds, ...idsFromEmails]));
      }

      const normalized = validateBroadcastInput({
        ...incoming,
        audienceUserIds,
        status: "draft",
      });
      const row = await upsertNotificationRow({
        supabaseAdmin,
        requesterId: requester.id,
        normalized,
        mode: "draft",
      });
      return new Response(JSON.stringify({ ok: true, notification: row }), {
        status: 200,
        headers: {
          ...corsHeaders,
          ...buildRateLimitHeaders(rate),
          "Content-Type": "application/json",
        },
      });
    }

    if (body.action === "schedule") {
      const incoming = (body as any).notification as Record<string, unknown>;
      const audience = asString(incoming.audience)
        .trim()
        .toLowerCase() as BroadcastNotificationAudience;
      let audienceUserIds: string[] = Array.isArray(
        incoming.audienceUserIds ?? incoming.audience_user_ids,
      )
        ? ((incoming.audienceUserIds ?? incoming.audience_user_ids) as unknown[])
            .map(v => asString(v).trim())
            .filter(Boolean)
        : [];
      const emailsRaw: string[] = Array.isArray((incoming as any).audienceEmails)
        ? ((incoming as any).audienceEmails as unknown[])
            .map(v => asString(v).trim().toLowerCase())
            .filter(Boolean)
        : [];
      if (audience === "specific") {
        const targets = normalizeSpecificTargets({ audienceUserIds, audienceEmails: emailsRaw });
        const idsFromEmails = await resolveSpecificUserIdsFromEmails({
          supabaseAdmin,
          emails: targets.emails,
          max: 200,
        });
        audienceUserIds = Array.from(new Set([...targets.userIds, ...idsFromEmails]));
      }

      const normalized = validateBroadcastInput({
        ...incoming,
        audienceUserIds,
        status: "scheduled",
      });
      if (!normalized.scheduledForIso) throw new Error("Missing scheduledForIso");
      const row = await upsertNotificationRow({
        supabaseAdmin,
        requesterId: requester.id,
        normalized,
        mode: "schedule",
      });
      return new Response(JSON.stringify({ ok: true, notification: row }), {
        status: 200,
        headers: {
          ...corsHeaders,
          ...buildRateLimitHeaders(rate),
          "Content-Type": "application/json",
        },
      });
    }

    if (body.action === "send_now") {
      const dryRun = asBool((body as any).dryRun);
      const incoming = (body as any).notification as Record<string, unknown>;

      // Support "specific" audience targeting by emails in addition to user IDs.
      const audience = asString(incoming.audience)
        .trim()
        .toLowerCase() as BroadcastNotificationAudience;
      let audienceUserIds: string[] = Array.isArray(
        incoming.audienceUserIds ?? incoming.audience_user_ids,
      )
        ? ((incoming.audienceUserIds ?? incoming.audience_user_ids) as unknown[])
            .map(v => asString(v).trim())
            .filter(Boolean)
        : [];
      const emailsRaw: string[] = Array.isArray((incoming as any).audienceEmails)
        ? ((incoming as any).audienceEmails as unknown[])
            .map(v => asString(v).trim().toLowerCase())
            .filter(Boolean)
        : [];

      if (audience === "specific") {
        const targets = normalizeSpecificTargets({ audienceUserIds, audienceEmails: emailsRaw });
        const idsFromEmails = await resolveSpecificUserIdsFromEmails({
          supabaseAdmin,
          emails: targets.emails,
          max: 200,
        });
        audienceUserIds = Array.from(new Set([...targets.userIds, ...idsFromEmails]));
      }

      const channels = normalizeChannels(incoming.channels);
      const normalized = validateBroadcastInput({
        ...incoming,
        audienceUserIds: audienceUserIds,
        channels,
        status: "sent",
        scheduledForIso: null,
      });

      const result = await sendBroadcastNow({
        supabaseAdmin,
        requesterId: requester.id,
        normalized,
        dryRun,
      });

      return new Response(JSON.stringify({ ok: true, ...result }), {
        status: 200,
        headers: {
          ...corsHeaders,
          ...buildRateLimitHeaders(rate),
          "Content-Type": "application/json",
        },
      });
    }

    if (body.action === "cancel") {
      const id = asString((body as any).id).trim();
      if (!id) throw new Error("Missing id");
      const { data, error } = await supabaseAdmin
        .from("app_broadcast_notifications")
        .update({ status: "cancelled", scheduled_for: null, updated_at: nowIso() })
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, notification: data ?? null }), {
        status: 200,
        headers: {
          ...corsHeaders,
          ...buildRateLimitHeaders(rate),
          "Content-Type": "application/json",
        },
      });
    }

    if (body.action === "delete") {
      const id = asString((body as any).id).trim();
      if (!id) throw new Error("Missing id");
      const { data, error } = await supabaseAdmin
        .from("app_broadcast_notifications")
        .update({
          is_deleted: true,
          deleted_at: nowIso(),
          deleted_by: requester.id,
          updated_at: nowIso(),
        })
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, notification: data ?? null }), {
        status: 200,
        headers: {
          ...corsHeaders,
          ...buildRateLimitHeaders(rate),
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
