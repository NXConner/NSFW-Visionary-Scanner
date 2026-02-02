import { logger } from "@/lib/logger";
import { fromExtended } from "@/lib/supabaseExtensions";
import type { MarketplaceItem } from "./types";

// Use type-safe helper from supabaseExtensions instead of casting
const from = (table: string) => fromExtended(table as Parameters<typeof fromExtended>[0]);

export async function getMarketplaceItems(
  itemType?: MarketplaceItem["item_type"],
  categoryId?: string,
  featured?: boolean,
  limit: number = 50,
): Promise<MarketplaceItem[]> {
  try {
    let query = from("marketplace_items")
      .select("*")
      .eq("is_active", true)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .range(0, Math.max(0, limit - 1));

    if (itemType) query = query.eq("item_type", itemType);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (featured) query = query.eq("is_featured", true);

    const { data, error } = await query;
    if (error) {
      logger.error("Failed to get marketplace items", { error: error.message });
      return [];
    }
    return (data || []) as MarketplaceItem[];
  } catch (err) {
    logger.error("Error getting marketplace items", { error: err });
    return [];
  }
}

export async function getMarketplaceItem(itemId: string): Promise<MarketplaceItem | null> {
  try {
    const { data, error } = await from("marketplace_items")
      .select("*")
      .eq("id", itemId)
      .maybeSingle();

    if (error) {
      logger.error("Failed to get marketplace item", { error: error.message, itemId });
      return null;
    }

    return (data as MarketplaceItem | null) ?? null;
  } catch (err) {
    logger.error("Error getting marketplace item", { error: err, itemId });
    return null;
  }
}

export async function searchMarketplace(query: string): Promise<MarketplaceItem[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const { data, error } = await from("marketplace_items")
      .select("*")
      .eq("is_active", true)
      .eq("is_approved", true)
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("Failed to search marketplace", { error: error.message, query: q });
      return [];
    }
    return (data || []) as MarketplaceItem[];
  } catch (err) {
    logger.error("Error searching marketplace", { error: err, query: q });
    return [];
  }
}

export async function getFeaturedItems(): Promise<MarketplaceItem[]> {
  return await getMarketplaceItems(undefined, undefined, true, 50);
}

export async function getTrendingItems(): Promise<MarketplaceItem[]> {
  try {
    const { data, error } = await from("marketplace_items")
      .select("*")
      .eq("is_active", true)
      .eq("is_approved", true)
      .eq("is_trending", true)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("Failed to get trending items", { error: error.message });
      return [];
    }
    return (data || []) as MarketplaceItem[];
  } catch (err) {
    logger.error("Error getting trending items", { error: err });
    return [];
  }
}
