/**
 * Enhanced DLC System
 * Handles modular DLC, bundles, previews, streaming, downloads, content library organization, updates, and backups
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";
import { toast } from "sonner";

// ==================== DLC Packs ====================

export interface DLCPack {
  id: string;
  pack_name: string;
  description: string;
  pack_type: "positions" | "videos" | "education" | "bundle" | "premium_content";
  content_items: any;
  item_count: number;
  price: number;
  currency: string;
  is_subscription: boolean;
  subscription_duration_days: number | null;
  preview_images: string[] | null;
  preview_video_url: string | null;
  preview_description: string | null;
  tags: string[] | null;
  category: string | null;
  difficulty_level: string | null;
  content_rating: string | null;
  requires_base_pack: boolean;
  base_pack_id: string | null;
  is_standalone: boolean;
  is_active: boolean;
  is_featured: boolean;
  release_date: string | null;
  sales_count: number;
  revenue_total: number;
  average_rating: number | null;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export async function getDLCPacks(packType?: DLCPack["pack_type"]): Promise<DLCPack[]> {
  try {
    let query = supabase
      .from("dlc_packs")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("sales_count", { ascending: false });

    if (packType) {
      query = query.eq("pack_type", packType);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching DLC packs:", error);
      return [];
    }

    return (data || []) as DLCPack[];
  } catch (error) {
    logger.error("Error in getDLCPacks:", error);
    return [];
  }
}

// ==================== DLC Bundles ====================

export interface DLCBundle {
  id: string;
  bundle_name: string;
  description: string;
  pack_ids: string[];
  pack_count: number;
  bundle_price: number;
  original_price: number | null;
  discount_percentage: number | null;
  preview_image_url: string | null;
  preview_description: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_limited_time: boolean;
  expires_at: string | null;
  sales_count: number;
  revenue_total: number;
  created_at: string;
  updated_at: string;
}

export async function getDLCBundles(): Promise<DLCBundle[]> {
  try {
    const { data, error } = await supabase
      .from("dlc_bundles")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("sales_count", { ascending: false });

    if (error) {
      logger.error("Error fetching bundles:", error);
      return [];
    }

    return (data || []) as DLCBundle[];
  } catch (error) {
    logger.error("Error in getDLCBundles:", error);
    return [];
  }
}

// ==================== DLC Purchases ====================

export interface DLCPurchase {
  id: string;
  pack_id: string;
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

export async function purchaseDLC(packId: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to purchase DLC");
      return false;
    }

    // Get pack details
    const { data: pack } = await supabase.from("dlc_packs").select("*").eq("id", packId).single();

    if (!pack) {
      toast.error("DLC pack not found");
      return false;
    }

    // Create checkout session (Stripe)
    const { data: sessionData, error: sessionError } = await supabase.functions.invoke(
      "create-checkout-session",
      {
        body: {
          pack_id: packId,
          price: pack.price,
          success_url: `${window.location.origin}/dlc?purchase=success`,
          cancel_url: `${window.location.origin}/dlc?purchase=cancelled`,
        },
      },
    );

    if (sessionError) {
      logger.error("Error creating checkout:", sessionError);
      toast.error("Failed to start purchase");
      return false;
    }

    // Redirect to checkout
    if (sessionData.url) {
      window.location.href = sessionData.url;
    }

    return true;
  } catch (error) {
    logger.error("Error in purchaseDLC:", error);
    return false;
  }
}

export async function getDLCPurchases(): Promise<DLCPurchase[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("dlc_purchases")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("purchased_at", { ascending: false });

    if (error) {
      logger.error("Error fetching purchases:", error);
      return [];
    }

    return (data || []) as DLCPurchase[];
  } catch (error) {
    logger.error("Error in getDLCPurchases:", error);
    return [];
  }
}

// ==================== DLC Download Queue ====================

export interface DLCDownloadQueueItem {
  id: string;
  purchase_id: string;
  user_id: string;
  content_item_id: string;
  content_type: "position" | "video" | "image" | "3d_model" | "other";
  file_url: string;
  file_size_bytes: number | null;
  download_status: "queued" | "downloading" | "paused" | "completed" | "failed" | "cancelled";
  download_priority: number;
  downloaded_bytes: number;
  download_progress: number;
  download_speed_bytes_per_sec: number | null;
  estimated_time_remaining_seconds: number | null;
  queued_at: string;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
}

export async function addToDownloadQueue(
  purchaseId: string,
  contentItemId: string,
  contentType: DLCDownloadQueueItem["content_type"],
  fileUrl: string,
  priority: number = 5,
): Promise<DLCDownloadQueueItem | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to download");
      return null;
    }

    const { data, error } = await supabase
      .from("dlc_download_queue")
      .insert({
        purchase_id: purchaseId,
        user_id: user.id,
        content_item_id: contentItemId,
        content_type: contentType,
        file_url: fileUrl,
        download_priority: priority,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error adding to queue:", error);
      toast.error("Failed to add to download queue");
      return null;
    }

    toast.success("Added to download queue!");
    return data as DLCDownloadQueueItem;
  } catch (error) {
    logger.error("Error in addToDownloadQueue:", error);
    return null;
  }
}

export async function getDownloadQueue(): Promise<DLCDownloadQueueItem[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("dlc_download_queue")
      .select("*")
      .eq("user_id", user.id)
      .order("download_priority", { ascending: false })
      .order("queued_at", { ascending: true });

    if (error) {
      logger.error("Error fetching download queue:", error);
      return [];
    }

    return (data || []) as DLCDownloadQueueItem[];
  } catch (error) {
    logger.error("Error in getDownloadQueue:", error);
    return [];
  }
}

// ==================== DLC Updates ====================

export interface DLCUpdate {
  id: string;
  pack_id: string;
  version_number: string;
  update_type: "patch" | "minor" | "major" | "content_add" | null;
  changelog: string[] | null;
  new_content_items: any;
  removed_content_items: string[] | null;
  modified_content_items: any;
  update_file_url: string | null;
  update_file_size_bytes: number | null;
  is_required: boolean;
  is_available: boolean;
  release_date: string;
  created_at: string;
}

export async function getDLCUpdates(packId?: string): Promise<DLCUpdate[]> {
  try {
    let query = supabase
      .from("dlc_updates")
      .select("*")
      .eq("is_available", true)
      .order("release_date", { ascending: false });

    if (packId) {
      query = query.eq("pack_id", packId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching updates:", error);
      return [];
    }

    return (data || []) as DLCUpdate[];
  } catch (error) {
    logger.error("Error in getDLCUpdates:", error);
    return [];
  }
}
