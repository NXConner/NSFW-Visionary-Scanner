import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";
import { getPrivilegedFlags } from "../_shared/privileged.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DiscountType = "percentage" | "fixed" | "fixed_amount" | "free" | "free_trial";

type PromoDto = {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  appliesToAll: boolean;
  appliesTo: string[];
  minPurchaseAmountUsd: number | null;
  maxRedemptions: number | null;
  currentRedemptions: number;
  maxPerUser: number | null;
  validFromIso: string | null;
  validUntilIso: string | null;
  isActive: boolean;
  campaignName: string | null;
  createdAtIso: string | null;
  updatedAtIso: string | null;
};

type ReqBody =
  | { action: "list"; includeInactive?: boolean }
  | {
      action: "upsert";
      promo: {
        code: string;
        description?: string | null;
        discountType: DiscountType;
        discountValue: number;
        appliesToAll?: boolean;
        appliesTo?: string[];
        minPurchaseAmountUsd?: number | null;
        maxRedemptions?: number | null;
        maxPerUser?: number | null;
        validFromIso?: string | null;
        validUntilIso?: string | null;
        isActive?: boolean;
        campaignName?: string | null;
      };
    }
  | { action: "set_active"; code: string; isActive: boolean };

function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function asNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeCode(raw: unknown): string {
  return asString(raw).trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeDiscountType(raw: unknown): DiscountType {
  const v = asString(raw).trim().toLowerCase();
  if (v === "percentage") return "percentage";
  if (v === "fixed" || v === "fixed_amount") return "fixed_amount";
  if (v === "free" || v === "free_trial") return "free_trial";
  // default conservative
  return "percentage";
}

function normalizeAppliesTo(list: unknown): string[] {
  const arr = Array.isArray(list) ? list : [];
  const out = arr
    .map(x => normalizeCode(x))
    .filter(Boolean)
    // avoid pathological payloads
    .slice(0, 200);
  // de-dup preserving order
  return Array.from(new Set(out));
}

function toIsoOrNull(v: unknown): string | null {
  const s = asString(v).trim();
  if (!s) return null;
  const t = new Date(s).getTime();
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

function mapPromoRow(row: Record<string, unknown>): PromoDto {
  const code = normalizeCode(row.code);
  const discountType = normalizeDiscountType(row.discount_type);
  const discountValue = Math.max(0, asNumber(row.discount_value) ?? 0);

  // Prefer modern schema (applies_to TEXT[] + valid_from/valid_until + max_redemptions/max_per_user)
  const appliesTo = normalizeAppliesTo(row.applies_to);
  const appliesToAll =
    Boolean(row.applies_to_all) ||
    appliesTo.includes("*") ||
    appliesTo.includes("ALL") ||
    appliesTo.includes("ANY");

  const validFromIso = toIsoOrNull(row.valid_from ?? row.starts_at ?? row.created_at);
  const validUntilIso = toIsoOrNull(row.valid_until ?? row.expires_at);

  const maxRedemptions = asNumber(row.max_redemptions ?? row.max_uses);
  const currentRedemptions = Math.max(
    0,
    asNumber(row.current_redemptions ?? row.current_uses) ?? 0,
  );
  const maxPerUser = asNumber(row.max_per_user ?? row.max_uses_per_user);
  const minPurchaseAmountUsd = asNumber(row.min_purchase_amount);

  return {
    id: asString(row.id),
    code,
    description: asString(row.description || "") || null,
    discountType,
    discountValue,
    appliesToAll,
    appliesTo,
    minPurchaseAmountUsd,
    maxRedemptions,
    currentRedemptions,
    maxPerUser,
    validFromIso,
    validUntilIso,
    isActive: Boolean(row.is_active ?? true),
    campaignName: asString(row.campaign_name || "") || null,
    createdAtIso: toIsoOrNull(row.created_at),
    updatedAtIso: toIsoOrNull(row.updated_at),
  };
}

function validatePromoInput(promo: ReqBody & { action: "upsert" }["promo"]) {
  const code = normalizeCode(promo.code);
  if (!code || code.length < 4 || code.length > 32 || !/^[A-Z0-9_-]+$/.test(code)) {
    throw new Error("Invalid code (use 4-32 chars: A-Z, 0-9, _ or -)");
  }

  const discountType = normalizeDiscountType(promo.discountType);
  const discountValue = Math.max(0, Number(promo.discountValue ?? 0) || 0);
  if (discountType === "percentage" && (discountValue <= 0 || discountValue > 100)) {
    throw new Error("Percentage discount must be between 0 and 100");
  }
  if ((discountType === "fixed" || discountType === "fixed_amount") && discountValue <= 0) {
    throw new Error("Fixed discount must be greater than 0");
  }

  const appliesTo = normalizeAppliesTo(promo.appliesTo ?? []);
  const appliesToAll =
    Boolean(promo.appliesToAll) || appliesTo.includes("*") || appliesTo.includes("ALL");
  if (!appliesToAll && appliesTo.length === 0) {
    // Fail closed: both the client and checkout validation should be able to determine applicability.
    throw new Error("Promo must apply to ALL or include at least one packageId in appliesTo");
  }

  const validFromIso = promo.validFromIso ? toIsoOrNull(promo.validFromIso) : null;
  const validUntilIso = promo.validUntilIso ? toIsoOrNull(promo.validUntilIso) : null;
  if (validFromIso && validUntilIso) {
    if (new Date(validUntilIso).getTime() <= new Date(validFromIso).getTime()) {
      throw new Error("validUntilIso must be after validFromIso");
    }
  }

  const maxRedemptions =
    promo.maxRedemptions == null
      ? null
      : Math.max(0, Math.floor(Number(promo.maxRedemptions) || 0));
  const maxPerUser =
    promo.maxPerUser == null ? null : Math.max(0, Math.floor(Number(promo.maxPerUser) || 0));
  const minPurchaseAmountUsd =
    promo.minPurchaseAmountUsd == null
      ? null
      : Math.max(0, Number(promo.minPurchaseAmountUsd) || 0);

  return {
    code,
    description: promo.description != null ? asString(promo.description).trim() || null : null,
    discountType,
    discountValue,
    appliesToAll,
    appliesTo,
    minPurchaseAmountUsd,
    maxRedemptions,
    maxPerUser,
    validFromIso,
    validUntilIso,
    isActive: promo.isActive == null ? true : Boolean(promo.isActive),
    campaignName: promo.campaignName != null ? asString(promo.campaignName).trim() || null : null,
  };
}

async function upsertPromoRow(supabase: any, input: ReturnType<typeof validatePromoInput>) {
  const { data: existing, error: fetchErr } = await supabase
    .from("dlc_promo_codes")
    .select("*")
    .eq("code", input.code)
    .maybeSingle();
  if (fetchErr) throw fetchErr;

  const nowIso = new Date().toISOString();

  // Detect schema variant:
  // - "v1" (dlc_system.sql): applies_to[], max_redemptions/current_redemptions, max_per_user,
  //   valid_from/valid_until, discount_type in ('percentage','fixed','free')
  // - "v2" (legacy pack/bundle schema): applies_to_all, max_uses/current_uses, max_uses_per_user,
  //   starts_at/expires_at, discount_type in ('percentage','fixed_amount','free_trial')
  let schema: "v1" | "v2" = "v2";
  try {
    const probe = await supabase.from("dlc_promo_codes").select("applies_to").limit(1);
    if (!probe.error) schema = "v1";
  } catch {
    schema = "v2";
  }

  if (schema === "v1") {
    const discountTypeV1 =
      input.discountType === "fixed_amount"
        ? "fixed"
        : input.discountType === "free_trial"
          ? "free"
          : "percentage";
    const discountValueV1 = discountTypeV1 === "free" ? 100 : input.discountValue;
    const validFrom =
      input.validFromIso ??
      (existing
        ? toIsoOrNull((existing as any).valid_from ?? (existing as any).created_at)
        : null) ??
      nowIso;

    const base: Record<string, unknown> = {
      code: input.code,
      discount_type: discountTypeV1,
      discount_value: discountValueV1,
      applies_to: input.appliesToAll ? ["ALL"] : input.appliesTo,
      max_redemptions: input.maxRedemptions,
      max_per_user: input.maxPerUser ?? 1,
      valid_from: validFrom,
      valid_until: input.validUntilIso,
      is_active: input.isActive,
      campaign_name: input.campaignName,
    };

    const q = existing
      ? supabase.from("dlc_promo_codes").update(base).eq("code", input.code)
      : supabase.from("dlc_promo_codes").insert({ ...base, created_at: nowIso });
    const { data, error } = await q.select("*").maybeSingle();
    if (error) throw error;
    return data as Record<string, unknown>;
  }

  // v2 legacy schema
  if (!input.appliesToAll) {
    throw new Error(
      "This environment uses a legacy promo schema; set appliesToAll=true (per-package applicability is unsupported here).",
    );
  }

  const discountTypeV2 =
    input.discountType === "fixed_amount"
      ? "fixed_amount"
      : input.discountType === "free_trial"
        ? "free_trial"
        : "percentage";
  const discountValueV2 = discountTypeV2 === "free_trial" ? 100 : input.discountValue;
  const startsAt =
    input.validFromIso ??
    (existing
      ? toIsoOrNull(
          (existing as any).starts_at ??
            (existing as any).valid_from ??
            (existing as any).created_at,
        )
      : null) ??
    nowIso;

  const legacy: Record<string, unknown> = {
    code: input.code,
    description: input.description,
    discount_type: discountTypeV2,
    discount_value: discountValueV2,
    applies_to_all: true,
    min_purchase_amount: input.minPurchaseAmountUsd ?? 0,
    max_uses: input.maxRedemptions,
    max_uses_per_user: input.maxPerUser ?? 1,
    starts_at: startsAt,
    expires_at: input.validUntilIso,
    is_active: input.isActive,
    updated_at: nowIso,
    campaign_name: input.campaignName,
  };

  const q = existing
    ? supabase.from("dlc_promo_codes").update(legacy).eq("code", input.code)
    : supabase
        .from("dlc_promo_codes")
        .insert({ ...legacy, created_at: nowIso, updated_at: nowIso });
  const { data, error } = await q.select("*").maybeSingle();
  if (error) throw error;
  return data as Record<string, unknown>;
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
      endpoint: "admin-dlc-promos",
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
    const user = userRes?.user;
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { isPrivileged } = await getPrivilegedFlags(supabase, user.id, user.email);
    if (!isPrivileged) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ReqBody;

    if (body.action === "list") {
      const includeInactive = Boolean(body.includeInactive ?? true);
      let q = supabase
        .from("dlc_promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (!includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q.limit(500);
      if (error) throw error;
      const promos = (data || []).map((r: any) => mapPromoRow(r));
      return new Response(JSON.stringify({ promos }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "set_active") {
      const code = normalizeCode(body.code);
      if (!code) {
        return new Response(JSON.stringify({ error: "Missing code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const isActive = Boolean(body.isActive);
      const nowIso = new Date().toISOString();
      // Some schema variants don't have updated_at. Try with updated_at then retry without it.
      let data: unknown = null;
      try {
        const res = await supabase
          .from("dlc_promo_codes")
          .update({ is_active: isActive, updated_at: nowIso })
          .eq("code", code)
          .select("*")
          .maybeSingle();
        if (res.error) throw res.error;
        data = res.data;
      } catch {
        const res = await supabase
          .from("dlc_promo_codes")
          .update({ is_active: isActive })
          .eq("code", code)
          .select("*")
          .maybeSingle();
        if (res.error) throw res.error;
        data = res.data;
      }
      return new Response(JSON.stringify({ promo: data ? mapPromoRow(data as any) : null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "upsert") {
      const normalized = validatePromoInput(body.promo);
      const row = await upsertPromoRow(supabase, normalized);
      return new Response(JSON.stringify({ promo: mapPromoRow(row) }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("admin-dlc-promos error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
