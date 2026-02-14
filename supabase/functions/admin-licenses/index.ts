import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getPrivilegedFlags } from "../_shared/privileged.ts";
import { buildRateLimitHeaders, enforceRateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody =
  | { action: "list"; limit?: number; includeInactive?: boolean }
  | {
      action: "generate";
      userEmail?: string;
      userId?: string;
      packageId?: string;
      licenseType?: string;
      maxDevices?: number;
      expiresAtIso?: string | null;
      note?: string | null;
    }
  | { action: "revoke"; licenseId: string }
  | { action: "rotate_key"; licenseId: string }
  | { action: "reset_devices"; licenseId: string };

function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function nowIso(): string {
  return new Date().toISOString();
}

const LICENSE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomLicenseKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, b => LICENSE_ALPHABET[b % LICENSE_ALPHABET.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars
    .slice(8, 12)
    .join("")}-${chars.slice(12, 16).join("")}`;
}

function base64FromBytes(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/=+$/g, "");
}

async function computeLicenseSignature(params: {
  licenseKey: string;
  userId: string;
  packageId: string | null;
}): Promise<string> {
  const secret = Deno.env.get("DLC_LICENSE_SIGNATURE_SECRET") ?? "";
  const msg = `${params.licenseKey}|${params.userId}|${params.packageId ?? ""}|${secret}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg));
  return base64FromBytes(new Uint8Array(digest));
}

async function generateUniqueLicenseKey(supabaseAdmin: any, maxAttempts = 6): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const key = randomLicenseKey();
    const { data, error } = await supabaseAdmin
      .from("dlc_licenses")
      .select("id")
      .eq("license_key", key)
      .maybeSingle();
    if (error) continue;
    if (!data?.id) return key;
  }
  throw new Error("Unable to generate unique license key");
}

type LicenseListItem = {
  id: string;
  key: string;
  userId: string;
  userEmail: string | null;
  packageId: string | null;
  packageName: string | null;
  status: "active" | "expired" | "revoked";
  devices: number;
  maxDevices: number;
  createdAtIso: string | null;
  expiresAtIso: string | null;
  licenseType: string | null;
};

