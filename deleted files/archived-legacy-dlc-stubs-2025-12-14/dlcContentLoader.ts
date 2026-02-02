/**
 * DLC Content Loader
 * Handles loading and managing DLC content
 */

import { toast } from "sonner";
import { getDLCPacks, getDLCPurchases, DLCPack, DLCPurchase } from "./enhancedDLCSystem";
import { hasDLCLicense } from "./dlcManager";

export interface DLCContentItem {
  id: string;
  name: string;
  description: string;
  type: "position" | "video" | "education" | "image" | "3d_model" | "other";
  url?: string;
  thumbnail_url?: string;
  metadata?: Record<string, any>;
}

export interface LoadedDLCContent {
  packId: string;
  packName: string;
  items: DLCContentItem[];
  isOwned: boolean;
  isLoaded: boolean;
}

/**
 * Check if user has access to a specific DLC pack
 */
export async function hasAccessToPack(packId: string): Promise<boolean> {
  try {
    const hasLicense = await hasDLCLicense();
    if (!hasLicense) return false;

    const purchases = await getDLCPurchases();
    return purchases.some(p => p.pack_id === packId && p.is_active);
  } catch {
    return false;
  }
}

/**
 * Get all available DLC packs with ownership status
 */
export async function getAvailableDLCPacks(): Promise<Array<DLCPack & { isOwned: boolean }>> {
  try {
    const [packs, purchases] = await Promise.all([getDLCPacks(), getDLCPurchases()]);

    const ownedPackIds = new Set(purchases.filter(p => p.is_active).map(p => p.pack_id));

    return packs.map(pack => ({
      ...pack,
      isOwned: ownedPackIds.has(pack.id),
    }));
  } catch {
    return [];
  }
}

/**
 * Get owned DLC packs
 */
export async function getOwnedDLCPacks(): Promise<DLCPack[]> {
  try {
    const [packs, purchases] = await Promise.all([getDLCPacks(), getDLCPurchases()]);

    const ownedPackIds = new Set(purchases.filter(p => p.is_active).map(p => p.pack_id));

    return packs.filter(pack => ownedPackIds.has(pack.id));
  } catch {
    return [];
  }
}

/**
 * Load content from a specific DLC pack
 */
export async function loadDLCPackContent(packId: string): Promise<DLCContentItem[]> {
  try {
    const hasAccess = await hasAccessToPack(packId);
    if (!hasAccess) {
      toast.error("You do not have access to this DLC pack");
      return [];
    }

    // This would fetch actual content from storage
    // For now, return empty array as stub
    return [];
  } catch {
    toast.error("Failed to load DLC content");
    return [];
  }
}

/**
 * Get DLC content by type
 */
export async function getDLCContentByType(type: DLCContentItem["type"]): Promise<DLCContentItem[]> {
  try {
    const ownedPacks = await getOwnedDLCPacks();
    const allContent: DLCContentItem[] = [];

    for (const pack of ownedPacks) {
      if (pack.content_items && Array.isArray(pack.content_items)) {
        const items = pack.content_items as DLCContentItem[];
        allContent.push(...items.filter(item => item.type === type));
      }
    }

    return allContent;
  } catch {
    return [];
  }
}

/**
 * Get total DLC content count
 */
export async function getDLCContentCount(): Promise<{
  total: number;
  byType: Record<string, number>;
}> {
  try {
    const ownedPacks = await getOwnedDLCPacks();
    const byType: Record<string, number> = {};
    let total = 0;

    for (const pack of ownedPacks) {
      total += pack.item_count;

      if (pack.content_items && Array.isArray(pack.content_items)) {
        const items = pack.content_items as DLCContentItem[];
        for (const item of items) {
          byType[item.type] = (byType[item.type] || 0) + 1;
        }
      }
    }

    return { total, byType };
  } catch {
    return { total: 0, byType: {} };
  }
}

/**
 * Search DLC content
 */
export async function searchDLCContent(query: string): Promise<DLCContentItem[]> {
  try {
    const ownedPacks = await getOwnedDLCPacks();
    const allContent: DLCContentItem[] = [];
    const lowerQuery = query.toLowerCase();

    for (const pack of ownedPacks) {
      if (pack.content_items && Array.isArray(pack.content_items)) {
        const items = pack.content_items as DLCContentItem[];
        allContent.push(
          ...items.filter(
            item =>
              item.name.toLowerCase().includes(lowerQuery) ||
              item.description?.toLowerCase().includes(lowerQuery),
          ),
        );
      }
    }

    return allContent;
  } catch {
    return [];
  }
}
