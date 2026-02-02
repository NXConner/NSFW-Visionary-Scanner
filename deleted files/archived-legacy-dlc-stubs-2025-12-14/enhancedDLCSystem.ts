/**
 * Enhanced DLC System - Stub implementation
 * Database tables don't exist yet
 */

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
  return [];
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
  return [];
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
  toast.info("DLC purchases coming soon");
  return false;
}

export async function getDLCPurchases(): Promise<DLCPurchase[]> {
  return [];
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
  toast.info("Download queue coming soon");
  return null;
}

export async function getDownloadQueue(): Promise<DLCDownloadQueueItem[]> {
  return [];
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
  return [];
}
