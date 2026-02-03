import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildRateLimitHeaders, enforceRateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get the user from the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      throw new Error("Invalid user token");
    }

    const rate = await enforceRateLimit({
      identifier: user.id,
      endpoint: "register-device-token",
      windowSeconds: 60,
      maxRequests: 20,
    });
    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        headers: { ...corsHeaders, ...buildRateLimitHeaders(rate), "Content-Type": "application/json" },
        status: 429,
      });
    }

    const { token, platform, deviceId, deviceName, appVersion } = await req.json();

    if (!token || !platform) {
      throw new Error("Token and platform are required");
    }

    // Validate platform
    if (!["ios", "android", "web"].includes(platform)) {
      throw new Error("Invalid platform. Must be ios, android, or web");
    }

    // Upsert device token
    const { data, error } = await supabaseClient
      .from("device_tokens")
      .upsert(
        {
          user_id: user.id,
          token,
          platform,
          device_id: deviceId || null,
          device_name: deviceName || null,
          app_version: appVersion || null,
          updated_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,token",
        },
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        device_token: data,
      }),
      {
        headers: { ...corsHeaders, ...buildRateLimitHeaders(rate), "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error registering device token:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
