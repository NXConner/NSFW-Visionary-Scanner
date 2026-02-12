import "dotenv/config";

import { createClient } from "@supabase/supabase-js";

type AppRole = "super_admin" | "admin" | "pro" | "user";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const SUPER_ADMIN_EMAIL = (process.env.CORE_SUPER_ADMIN_EMAIL || "n8ter8@gmail.com").toLowerCase().trim();
const ADMIN_EMAIL = (process.env.CORE_ADMIN_EMAIL || "butterflii18@gmail.com").toLowerCase().trim();

// Optional: if provided, the script will update the auth password.
// SECURITY: do not commit .env with these values.
const SUPER_ADMIN_PASSWORD = process.env.CORE_SUPER_ADMIN_PASSWORD || "";
const ADMIN_PASSWORD = process.env.CORE_ADMIN_PASSWORD || "";

// If set to "1", missing users will be created (requires passwords).
const CREATE_MISSING_USERS = String(process.env.CORE_CREATE_USERS || "") === "1";

const LIFETIME_TIER = process.env.CORE_LIFETIME_TIER || "tier3_premium_lifetime";

// Keep in sync with src/lib/partnerSync/constants.ts
const PARTNER_CONSENT_VERSION = process.env.CORE_PARTNER_CONSENT_VERSION || "2026-01-30";

const PARTNER_PERMISSION_TYPES = [
  "scans",
  "wellness_scores",
  "diary_entries",
  "goals",
  "progress_photos",
] as const;

function assertConfig(): void {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function shouldSetPassword(nextPassword: string): boolean {
  return Boolean(String(nextPassword || "").trim());
}

const supabase = (() => {
  assertConfig();
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
})();

async function ensureAuthUser(params: {
  email: string;
  password?: string;
  displayName?: string;
}): Promise<{ id: string; email: string }> {
  const email = params.email.toLowerCase().trim();
  const password = String(params.password || "").trim();

  const { data: existing, error: lookupError } = await supabase.auth.admin.getUserByEmail(email);
  if (lookupError) {
    throw new Error(`auth.admin.getUserByEmail failed for ${email}: ${lookupError.message}`);
  }

  if (!existing?.user) {
    if (!CREATE_MISSING_USERS) {
      throw new Error(
        `Auth user not found: ${email}. Create it in Supabase Auth (or set CORE_CREATE_USERS=1 with CORE_*_PASSWORD).`,
      );
    }
    if (!shouldSetPassword(password)) {
      throw new Error(`Missing password for ${email}. Set CORE_*_PASSWORD env var to create user.`);
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: params.displayName ? { display_name: params.displayName } : undefined,
    });
    if (createError || !created?.user) {
      throw new Error(`auth.admin.createUser failed for ${email}: ${createError?.message || "no user"}`);
    }

    return { id: created.user.id, email };
  }

  const userId = existing.user.id;

  // Best effort: confirm email + update password if explicitly provided.
  const updatePayload: Record<string, unknown> = { email_confirm: true };
  if (shouldSetPassword(password)) updatePayload.password = password;
  if (params.displayName) updatePayload.user_metadata = { ...(existing.user.user_metadata || {}), display_name: params.displayName };

  const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(userId, updatePayload);
  if (updateError || !updated?.user) {
    throw new Error(`auth.admin.updateUserById failed for ${email}: ${updateError?.message || "no user"}`);
  }

  return { id: updated.user.id, email };
}

async function upsertProfile(params: { userId: string; email: string; displayName?: string }): Promise<void> {
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: params.userId,
      email: params.email,
      display_name: params.displayName || null,
      updated_at: nowIso(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`profiles.upsert failed for ${params.email}: ${error.message}`);
}

async function ensureUserRole(userId: string, role: AppRole): Promise<void> {
  const { error } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
  if (error) throw new Error(`user_roles.upsert failed (${userId}, ${role}): ${error.message}`);
}

