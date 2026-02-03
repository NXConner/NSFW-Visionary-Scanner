import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitConfig {
  identifier: string;
  endpoint: string;
  windowSeconds: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export function buildRateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": Math.max(0, result.remaining).toString(),
    "X-RateLimit-Reset": Math.floor(result.resetAt / 1000).toString(),
  };
}

export async function enforceRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowSeconds * 1000,
      limit: config.maxRequests,
    };
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const windowEnd = new Date(windowStartMs + windowMs);

  try {
    const { data: existing, error } = await supabase
      .from("edge_rate_limits")
      .select("id, request_count")
      .eq("identifier", config.identifier)
      .eq("endpoint", config.endpoint)
      .eq("window_start", windowStart.toISOString())
      .maybeSingle();

    if (error) throw error;

    if (existing) {
      if (existing.request_count >= config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: windowEnd.getTime(),
          limit: config.maxRequests,
        };
      }

      const nextCount = existing.request_count + 1;
      await supabase
        .from("edge_rate_limits")
        .update({
          request_count: nextCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      return {
        allowed: true,
        remaining: config.maxRequests - nextCount,
        resetAt: windowEnd.getTime(),
        limit: config.maxRequests,
      };
    }

    await supabase.from("edge_rate_limits").insert({
      identifier: config.identifier,
      endpoint: config.endpoint,
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
      request_count: 1,
      max_requests: config.maxRequests,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: windowEnd.getTime(),
      limit: config.maxRequests,
    };
  } catch (error) {
    console.warn("Rate limit check failed:", error);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: windowEnd.getTime(),
      limit: config.maxRequests,
    };
  }
}
