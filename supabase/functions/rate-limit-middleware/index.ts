import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildRateLimitHeaders, enforceRateLimit } from "../_shared/rateLimit.ts";

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
    const result = await enforceRateLimit({
      identifier,
      endpoint: endpointType,
      windowSeconds: limit.window,
      maxRequests: limit.requests,
    });

    const headers = {
      ...corsHeaders,
      ...buildRateLimitHeaders(result),
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