async function ensureLifetimeSubscription(userId: string): Promise<void> {
  const { data: rows, error } = await supabase
    .from("user_subscriptions")
    .select("id, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`user_subscriptions.select failed: ${error.message}`);

  const iso = nowIso();
  const desired = {
    status: "active",
    subscription_tier: LIFETIME_TIER,
    plan_id: LIFETIME_TIER,
    cancel_at_period_end: false,
    current_period_start: iso,
    current_period_end: null,
    canceled_at: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    stripe_price_id: null,
    updated_at: iso,
  } as const;

  if (!rows || rows.length === 0) {
    const { error: insertError } = await supabase.from("user_subscriptions").insert({
      user_id: userId,
      ...desired,
      created_at: iso,
    });
    if (insertError) throw new Error(`user_subscriptions.insert failed: ${insertError.message}`);
    return;
  }

  const [keep, ...extras] = rows;
  if (!keep?.id) throw new Error("user_subscriptions: missing id for existing row");

  if (extras.length) {
    const extraIds = extras.map(r => r.id).filter(Boolean);
    if (extraIds.length) {
      const { error: delErr } = await supabase.from("user_subscriptions").delete().in("id", extraIds);
      if (delErr) throw new Error(`user_subscriptions: failed to delete duplicate rows: ${delErr.message}`);
    }
  }

  const { error: updateError } = await supabase.from("user_subscriptions").update(desired).eq("id", keep.id);
  if (updateError) throw new Error(`user_subscriptions.update failed: ${updateError.message}`);
}

async function ensureBetaTester(userId: string, email: string): Promise<void> {
  const { error } = await supabase.from("beta_testers").upsert(
    {
      user_id: userId,
      email,
      enabled: true,
      expires_at: null,
      notes: "core account bootstrap",
      updated_at: nowIso(),
    },
    { onConflict: "user_id" },
  );
  if (!error) return;

  // Some deployments may not have the optional beta_testers table applied yet.
  // Provisioning should still succeed for roles/subscriptions/partner sync.
  if (String((error as any).code || "") === "42P01" || /relation .*beta_testers.* does not exist/i.test(error.message)) {
    console.warn(`⚠️  beta_testers table missing; skipping allowlist for ${email}`);
    return;
  }

  throw new Error(`beta_testers.upsert failed (${email}): ${error.message}`);
}

async function ensurePartnerConnectionAccepted(params: {
  userA: { id: string; email: string };
  userB: { id: string; email: string };
}): Promise<string> {
  const a = params.userA.id;
  const b = params.userB.id;

  // Prefer a single canonical row A->B to avoid multiple accepted connections.
  const iso = nowIso();

  const { data: existing, error: queryError } = await supabase
    .from("partner_connections")
    .select("id,user_id,partner_id,created_at")
    .or(`and(user_id.eq.${a},partner_id.eq.${b}),and(user_id.eq.${b},partner_id.eq.${a})`)
    .order("created_at", { ascending: false });

  if (queryError) throw new Error(`partner_connections.select failed: ${queryError.message}`);

  const desiredRow = {
    user_id: a,
    partner_id: b,
    status: "accepted",
    accepted_at: iso,
    invitation_code: null,
    invitation_expires_at: null,
    updated_at: iso,
  } as const;

  let connectionId: string | null = null;

  if (!existing || existing.length === 0) {
    const { data: inserted, error: insertError } = await supabase
      .from("partner_connections")
      .insert({ ...desiredRow })
      .select("id")
      .single();
    if (insertError || !inserted?.id) {
      throw new Error(`partner_connections.insert failed: ${insertError?.message || "no id"}`);
    }
    connectionId = inserted.id;
  } else {
    // If the canonical row doesn't exist, convert the most-recent row into canonical.
    const canonical = existing.find(r => r.user_id === a && r.partner_id === b) ?? existing[0];
    connectionId = canonical?.id ?? null;
    if (!connectionId) throw new Error("partner_connections: missing id for existing row");

    const { error: updateError } = await supabase
      .from("partner_connections")
      .update(desiredRow)
      .eq("id", connectionId);
    if (updateError) throw new Error(`partner_connections.update failed: ${updateError.message}`);

    // Delete any duplicates (reverse-direction rows).
    const extraIds = existing.map(r => r.id).filter(id => id && id !== connectionId);
    if (extraIds.length) {
      const { error: delError } = await supabase.from("partner_connections").delete().in("id", extraIds);
      if (delError) throw new Error(`partner_connections.delete duplicates failed: ${delError.message}`);
    }
  }

  return connectionId;
}

async function ensurePartnerConsent(connectionId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("partner_sync_consent").upsert(
    {
      connection_id: connectionId,
      user_id: userId,
      consent_version: PARTNER_CONSENT_VERSION,
      accepted_at: nowIso(),
      revoked_at: null,
      updated_at: nowIso(),
    },
    { onConflict: "connection_id,user_id,consent_version" },
  );
  if (error) throw new Error(`partner_sync_consent.upsert failed: ${error.message}`);
}

async function ensurePartnerPreferences(userId: string): Promise<void> {
  const { error } = await supabase.from("partner_sync_preferences").upsert(
    {
      user_id: userId,
      quiet_hours_enabled: false,
      timezone: "UTC",
      rate_limit_per_hour: 999,
      allow_push_notifications: true,
      allow_scheduled_pings: true,
      allow_media: true,
      updated_at: nowIso(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`partner_sync_preferences.upsert failed: ${error.message}`);
}

async function ensurePartnerPermissionsAll(connectionId: string, userId: string): Promise<void> {
  const rows = PARTNER_PERMISSION_TYPES.map(type => ({
    connection_id: connectionId,
    user_id: userId,
    data_type: type,
    can_view: true,
    can_comment: true,
    updated_at: nowIso(),
  }));

  const { error } = await supabase.from("partner_data_permissions").upsert(rows, {
    onConflict: "connection_id,user_id,data_type",
  });
  if (error) throw new Error(`partner_data_permissions.upsert failed: ${error.message}`);
}

async function run(): Promise<void> {
  console.log("Provisioning core users (roles, lifetime premium, partner sync)...");

  const superAdmin = await ensureAuthUser({
    email: SUPER_ADMIN_EMAIL,
    password: SUPER_ADMIN_PASSWORD,
    displayName: "N8TER8 (Super Admin)",
  });
  const admin = await ensureAuthUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    displayName: "Butterflii (Admin)",
  });

  await upsertProfile({ userId: superAdmin.id, email: superAdmin.email, displayName: "N8TER8" });
  await upsertProfile({ userId: admin.id, email: admin.email, displayName: "Butterflii" });

  await ensureUserRole(superAdmin.id, "super_admin");
  await ensureUserRole(admin.id, "admin");

  await ensureLifetimeSubscription(superAdmin.id);
  await ensureLifetimeSubscription(admin.id);

  await ensureBetaTester(superAdmin.id, superAdmin.email);
  await ensureBetaTester(admin.id, admin.email);

  const connectionId = await ensurePartnerConnectionAccepted({ userA: superAdmin, userB: admin });
  await ensurePartnerPreferences(superAdmin.id);
  await ensurePartnerPreferences(admin.id);
  await ensurePartnerConsent(connectionId, superAdmin.id);
  await ensurePartnerConsent(connectionId, admin.id);
  await ensurePartnerPermissionsAll(connectionId, superAdmin.id);
  await ensurePartnerPermissionsAll(connectionId, admin.id);

  console.log("✅ Core provisioning complete");
  console.log(`- Super Admin: ${superAdmin.email} (${superAdmin.id})`);
  console.log(`- Admin:       ${admin.email} (${admin.id})`);
  console.log(`- Partner connection: ${connectionId}`);
}

run().catch(err => {
  console.error("❌ Provisioning failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});

