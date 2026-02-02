import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { feedbackDraftSchema } from "./schema";
import { collectFeedbackEnvironment } from "./env";
import type { FeedbackDraftInput, FeedbackDraftParsed } from "./schema";
import type { FeedbackRow } from "./types";

const LOCAL_QUEUE_KEY = "morphoscan_feedback_queue_v1";

type QueueOperationFn = (
  table: string,
  operation: "insert" | "update" | "delete",
  data: Record<string, unknown>,
) => string;

export type SubmitFeedbackOutcome =
  | { outcome: "sent"; id: string }
  | { outcome: "queued"; localId: string }
  | { outcome: "saved_local"; localId: string }
  | { outcome: "invalid"; fieldErrors: Record<string, string> }
  | { outcome: "error"; message: string };

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadLocalFeedbackQueue(): Array<{
  id: string;
  createdAt: string;
  draft: FeedbackDraftParsed;
}> {
  if (typeof window === "undefined") return [];
  return safeJsonParse(localStorage.getItem(LOCAL_QUEUE_KEY), []);
}

export function removeLocalFeedbackQueueItem(id: string) {
  if (typeof window === "undefined") return;
  const next = loadLocalFeedbackQueue().filter(x => x.id !== id);
  localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(next));
}

export function clearLocalFeedbackQueue() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_QUEUE_KEY);
}

function enqueueLocal(draft: FeedbackDraftParsed): string {
  const localId = crypto.randomUUID();
  const current = loadLocalFeedbackQueue();
  const next = [{ id: localId, createdAt: new Date().toISOString(), draft }, ...current].slice(
    0,
    100,
  );
  localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(next));
  return localId;
}

function toFieldErrors(parsed: ReturnType<typeof feedbackDraftSchema.safeParse>) {
  if (parsed.success) return {};
  const out: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function buildInsertPayload(
  draft: FeedbackDraftParsed,
  opts: { includeDiagnostics: boolean; userId?: string; extra?: Record<string, unknown> },
) {
  const env = opts.includeDiagnostics ? collectFeedbackEnvironment() : undefined;

  return {
    ...(opts.userId ? { user_id: opts.userId } : {}),
    kind: draft.kind,
    title: draft.title,
    description: draft.description,
    rating: typeof draft.rating === "number" ? draft.rating : null,
    sentiment: draft.sentiment ?? null,
    severity: draft.severity ?? null,
    frequency: draft.frequency ?? null,
    steps_to_reproduce: draft.stepsToReproduce ?? null,
    expected: draft.expected ?? null,
    actual: draft.actual ?? null,
    tags: draft.tags ?? null,
    allow_contact: draft.allowContact ?? false,
    contact_email: draft.contactEmail ?? null,
    attachments: draft.attachments ?? null,
    environment: env ? (env as unknown as Record<string, unknown>) : null,
    source: "settings_feedback_hub",
    ...opts.extra,
  } as Record<string, unknown>;
}

export async function submitFeedback(params: {
  draft: FeedbackDraftInput;
  userId: string | null;
  queueOperation?: QueueOperationFn;
  supabaseClient?: SupabaseClient;
  extraMetadata?: Record<string, unknown>;
}): Promise<SubmitFeedbackOutcome> {
  const parsed = feedbackDraftSchema.safeParse(params.draft);
  if (!parsed.success) {
    return { outcome: "invalid", fieldErrors: toFieldErrors(parsed) };
  }

  const draft = parsed.data;
  const client = (params.supabaseClient ?? supabase) as SupabaseClient;
  const includeDiagnostics = draft.includeDiagnostics !== false;

  if (!params.userId) {
    const localId = enqueueLocal(draft);
    logger.userAction("feedback_saved_local_anonymous", undefined, { kind: draft.kind, localId });
    return { outcome: "saved_local", localId };
  }

  const payload = buildInsertPayload(draft, {
    includeDiagnostics,
    userId: params.userId,
    extra: params.extraMetadata,
  });

  // Offline path: queue if possible, else save local.
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    if (params.queueOperation) {
      const localId = params.queueOperation("user_feedback", "insert", payload);
      logger.userAction("feedback_queued_offline", params.userId, { kind: draft.kind, localId });
      return { outcome: "queued", localId };
    }
    const localId = enqueueLocal(draft);
    logger.userAction("feedback_saved_local_offline_noqueue", params.userId, {
      kind: draft.kind,
      localId,
    });
    return { outcome: "saved_local", localId };
  }

  try {
    const startedAt = performance.now();
    const { data, error } = await client
      // Supabase types are generated; keep this resilient if table isn't in local typings yet.

      .from("user_feedback" as any)
      .insert(payload)
      .select("id")
      .single();

    const duration = Math.round(performance.now() - startedAt);
    if (error) throw error;

    const id = String((data as { id?: string } | null)?.id ?? "");
    if (!id) throw new Error("Feedback insert returned no id");

    logger.apiCall("/user_feedback", "INSERT", 201, duration, params.userId);
    logger.userAction("feedback_submitted", params.userId, { kind: draft.kind, id });
    return { outcome: "sent", id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Feedback submit failed", {
      userId: params.userId,
      component: "feedback_hub",
      metadata: { message },
    });

    if (params.queueOperation) {
      const localId = params.queueOperation("user_feedback", "insert", payload);
      return { outcome: "queued", localId };
    }

    return { outcome: "error", message };
  }
}

export async function listMyFeedback(params: {
  userId: string;
  limit?: number;
  supabaseClient?: SupabaseClient;
}) {
  const client = (params.supabaseClient ?? supabase) as SupabaseClient;
  const limit = Math.min(Math.max(params.limit ?? 25, 1), 100);

  const { data, error } = await client

    .from("user_feedback" as any)
    .select(
      "id,user_id,created_at,updated_at,kind,title,description,rating,sentiment,severity,frequency,steps_to_reproduce,expected,actual,tags,allow_contact,contact_email,environment,attachments,status,admin_response",
    )
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as FeedbackRow[];
}
