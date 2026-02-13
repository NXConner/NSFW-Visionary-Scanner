import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getPrivilegedFlags } from "../_shared/privileged.ts";
import { buildRateLimitHeaders, enforceRateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CheckStatus = "healthy" | "degraded" | "down";

type HealthCheck = {
  name: string;
  status: CheckStatus;
  latencyMs: number | null;
  checkedAtIso: string;
  detail?: string | null;
};

type RecentEvent = {
  timeIso: string;
  event: string;
  type: "info" | "warning" | "success" | "error";
};

function safeEnvPresent(key: string): boolean {
  try {
    const v = Deno.env.get(key);
    return typeof v === "string" && v.trim().length > 0;
  } catch {
    return false;
  }
}

function asErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  try {
    return String(e);
  } catch {
    return "Unknown error";
  }
}

async function timed(
  name: string,
  fn: () => Promise<{ ok: boolean; detail?: string | null }>,
): Promise<HealthCheck> {
  const start = performance.now();
  try {
    const res = await fn();
    const latencyMs = Math.max(0, Math.round(performance.now() - start));
    return {
      name,
      status: res.ok ? "healthy" : "down",
      latencyMs,
      checkedAtIso: new Date().toISOString(),
      detail: res.detail ?? null,
    };
  } catch (e) {
    const latencyMs = Math.max(0, Math.round(performance.now() - start));
    return {
      name,
      status: "down",
      latencyMs,
      checkedAtIso: new Date().toISOString(),
      detail: asErrorMessage(e),
    };
  }
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: userRes, error: authError } = await supabaseAdmin.auth.getUser(token);
    const requester = userRes?.user ?? null;
    if (authError || !requester) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { isPrivileged } = await getPrivilegedFlags(supabaseAdmin, requester.id, requester.email);
    if (!isPrivileged) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rate = await enforceRateLimit({
      identifier: requester.id,
      endpoint: "admin-system-health",
      windowSeconds: 60,
      maxRequests: 60,
    });
    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: {
          ...corsHeaders,
          ...buildRateLimitHeaders(rate),
          "Content-Type": "application/json",
        },
      });
    }

    const checks: HealthCheck[] = [];
    checks.push(
      await timed("database", async () => {
        const { error } = await supabaseAdmin.from("profiles").select("user_id", {
          count: "exact",
          head: true,
        });
        return { ok: !error, detail: error?.message ?? null };
      }),
    );
    checks.push(
      await timed("analytics", async () => {
        const { error } = await supabaseAdmin.from("app_analytics_events").select("id", {
          count: "exact",
          head: true,
        });
        return { ok: !error, detail: error?.message ?? null };
      }),
    );
    checks.push(
      await timed("email-events", async () => {
        const { error } = await supabaseAdmin.from("email_send_events").select("id", {
          count: "exact",
          head: true,
        });
        return { ok: !error, detail: error?.message ?? null };
      }),
    );
    checks.push(
      await timed("storage", async () => {
        // Bucket exists via migrations; if not present, this will surface clearly.
        const { error } = await supabaseAdmin.storage.from("wallpapers").list("", { limit: 1 });
        return { ok: !error, detail: error?.message ?? null };
      }),
    );

    const env = {
      resendConfigured: safeEnvPresent("RESEND_API_KEY"),
      stripeConfigured:
        safeEnvPresent("STRIPE_SECRET_KEY") ||
        safeEnvPresent("STRIPE_SECRET_KEY_LIVE") ||
        safeEnvPresent("STRIPE_SECRET_KEY_PROD"),
      firebaseConfigured: safeEnvPresent("FIREBASE_SERVICE_ACCOUNT_JSON"),
      vapidConfigured:
        safeEnvPresent("PUSH_VAPID_PUBLIC_KEY") || safeEnvPresent("PUSH_VAPID_PRIVATE_KEY"),
    };

    // Convert missing provider configuration into a "degraded" check (not "down").
    const configChecks: HealthCheck[] = [
      {
        name: "email-provider-config",
        status: env.resendConfigured ? "healthy" : "degraded",
        latencyMs: null,
        checkedAtIso: new Date().toISOString(),
        detail: env.resendConfigured ? null : "RESEND_API_KEY is not configured",
      },
      {
        name: "payments-config",
        status: env.stripeConfigured ? "healthy" : "degraded",
        latencyMs: null,
        checkedAtIso: new Date().toISOString(),
        detail: env.stripeConfigured ? null : "Stripe secret key is not configured",
      },
      {
        name: "push-config",
        status: env.firebaseConfigured || env.vapidConfigured ? "healthy" : "degraded",
        latencyMs: null,
        checkedAtIso: new Date().toISOString(),
        detail:
          env.firebaseConfigured || env.vapidConfigured
            ? null
            : "Neither Firebase nor VAPID push config is present",
      },
    ];

    const emailEventsRes = await supabaseAdmin
      .from("email_send_events")
      .select("status, to_email, provider, created_at, error_message")
      .order("created_at", { ascending: false })
      .limit(8);
    const recentEmailEvents = (emailEventsRes.data ?? []).map(ev => {
      const status = String((ev as any)?.status ?? "");
      const to = String((ev as any)?.to_email ?? "");
      const provider = String((ev as any)?.provider ?? "");
      const createdAt = String((ev as any)?.created_at ?? new Date().toISOString());
      const err = String((ev as any)?.error_message ?? "");
      const type: RecentEvent["type"] =
        status === "sent" ? "success" : status === "failed" ? "error" : "info";
      const suffix = status === "failed" && err ? ` — ${err}` : "";
      return {
        timeIso: createdAt,
        event: `Email ${status || "queued"} (${provider || "provider"}) → ${to}${suffix}`,
        type,
      } satisfies RecentEvent;
    });

    const errorEventsRes = await supabaseAdmin
      .from("app_analytics_events")
      .select("event_name, event_action, event_label, created_at")
      .eq("event_category", "error")
      .order("created_at", { ascending: false })
      .limit(8);
    const recentErrorEvents = (errorEventsRes.data ?? []).map(row => {
      const createdAt = String((row as any)?.created_at ?? new Date().toISOString());
      const name = String((row as any)?.event_name ?? "error");
      const action = String((row as any)?.event_action ?? "");
      const label = String((row as any)?.event_label ?? "");
      const event = [name, action, label].filter(Boolean).join(" • ");
      return { timeIso: createdAt, event, type: "warning" } satisfies RecentEvent;
    });

    const recentEvents: RecentEvent[] = [...recentEmailEvents, ...recentErrorEvents]
      .filter(Boolean)
      .slice(0, 12);

    return new Response(
      JSON.stringify({
        ok: true,
        checkedAtIso: new Date().toISOString(),
        requester: { id: requester.id, email: requester.email ?? null },
        env,
        checks: [...checks, ...configChecks],
        recentEvents,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          ...buildRateLimitHeaders(rate),
          "Content-Type": "application/json",
        },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: asErrorMessage(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
