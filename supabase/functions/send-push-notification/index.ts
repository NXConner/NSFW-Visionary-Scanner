import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPushToTargets, type PushTarget } from "../_shared/push.ts";
import { buildRateLimitHeaders, enforceRateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


serve(async req => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Push notification request missing Authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized: Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    // Verify the user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error("Push notification auth error:", authError?.message || "Invalid token");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized: Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check if user has admin role (required for sending push notifications)
    const { data: roles, error: rolesError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError.message);
    }

    const isAdmin = (roles || []).some(
      (r: { role: string }) => r.role === "admin" || r.role === "super_admin",
    );

    if (!isAdmin) {
      console.error(`User ${user.id} attempted to send push notification without admin role`);
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rate = await enforceRateLimit({
      identifier: user.id,
      endpoint: "send-push-notification",
      windowSeconds: 60,
      maxRequests: 30,
    });
    if (!rate.allowed) {
      return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, ...buildRateLimitHeaders(rate), "Content-Type": "application/json" },
      });
    }

    console.log(`Admin user ${user.id} sending push notification`);

    const { tokens, targets, title, body, data, imageUrl } = await req.json();

    const resolvedTargets: PushTarget[] = [];

    if (Array.isArray(targets) && targets.length > 0) {
      for (const t of targets as Array<{ token?: unknown; platform?: unknown }>) {
        if (typeof t?.token !== "string" || !t.token) continue;
        const platform =
          t.platform === "ios" || t.platform === "android" || t.platform === "web"
            ? t.platform
            : "android";
        resolvedTargets.push({ token: t.token, platform });
      }
    } else if (Array.isArray(tokens) && tokens.length > 0) {
      for (const token of tokens as unknown[]) {
        if (typeof token === "string" && token)
          resolvedTargets.push({ token, platform: "android" });
      }
    }

    if (resolvedTargets.length === 0) throw new Error("No device tokens provided");

    const { success, failed, results } = await sendPushToTargets(resolvedTargets, {
      title,
      body,
      data,
      imageUrl,
    });

    return new Response(
      JSON.stringify({
        success: true,
        sent: success,
        failed,
        results,
      }),
      {
        headers: { ...corsHeaders, ...buildRateLimitHeaders(rate), "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    console.error("Push notification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
