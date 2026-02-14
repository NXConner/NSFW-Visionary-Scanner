import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export type BroadcastNotificationType = "info" | "warning" | "success" | "error";
export type BroadcastNotificationAudience = "all" | "premium" | "free" | "specific";
export type BroadcastNotificationStatus = "draft" | "scheduled" | "sent" | "cancelled";

export type BroadcastChannels = {
  in_app: boolean;
  push: boolean;
  email: boolean;
};

export type BroadcastNotificationRow = {
  id: string;
  created_by: string | null;
  title: string;
  message: string;
  type: BroadcastNotificationType;
  audience: BroadcastNotificationAudience;
  audience_user_ids: string[];
  channels: Record<string, unknown> | null;
  status: BroadcastNotificationStatus;
  scheduled_for: string | null;
  sent_at: string | null;
  target_count: number | null;
  read_count: number | null;
  last_error: string | null;
  is_deleted: boolean | null;
  deleted_at: string | null;
  deleted_by: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
};

function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function asBool(v: unknown, fallback = false): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes" || s === "y") return true;
    if (s === "false" || s === "0" || s === "no" || s === "n") return false;
  }
  return fallback;
}

function isType(v: string): v is BroadcastNotificationType {
  return v === "info" || v === "warning" || v === "success" || v === "error";
}

function isAudience(v: string): v is BroadcastNotificationAudience {
  return v === "all" || v === "premium" || v === "free" || v === "specific";
}

function isStatus(v: string): v is BroadcastNotificationStatus {
  return v === "draft" || v === "scheduled" || v === "sent" || v === "cancelled";
}

export function normalizeChannels(input: unknown): BroadcastChannels {
  const obj = (input && typeof input === "object" ? (input as Record<string, unknown>) : {}) ?? {};
  // Accept both snake_case and camelCase keys (API/UI ergonomics).
  const inApp = asBool(obj.in_app ?? obj.inApp ?? obj["in-app"] ?? obj.inapp, true);
  const push = asBool(obj.push, false);
  const email = asBool(obj.email, false);
  return { in_app: inApp, push, email };
}

export function validateBroadcastInput(input: unknown): {
  id: string | null;
  title: string;
  message: string;
  type: BroadcastNotificationType;
  audience: BroadcastNotificationAudience;
  audienceUserIds: string[];
  channels: BroadcastChannels;
  status: BroadcastNotificationStatus;
  scheduledForIso: string | null;
  isDeleted: boolean;
} {
  const obj = (input && typeof input === "object" ? (input as Record<string, unknown>) : {}) ?? {};

  const idRaw = asString(obj.id).trim();
  const title = asString(obj.title).trim();
  const message = asString(obj.message).trim();
  const typeRaw = asString(obj.type).trim().toLowerCase();
  const audienceRaw = asString(obj.audience).trim().toLowerCase();
  const statusRaw = asString(obj.status).trim().toLowerCase();
  const scheduledForRaw = asString(
    obj.scheduledForIso ?? obj.scheduled_for ?? obj.scheduledFor ?? "",
  ).trim();

  if (!title) throw new Error("Missing title");
  if (!message) throw new Error("Missing message");
  if (!isType(typeRaw)) throw new Error("Invalid type");
  if (!isAudience(audienceRaw)) throw new Error("Invalid audience");
  if (!isStatus(statusRaw)) throw new Error("Invalid status");

  const channels = normalizeChannels(obj.channels);
  const isDeleted = asBool(obj.isDeleted ?? obj.is_deleted, false);

  const audienceUserIds: string[] = Array.isArray(obj.audienceUserIds ?? obj.audience_user_ids)
    ? ((obj.audienceUserIds ?? obj.audience_user_ids) as unknown[])
        .map(v => asString(v).trim())
        .filter(Boolean)
    : [];

  if (audienceRaw === "specific" && audienceUserIds.length === 0) {
    throw new Error("Specific audience requires at least one audienceUserId");
  }

  let scheduledForIso: string | null = null;
  if (scheduledForRaw) {
    const d = new Date(scheduledForRaw);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid scheduledForIso");
    scheduledForIso = d.toISOString();
  }

  return {
    id: idRaw ? idRaw : null,
    title,
    message,
    type: typeRaw,
    audience: audienceRaw,
    audienceUserIds,
    channels,
    status: statusRaw,
    scheduledForIso,
    isDeleted,
  };
}

