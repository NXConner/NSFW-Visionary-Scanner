/**
 * Premium Add-Ons System (Supabase-backed)
 *
 * Backed by:
 * - supabase/migrations/20251207000029_premium_add_ons.sql
 */

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { fromExtended } from "@/lib/supabaseExtensions";

const db = { from: (t: string) => fromExtended(t as any) };

export interface PremiumAddOn {
  id: string;
  addon_id: string;
  addon_name: string;
  addon_description: string;
  monthly_price: number;
  annual_price: number | null;
  lifetime_price: number | null;
  annual_discount_percentage: number;
  stripe_monthly_price_id: string | null;
  stripe_annual_price_id: string | null;
  stripe_lifetime_price_id: string | null;
  features: string[];
  limitations: string[] | null;
  requires_tier: string[];
  incompatible_addons: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  is_popular: boolean;
  category: string | null;
  icon_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserAddOn {
  id: string;
  user_id: string;
  addon_id: string;
  plan_type: "monthly" | "annual" | "lifetime";
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: "active" | "canceled" | "past_due" | "unpaid" | "trialing" | "paused";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  price_paid: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface AddOnUsageTracking {
  id: string;
  user_id: string;
  addon_id: string;
  usage_type: string;
  usage_value: number;
  usage_limit: number | null;
  period_start: string;
  period_end: string;
  tracked_at: string;
  created_at: string;
}

function isActiveSubscription(row: Pick<UserAddOn, "status" | "current_period_end">): boolean {
  if (row.status !== "active" && row.status !== "trialing") return false;
  if (!row.current_period_end) return true;
  return new Date(row.current_period_end).getTime() > Date.now();
}

export async function getPremiumAddOns(category?: string): Promise<PremiumAddOn[]> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];
    let q = db
      .from("premium_add_ons")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (category) q = q.eq("category", category);
    const { data, error } = await q;
    if (error) {
      logger.error("getPremiumAddOns failed", { error: error.message });
      return [];
    }
    return (data ?? []).map((a: any) => ({
      ...a,
      features: Array.isArray(a.features) ? a.features.map(String) : [],
      limitations: Array.isArray(a.limitations) ? a.limitations.map(String) : null,
      requires_tier: Array.isArray(a.requires_tier) ? a.requires_tier.map(String) : [],
      incompatible_addons: Array.isArray(a.incompatible_addons)
        ? a.incompatible_addons.map(String)
        : null,
    })) as PremiumAddOn[];
  } catch (error) {
    logger.error("getPremiumAddOns error", { error });
    return [];
  }
}

export async function getPremiumAddOn(addonId: string): Promise<PremiumAddOn | null> {
  const addOns = await getPremiumAddOns();
  return addOns.find(a => a.addon_id === addonId) || null;
}

export async function getUserAddOns(): Promise<UserAddOn[]> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];
    const { data, error } = await db
      .from("user_add_ons")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      logger.error("getUserAddOns failed", { error: error.message });
      return [];
    }
    return (data ?? []) as UserAddOn[];
  } catch (error) {
    logger.error("getUserAddOns error", { error });
    return [];
  }
}

export async function subscribeToAddOn(
  addonId: string,
  planType: "monthly" | "annual" | "lifetime",
): Promise<boolean> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Please sign in");
      return false;
    }

    const addon = await getPremiumAddOn(addonId);
    if (!addon) {
      toast.error("Add-on not found");
      return false;
    }

    const existing = await getUserAddOns();
    const existingRow = existing.find(a => a.addon_id === addonId);
    if (existingRow && isActiveSubscription(existingRow)) {
      toast.info("You already have this add-on");
      return true;
    }

    const price =
      planType === "monthly"
        ? Number(addon.monthly_price ?? 0)
        : planType === "annual"
          ? Number(addon.annual_price ?? 0)
          : Number(addon.lifetime_price ?? 0);

    const stripePriceId =
      planType === "monthly"
        ? addon.stripe_monthly_price_id
        : planType === "annual"
          ? addon.stripe_annual_price_id
          : addon.stripe_lifetime_price_id;

    const isFree = price <= 0;
    if (isFree) {
      const now = new Date().toISOString();
      const expiresAt =
        planType !== "lifetime" && planType !== "monthly" && addon.annual_price
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : null;

      const { error } = await db.from("user_add_ons").upsert(
        {
          user_id: auth.user.id,
          addon_id: addonId,
          plan_type: planType,
          stripe_subscription_id: null,
          stripe_price_id: null,
          status: "active",
          current_period_start: now,
          current_period_end: expiresAt,
          cancel_at_period_end: false,
          canceled_at: null,
          price_paid: 0,
          currency: "USD",
          updated_at: now,
        },
        { onConflict: "user_id,addon_id" },
      );
      if (error) {
        logger.error("subscribeToAddOn free upsert failed", { error: error.message });
        toast.error("Failed to enable add-on");
        return false;
      }
      toast.success("Add-on enabled");
      return true;
    }

    if (!stripePriceId) {
      toast.error("Stripe price is not configured for this add-on");
      return false;
    }

    const origin = window.location.origin;
    const successUrl = `${origin}/pricing?addon=success&addonId=${encodeURIComponent(addonId)}`;
    const cancelUrl = `${origin}/pricing?addon=cancel&addonId=${encodeURIComponent(addonId)}`;

    const { data, error } = await supabase.functions.invoke("create-addon-checkout-session", {
      body: { addonId, planType, successUrl, cancelUrl },
    });

    if (error || !data?.url) {
      toast.error(error?.message || data?.error || "Failed to start checkout");
      return false;
    }

    window.location.assign(String(data.url));
    return true;
  } catch (error) {
    logger.error("subscribeToAddOn error", { error, addonId, planType });
    toast.error("Failed to start add-on purchase");
    return false;
  }
}

export async function cancelAddOn(addonId: string): Promise<boolean> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Please sign in");
      return false;
    }

    const { data: row, error } = await db
      .from("user_add_ons")
      .select("*")
      .eq("user_id", auth.user.id)
      .eq("addon_id", addonId)
      .maybeSingle();

    if (error || !row) {
      toast.error("Add-on not found");
      return false;
    }

    if (row.stripe_subscription_id) {
      const { error: fnErr } = await supabase.functions.invoke("cancel-addon-subscription", {
        body: { addonId },
      });
      if (fnErr) {
        toast.error(fnErr.message || "Failed to cancel add-on");
        return false;
      }
      toast.success("Add-on cancellation scheduled");
      return true;
    }

    const { error: updErr } = await db
      .from("user_add_ons")
      .update({ status: "canceled", canceled_at: new Date().toISOString() })
      .eq("user_id", auth.user.id)
      .eq("addon_id", addonId);
    if (updErr) {
      toast.error("Failed to cancel add-on");
      return false;
    }
    toast.success("Add-on canceled");
    return true;
  } catch (error) {
    logger.error("cancelAddOn error", { error, addonId });
    toast.error("Failed to cancel add-on");
    return false;
  }
}

export async function getAddOnUsage(addonId: string): Promise<AddOnUsageTracking[]> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];
    const { data, error } = await db
      .from("addon_usage_tracking")
      .select("*")
      .eq("user_id", auth.user.id)
      .eq("addon_id", addonId)
      .order("tracked_at", { ascending: false })
      .limit(200);
    if (error) return [];
    return (data ?? []) as AddOnUsageTracking[];
  } catch {
    return [];
  }
}
