import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function getMarketplaceCategories(): Promise<
  Array<{ id: string; name: string; count: number }>
> {
  try {
    const { data: categories, error: catError } = await supabase
      .from("marketplace_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (catError) {
      logger.error("Failed to get marketplace categories", { error: catError.message });
      return [];
    }

    const { data: items, error: itemsError } = await supabase
      .from("marketplace_items")
      .select("category_id")
      .eq("status", "published");

    if (itemsError) {
      logger.error("Failed to get marketplace category counts", { error: itemsError.message });
      return ((categories || []) as unknown as CategoryRow[]).map(c => ({
        id: c.id,
        name: c.name,
        count: 0,
      }));
    }

    const counts = new Map<string, number>();
    for (const row of items || []) {
      const id = (row as { category_id: string | null }).category_id;
      if (!id) continue;
      counts.set(id, (counts.get(id) || 0) + 1);
    }

    return ((categories || []) as unknown as CategoryRow[]).map(c => ({
      id: c.id,
      name: c.name,
      count: counts.get(c.id) || 0,
    }));
  } catch (err) {
    logger.error("Error getting marketplace categories", { error: err });
    return [];
  }
}
