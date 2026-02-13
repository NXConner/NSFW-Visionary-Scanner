/**
 * Premium Content Marketplace (Supabase-backed)
 *
 * Backed by:
 * - supabase/migrations/20251207000025_premium_content_marketplace.sql
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { fromExtended } from "@/lib/supabaseExtensions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = { from: (t: string) => fromExtended(t as any) };

export interface PremiumContentItem {
  id: string;
  creator_id: string;
  content_type: "position_pack" | "video" | "course" | "expert_content" | "bundle";
  title: string;
  description: string;
  content_data: any;
  preview_content: any;
  preview_images: string[] | null;
  preview_video_url: string | null;
  thumbnail_url: string | null;
  price: number;
  currency: string;
  is_subscription: boolean;
  subscription_duration_days: number | null;
  category: string | null;
  tags: string[] | null;
  difficulty_level: string | null;
  content_rating: string | null;
  target_audience: string[] | null;
  expert_name: string | null;
  expert_credentials: string | null;
  expert_bio: string | null;
  view_count: number;
  purchase_count: number;
  revenue_total: number;
  average_rating: number | null;
  rating_count: number;
  review_count: number;
  is_active: boolean;
  is_featured: boolean;
  is_verified: boolean;
  is_trending: boolean;
  is_approved: boolean;
  moderation_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PremiumContentPurchase {
  id: string;
  content_id: string;
  user_id: string;
  purchase_type: "one_time" | "subscription";
  price_paid: number;
  payment_intent_id: string | null;
  access_granted_at: string;
  access_expires_at: string | null;
  is_active: boolean;
  download_enabled: boolean;
  stream_enabled: boolean;
  purchased_at: string;
}

export interface PremiumContentReview {
  id: string;
  content_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  pros: string[] | null;
  cons: string[] | null;
  has_used_content: boolean;
  usage_duration_days: number | null;
  results_achieved: string | null;
  helpful_count: number;
  is_verified_purchase: boolean;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

function isActivePurchase(
  p: Pick<PremiumContentPurchase, "is_active" | "access_expires_at">,
): boolean {
  if (!p.is_active) return false;
  if (!p.access_expires_at) return true;
  return new Date(p.access_expires_at).getTime() > Date.now();
}

export async function getPremiumContent(
  contentType?: PremiumContentItem["content_type"],
  category?: string,
): Promise<PremiumContentItem[]> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];

    let q = db
      .from("premium_content_items")
      .select("*")
      .eq("is_active", true)
      .eq("is_approved", true)
      .order("is_featured", { ascending: false })
      .order("is_trending", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (contentType) q = q.eq("content_type", contentType);
    if (category) q = q.eq("category", category);

    const { data, error } = await q;
    if (error) {
      logger.error("getPremiumContent failed", { error: error.message });
      return [];
    }
    return (data ?? []) as PremiumContentItem[];
  } catch (error) {
    logger.error("getPremiumContent error", { error });
    return [];
  }
}

export async function purchasePremiumContent(contentId: string): Promise<boolean> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Please sign in to purchase");
      return false;
    }

    const { data: item, error: itemErr } = await db
      .from("premium_content_items")
      .select("*")
      .eq("id", contentId)
      .maybeSingle();

    if (itemErr || !item) {
      toast.error("Content not found");
      return false;
    }

    const { data: existing, error: ownErr } = await db
      .from("premium_content_purchases")
      .select("*")
      .eq("user_id", auth.user.id)
      .eq("content_id", contentId)
      .order("purchased_at", { ascending: false })
      .limit(10);

    if (!ownErr && Array.isArray(existing) && existing.some(isActivePurchase)) {
      toast.info("You already own this content");
      return true;
    }

    const isFree = Number(item.price ?? 0) <= 0;
    if (isFree) {
      const now = new Date();
      const expires =
        item.is_subscription && item.subscription_duration_days
          ? new Date(now.getTime() + Number(item.subscription_duration_days) * 24 * 60 * 60 * 1000)
          : null;
      const purchaseType = item.is_subscription ? "subscription" : "one_time";

      const { error } = await db.from("premium_content_purchases").insert({
        content_id: contentId,
        user_id: auth.user.id,
        purchase_type: purchaseType,
        price_paid: 0,
        payment_intent_id: null,
        access_granted_at: now.toISOString(),
        access_expires_at: expires ? expires.toISOString() : null,
        is_active: true,
        download_enabled: true,
        stream_enabled: true,
        purchased_at: now.toISOString(),
      });

      if (error) {
        logger.error("Failed to insert premium_content_purchases", { error: error.message });
        toast.error("Failed to add to library");
        return false;
      }

      toast.success("Added to your library!");
      return true;
    }

    // Paid checkout via Stripe (grants via webhook)
    const origin = window.location.origin;
    const successUrl = `${origin}/premium-marketplace?purchase=success&content=${encodeURIComponent(contentId)}`;
    const cancelUrl = `${origin}/premium-marketplace?purchase=cancel&content=${encodeURIComponent(contentId)}`;

    const { data, error } = await supabase.functions.invoke(
      "create-premium-content-checkout-session",
      {
        body: { contentId, successUrl, cancelUrl },
      },
    );

    if (error || !data?.url) {
      toast.error(error?.message || data?.error || "Checkout not available");
      return false;
    }

    window.location.assign(String(data.url));
    return true;
  } catch (error) {
    logger.error("purchasePremiumContent error", { error, contentId });
    toast.error("Failed to start purchase");
    return false;
  }
}

export async function createPremiumContentReview(
  contentId: string,
  rating: number,
  reviewText?: string,
  pros?: string[],
  cons?: string[],
): Promise<PremiumContentReview | null> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Please sign in to review");
      return null;
    }

    const r = Math.max(1, Math.min(5, Number(rating)));
    const { data, error } = await db
      .from("premium_content_reviews")
      .upsert(
        {
          content_id: contentId,
          user_id: auth.user.id,
          rating: r,
          review_text: reviewText ?? null,
          pros: pros ?? null,
          cons: cons ?? null,
          has_used_content: true,
          usage_duration_days: null,
          results_achieved: null,
          helpful_count: 0,
          is_verified_purchase: false,
          is_approved: true,
          is_featured: false,
        },
        { onConflict: "content_id,user_id" },
      )
      .select("*")
      .single();

    if (error) {
      logger.error("createPremiumContentReview failed", { error: error.message });
      toast.error("Failed to submit review");
      return null;
    }

    toast.success("Review submitted");
    return (data ?? null) as PremiumContentReview | null;
  } catch (error) {
    logger.error("createPremiumContentReview error", { error });
    toast.error("Failed to submit review");
    return null;
  }
}

export async function addToWishlist(contentId: string): Promise<boolean> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Please sign in");
      return false;
    }
    const { error } = await db
      .from("premium_content_wishlist")
      .upsert(
        { content_id: contentId, user_id: auth.user.id },
        { onConflict: "content_id,user_id" },
      );
    if (error) {
      logger.error("addToWishlist failed", { error: error.message });
      return false;
    }
    toast.success("Added to wishlist");
    return true;
  } catch (error) {
    logger.error("addToWishlist error", { error });
    return false;
  }
}

export async function getWishlist(): Promise<PremiumContentItem[]> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];

    const { data, error } = await db
      .from("premium_content_wishlist")
      .select("content_id, premium_content_items(*)")
      .eq("user_id", auth.user.id)
      .order("added_at", { ascending: false })
      .limit(200);

    if (error) {
      logger.error("getWishlist failed", { error: error.message });
      return [];
    }

    return (data ?? [])
      .map((row: any) => row.premium_content_items)
      .filter(Boolean) as PremiumContentItem[];
  } catch (error) {
    logger.error("getWishlist error", { error });
    return [];
  }
}
