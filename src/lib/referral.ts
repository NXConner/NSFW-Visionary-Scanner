/**
 * Referral Program System
 *
 * Backed by `supabase/migrations/20251207000000_referral_system.sql` and edge functions:
 * - `generate-referral-code` (service-role safe generator)
 * - `apply-referral-code` (service-role safe application)
 */

import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "./logger";
import { toast } from "sonner";

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  is_active: boolean;
  usage_count: number;
  max_uses: number | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralTracking {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code_id: string;
  status: "pending" | "completed" | "rewarded" | "expired";
  reward_type: "discount" | "free_month" | "credit" | "badge" | null;
  reward_value: number | null;
  reward_applied: boolean;
  referred_subscribed: boolean;
  referred_subscription_tier: string | null;
  created_at: string;
  completed_at: string | null;
  rewarded_at: string | null;
}

export interface ReferralReward {
  id: string;
  user_id: string;
  referral_tracking_id: string;
  reward_type: string;
  reward_value: number;
  reward_status: "pending" | "applied" | "expired" | "cancelled";
  expires_at: string | null;
  applied_at: string | null;
  created_at: string;
}

export interface ReferralAnalytics {
  total_referrals: number;
  completed_referrals: number;
  pending_referrals: number;
  total_rewards_earned: number;
  conversion_rate: number;
  top_referrers: Array<{
    user_id: string;
    count: number;
  }>;
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

/**
 * Generate or get user's referral code
 */
export async function getOrCreateReferralCode(): Promise<ReferralCode | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      logger.error("User not authenticated");
      return null;
    }

    // Generate new referral code via Edge Function
    const { data, error } = await supabase.functions.invoke("generate-referral-code", {
      body: { user_id: user.id },
    });

    if (error) {
      logger.error("Error generating referral code:", error);
      return null;
    }

    return data as ReferralCode;
  } catch (error) {
    logger.error("Error in getOrCreateReferralCode:", error);
    return null;
  }
}

/**
 * Validate referral code
 */
export async function validateReferralCode(code: string): Promise<boolean> {
  try {
    const normalized = normalizeCode(code);
    if (!normalized) return false;

    const { data, error } = await fromExtended("referral_codes")
      .select("id, is_active, usage_count, max_uses, expires_at")
      .eq("code", normalized)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      logger.error("Error validating referral code", { error: error.message });
      return false;
    }
    if (!data) return false;

    const d = data as Record<string, unknown>;
    if (isExpired((d.expires_at as string | null) ?? null)) return false;
    const usageCount = Number(d.usage_count ?? 0);
    const maxUses = d.max_uses == null ? null : Number(d.max_uses);
    if (maxUses != null && usageCount >= maxUses) return false;
    return true;
  } catch (e) {
    logger.error("Error in validateReferralCode", {
      error: e instanceof Error ? e.message : "Unknown error",
    });
    return false;
  }
}

/**
 * Apply referral code (when new user signs up)
 */
export async function applyReferralCode(code: string): Promise<boolean> {
  try {
    const normalized = normalizeCode(code);
    if (!normalized) return false;

    // This requires service-role due to RLS; use edge function.
    const { data, error } = await supabase.functions.invoke("apply-referral-code", {
      body: { code: normalized },
    });

    if (error) {
      toast.error(error.message || "Failed to apply referral code");
      logger.error("Failed to apply referral code", { error: error.message });
      return false;
    }

    if (data?.alreadyApplied) {
      toast.info("Referral already applied");
      return true;
    }

    toast.success("Referral applied!");
    return true;
  } catch (e) {
    toast.error("Failed to apply referral code");
    logger.error("Error in applyReferralCode", {
      error: e instanceof Error ? e.message : "Unknown error",
    });
    return false;
  }
}

/**
 * Get user's referral statistics
 */
export async function getReferralStats(): Promise<ReferralAnalytics | null> {
  try {
    const userId = await requireUserId();

    const { data: tracking, error: trackingErr } = await fromExtended("referral_tracking")
      .select("status")
      .eq("referrer_id", userId);

    if (trackingErr) throw trackingErr;

    const trackingData = (tracking ?? []) as Array<{ status: string }>;
    const total = trackingData.length;
    const completed = trackingData.filter(
      t => t.status === "completed" || t.status === "rewarded",
    ).length;
    const pending = trackingData.filter(t => t.status === "pending").length;

    const { data: rewards, error: rewardsErr } = await fromExtended("referral_rewards")
      .select("reward_value, reward_status")
      .eq("user_id", userId);

    if (rewardsErr) throw rewardsErr;

    const rewardsData = (rewards ?? []) as Array<{ reward_value: number; reward_status: string }>;
    const totalRewardsEarned = rewardsData
      .filter(r => r.reward_status === "applied" || r.reward_status === "pending")
      .reduce((sum: number, r) => sum + Number(r.reward_value ?? 0), 0);

    const conversionRate = total > 0 ? completed / total : 0;

    return {
      total_referrals: total,
      completed_referrals: completed,
      pending_referrals: pending,
      total_rewards_earned: totalRewardsEarned,
      conversion_rate: conversionRate,
      // Not available client-side due to RLS; leave empty unless you add an admin/service endpoint.
      top_referrers: [],
    };
  } catch (e) {
    logger.error("Error in getReferralStats", {
      error: e instanceof Error ? e.message : "Unknown error",
    });
    return null;
  }
}

/**
 * Get referral tracking list
 */
export async function getReferralTracking(): Promise<ReferralTracking[]> {
  try {
    const userId = await requireUserId();
    const { data, error } = await fromExtended("referral_tracking")
      .select("*")
      .or(`referrer_id.eq.${userId},referred_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as unknown as ReferralTracking[];
  } catch (e) {
    logger.error("Error in getReferralTracking", {
      error: e instanceof Error ? e.message : "Unknown error",
    });
    return [];
  }
}

/**
 * Get referral rewards
 */
export async function getReferralRewards(): Promise<ReferralReward[]> {
  try {
    const userId = await requireUserId();
    const { data, error } = await fromExtended("referral_rewards")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as unknown as ReferralReward[];
  } catch (e) {
    logger.error("Error in getReferralRewards", {
      error: e instanceof Error ? e.message : "Unknown error",
    });
    return [];
  }
}

/**
 * Share referral code
 */
export function shareReferralCode(code: string): void {
  const shareText = `Join me on this amazing health tracking app! Use my referral code: ${code}\n\nGet started: ${window.location.origin}?ref=${code}`;
  const shareUrl = `${window.location.origin}?ref=${code}`;

  if (navigator.share) {
    navigator
      .share({
        title: "Join me on this health app!",
        text: shareText,
        url: shareUrl,
      })
      .catch(err => {
        logger.error("Error sharing:", err);
        copyToClipboard(shareUrl);
      });
  } else {
    copyToClipboard(shareUrl);
  }
}

/**
 * Copy to clipboard
 */
function copyToClipboard(text: string): void {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      toast.success("Referral link copied to clipboard!");
    })
    .catch(err => {
      logger.error("Error copying to clipboard:", err);
      toast.error("Failed to copy referral link");
    });
}

/**
 * Get referral leaderboard (opt-in, anonymous)
 */
export async function getReferralLeaderboard(limit: number = 10): Promise<
  Array<{
    display_name: string;
    referral_count: number;
    rank: number;
  }>
> {
  // Not exposed client-side by default due to RLS; keep as an empty list unless you add a service endpoint.
  void limit;
  return [];
}
