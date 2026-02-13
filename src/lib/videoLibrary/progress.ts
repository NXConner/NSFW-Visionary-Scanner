import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";
import type { Video, VideoProgress } from "./types";

export async function updateVideoProgress(
  videoId: string,
  progressSeconds: number,
  durationSeconds?: number,
): Promise<VideoProgress> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { video_id: videoId, progress_seconds: progressSeconds };

    const progressPercentage = durationSeconds
      ? Math.min(100, (progressSeconds / durationSeconds) * 100)
      : 0;
    const isCompleted = progressPercentage >= 90;

    const { data: existing } = await fromExtended("video_progress")
      .select("watch_count")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .maybeSingle();

    const watchCount =
      Number((existing as { watch_count?: number | null } | null)?.watch_count || 0) + 1;

    const { data, error } = await fromExtended("video_progress")
      .upsert(
        {
          user_id: user.id,
          video_id: videoId,
          progress_seconds: progressSeconds,
          progress_percentage: progressPercentage,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          watch_count: watchCount,
          last_watched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,video_id" },
      )
      .select()
      .single();

    if (error) {
      logger.error("Error updating video progress", { error: error.message, videoId });
      return { video_id: videoId, progress_seconds: progressSeconds };
    }

    return data as unknown as VideoProgress;
  } catch (err) {
    logger.error("Error updating video progress", { error: err, videoId });
    return { video_id: videoId, progress_seconds: progressSeconds };
  }
}

export async function getUserVideoProgress(videoId?: string): Promise<VideoProgress[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    let query = fromExtended("video_progress")
      .select("*")
      .eq("user_id", user.id)
      .order("last_watched_at", {
        ascending: false,
      });
    if (videoId) query = query.eq("video_id", videoId);

    const { data, error } = await query;
    if (error) {
      logger.error("Error getting video progress", { error: error.message });
      return [];
    }
    return (data || []) as unknown as VideoProgress[];
  } catch (err) {
    logger.error("Error getting video progress", { error: err });
    return [];
  }
}

async function fetchVideosByIds(videoIds: string[]): Promise<Video[]> {
  if (videoIds.length === 0) return [];

  const { data, error } = await fromExtended("video_library")
    .select("*")
    .in("id", videoIds);
  if (error) return [];
  const list = (data || []) as unknown as Video[];
  const byId = new Map(list.map(v => [String(v.id), v]));
  return videoIds.map(id => byId.get(id)).filter(Boolean) as Video[];
}

type ContinueRow = {
  video_id: string;
  progress_percentage: number | null;
  is_completed: boolean | null;
  last_watched_at: string | null;
};

export async function getContinueWatching(limit: number = 10): Promise<Video[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await fromExtended("video_progress")
      .select("video_id, progress_percentage, is_completed, last_watched_at")
      .eq("user_id", user.id)
      .order("last_watched_at", { ascending: false })
      .limit(limit * 3);

    if (error) return [];

    const ids = ((data || []) as unknown as ContinueRow[])
      .filter(p => !p.is_completed && Number(p.progress_percentage || 0) > 5)
      .slice(0, limit)
      .map(p => String(p.video_id));

    return await fetchVideosByIds(ids);
  } catch (err) {
    logger.error("Error getting continue watching", { error: err });
    return [];
  }
}

type RecentRow = { video_id: string; last_watched_at: string | null };

export async function getRecentlyWatched(limit: number = 10): Promise<Video[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await fromExtended("video_progress")
      .select("video_id, last_watched_at")
      .eq("user_id", user.id)
      .order("last_watched_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    const ids = ((data || []) as unknown as RecentRow[]).map(p => String(p.video_id));
    return await fetchVideosByIds(ids);
  } catch (err) {
    logger.error("Error getting recently watched", { error: err });
    return [];
  }
}
