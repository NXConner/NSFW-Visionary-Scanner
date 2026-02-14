import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

import type { RoutineMarketplaceItem } from "../advancedTypes";
import { db } from "./common";

export async function getMarketplaceRoutines(
  category?: string,
  maxPrice?: number,
): Promise<RoutineMarketplaceItem[]> {
  try {
    let q = (db as any)
      .from("routine_marketplace")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (category) q = q.eq("marketplace_category", category);
    if (maxPrice != null && Number.isFinite(maxPrice)) q = q.lte("price", Number(maxPrice));

    const { data, error } = await q;
    if (error) {
      logger.error("getMarketplaceRoutines failed", { error: error.message });
      return [];
    }

    return (data || []).map((r: any) => ({
      id: String(r.id),
      template_id: r.template_id ?? null,
      creator_id: String(r.creator_id),
      price: Number(r.price ?? 0),
      currency: String(r.currency ?? "USD"),
      is_subscription: Boolean(r.is_subscription),
      subscription_duration_days: r.subscription_duration_days ?? null,
      marketplace_category: r.marketplace_category ?? null,
      tags: Array.isArray(r.tags) ? r.tags.map(String) : null,
      featured_image_url: r.featured_image_url ?? null,
      preview_video_url: r.preview_video_url ?? null,
      sales_count: Number(r.sales_count ?? 0),
      revenue_total: Number(r.revenue_total ?? 0),
      average_rating: r.average_rating != null ? Number(r.average_rating) : null,
      is_active: Boolean(r.is_active),
      is_featured: Boolean(r.is_featured),
      created_at: String(r.created_at ?? new Date().toISOString()),
      updated_at: String(r.updated_at ?? new Date().toISOString()),
    })) as RoutineMarketplaceItem[];
  } catch (error) {
    logger.error("getMarketplaceRoutines error", { error });
    return [];
  }
}

export async function purchaseRoutine(marketplaceId: string): Promise<boolean> {
  try {
    const origin = window.location.origin;
    const successUrl = `${origin}/routines?purchase=success&marketplace=${encodeURIComponent(marketplaceId)}`;
    const cancelUrl = `${origin}/routines?purchase=cancel&marketplace=${encodeURIComponent(marketplaceId)}`;

    const { data, error } = await supabase.functions.invoke(
      "create-routine-marketplace-checkout-session",
      {
        body: { marketplaceId, successUrl, cancelUrl },
      },
    );

    if (error || !data?.url) {
      const msg = error?.message || data?.error || "Checkout not available";
      toast.error(msg);
      return false;
    }

    window.location.assign(String(data.url));
    return true;
  } catch (error) {
    logger.error("purchaseRoutine error", { error, marketplaceId });
    toast.error("Failed to start checkout");
    return false;
  }
}
