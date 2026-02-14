import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody = {
  packageId: string;
  successUrl: string;
  cancelUrl: string;
  promoCode?: string | null;
};

function asString(v: unknown, fallback = ""): string {
  const s = typeof v === "string" ? v : v === null || v === undefined ? "" : String(v);
  return s.trim() || fallback;
}

function asNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toUnixMs(v: unknown): number | null {
  const s = asString(v, "");
  if (!s) return null;
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : null;
}

type PromoValidationResult =
  | { ok: true; promoId: string; code: string; promo: Record<string, unknown> }
  | { ok: false; error: string };

async function validatePromoCode(args: {
  supabase: any;
  userId: string;
  packageId: string;
  promoCode: string;
  subtotalUsd: number;
}): Promise<PromoValidationResult> {
  const { supabase, userId, packageId, promoCode, subtotalUsd } = args;
  const code = promoCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Invalid promo code" };

  const { data: promo, error } = await supabase
    .from("dlc_promo_codes")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !promo) return { ok: false, error: "Promo code not found" };

  const now = Date.now();

  const startsAt =
    toUnixMs((promo as any).valid_from) ??
    toUnixMs((promo as any).starts_at) ??
    toUnixMs((promo as any).created_at) ??
    now;

  const expiresAt = toUnixMs((promo as any).valid_until) ?? toUnixMs((promo as any).expires_at);

  if (startsAt > now) return { ok: false, error: "Promo code not active yet" };
  if (expiresAt !== null && expiresAt <= now) return { ok: false, error: "Promo code expired" };

  const maxUsesRaw = (promo as any).max_redemptions ?? (promo as any).max_uses ?? null;
  const currentUsesRaw =
    (promo as any).current_redemptions ??
    (promo as any).current_uses ??
    (promo as any).current_uses ??
    0;

  const maxUses = maxUsesRaw != null ? Number(maxUsesRaw) : null;
  const currentUses = currentUsesRaw != null ? Number(currentUsesRaw) : 0;
  if (maxUses != null && currentUses >= maxUses)
    return { ok: false, error: "Promo code max uses reached" };

  const minPurchaseRaw =
    (promo as any).min_purchase_amount ?? (promo as any).min_purchase_amount ?? 0;
  const minPurchase = Number(minPurchaseRaw) || 0;
  if (minPurchase > 0 && subtotalUsd < minPurchase)
    return { ok: false, error: "Promo code requires a higher purchase amount" };

  const appliesToAll = Boolean((promo as any).applies_to_all);
  const appliesTo: string[] = Array.isArray((promo as any).applies_to)
    ? (promo as any).applies_to.map((x: unknown) => asString(x).toUpperCase())
    : [];

  const appliesAny =
    appliesToAll ||
    appliesTo.includes("*") ||
    appliesTo.includes("ALL") ||
    appliesTo.includes(packageId.toUpperCase());
  if (!appliesAny && appliesTo.length > 0) return { ok: false, error: "Promo code not applicable" };

  const maxPerUserRaw = (promo as any).max_per_user ?? (promo as any).max_uses_per_user ?? 1;
  const maxPerUser = Number(maxPerUserRaw) || 1;
  if (maxPerUser > 0) {
    // Support either table name depending on which migration was applied.
    let count = 0;
    try {
      const { count: c } = await supabase
        .from("dlc_promo_redemptions" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("promo_code_id", (promo as any).id);
      count = Number(c ?? 0);
    } catch {
      try {
        const { count: c } = await supabase
          .from("dlc_promo_code_usage" as any)
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("promo_code_id", (promo as any).id);
        count = Number(c ?? 0);
      } catch {
        // ignore
      }
    }
    if (count >= maxPerUser) return { ok: false, error: "Promo code per-user limit reached" };
  }

  return { ok: true, promoId: asString((promo as any).id), code, promo: promo as any };
}

