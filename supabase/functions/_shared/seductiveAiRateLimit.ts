type RateWindow = {
  name: "minute" | "hour" | "day";
  seconds: number;
  limit: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  windowSeconds: number;
  resetAt: string;
  reason?: RateWindow["name"];
};

function parseLimit(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

async function countMessagesSince(
  supabase: any,
  userId: string,
  sinceIso: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("seductive_ai_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("message_type", "user")
    .gte("created_at", sinceIso);
  if (error) throw error;
  return count ?? 0;
}

export async function checkSeductiveAiRateLimit(
  supabase: any,
  userId: string,
): Promise<RateLimitResult> {
  const perMinute = parseLimit(Deno.env.get("SEDUCTIVE_AI_RATE_LIMIT_MINUTE"), 12);
  const perHour = parseLimit(Deno.env.get("SEDUCTIVE_AI_RATE_LIMIT_HOUR"), 120);
  const perDay = parseLimit(Deno.env.get("SEDUCTIVE_AI_RATE_LIMIT_DAY"), 480);

  const windows: RateWindow[] = [
    { name: "minute", seconds: 60, limit: perMinute },
    { name: "hour", seconds: 60 * 60, limit: perHour },
    { name: "day", seconds: 60 * 60 * 24, limit: perDay },
  ];

  const now = Date.now();
  const counts: Record<RateWindow["name"], number> = { minute: 0, hour: 0, day: 0 };

  for (const window of windows) {
    const sinceIso = new Date(now - window.seconds * 1000).toISOString();
    const count = await countMessagesSince(supabase, userId, sinceIso);
    counts[window.name] = count;
    if (count >= window.limit) {
      return {
        allowed: false,
        limit: window.limit,
        remaining: 0,
        windowSeconds: window.seconds,
        resetAt: new Date(now + window.seconds * 1000).toISOString(),
        reason: window.name,
      };
    }
  }

  const remaining = Math.max(0, perMinute - counts.minute);
  return {
    allowed: true,
    limit: perMinute,
    remaining,
    windowSeconds: 60,
    resetAt: new Date(now + 60 * 1000).toISOString(),
  };
}