function parseExpiresAt(row: Record<string, unknown>): string | null {
  const candidates = [
    row.expires_at,
    row.expiration_date,
    row.subscription_end,
    row.expiresAt,
    row.expirationDate,
    row.subscriptionEnd,
  ];
  for (const c of candidates) {
    const iso = asString(c).trim();
    if (!iso) continue;
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

function computeStatus(row: Record<string, unknown>): LicenseListItem["status"] {
  const active = Boolean(row.is_active ?? row.isActive ?? true);
  if (!active) return "revoked";
  if (row.refunded_at || row.deactivated_at) return "revoked";
  const exp = parseExpiresAt(row);
  if (exp) {
    const t = new Date(exp).getTime();
    if (!Number.isNaN(t) && t < Date.now()) return "expired";
  }
  const subscriptionStatus = asString(row.subscription_status ?? row.subscriptionStatus)
    .trim()
    .toLowerCase();
  if (subscriptionStatus && subscriptionStatus !== "active" && subscriptionStatus !== "trialing")
    return "expired";
  return "active";
}

async function chunkedIn<T extends string | number>(arr: T[], size: number): Promise<T[][]> {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function mapUserEmails(supabaseAdmin: any, userIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const chunks = await chunkedIn(userIds, 200);
  for (const chunk of chunks) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id,email")
      .in("user_id", chunk);
    if (error) continue;
    for (const row of data ?? []) {
      const uid = asString((row as any)?.user_id).trim();
      const email = asString((row as any)?.email).trim();
      if (uid && email) map.set(uid, email);
    }
  }
  return map;
}

async function mapPackageNames(
  supabaseAdmin: any,
  packageIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (packageIds.length === 0) return map;
  const chunks = await chunkedIn(packageIds, 200);
  for (const chunk of chunks) {
    const { data, error } = await supabaseAdmin
      .from("dlc_packages")
      .select("package_id,name")
      .in("package_id", chunk);
    if (error) continue;
    for (const row of data ?? []) {
      const pid = asString((row as any)?.package_id).trim();
      const name = asString((row as any)?.name).trim();
      if (pid && name) map.set(pid, name);
    }
  }
  return map;
}

async function mapDeviceCounts(
  supabaseAdmin: any,
  licenseIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (licenseIds.length === 0) return map;
  const chunks = await chunkedIn(licenseIds, 200);
  for (const chunk of chunks) {
    const { data, error } = await supabaseAdmin
      .from("dlc_license_devices")
      .select("license_id,is_active")
      .in("license_id", chunk);
    if (error) continue;
    for (const row of data ?? []) {
      const lid = asString((row as any)?.license_id).trim();
      if (!lid) continue;
      const isActive = (row as any)?.is_active === false ? false : true;
      if (!isActive) continue;
      map.set(lid, (map.get(lid) ?? 0) + 1);
    }
  }
  return map;
}

async function resolveUserId(params: { supabaseAdmin: any; userId?: string; userEmail?: string }) {
  const id = asString(params.userId).trim();
  if (id) return id;
  const email = asString(params.userEmail).trim().toLowerCase();
  if (!email) throw new Error("Missing userId or userEmail");
  const { data, error } = await params.supabaseAdmin
    .from("profiles")
    .select("user_id,email")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  const uid = asString((data as any)?.user_id).trim();
  if (!uid) throw new Error("User not found for email");
  return uid;
}

async function insertLicenseRow(params: {
  supabaseAdmin: any;
  userId: string;
  packageId: string;
  licenseType: string;
  maxDevices: number;
  expiresAtIso: string | null;
  note?: string | null;
}): Promise<Record<string, unknown>> {
  const key = await generateUniqueLicenseKey(params.supabaseAdmin);
  const signature = await computeLicenseSignature({
    licenseKey: key,
    userId: params.userId,
    packageId: params.packageId,
  });
  const ts = nowIso();

  // Start with a superset payload and progressively remove unknown columns if a schema variant
  // doesn't include them. This keeps the function compatible with multiple historical schemas.
  const payload: Record<string, unknown> = {
    user_id: params.userId,
    package_id: params.packageId,
    license_key: key,
    license_type: params.licenseType,
    max_devices: params.maxDevices,
    is_active: true,
    purchase_date: ts,
    activated_at: ts,
    expires_at: params.expiresAtIso,
    subscription_status: params.licenseType.toLowerCase() === "subscription" ? "active" : null,
    content_version: "1.0.0",
    signature,
    // Optional column (not present in all schemas)
    metadata: params.note ? { note: params.note } : undefined,
    created_at: ts,
    updated_at: ts,
  };

  // Try modern schema first; fall back if columns don't exist.
  const attempt = async (payload: Record<string, unknown>) => {
    const { data, error } = await params.supabaseAdmin
      .from("dlc_licenses")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return (data ?? null) as any;
  };

  // Progressive removal of unknown columns; stop on non-schema errors.
  let lastErr: unknown = null;
  for (let i = 0; i < 8; i++) {
    try {
      return await attempt(payload);
    } catch (e) {
      lastErr = e;
      const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
      // PostgREST error messages typically include: column "<name>" of relation ...
      const m = msg.match(/column\\s+\"([a-z0-9_]+)\"\\s+/i);
      const col = m?.[1] ? String(m[1]) : null;
      if (!col) throw e;
      if (!(col in payload)) throw e;
      delete payload[col];

      // Keep a best-effort expiration across schemas.
      if (col === "expires_at" && params.expiresAtIso)
        payload.expiration_date = params.expiresAtIso;
      if (col === "expiration_date" && params.expiresAtIso)
        payload.expires_at = params.expiresAtIso;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr ?? "Insert failed"));
}

async function rotateLicenseKey(params: { supabaseAdmin: any; licenseId: string }) {
  const { data: current, error: fetchErr } = await params.supabaseAdmin
    .from("dlc_licenses")
    .select("*")
    .eq("id", params.licenseId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!current) throw new Error("License not found");

  const row = current as Record<string, unknown>;
  const userId = asString(row.user_id).trim();
  const packageId = asString(row.package_id).trim() || null;

  const key = await generateUniqueLicenseKey(params.supabaseAdmin);
  const signature = await computeLicenseSignature({ licenseKey: key, userId, packageId });

  // Update only columns that are safe/common; tolerate missing signature column by retrying.
  const ts = nowIso();
  try {
    const { data, error } = await params.supabaseAdmin
      .from("dlc_licenses")
      .update({ license_key: key, signature, updated_at: ts })
      .eq("id", params.licenseId)
      .select("*")
      .single();
    if (error) throw error;
    return data as Record<string, unknown>;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes("signature") && msg.toLowerCase().includes("column")) {
      const { data, error } = await params.supabaseAdmin
        .from("dlc_licenses")
        .update({ license_key: key, updated_at: ts })
        .eq("id", params.licenseId)
        .select("*")
        .single();
      if (error) throw error;
      return data as Record<string, unknown>;
    }
    throw e;
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
      endpoint: "admin-licenses",
      windowSeconds: 60,
      maxRequests: 30,
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

    const body = (await req.json()) as ReqBody;

    if (body.action === "list") {
      const limit = clampInt((body as any).limit, 1, 1000, 250);
      const includeInactive = Boolean((body as any).includeInactive ?? true);

      let q = supabaseAdmin
        .from("dlc_licenses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (!includeInactive) q = q.eq("is_active", true);

      const { data, error } = await q;
      if (error) throw error;

      const rows = (data ?? []) as Array<Record<string, unknown>>;
      const userIds = Array.from(
        new Set(rows.map(r => asString(r.user_id).trim()).filter(Boolean)),
      );
      const licenseIds = Array.from(new Set(rows.map(r => asString(r.id).trim()).filter(Boolean)));
      const packageIds = Array.from(
        new Set(rows.map(r => asString(r.package_id).trim()).filter(Boolean)),
      );

      const [emails, packages, deviceCounts] = await Promise.all([
        mapUserEmails(supabaseAdmin, userIds),
        mapPackageNames(supabaseAdmin, packageIds),
        mapDeviceCounts(supabaseAdmin, licenseIds),
      ]);

      const out: LicenseListItem[] = rows.map(r => {
        const id = asString(r.id).trim();
        const userId = asString(r.user_id).trim();
        const packageId = asString((r as any).package_id).trim() || null;
        const licenseType = asString((r as any).license_type).trim() || null;
        const maxDevices = clampInt((r as any).max_devices, 1, 50, 3);
        const createdAtIso = asString(r.created_at).trim() || null;
        const expiresAtIso = parseExpiresAt(r);
        const status = computeStatus(r);
        const devices = deviceCounts.get(id) ?? 0;
        return {
          id,
          key: asString((r as any).license_key).trim(),
          userId,
          userEmail: emails.get(userId) ?? (asString((r as any).email).trim() || null),
          packageId,
          packageName: packageId ? (packages.get(packageId) ?? null) : null,
          status,
          devices,
          maxDevices,
          createdAtIso,
          expiresAtIso,
          licenseType,
        };
      });

      return new Response(JSON.stringify({ ok: true, licenses: out }), {
        status: 200,
        headers: {
          ...corsHeaders,
          ...buildRateLimitHeaders(rate),
          "Content-Type": "application/json",
        },
      });
    }

    if (body.action === "generate") {
      const userId = await resolveUserId({
        supabaseAdmin,
        userId: body.userId,
        userEmail: body.userEmail,
      });
      const packageId = asString(body.packageId).trim();
      if (!packageId) throw new Error("Missing packageId");

      const licenseType = asString(body.licenseType).trim().toLowerCase() || "one_time";
      const maxDevices = clampInt(body.maxDevices, 1, 50, 3);
      const expiresAtRaw = asString(body.expiresAtIso).trim();
      const expiresAtIso = expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null;
      const note = body.note ? asString(body.note).trim() : null;

      const row = await insertLicenseRow({
        supabaseAdmin,
        userId,
        packageId,
        licenseType,
        maxDevices,
        expiresAtIso,
        note,
      });

      return new Response(JSON.stringify({ ok: true, license: row }), {
        status: 200,
        headers: {
          ...corsHeaders,
          ...buildRateLimitHeaders(rate),
          "Content-Type": "application/json",
        },
      });
    }

    if (body.action === "revoke") {
      const licenseId = asString(body.licenseId).trim();
      if (!licenseId) throw new Error("Missing licenseId");
      const ts = nowIso();
      const { data, error } = await supabaseAdmin
        .from("dlc_licenses")
        .update({ is_active: false, deactivated_at: ts, updated_at: ts })
        .eq("id", licenseId)
        .select("*")
        .maybeSingle();
      if (error) {
        // Tolerate missing deactivated_at column.
        const { data: data2, error: error2 } = await supabaseAdmin
          .from("dlc_licenses")
          .update({ is_active: false, updated_at: ts })
          .eq("id", licenseId)
          .select("*")
          .maybeSingle();
        if (error2) throw error2;
        return new Response(JSON.stringify({ ok: true, license: data2 ?? null }), {
          status: 200,
          headers: {
            ...corsHeaders,
            ...buildRateLimitHeaders(rate),
            "Content-Type": "application/json",
          },
        });
      }
      return new Response(JSON.stringify({ ok: true, license: data ?? null }), {
        status: 200,
        headers: {
          ...corsHeaders,
          ...buildRateLimitHeaders(rate),
          "Content-Type": "application/json",
        },
      });
    }

    if (body.action === "rotate_key") {
      const licenseId = asString(body.licenseId).trim();
      if (!licenseId) throw new Error("Missing licenseId");
      const updated = await rotateLicenseKey({ supabaseAdmin, licenseId });
      return new Response(JSON.stringify({ ok: true, license: updated }), {
        status: 200,
        headers: {
          ...corsHeaders,
          ...buildRateLimitHeaders(rate),
          "Content-Type": "application/json",
        },
      });
    }

    if (body.action === "reset_devices") {
      const licenseId = asString(body.licenseId).trim();
      if (!licenseId) throw new Error("Missing licenseId");
      const ts = nowIso();
      // Deactivate device bindings (best-effort).
      const devRes = await supabaseAdmin
        .from("dlc_license_devices")
        .update({ is_active: false, is_primary: false, last_seen_at: ts })
        .eq("license_id", licenseId);
      // If last_seen_at doesn't exist in this schema, retry without it.
      if (devRes?.error) {
        await supabaseAdmin
          .from("dlc_license_devices")
          .update({ is_active: false, is_primary: false })
          .eq("license_id", licenseId);
      }
      // Legacy device_id field (best-effort).
      await supabaseAdmin
        .from("dlc_licenses")
        .update({ device_id: null, updated_at: ts })
        .eq("id", licenseId);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          ...corsHeaders,
          ...buildRateLimitHeaders(rate),
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
