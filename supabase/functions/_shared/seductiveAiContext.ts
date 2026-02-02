import {
  INTENSITY_PROFILES,
  buildSystemPrompt,
  clampIntensity,
  pickAllowedPersonality,
  type AiMode,
  type IntensityKey,
  type PersonalityProfile,
} from "./seductiveAiPrompts.ts";
import {
  extractMemoryCues,
  getMemoryFromContext,
  mergeMemoryCues,
  summarizeMemory,
  type MemoryCue,
} from "./seductiveAiMemory.ts";
import { buildPolicyNote, scanForPolicyIssues, type PolicyResult } from "./seductiveAiPolicy.ts";
import { buildContextPayload, summarizeMedia } from "./seductiveAiUtils.ts";

export type HistoryRow = {
  message_type: "user" | "ai" | "system";
  message_content: string | null;
  context_data?: unknown;
};

export type SeductiveAiContext = {
  policy: PolicyResult;
  memoryCues: MemoryCue[];
  memorySummary: string[];
  personality: PersonalityProfile;
  intensity: IntensityKey;
  intensityProfile: (typeof INTENSITY_PROFILES)[IntensityKey];
  systemPrompt: string;
  history: Array<{ role: string; content: string }>;
  userContent: string;
  contextPayloadBase: ReturnType<typeof buildContextPayload>;
  mediaSummary: string | null;
};

export function prepareSeductiveAiContext(params: {
  mode: AiMode;
  userMessage: string;
  sessionId: string;
  body: { personality?: string; intensity?: string; media?: unknown; client_context?: Record<string, unknown> };
  session: { ai_personality?: string | null; ai_intensity?: string | null; session_type?: string | null; session_name?: string | null };
  chronological: HistoryRow[];
  memoryMaxCues: number;
  provider: { name: string; model: string };
  rateLimit: { limit: number; remaining: number; resetAt: string };
}): SeductiveAiContext {
  const history = (params.chronological || [])
    .filter(m => m.message_type === "user" || m.message_type === "ai")
    .map(m => ({
      role: (m.message_type === "user" ? "user" : "assistant") as "user" | "assistant",
      content: String(m.message_content ?? ""),
    })) as SeductiveAiContext["history"];

  if (history.length > 0) {
    const last = history[history.length - 1];
    if (last.role === "user" && last.content.trim() === params.userMessage) {
      history.pop();
    }
  }

  const policy = scanForPolicyIssues(params.userMessage, params.mode);
  const previousMemory = getMemoryFromContext(params.chronological);
  const nowIso = new Date().toISOString();
  const newCues = policy.action === "block" ? [] : extractMemoryCues(params.userMessage, nowIso);
  const memoryCues = mergeMemoryCues(previousMemory, newCues, params.memoryMaxCues);
  const memorySummary = summarizeMemory(memoryCues);

  const personality = pickAllowedPersonality(
    params.body.personality || params.session.ai_personality || "seductive",
    params.mode,
  );
  const intensity = clampIntensity(params.body.intensity || params.session.ai_intensity || "medium", params.mode);
  const intensityProfile = INTENSITY_PROFILES[intensity];

  const policyNote = buildPolicyNote(policy, params.mode);
  const mediaSummary = summarizeMedia(params.body.media);

  const additionalContext: string[] = [];
  if (mediaSummary) additionalContext.push(mediaSummary);
  if (params.session.session_name) additionalContext.push(`Session name: ${params.session.session_name}`);
  if (params.session.session_type) additionalContext.push(`Session type: ${params.session.session_type}`);
  if (params.body.client_context?.app_version) {
    additionalContext.push(`App version: ${String(params.body.client_context.app_version)}`);
  }

  const systemPrompt = buildSystemPrompt({
    personality,
    intensity,
    mode: params.mode,
    memorySummary,
    policyNote: policyNote || undefined,
    additionalContext,
  });

  const contextPayloadBase = buildContextPayload({
    personality: personality.name,
    intensity,
    memory: memoryCues,
    policy,
    mode: params.mode,
    messageCount: history.length,
    sessionId: params.sessionId,
    provider: params.provider,
    rateLimit: params.rateLimit,
  });

  const userContent = mediaSummary
    ? `${params.userMessage}\n\nUser shared media: ${mediaSummary}`
    : params.userMessage;

  return {
    policy,
    memoryCues,
    memorySummary,
    personality,
    intensity,
    intensityProfile,
    systemPrompt,
    history,
    userContent,
    contextPayloadBase,
    mediaSummary,
  };
}
