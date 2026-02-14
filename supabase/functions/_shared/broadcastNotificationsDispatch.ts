import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendPushToTargets, type PushTarget } from "./push.ts";
import { resolveEmailFromEnv, sanitizeNotificationText, sendResendEmail } from "./email.ts";
import {
  countAllUsers,
  normalizeChannels,
  resolveAudienceUserIds,
  safeInt,
  type BroadcastChannels,
  type BroadcastNotificationAudience,
  type BroadcastNotificationRow,
} from "./broadcastNotifications.ts";

function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function nowIso(): string {
  return new Date().toISOString();
}

async function updateNotificationMetrics(params: {
  supabaseAdmin: SupabaseClient;
  id: string;
  patch: Record<string, unknown>;
}): Promise<void> {
  const { error } = await params.supabaseAdmin
    .from("app_broadcast_notifications")
    .update({ ...params.patch, updated_at: nowIso() })
    .eq("id", params.id);
  if (error) throw error;
}

async function fetchPushTargetsForAudience(params: {
  supabaseAdmin: SupabaseClient;
  audience: BroadcastNotificationAudience;
  userIds: string[];
  maxTokens: number;
}): Promise<PushTarget[]> {
  const maxTokens = Math.max(1, Math.min(10000, params.maxTokens));

  if (params.audience === "all") {
    const { data, error } = await params.supabaseAdmin
      .from("device_tokens")
      .select("token,platform")
      .limit(maxTokens);
    if (error) throw error;
    return (data ?? [])
      .map((r: any) => ({
        token: asString(r?.token),
        platform:
          r?.platform === "ios" || r?.platform === "android" || r?.platform === "web"
            ? r.platform
            : "android",
      }))
      .filter(t => t.token);
  }

  const out: PushTarget[] = [];
  const chunkSize = 200;
  for (let i = 0; i < params.userIds.length && out.length < maxTokens; i += chunkSize) {
    const chunk = params.userIds.slice(i, i + chunkSize);
    const { data, error } = await params.supabaseAdmin
      .from("device_tokens")
      .select("token,platform,user_id")
      .in("user_id", chunk)
      .limit(maxTokens - out.length);
    if (error) throw error;
    for (const r of data ?? []) {
      const token = asString((r as any)?.token);
      if (!token) continue;
      const platform =
        (r as any)?.platform === "ios" ||
        (r as any)?.platform === "android" ||
        (r as any)?.platform === "web"
          ? (r as any).platform
          : "android";
      out.push({ token, platform });
    }
  }
  return out;
}

async function fetchEmailTargetsForAudience(params: {
  supabaseAdmin: SupabaseClient;
  audience: BroadcastNotificationAudience;
  userIds: string[];
  maxEmails: number;
}): Promise<Array<{ userId: string; email: string }>> {
  const maxEmails = Math.max(1, Math.min(2000, params.maxEmails));

  if (params.audience === "all") {
    const { data, error } = await params.supabaseAdmin
      .from("profiles")
      .select("user_id,email")
      .not("email", "is", null)
      .limit(maxEmails);
    if (error) throw error;
    return (data ?? [])
      .map((r: any) => ({ userId: asString(r?.user_id), email: asString(r?.email).trim() }))
      .filter(r => r.userId && r.email);
  }

  const out: Array<{ userId: string; email: string }> = [];
  const chunkSize = 200;
  for (let i = 0; i < params.userIds.length && out.length < maxEmails; i += chunkSize) {
    const chunk = params.userIds.slice(i, i + chunkSize);
    const { data, error } = await params.supabaseAdmin
      .from("profiles")
      .select("user_id,email")
      .in("user_id", chunk)
      .not("email", "is", null)
      .limit(maxEmails - out.length);
    if (error) throw error;
    for (const r of data ?? []) {
      const userId = asString((r as any)?.user_id);
      const email = asString((r as any)?.email).trim();
      if (!userId || !email) continue;
      out.push({ userId, email });
    }
  }
  return out;
}

