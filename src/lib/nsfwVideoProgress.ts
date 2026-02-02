import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";
import type { NSFWVideoContent } from "@/lib/nsfwVideoContent";

export type NsfwVideoProgress = {
  video_id: string;
  current_position_seconds?: number;
  watched_duration_seconds?: number;
  completion_percentage?: number;
  is_completed?: boolean;
  last_position_updated_at?: string;
};

export async function updateNsfwVideoProgress(
  videoId: string,
  currentSeconds: number,
  durationSeconds?: number,
): Promise<NsfwVideoProgress> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { video_id: videoId, current_position_seconds: currentSeconds };

    const completion = durationSeconds
      ? Math.min(100, (currentSeconds / durationSeconds) * 100)
      : 0;
    const isCompleted = completion >= 90;

    const { data, error } = await fromExtended("nsfw_video_progress")
      .upsert(
        {
          user_id: user.id,
          video_id: videoId,
          current_position_seconds: Math.max(0, Math.floor(currentSeconds)),
          watched_duration_seconds: Math.max(0, Math.floor(currentSeconds)),
          completion_percentage: completion,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          last_position_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,video_id" },
      )
      .select()
      .single();

    if (error) {
      logger.error("nsfw progress: update failed", { error: error.message, videoId });
      return { video_id: videoId, current_position_seconds: currentSeconds };
    }

    return data as unknown as NsfwVideoProgress;
  } catch (err) {
    logger.error("nsfw progress: update error", { error: err, videoId });
    return { video_id: videoId, current_position_seconds: currentSeconds };
  }
}

export async function recordNsfwWatchHistory(params: {
  videoId: string;
  watchDurationSeconds: number;
  completionPercentage: number;
  watchSource?: string;
  referrerId?: string | null;
}): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await fromExtended("nsfw_video_watch_history").insert({
      video_id: params.videoId,
      user_id: user.id,
      watch_duration_seconds: Math.max(0, Math.floor(params.watchDurationSeconds)),
      completion_percentage: params.completionPercentage,
      watch_source: params.watchSource ?? "direct",
      referrer_id: params.referrerId ?? null,
      watched_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
    if (error) {
      logger.error("nsfw watch history: insert failed", { error: error.message });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("nsfw watch history: insert error", { error: err });
    return false;
  }
}

async function fetchNsfwVideosByIds(ids: string[]): Promise<NSFWVideoContent[]> {
  if (ids.length === 0) return [];
  const { data, error } = await fromExtended("nsfw_video_content").select("*").in("id", ids);
  if (error) return [];
  const list = (data || []) as NSFWVideoContent[];
  const byId = new Map(list.map(v => [String(v.id), v]));
  return ids.map(id => byId.get(id)).filter(Boolean) as NSFWVideoContent[];
}

export async function getNsfwContinueWatching(limit: number = 10): Promise<NSFWVideoContent[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await fromExtended("nsfw_video_progress")
      .select("video_id, completion_percentage, is_completed, last_position_updated_at")
      .eq("user_id", user.id)
      .order("last_position_updated_at", { ascending: false })
      .limit(limit * 3);
    if (error) return [];

    const ids = (data || [])
      .filter((row: any) => !row.is_completed && Number(row.completion_percentage || 0) > 5)
      .slice(0, limit)
      .map((row: any) => String(row.video_id));
    return await fetchNsfwVideosByIds(ids);
  } catch (err) {
    logger.error("nsfw progress: continue watching error", { error: err });
    return [];
  }
}

export async function getNsfwRecentlyWatched(limit: number = 10): Promise<NSFWVideoContent[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await fromExtended("nsfw_video_progress")
      .select("video_id, last_position_updated_at")
      .eq("user_id", user.id)
      .order("last_position_updated_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    const ids = (data || []).map((row: any) => String(row.video_id));
    return await fetchNsfwVideosByIds(ids);
  } catch (err) {
    logger.error("nsfw progress: recently watched error", { error: err });
    return [];
  }
}
