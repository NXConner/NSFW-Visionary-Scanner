import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { SexPosition } from "./types";

function mapGalleryCategoryToLibrary(
  category: string,
): SexPosition["position_category"] {
  const c = String(category || "").toLowerCase();
  if (c === "romantic" || c === "tantric") return "romantic";
  if (c === "acrobatic") return "acrobatic";
  if (c === "advanced") return "advanced";
  if (c === "kama_sutra") return "adventurous";
  if (c === "quickie") return "adventurous";
  // fallback
  return "basic";
}

function mapGalleryDifficultyToLibrary(
  difficulty: string | null | undefined,
): SexPosition["difficulty_level"] {
  const d = String(difficulty || "").toLowerCase();
  if (d === "expert") return "expert";
  if (d === "advanced") return "hard";
  if (d === "intermediate") return "medium";
  if (d === "beginner") return "easy";
  // fallback
  return "easy";
}

export async function getSexPositions(
  category?: SexPosition["position_category"],
  difficulty?: SexPosition["difficulty_level"],
): Promise<SexPosition[]> {
  try {
    // Canonical source of truth: `nsfw_positions_gallery`.
    // This keeps the advanced tab consistent with the main Positions Gallery and avoids drift.
    const { data, error } = await fromExtended("nsfw_positions_gallery")
      .select(
        "id,position_name,description,category,difficulty_level,required_flexibility,tags,best_for,image_url,image_url_illustrated,thumbnail_url,view_count,favorite_count,is_featured,is_active",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(800);
    if (error) {
      logger.error("Error fetching positions", { error: error.message });
      return [];
    }

    const rows = (data || []) as Array<{
      id: string;
      position_name: string;
      description: string | null;
      category: string | null;
      difficulty_level: string | null;
      tags: string[] | null;
      best_for: string[] | null;
      required_flexibility: string | null;
      image_url: string | null;
      image_url_illustrated: string | null;
      thumbnail_url: string | null;
      view_count: number | null;
      favorite_count: number | null;
      is_featured: boolean | null;
      is_active: boolean | null;
    }>;

    const mapped: SexPosition[] = rows.map(r => {
      const cat = String(r.category || "classic");
      const position_category = mapGalleryCategoryToLibrary(cat);
      const difficulty_level = mapGalleryDifficultyToLibrary(r.difficulty_level);
      const popularity_score = Number(r.view_count || 0) * 1 + Number(r.favorite_count || 0) * 3;
      const image_url = r.image_url_illustrated || r.image_url || r.thumbnail_url || null;
      return {
        id: String(r.id),
        position_name: String(r.position_name || "Untitled").trim(),
        position_category,
        difficulty_level,
        description: r.description ?? null,
        instructions: null,
        tips: null,
        required_flexibility: (r.required_flexibility as SexPosition["required_flexibility"]) ?? null,
        tags: r.tags ?? null,
        best_for: r.best_for ?? null,
        image_url,
        video_url: null,
        gif_url: null,
        popularity_score,
        is_featured: Boolean(r.is_featured ?? false),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    return mapped.filter(p => {
      if (category && p.position_category !== category) return false;
      if (difficulty && p.difficulty_level !== difficulty) return false;
      return true;
    });
  } catch (error) {
    logger.error("Error in getSexPositions", { error });
    return [];
  }
}

export async function savePosition(
  positionId: string,
  notes?: string,
  favorite?: boolean,
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      return false;
    }

    // Canonical favorite store: `nsfw_positions_favorites`.
    // Notes are not stored in this MVP path; use per-position private media overrides for journaling.
    const wantFavorite = Boolean(favorite ?? true);
    if (!wantFavorite) {
      const { error } = await fromExtended("nsfw_positions_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("position_id", positionId);
      if (error) {
        logger.error("Error unfavoriting position", { error: error.message });
        toast.error("Failed to update favorite");
        return false;
      }
      toast.success("Removed from favorites");
      return true;
    }

    const { error } = await fromExtended("nsfw_positions_favorites")
      .upsert({ user_id: user.id, position_id: positionId }, { onConflict: "user_id,position_id" });
    if (error) {
      logger.error("Error favoriting position", { error: error.message });
      toast.error("Failed to update favorite");
      return false;
    }
    toast.success("Added to favorites");
    return true;
  } catch (error) {
    logger.error("Error in savePosition", { error });
    return false;
  }
}
