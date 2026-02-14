import { supabase } from "@/integrations/supabase/client";

import type {
  AdminBroadcastChannels,
  AdminBroadcastNotificationDto,
  AdminBroadcastNotificationUpsertInput,
  AdminBroadcastNotificationsListResponse,
  AdminBroadcastNotificationsStats,
} from "./types";

function edgeErrorMessage(e: unknown): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  return String(e);
}

function normalizeChannels(input: unknown): AdminBroadcastChannels {
  const obj = (input && typeof input === "object" ? (input as Record<string, unknown>) : {}) ?? {};
  const inApp = Boolean(obj.in_app ?? obj.inApp ?? obj["in-app"] ?? true);
  return { inApp, push: Boolean(obj.push ?? false), email: Boolean(obj.email ?? false) };
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function asNumber(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function mapRowToDto(row: Record<string, unknown>): AdminBroadcastNotificationDto {
  const audienceUserIds = Array.isArray(row.audience_user_ids)
    ? (row.audience_user_ids as unknown[]).map(asString).filter(Boolean)
    : Array.isArray(row.audienceUserIds)
      ? (row.audienceUserIds as unknown[]).map(asString).filter(Boolean)
      : [];

  const channels = normalizeChannels(row.channels);

  return {
    id: asString(row.id),
    createdBy: row.created_by ? asString(row.created_by) : null,
    title: asString(row.title),
    message: asString(row.message),
    type: asString(row.type) as any,
    audience: asString(row.audience) as any,
    audienceUserIds,
    channels,
    status: asString(row.status) as any,
    scheduledForIso: row.scheduled_for ? asString(row.scheduled_for) : null,
    sentAtIso: row.sent_at ? asString(row.sent_at) : null,
    targetCount: asNumber(row.target_count, 0),
    readCount: asNumber(row.read_count, 0),
    lastError: row.last_error ? asString(row.last_error) : null,
    isDeleted: Boolean(row.is_deleted ?? false),
    deletedAtIso: row.deleted_at ? asString(row.deleted_at) : null,
    createdAtIso: asString(row.created_at),
    updatedAtIso: asString(row.updated_at),
    metadata: (row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : undefined) as any,
  };
}

function mapStats(input: unknown): AdminBroadcastNotificationsStats {
  const obj = (input && typeof input === "object" ? (input as Record<string, unknown>) : {}) ?? {};
  const totalUsers =
    typeof obj.totalUsers === "number"
      ? obj.totalUsers
      : typeof obj.totalUsers === "string"
        ? Number(obj.totalUsers)
        : null;
  const totalTokens =
    typeof obj.totalTokens === "number"
      ? obj.totalTokens
      : typeof obj.totalTokens === "string"
        ? Number(obj.totalTokens)
        : null;
  return {
    totalUsers: Number.isFinite(totalUsers as any) ? (totalUsers as number) : null,
    totalTokens: Number.isFinite(totalTokens as any) ? (totalTokens as number) : null,
  };
}

export async function adminListBroadcastNotifications(params?: {
  limit?: number;
  includeDeleted?: boolean;
}): Promise<AdminBroadcastNotificationsListResponse> {
  const { data, error } = await supabase.functions.invoke("admin-notifications", {
    body: {
      action: "list",
      limit: params?.limit ?? 200,
      includeDeleted: params?.includeDeleted ?? false,
    },
  });
  if (error) throw new Error(error.message);
  const notifications = ((data?.notifications || []) as Array<Record<string, unknown>>).map(
    mapRowToDto,
  );
  const stats = mapStats(data?.stats);
  return { notifications, stats };
}

export async function adminSaveBroadcastDraft(
  input: AdminBroadcastNotificationUpsertInput,
): Promise<AdminBroadcastNotificationDto> {
  try {
    const { data, error } = await supabase.functions.invoke("admin-notifications", {
      body: { action: "save_draft", notification: input },
    });
    if (error) throw new Error(error.message);
    return mapRowToDto((data?.notification ?? {}) as Record<string, unknown>);
  } catch (e) {
    throw new Error(edgeErrorMessage(e));
  }
}

export async function adminScheduleBroadcastNotification(
  input: AdminBroadcastNotificationUpsertInput & { scheduledForIso: string },
): Promise<AdminBroadcastNotificationDto> {
  try {
    const { data, error } = await supabase.functions.invoke("admin-notifications", {
      body: { action: "schedule", notification: input },
    });
    if (error) throw new Error(error.message);
    return mapRowToDto((data?.notification ?? {}) as Record<string, unknown>);
  } catch (e) {
    throw new Error(edgeErrorMessage(e));
  }
}

export async function adminSendBroadcastNow(
  input: AdminBroadcastNotificationUpsertInput & { dryRun?: boolean },
): Promise<{
  notification: AdminBroadcastNotificationDto;
  targetCount: number;
  delivery: Record<string, unknown> | null;
  lastError: string | null;
  recipients: { users: number; capped: boolean } | null;
}> {
  try {
    const { data, error } = await supabase.functions.invoke("admin-notifications", {
      body: { action: "send_now", notification: input, dryRun: input.dryRun ?? false },
    });
    if (error) throw new Error(error.message);
    const notification = mapRowToDto((data?.notification ?? {}) as Record<string, unknown>);
    return {
      notification,
      targetCount:
        typeof data?.targetCount === "number" ? data.targetCount : Number(data?.targetCount ?? 0),
      delivery: (data?.delivery as Record<string, unknown> | undefined) ?? null,
      lastError: data?.lastError ? String(data.lastError) : null,
      recipients: data?.recipients ? (data.recipients as any) : null,
    };
  } catch (e) {
    throw new Error(edgeErrorMessage(e));
  }
}

export async function adminCancelBroadcastNotification(
  id: string,
): Promise<AdminBroadcastNotificationDto | null> {
  const { data, error } = await supabase.functions.invoke("admin-notifications", {
    body: { action: "cancel", id },
  });
  if (error) throw new Error(error.message);
  if (!data?.notification) return null;
  return mapRowToDto(data.notification as Record<string, unknown>);
}

export async function adminDeleteBroadcastNotification(
  id: string,
): Promise<AdminBroadcastNotificationDto | null> {
  const { data, error } = await supabase.functions.invoke("admin-notifications", {
    body: { action: "delete", id },
  });
  if (error) throw new Error(error.message);
  if (!data?.notification) return null;
  return mapRowToDto(data.notification as Record<string, unknown>);
}
