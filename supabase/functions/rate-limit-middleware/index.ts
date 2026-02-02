import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit configuration
const RATE_LIMITS = {
  // Per endpoint type
  auth: { requests: 10, window: 60 }, // 10 requests per minute
  api: { requests: 100, window: 60 }, // 100 requests per minute
  ai: { requests: 20, window: 60 }, // 20 requests per minute
  upload: { requests: 10, window: 60 }, // 10 requests per minute
  default: { requests: 50, window: 60 }, // 50 requests per minute
} as const;

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

// In-memory store (for production, use Redis or Supabase)
const rateLimitStore: RateLimitStore = {};

function getRateLimitKey(identifier: string, endpoint: string): string {
  return `${identifier}:${endpoint}`;
}

function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: { requests: number; window: number },
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = getRateLimitKey(identifier, endpoint);
  const now = Date.now();
  const windowMs = limit.window * 1000;

  if (!rateLimitStore[key] || rateLimitStore[key].resetAt < now) {
    // Reset or create
    rateLimitStore[key] = {
      count: 1,
      resetAt: now + windowMs,
    };
    return {
      allowed: true,
      remaining: limit.requests - 1,
      resetAt: rateLimitStore[key].resetAt,
    };
  }

  if (rateLimitStore[key].count >= limit.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: rateLimitStore[key].resetAt,
    };
  }

  rateLimitStore[key].count++;
  return {
    allowed: true,
    remaining: limit.requests - rateLimitStore[key].count,
    resetAt: rateLimitStore[key].resetAt,
  };
}

function getEndpointType(path: string): keyof typeof RATE_LIMITS {
  if (path.includes("/auth") || path.includes("/signin") || path.includes("/signup")) {
    return "auth";
  }
  if (path.includes("/ai-") || path.includes("/analyze")) {
    return "ai";
  }
  if (path.includes("/upload") || path.includes("/scan")) {
    return "upload";
  }
  if (path.includes("/api")) {
    return "api";
  }
  return "default";
}

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const endpointType = getEndpointType(path);

    // Get identifier (user ID or IP address)
    const authHeader = req.headers.get("Authorization");
    let identifier = "anonymous";

    if (authHeader) {
      try {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        const {
          data: { user },
        } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));

        if (user) {
          identifier = user.id;
        } else {
          // Fallback to IP if auth fails
          identifier =
            req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        }
      } catch {
        // Fallback to IP
        identifier =
          req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
      }
    } else {
      // No auth, use IP
      identifier = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    }

    const limit = RATE_LIMITS[endpointType];
    const result = checkRateLimit(identifier, endpointType, limit);

    // Add rate limit headers
    const headers = {
      ...corsHeaders,
      "X-RateLimit-Limit": limit.requests.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": Math.floor(result.resetAt / 1000).toString(),
    };

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: `Too many requests. Please try again after ${new Date(result.resetAt).toISOString()}`,
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        }),
        {
          headers: { ...headers, "Content-Type": "application/json" },
          status: 429,
        },
      );
    }

    // Forward request to actual endpoint
    // This is a middleware, so it should be used before other Edge Functions
    // For now, return success (actual implementation depends on architecture)
    return new Response(
      JSON.stringify({
        success: true,
        rateLimit: {
          limit: limit.requests,
          remaining: result.remaining,
          resetAt: result.resetAt,
        },
      }),
      {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Rate limit middleware error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
