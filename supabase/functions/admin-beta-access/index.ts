import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";
import { getPrivilegedFlags } from "../_shared/privileged.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody =
  | {
      action: "grant";
      email: string;
      expiresInDays?: number | null;
      maxDevices?: number | null;
      notes?: string | null;
    }
  | {
      action: "revoke";
      email: string;
      notes?: string | null;
    }
  | { action: "list" };

function normalizeEmail(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 254);
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function generateLicenseKey(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segment = () =>
    Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map(b => alphabet[b % alphabet.length])
      .join("");
  return `${segment()}-${segment()}-${segment()}-${segment()}`;
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rateLimitResponse = await applyRateLimit({
      req,
      endpoint: "admin-beta-access",
      ...DEFAULT_EDGE_RATE_LIMIT,
      headers: corsHeaders,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userRes, error: authError } = await supabase.auth.getUser(token);
    const requester = userRes?.user;
    if (authError || !requester) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Privileged check (admin/super_admin), supports DB roles + core-email allowlist.
    const { isPrivileged } = await getPrivilegedFlags(supabase, requester.id, requester.email);
    if (!isPrivileged) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ReqBody;

    if (body.action === "list") {
      const { data, error } = await supabase
        .from("beta_testers")
        .select("user_id,email,enabled,expires_at,granted_by,notes,created_at,updated_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return new Response(JSON.stringify({ testers: data ?? [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = normalizeEmail(body.email);
    if (!email || !isEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find target user by email (must already exist in Supabase Auth)
    const { data: usersResult, error: getUserErr } = await supabase.auth.admin.listUsers();
    if (getUserErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch users: " + getUserErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const targetUser = usersResult?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!targetUser) {
      return new Response(
        JSON.stringify({
          error: "Target user not found. Create the user in Supabase Auth first, then retry.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const now = new Date();
    const nowIso = now.toISOString();

    if (body.action === "revoke") {
      const notes = body.notes ? String(body.notes).slice(0, 2000) : null;

      await supabase
        .from("beta_testers")
        .update({ enabled: false, updated_at: nowIso, notes })
        .eq("user_id", targetUser.id);

      // Downgrade subscription gating row (if created for beta)
      await supabase
        .from("user_subscriptions")
        .update({
          status: "canceled",
          cancel_at_period_end: true,
          canceled_at: nowIso,
          updated_at: nowIso,
        })
        .eq("user_id", targetUser.id);

      // Revoke beta-issued DLC licenses
      await supabase
        .from("dlc_licenses")
        .update({
          is_active: false,
          deactivated_at: nowIso,
          refund_reason: "beta_revoked",
          refunded_at: null,
          updated_at: nowIso,
        })
        .eq("user_id", targetUser.id)
        .eq("payment_provider", "beta");

      return new Response(JSON.stringify({ ok: true, action: "revoke", email }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // action === "grant"
    const expiresInDays =
      body.expiresInDays === null || body.expiresInDays === undefined
        ? 90
        : clampInt(body.expiresInDays, 1, 365, 90);
    const maxDevices = clampInt(body.maxDevices, 1, 50, 10);
    const notes = body.notes ? String(body.notes).slice(0, 2000) : null;

    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);
    const expiresAtIso = expiresAt.toISOString();

    // Upsert allowlist row
    const { error: betaErr } = await supabase.from("beta_testers").upsert(
      {
        user_id: targetUser.id,
        email,
        enabled: true,
        expires_at: expiresAtIso,
        granted_by: requester.id,
        notes,
        updated_at: nowIso,
      },
      { onConflict: "user_id" },
    );
    if (betaErr) throw betaErr;

    // Mark premium subscription as active for beta (to remove paywalls without Stripe)
    await supabase.from("user_subscriptions").upsert(
      {
        user_id: targetUser.id,
        status: "active",
        plan_id: "premium",
        subscription_tier: "premium",
        current_period_start: nowIso,
        current_period_end: expiresAtIso,
        cancel_at_period_end: false,
        canceled_at: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        stripe_price_id: null,
        updated_at: nowIso,
      },
      { onConflict: "user_id" },
    );

    // Grant all DLC packages
    const { data: packages, error: pkgErr } = await supabase
      .from("dlc_packages")
      .select(
        "package_id, price_type, subscription_interval, price_usd, content_version, is_active",
      )
      .eq("is_active", true);
    if (pkgErr) throw pkgErr;

    const pkgIds = (packages || []).map((p: any) => String(p.package_id));
    const { data: existingLicenses } = await supabase
      .from("dlc_licenses")
      .select("package_id, license_key")
      .eq("user_id", targetUser.id)
      .in("package_id", pkgIds);

    const existingKeyByPackage = new Map<string, string>();
    for (const row of (existingLicenses || []) as any[]) {
      if (row?.package_id && row?.license_key) {
        existingKeyByPackage.set(String(row.package_id), String(row.license_key));
      }
    }

    const offlineCacheExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const rows = (packages || []).map((p: any) => {
      const packageId = String(p.package_id);
      const priceType = String(p.price_type ?? "one_time");
      const isSubscription = priceType === "subscription";
      const licenseType = isSubscription ? "subscription" : "one_time";
      const licenseKey = existingKeyByPackage.get(packageId) ?? generateLicenseKey();
      return {
        user_id: targetUser.id,
        package_id: packageId,
        license_key: licenseKey,
        license_type: licenseType,
        purchase_date: nowIso,
        purchase_price: 0,
        purchase_currency: "USD",
        payment_provider: "beta",
        payment_id: `beta:${now.getTime()}`,
        subscription_status: isSubscription ? "active" : null,
        subscription_start: isSubscription ? nowIso : null,
        subscription_end: isSubscription ? expiresAtIso : null,
        auto_renew: isSubscription ? false : null,
        is_active: true,
        activated_at: nowIso,
        max_devices: maxDevices,
        offline_cache_expires_at: offlineCacheExpiresAt,
        last_online_validation: nowIso,
        content_version: p.content_version ?? null,
        refunded_at: null,
        refund_reason: null,
        deactivated_at: null,
        updated_at: nowIso,
      };
    });

    if (rows.length > 0) {
      const { error: licErr } = await supabase.from("dlc_licenses").upsert(rows, {
        onConflict: "user_id,package_id",
      });
      if (licErr) throw licErr;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        action: "grant",
        email,
        userId: targetUser.id,
        expiresAt: expiresAtIso,
        dlcGranted: rows.length,
        maxDevices,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("admin-beta-access error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
