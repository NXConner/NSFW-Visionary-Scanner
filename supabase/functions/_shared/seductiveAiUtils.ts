import type { AiMode } from "./seductiveAiPrompts.ts";
import type { PolicyResult } from "./seductiveAiPolicy.ts";

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function buildRateLimitHeaders(rateLimit: { limit: number; remaining: number; resetAt: string }) {
  return {
    "X-RateLimit-Limit": rateLimit.limit.toString(),
    "X-RateLimit-Remaining": rateLimit.remaining.toString(),
    "X-RateLimit-Reset": Math.floor(new Date(rateLimit.resetAt).getTime() / 1000).toString(),
  };
}

export function summarizeMedia(media: unknown): string | null {
  if (!media || typeof media !== "object") return null;
  const record = media as Record<string, unknown>;
  const images = Array.isArray(record.images) ? record.images.length : 0;
  const gifs = Array.isArray(record.gifs) ? record.gifs.length : 0;
  const videos = Array.isArray(record.videos) ? record.videos.length : 0;
  const voice = record.voiceMessage ? 1 : 0;
  const parts: string[] = [];
  if (images) parts.push(`${images} image${images === 1 ? "" : "s"}`);
  if (gifs) parts.push(`${gifs} gif${gifs === 1 ? "" : "s"}`);
  if (videos) parts.push(`${videos} video${videos === 1 ? "" : "s"}`);
  if (voice) parts.push("voice message");
  if (parts.length === 0) return null;
  return `User shared ${parts.join(", ")}`;
}

export function sentimentFor(text: string): { sentiment: string; confidence: number } {
  const positiveWords = ["love", "enjoy", "excited", "happy", "pleasure", "desire", "safe", "sweet"];
  const negativeWords = ["hate", "disgust", "angry", "sad", "disappointed", "unsafe", "hurt"];
  const lower = text.toLowerCase();
  const pos = positiveWords.filter(w => lower.includes(w)).length;
  const neg = negativeWords.filter(w => lower.includes(w)).length;
  const sentiment = pos > neg ? "positive" : neg > pos ? "negative" : "neutral";
  const confidence = clampNumber(0.7 + (pos + neg) * 0.05, 0.5, 0.95);
  return { sentiment, confidence };
}

export function buildSuggestions(intensity: string, mode: AiMode): string[] {
  if (mode === "tame" || intensity === "light") {
    return ["Ask about boundaries", "Share a compliment", "Check in on consent"];
  }
  if (intensity === "strong" || intensity === "extreme") {
    return ["Ask for consent to go deeper", "Share a bold desire", "Set a safe word"];
  }
  return ["Ask about preferences", "Share a fantasy", "Talk about aftercare"];
}

export async function hasFeatureEntitlement(
  supabase: any,
  userId: string,
  featureId: string,
): Promise<boolean> {
  const { data: licenses, error: licensesError } = await supabase
    .from("dlc_licenses")
    .select("id, package_id, is_active, refunded_at, deactivated_at")
    .eq("user_id", userId)
    .eq("is_active", true);
  if (licensesError) throw licensesError;

  const activeLicenses = (licenses || []).filter((l: any) => !l.refunded_at && !l.deactivated_at);
  if (activeLicenses.length === 0) return false;

  const owned = activeLicenses.map((l: any) => String(l.package_id));
  const { data: pkgs, error: pkgsError } = await supabase
    .from("dlc_packages")
    .select("package_id, features, included_packages")
    .in("package_id", owned);
  if (pkgsError) throw pkgsError;

  const toVisit = new Set<string>(owned);
  const visited = new Set<string>();
  const allPackageIds: string[] = [];

  while (toVisit.size > 0) {
    const next = toVisit.values().next().value as string;
    toVisit.delete(next);
    if (visited.has(next)) continue;
    visited.add(next);
    allPackageIds.push(next);
    const row = (pkgs || []).find((p: any) => String(p.package_id) === next);
    const included = Array.isArray(row?.included_packages) ? row.included_packages : [];
    for (const inc of included) toVisit.add(String(inc));
  }

  const missing = allPackageIds.filter(
    id => !(pkgs || []).some((p: any) => String(p.package_id) === id),
  );
  let extraPkgs: any[] = [];
  if (missing.length > 0) {
    const { data: more, error: moreErr } = await supabase
      .from("dlc_packages")
      .select("package_id, features, included_packages")
      .in("package_id", missing);
    if (moreErr) throw moreErr;
    extraPkgs = more || [];
  }

  const all = [...(pkgs || []), ...extraPkgs];
  for (const p of all) {
    const feats = Array.isArray(p.features) ? p.features : [];
    if (feats.includes(featureId)) return true;
  }
  return false;
}

export function buildContextPayload(params: {
  personality: string;
  intensity: string;
  memory: unknown;
  policy: PolicyResult;
  mode: string;
  messageCount: number;
  sessionId: string;
  provider: { name: string; model: string; latencyMs?: number };
  rateLimit: { limit: number; remaining: number; resetAt: string };
}) {
  return {
    personality: params.personality,
    intensity: params.intensity,
    memory: params.memory,
    policy: params.policy,
    mode: params.mode,
    messageCount: params.messageCount,
    sessionId: params.sessionId,
    provider: params.provider,
    rateLimit: params.rateLimit,
  };
}
