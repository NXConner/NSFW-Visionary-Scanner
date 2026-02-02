/**
 * Subscription Tiers Expansion (Supabase-backed)
 *
 * Backed by:
 * - supabase/migrations/20251207000028_subscription_tiers_expansion.sql
 * - supabase/migrations/20251213000001_user_subscriptions_compat.sql (current subscription source)
 */

import { toast } from "sonner";
import { logger } from "./logger";
import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";

// ==================== Subscription Tiers ====================

export interface SubscriptionTier {
  id: string;
  tier_id: string;
  tier_name: string;
  tier_description: string | null;
  monthly_price: number;
  annual_price: number | null;
  lifetime_price: number | null;
  annual_discount_percentage: number;
  lifetime_discount_percentage: number;
  stripe_monthly_price_id: string | null;
  stripe_annual_price_id: string | null;
  stripe_lifetime_price_id: string | null;
  features: string[];
  limitations: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  is_popular: boolean;
  sort_order: number;
  icon_url: string | null;
  color_scheme: string | null;
  created_at: string;
  updated_at: string;
}

export async function getSubscriptionTiers(): Promise<SubscriptionTier[]> {
  try {
    const { data, error } = await fromExtended("subscription_tiers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("getSubscriptionTiers failed", { error: error.message });
      return [];
    }

    return (data ?? []).map((t: any) => ({
      ...t,
      features: Array.isArray(t.features) ? t.features.map(String) : [],
      limitations: Array.isArray(t.limitations) ? t.limitations.map(String) : null,
    })) as SubscriptionTier[];
  } catch (e) {
    logger.error("getSubscriptionTiers error", { error: e });
    return [];
  }
}

export async function getSubscriptionTier(tierId: string): Promise<SubscriptionTier | null> {
  const tiers = await getSubscriptionTiers();
  return tiers.find(t => t.tier_id === tierId) || null;
}

// ==================== Subscription Plans ====================

export interface SubscriptionPlan {
  id: string;
  user_id: string;
  tier_id: string;
  plan_type: "monthly" | "annual" | "lifetime";
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  stripe_customer_id: string | null;
  status: "active" | "canceled" | "past_due" | "unpaid" | "trialing" | "paused";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  price_paid: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export async function getUserSubscriptionPlan(): Promise<SubscriptionPlan | null> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;

    // Source of truth currently is `user_subscriptions` maintained by Stripe webhooks.

    const { data, error } = await fromExtended("user_subscriptions")
      .select("*")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error) {
      logger.warn("getUserSubscriptionPlan: failed to fetch user_subscriptions", {
        error: error.message,
      });
      return null;
    }
    if (!data) return null;

    const tier = (data.subscription_tier ?? data.plan_id ?? data.plan_id ?? data.plan_id) as
      | string
      | null;
    const stripePriceId = (data.stripe_price_id ?? null) as string | null;
    const status = (data.status ?? "canceled") as SubscriptionPlan["status"];

    let planType: SubscriptionPlan["plan_type"] = "monthly";
    if (stripePriceId) {
      const tiers = await getSubscriptionTiers();
      const t = tiers.find(x => x.tier_id === tier);
      if (t?.stripe_annual_price_id && stripePriceId === t.stripe_annual_price_id)
        planType = "annual";
      if (t?.stripe_lifetime_price_id && stripePriceId === t.stripe_lifetime_price_id)
        planType = "lifetime";
    }

    return {
      id: String(data.id ?? data.user_id),
      user_id: String(data.user_id),
      tier_id: String(tier ?? "free"),
      plan_type: planType,
      stripe_subscription_id: data.stripe_subscription_id ?? null,
      stripe_price_id: stripePriceId,
      stripe_customer_id: data.stripe_customer_id ?? null,
      status,
      current_period_start: data.current_period_start ?? null,
      current_period_end: data.current_period_end ?? null,
      cancel_at_period_end: Boolean(data.cancel_at_period_end ?? false),
      canceled_at: data.canceled_at ?? null,
      trial_start: null,
      trial_end: null,
      price_paid: 0,
      currency: "USD",
      created_at: data.created_at ?? new Date().toISOString(),
      updated_at: data.updated_at ?? new Date().toISOString(),
    } as SubscriptionPlan;
  } catch (e) {
    logger.error("getUserSubscriptionPlan error", { error: e });
    return null;
  }
}

export async function subscribeToTier(
  tierId: string,
  planType: "monthly" | "annual" | "lifetime",
): Promise<boolean> {
  try {
    const tier = await getSubscriptionTier(tierId);
    if (!tier) {
      toast.error("Tier not found");
      return false;
    }

    const priceId =
      planType === "monthly"
        ? tier.stripe_monthly_price_id
        : planType === "annual"
          ? tier.stripe_annual_price_id
          : tier.stripe_lifetime_price_id;

    if (!priceId) {
      toast.error("Stripe price is not configured for this plan");
      return false;
    }

    const origin = window.location.origin;
    const successUrl = `${origin}/pricing?subscription=success&tier=${encodeURIComponent(tierId)}`;
    const cancelUrl = `${origin}/pricing?subscription=cancel&tier=${encodeURIComponent(tierId)}`;

    const { data, error } = await supabase.functions.invoke("create-checkout-session", {
      body: { priceId, successUrl, cancelUrl },
    });

    if (error || !data?.url) {
      toast.error(error?.message || "Failed to start checkout");
      return false;
    }

    window.location.assign(String(data.url));
    return true;
  } catch (e) {
    logger.error("subscribeToTier error", { error: e, tierId, planType });
    toast.error("Failed to start subscription");
    return false;
  }
}

export async function upgradeSubscription(
  newTierId: string,
  planType: "monthly" | "annual" | "lifetime",
): Promise<boolean> {
  // For now, upgrades use the same checkout flow; Stripe will handle proration depending on dashboard settings.
  return await subscribeToTier(newTierId, planType);
}

export async function cancelSubscription(): Promise<boolean> {
  try {
    const plan = await getUserSubscriptionPlan();
    if (!plan?.stripe_subscription_id) {
      toast.error("No active subscription");
      return false;
    }
    const { error } = await supabase.functions.invoke("cancel-subscription", {
      body: { subscriptionId: plan.stripe_subscription_id, cancelAtPeriodEnd: true },
    });
    if (error) {
      toast.error(error.message || "Failed to cancel subscription");
      return false;
    }
    toast.success("Subscription cancellation scheduled");
    return true;
  } catch (e) {
    logger.error("cancelSubscription error", { error: e });
    toast.error("Failed to cancel subscription");
    return false;
  }
}

// ==================== Tier Comparison ====================

export interface TierComparisonFeature {
  id: string;
  feature_name: string;
  feature_description: string | null;
  feature_category: string | null;
  available_tiers: string[];
  is_premium: boolean;
  is_core: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function getTierComparisonFeatures(): Promise<TierComparisonFeature[]> {
  try {
    const { data, error } = await fromExtended("tier_comparison_features")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      logger.warn("getTierComparisonFeatures failed", { error: error.message });
      return [];
    }
    return (data ?? []) as TierComparisonFeature[];
  } catch (e) {
    logger.error("getTierComparisonFeatures error", { error: e });
    return [];
  }
}