async function resolveStripePromotionCodeId(args: {
  stripe: Stripe;
  promoCode: string;
  isLiveMode: boolean;
  currency: string;
  promoRow?: Record<string, unknown>;
}): Promise<string | null> {
  const { stripe, promoCode, isLiveMode, currency, promoRow } = args;
  const code = promoCode.trim().toUpperCase();
  if (!code) return null;

  const listed = await stripe.promotionCodes.list({ code, active: true, limit: 1 } as any);
  const existingId = listed.data?.[0]?.id ? String(listed.data[0].id) : null;
  if (existingId) return existingId;

  // In live mode, do not auto-create coupons/promotion codes.
  if (isLiveMode) return null;

  const discountType = asString((promoRow as any)?.discount_type, "").toLowerCase();
  const discountValue = asNumber((promoRow as any)?.discount_value) ?? 0;

  // Create coupon + promotion code in Stripe test mode as a convenience.
  let coupon: Stripe.Coupon;
  if (discountType === "percentage") {
    coupon = await stripe.coupons.create({
      percent_off: Math.max(0, Math.min(100, discountValue)),
    } as any);
  } else if (discountType === "fixed" || discountType === "fixed_amount") {
    coupon = await stripe.coupons.create({
      amount_off: Math.max(0, Math.round(discountValue * 100)),
      currency,
    } as any);
  } else if (discountType === "free" || discountType === "free_trial") {
    coupon = await stripe.coupons.create({ percent_off: 100 } as any);
  } else {
    return null;
  }

  const pc = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code,
    active: true,
  } as any);
  return pc.id ? String(pc.id) : null;
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { packageId, successUrl, cancelUrl, promoCode } = (await req.json()) as ReqBody;
    if (!packageId || !successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid authentication");

    const { data: pkg, error: pkgError } = await supabase
      .from("dlc_packages")
      .select("*")
      .eq("package_id", packageId)
      .eq("is_active", true)
      .maybeSingle();

    if (pkgError) {
      console.error("Package query error:", pkgError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pkg) {
      console.error("Package not found for packageId:", packageId);
      return new Response(JSON.stringify({ error: "Package not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Schema-tolerant extraction (supports historical variants).
    const resolvedPackageId = asString(
      (pkg as any).package_id ?? (pkg as any).packageId,
      packageId,
    );
    const resolvedName = asString(
      (pkg as any).package_name ?? (pkg as any).packageName ?? (pkg as any).name,
      resolvedPackageId,
    );
    const resolvedDescription = asString(
      (pkg as any).safe_description ?? (pkg as any).description ?? (pkg as any).full_description,
      "",
    );

    const priceUsd =
      asNumber((pkg as any).price_usd) ??
      asNumber((pkg as any).priceUsd) ??
      asNumber((pkg as any).price) ??
      0;

    const priceTypeRaw = asString((pkg as any).price_type ?? (pkg as any).priceType, "");
    const packageTypeRaw = asString((pkg as any).package_type ?? (pkg as any).packageType, "");
    const isSubscription =
      priceTypeRaw === "subscription" ||
      packageTypeRaw === "subscription" ||
      (pkg as any).is_subscription === true;

    const subscriptionIntervalRaw = asString(
      (pkg as any).subscription_interval ?? (pkg as any).subscriptionInterval,
      "monthly",
    ).toLowerCase();

    const recurringInterval =
      subscriptionIntervalRaw === "yearly" || subscriptionIntervalRaw === "year" ? "year" : "month";

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    if (!stripeSecretKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    const isLiveMode =
      stripeSecretKey.startsWith("sk_live_") || stripeSecretKey.startsWith("rk_live_");

    // Reuse/ensure customer for this user (stored in user_subscriptions table)
    // This keeps billing portal & receipts consistent with subscriptions.
    let { data: subscriptionRow } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = subscriptionRow?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from("user_subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        status: "incomplete",
      });
    }

    const currency = "usd";
    const unitAmount = Math.round(Number(priceUsd) * 100);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      throw new Error("Invalid package price");
    }

    const normalizedPromoCode = asString(promoCode, "");

    let promoMeta: { promoCode: string; promoId: string; promo: Record<string, unknown> } | null =
      null;
    if (normalizedPromoCode) {
      const validation = await validatePromoCode({
        supabase,
        userId: user.id,
        packageId: resolvedPackageId,
        promoCode: normalizedPromoCode,
        subtotalUsd: Number(priceUsd) || 0,
      });
      if (!validation.ok) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      promoMeta = {
        promoCode: validation.code,
        promoId: validation.promoId,
        promo: validation.promo,
      };
    }

    const stripePriceId =
      asString((pkg as any).stripe_price_id ?? (pkg as any).stripePriceId, "") || null;
    if (isLiveMode && !stripePriceId) {
      throw new Error("Missing stripe_price_id for package (required in live mode)");
    }

    const mode = isSubscription ? "subscription" : "payment";
    const lineItem = stripePriceId
      ? { price: stripePriceId, quantity: 1 }
      : {
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: {
              name: resolvedName,
              description: resolvedDescription,
              metadata: {
                dlc_package_id: resolvedPackageId,
              },
            },
            recurring: mode === "subscription" ? { interval: recurringInterval as any } : undefined,
          },
          quantity: 1,
        };

    let discounts: Array<{ promotion_code: string }> | undefined = undefined;
    if (promoMeta) {
      const promoId = await resolveStripePromotionCodeId({
        stripe,
        promoCode: promoMeta.promoCode,
        isLiveMode,
        currency,
        promoRow: promoMeta.promo,
      });
      if (!promoId) {
        return new Response(
          JSON.stringify({
            error: isLiveMode
              ? "Promo code must exist as an active Stripe Promotion Code in live mode"
              : "Promo code could not be applied",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      discounts = [{ promotion_code: promoId }];
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [lineItem as any],
      mode: mode as any,
      success_url: successUrl,
      cancel_url: cancelUrl,
      discounts: discounts as any,
      metadata: {
        purchase_type: "dlc",
        dlc_package_id: resolvedPackageId,
        supabase_user_id: user.id,
        ...(promoMeta ? { promo_code: promoMeta.promoCode, promo_code_id: promoMeta.promoId } : {}),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating DLC checkout session:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
