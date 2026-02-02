import { logger } from "@/lib/logger";
import { fromExtended } from "@/lib/supabaseExtensions";
import type { ExpertVideo } from "@/lib/expertContentConsultations/types";

function mapExpertVideo(row: any): ExpertVideo {
  return {
    id: String(row.id),
    expert_id: String(row.expert_id),
    title: String(row.video_title ?? ""),
    video_url: String(row.video_url ?? ""),
    thumbnail_url: row.thumbnail_url ?? null,
    description: row.video_description ?? null,
    duration_seconds: row.duration_seconds ?? null,
    category: row.category ?? null,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : null,
    is_featured: Boolean(row.is_featured),
    view_count: Number(row.view_count ?? 0),
    like_count: Number(row.like_count ?? 0),
    published_at: row.published_at ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function getExpertVideos(
  expertId?: string,
  category?: string,
  featured?: boolean,
): Promise<ExpertVideo[]> {
  try {
    let q = fromExtended("expert_videos")
      .select("*")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (expertId) q = q.eq("expert_id", expertId);
    if (category) q = q.eq("category", category);
    if (featured) q = q.eq("is_featured", true);

    const { data, error } = await q;
    if (error) {
      logger.error("getExpertVideos failed", { error: error.message });
      return [];
    }

    return (data || []).map(mapExpertVideo);
  } catch (error) {
    logger.error("getExpertVideos error", { error });
    return [];
  }
}