export function mapRowToDto(row: Record<string, unknown>): BroadcastNotificationRow {
  return row as unknown as BroadcastNotificationRow;
}

export async function countAllUsers(supabaseAdmin: SupabaseClient): Promise<number | null> {
  try {
    const { count, error } = await supabaseAdmin.from("profiles").select("user_id", {
      count: "exact",
      head: true,
    });
    if (error) return null;
    return typeof count === "number" ? count : null;
  } catch {
    return null;
  }
}

type PagedQuery<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

async function fetchAllPaged<T>(params: {
  fetch: (from: number, to: number) => Promise<PagedQuery<T>>;
  pageSize: number;
  max: number;
}): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < params.max; from += params.pageSize) {
    const to = Math.min(params.max - 1, from + params.pageSize - 1);
    const { data, error } = await params.fetch(from, to);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < params.pageSize) break;
  }
  return out;
}

export async function listAllUserIds(supabaseAdmin: SupabaseClient, maxUsers = 20000) {
  const rows = await fetchAllPaged<{ user_id: string }>({
    pageSize: 1000,
    max: maxUsers,
    fetch: async (from, to) => {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .order("created_at", { ascending: true })
        .range(from, to);
      return { data: (data ?? null) as any, error: error ? { message: error.message } : null };
    },
  });
  return Array.from(new Set(rows.map(r => asString((r as any)?.user_id)).filter(Boolean)));
}

export async function listAdminUserIds(supabaseAdmin: SupabaseClient, maxUsers = 5000) {
  const rows = await fetchAllPaged<{ user_id: string; role: string }>({
    pageSize: 1000,
    max: maxUsers,
    fetch: async (from, to) => {
      const { data, error } = await supabaseAdmin
        .from("user_roles")
        .select("user_id,role")
        .in("role", ["admin", "super_admin"])
        .order("user_id", { ascending: true })
        .range(from, to);
      return { data: (data ?? null) as any, error: error ? { message: error.message } : null };
    },
  });
  return Array.from(new Set(rows.map(r => asString((r as any)?.user_id)).filter(Boolean)));
}

export async function listPremiumUserIds(supabaseAdmin: SupabaseClient, maxUsers = 20000) {
  if (maxUsers <= 0) return [];
  let subs: Array<{ user_id: string; status: string | null; current_period_end: string | null }> =
    [];
  try {
    subs = await fetchAllPaged<{
      user_id: string;
      status: string | null;
      current_period_end: string | null;
    }>({
      pageSize: 1000,
      max: maxUsers,
      fetch: async (from, to) => {
        const { data, error } = await supabaseAdmin
          .from("user_subscriptions")
          .select("user_id,status,current_period_end")
          .in("status", ["active", "trialing", "past_due"])
          .order("updated_at", { ascending: false })
          .range(from, to);
        return { data: (data ?? null) as any, error: error ? { message: error.message } : null };
      },
    });
  } catch {
    subs = [];
  }

  const now = Date.now();
  const premiumFromSubs = subs
    .filter(row => {
      const end = asString((row as any)?.current_period_end).trim();
      if (!end) return true;
      const t = new Date(end).getTime();
      if (Number.isNaN(t)) return true;
      // Small grace period to avoid flapping at boundaries
      return t > now - 24 * 60 * 60 * 1000;
    })
    .map(row => asString((row as any)?.user_id).trim())
    .filter(Boolean);

  const admins = await listAdminUserIds(supabaseAdmin);
  return Array.from(new Set([...premiumFromSubs, ...admins]));
}

export async function resolveAudienceUserIds(params: {
  supabaseAdmin: SupabaseClient;
  audience: BroadcastNotificationAudience;
  audienceUserIds: string[];
  maxUsers?: number;
}): Promise<string[]> {
  const max = params.maxUsers ?? 20000;
  if (params.audience === "specific") {
    return Array.from(new Set(params.audienceUserIds.map(v => asString(v).trim()).filter(Boolean)));
  }

  if (params.audience === "premium") {
    return await listPremiumUserIds(params.supabaseAdmin, max);
  }

  if (params.audience === "all") {
    return await listAllUserIds(params.supabaseAdmin, max);
  }

  // free = all - premium
  const [all, premium] = await Promise.all([
    listAllUserIds(params.supabaseAdmin, max),
    listPremiumUserIds(params.supabaseAdmin, max),
  ]);
  const premiumSet = new Set(premium);
  return all.filter(id => !premiumSet.has(id));
}

export function safeInt(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
