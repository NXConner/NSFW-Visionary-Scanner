import { logger } from "@/lib/logger";

import type { VideoGuidedRoutine } from "../advancedTypes";
import { db, requireUserId } from "./common";

export async function getVideoGuidedRoutines(): Promise<VideoGuidedRoutine[]> {
  try {
    const userId = await requireUserId();
    const { data, error } = await db
      .from("video_guided_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      logger.error("getVideoGuidedRoutines failed", { error: error.message });
      return [];
    }

    return (data || []).map((r: any) => ({
      id: String(r.id),
      routine_id: r.routine_id ?? null,
      video_url: String(r.video_url ?? ""),
      thumbnail_url: r.video_thumbnail_url ?? null,
      duration_seconds: r.video_duration_seconds ?? null,
      instructor_name: null,
      difficulty_level: null,
      is_premium: false,
      view_count: 0,
      created_at: String(r.created_at ?? new Date().toISOString()),
    })) as VideoGuidedRoutine[];
  } catch (error) {
    logger.error("getVideoGuidedRoutines error", { error });
    return [];
  }
}
