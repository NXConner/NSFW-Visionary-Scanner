import { fromExtended } from "@/lib/supabaseExtensions";
import type { DbPositionRow } from "./model";
import { isUuid } from "./uuid";
import { logger } from "@/lib/logger";

export async function fetchPositionCategories(): Promise<string[]> {
  try {
    const { data, error } = await fromExtended("nsfw_positions_gallery")
      .select("category")
      .eq("is_active", true);
    if (error) {
      logger.info("[positionsGallery/db] Category fetch error, returning empty", { error: error.message });
      return [];
    }
    return (
      Array.from(
        new Set((data || []).map((r: { category?: string }) => String(r.category || "").trim()).filter(Boolean)),
      ) as string[]
    ).sort((a, b) => a.localeCompare(b));
  } catch (err) {
    logger.info("[positionsGallery/db] Category fetch exception", { error: err });
    return [];
  }
}

export async function fetchPositionsPage(params: {
  page: number;
  pageSize: number;
  searchTerm: string;
  selectedCategory: string;
  selectedDifficulty: string;
}): Promise<{ rows: DbPositionRow[]; count: number }> {
  try {
    const from = Math.max(0, params.page) * Math.max(1, params.pageSize);
    const to = from + Math.max(1, params.pageSize) - 1;

    let q = fromExtended("nsfw_positions_gallery")
      .select(
        "id,position_name,position_slug,description,detailed_instructions,category,difficulty_level,intimacy_level,required_flexibility,tags,benefits,tips,variations,image_url,image_url_illustrated,thumbnail_url,video_tutorial_url,animation_url,is_active",
        { count: "exact" },
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .range(from, to);

    if (params.selectedCategory !== "all") q = q.eq("category", params.selectedCategory);

    if (params.selectedDifficulty !== "all") {
      const d = String(params.selectedDifficulty);
      if (d === "easy") q = q.in("difficulty_level", ["beginner"]);
      else if (d === "medium") q = q.in("difficulty_level", ["intermediate"]);
      else if (d === "hard") q = q.in("difficulty_level", ["advanced"]);
      else if (d === "expert") q = q.in("difficulty_level", ["expert"]);
    }

    const term = params.searchTerm.trim();
    if (term) {
      const escaped = term.replace(/[%_]/g, "\\$&");
      q = q.or(
        [
          `position_name.ilike.%${escaped}%`,
          `position_slug.ilike.%${escaped}%`,
          `description.ilike.%${escaped}%`,
        ].join(","),
      );
    }

    const { data, error, count } = await q;
    if (error) {
      // Log and return empty result to trigger fallback in caller
      logger.info("[positionsGallery/db] Positions fetch error, returning empty to trigger fallback", { 
        error: error.message 
      });
      return { rows: [], count: 0 };
    }
    
    const rows = (data || []) as DbPositionRow[];
    const totalCount = typeof count === "number" ? count : 0;
    logger.info("[positionsGallery/db] Fetched positions from DB", { 
      rowCount: rows.length, 
      totalCount 
    });
    return { rows, count: totalCount };
  } catch (err) {
    // Return empty to allow fallback to GitHub catalog
    logger.info("[positionsGallery/db] Positions fetch exception, returning empty to trigger fallback", { 
      error: err 
    });
    return { rows: [], count: 0 };
  }
}

export async function fetchPositionById(positionId: string): Promise<DbPositionRow | null> {
  const id = String(positionId || "").trim();
  if (!id) return null;
  // Guard against accidental route placeholders (e.g. ":id") or invalid UUIDs.
  if (id.startsWith(":") || !isUuid(id)) return null;

  const { data, error } = await fromExtended("nsfw_positions_gallery")
    .select(
      "id,position_name,position_slug,description,detailed_instructions,category,difficulty_level,intimacy_level,required_flexibility,tags,benefits,tips,variations,image_url,image_url_illustrated,thumbnail_url,video_tutorial_url,animation_url,is_active",
    )
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as DbPositionRow | null) ?? null;
}
