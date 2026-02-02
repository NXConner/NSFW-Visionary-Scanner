import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";
import type { Video } from "./types";

export async function getVideos(
  category?: string,
  featured?: boolean,
  premiumOnly?: boolean,
  limit: number = 50,
): Promise<Video[]> {
  try {
    let query = fromExtended("video_library")
      .select("*")
      .order("order_index", { ascending: true })
      .limit(limit);

    if (category) query = query.eq("category", category);
    if (featured) query = query.eq("is_featured", true);
    if (premiumOnly) query = query.eq("is_premium", true);

    const { data, error } = await query;
    if (error) {
      logger.error("Failed to get videos", { error: error.message });
      return [];
    }
    return (data || []) as Video[];
  } catch (err) {
    logger.error("Error getting videos", { error: err });
    return [];
  }
}

export async function getVideo(videoId: string): Promise<Video | null> {
  try {
    const { data, error } = await fromExtended("video_library")
      .select("*")
      .eq("id", videoId)
      .maybeSingle();
    if (error) {
      logger.error("Failed to get video", { error: error.message, videoId });
      return null;
    }
    return (data as Video | null) ?? null;
  } catch (err) {
    logger.error("Error getting video", { error: err, videoId });
    return null;
  }
}

export async function searchVideos(query: string, limit: number = 20): Promise<Video[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const { data, error } = await fromExtended("video_library")
      .select("*")
      .or(`title.ilike.%${q}%,description.ilike.%${q}%,instructor_name.ilike.%${q}%`)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("Failed to search videos", { error: error.message, query: q });
      return [];
    }
    return (data || []) as Video[];
  } catch (err) {
    logger.error("Error searching videos", { error: err, query: q });
    return [];
  }
}

export async function getFeaturedVideos(): Promise<Video[]> {
  return await getVideos(undefined, true, false, 50);
}

export async function getVideoCategories(): Promise<Array<{ name: string; count: number }>> {
  try {
    const { data, error } = await fromExtended("video_library").select("category");
    if (error) {
      logger.error("Failed to get video categories", { error: error.message });
      return [];
    }
    const counts = new Map<string, number>();
    for (const row of data || []) {
      const c = (row as unknown as { category: string }).category;
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  } catch (err) {
    logger.error("Error getting video categories", { error: err });
    return [];
  }
}

export async function incrementViewCount(videoId: string): Promise<void> {
  try {
    const { data, error } = await fromExtended("video_library")
      .select("view_count")
      .eq("id", videoId)
      .maybeSingle();
    if (error) return;
    const current = Number((data as { view_count?: number | null } | null)?.view_count || 0);
    await fromExtended("video_library")
      .update({ view_count: current + 1, updated_at: new Date().toISOString() })
      .eq("id", videoId);
  } catch (err) {
    logger.error("Error incrementing view count", { error: err, videoId });
  }
}

export async function getRelatedVideos(videoId: string, limit: number = 5): Promise<Video[]> {
  try {
    const current = await getVideo(videoId);
    if (!current) return [];
    const { data, error } = await fromExtended("video_library")
      .select("*")
      .eq("category", current.category)
      .neq("id", videoId)
      .order("is_featured", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data || []) as Video[];
  } catch (err) {
    logger.error("Error getting related videos", { error: err, videoId });
    return [];
  }
}

export async function getTrendingVideos(limit: number = 10): Promise<Video[]> {
  try {
    const { data, error } = await fromExtended("video_library")
      .select("*")
      .order("view_count", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data || []) as Video[];
  } catch (err) {
    logger.error("Error getting trending videos", { error: err });
    return [];
  }
}