export async function deliverBroadcastNotification(params: {
  supabaseAdmin: SupabaseClient;
  row: BroadcastNotificationRow;
  dryRun?: boolean;
  maxUsers?: number;
  maxPushTokens?: number;
  maxEmails?: number;
}): Promise<{
  targetCount: number;
  delivery: Record<string, unknown>;
  lastError: string | null;
  audienceUserIds: string[];
  cappedUsers: boolean;
}> {
  const MAX_USERS = params.maxUsers ?? 20000;
  const MAX_PUSH_TOKENS = params.maxPushTokens ?? 5000;
  const MAX_EMAILS = params.maxEmails ?? 200;

  const audience = params.row.audience;
  const channels: BroadcastChannels = normalizeChannels(params.row.channels);

  const audienceUserIds =
    audience === "all"
      ? []
      : await resolveAudienceUserIds({
          supabaseAdmin: params.supabaseAdmin,
          audience,
          audienceUserIds: params.row.audience_user_ids ?? [],
          maxUsers: MAX_USERS,
        });

  const cappedUsers = audienceUserIds.length >= MAX_USERS && audience !== "specific";

  let targetCount = audienceUserIds.length;
  if (audience === "all") {
    const cnt = await countAllUsers(params.supabaseAdmin);
    if (typeof cnt === "number") targetCount = cnt;
  }

  const delivery: Record<string, unknown> = {
    push: { attempted: channels.push, sent: 0, failed: 0, tokens: 0 },
    email: { attempted: channels.email, sent: 0, failed: 0, recipients: 0, capped: false },
    in_app: { attempted: channels.in_app },
    recipients: { users: audienceUserIds.length, capped: cappedUsers },
  };

  let lastError: string | null = null;

  if (channels.push) {
    try {
      const targets = await fetchPushTargetsForAudience({
        supabaseAdmin: params.supabaseAdmin,
        audience,
        userIds: audienceUserIds,
        maxTokens: MAX_PUSH_TOKENS,
      });
      (delivery as any).push.tokens = targets.length;
      if (targets.length > 0 && !params.dryRun) {
        const res = await sendPushToTargets(targets, {
          title: sanitizeNotificationText(params.row.title),
          body: sanitizeNotificationText(params.row.message),
          data: { type: "broadcast_notification", notificationId: params.row.id },
        });
        (delivery as any).push.sent = safeInt((res as any)?.success, 0);
        (delivery as any).push.failed = safeInt((res as any)?.failed, 0);
      }
    } catch (e) {
      lastError = `push: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  if (channels.email) {
    try {
      const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
      if (!resendKey) throw new Error("RESEND_API_KEY is not configured");
      const from = resolveEmailFromEnv();
      const subject = sanitizeNotificationText(params.row.title);
      const html = `<div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
  <h2 style="margin: 0 0 12px 0;">${subject}</h2>
  <p style="margin: 0; white-space: pre-line; line-height: 1.5;">${sanitizeNotificationText(params.row.message)}</p>
  <hr style="margin: 18px 0; border: 0; border-top: 1px solid rgba(148,163,184,0.35);" />
  <p style="margin: 0; font-size: 12px; color: rgba(100,116,139,1);">You received this message because you use the app.</p>
</div>`;

      const recipients = await fetchEmailTargetsForAudience({
        supabaseAdmin: params.supabaseAdmin,
        audience,
        userIds: audienceUserIds,
        maxEmails: MAX_EMAILS + 1,
      });
      const cappedEmails = recipients.length > MAX_EMAILS;
      const toSend = recipients.slice(0, MAX_EMAILS);
      (delivery as any).email.recipients = toSend.length;
      (delivery as any).email.capped = cappedEmails;

      if (!params.dryRun) {
        for (const r of toSend) {
          const { data: ev, error: evErr } = await params.supabaseAdmin
            .from("email_send_events")
            .insert({
              campaign_id: null,
              user_id: r.userId,
              to_email: r.email,
              subject,
              provider: "resend",
              provider_message_id: null,
              status: "queued",
              error_message: null,
              sent_at: null,
            })
            .select("*")
            .single();
          if (evErr) throw evErr;

          try {
            const sent = await sendResendEmail({
              to: r.email,
              subject,
              html,
              from,
              apiKey: resendKey,
            });
            await params.supabaseAdmin
              .from("email_send_events")
              .update({
                provider_message_id: sent.id,
                status: "sent",
                error_message: null,
                sent_at: nowIso(),
              })
              .eq("id", (ev as any).id);
            (delivery as any).email.sent += 1;
          } catch (sendErr) {
            const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
            await params.supabaseAdmin
              .from("email_send_events")
              .update({
                status: "failed",
                error_message: msg,
                sent_at: nowIso(),
              })
              .eq("id", (ev as any).id);
            (delivery as any).email.failed += 1;
          }
        }
      }
    } catch (e) {
      const part = `email: ${e instanceof Error ? e.message : String(e)}`;
      lastError = lastError ? `${lastError}; ${part}` : part;
    }
  }

  if (!params.dryRun) {
    await updateNotificationMetrics({
      supabaseAdmin: params.supabaseAdmin,
      id: params.row.id,
      patch: {
        target_count: targetCount,
        last_error: lastError,
        metadata: { ...(params.row.metadata ?? {}), delivery },
      },
    });
  }

  return { targetCount, delivery, lastError, audienceUserIds, cappedUsers };
}
