import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";
import type { NSFWVideoContent } from "@/lib/nsfwVideoContent";

export async function getNsfwVideoBookmarks(): Promise<string[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await fromExtended("nsfw_video_bookmarks")
      .select("video_id")
      .eq("user_id", user.id);
    if (error) {
      logger.error("nsfw bookmarks: fetch failed", { error: error.message });
      return [];
    }
    return (data || []).map((row: any) => String(row.video_id));
  } catch (err) {
    logger.error("nsfw bookmarks: fetch error", { error: err });
    return [];
  }
}

export async function getNsfwBookmarkedVideos(limit: number = 50): Promise<NSFWVideoContent[]> {
  try {
    const ids = await getNsfwVideoBookmarks();
    if (ids.length === 0) return [];
    const { data, error } = await fromExtended("nsfw_video_content")
      .select("*")
      .in("id", ids)
      .limit(limit);
    if (error) return [];
    return (data || []) as NSFWVideoContent[];
  } catch (err) {
    logger.error("nsfw bookmarks: load videos error", { error: err });
    return [];
  }
}

export async function setNsfwVideoBookmark(videoId: string, bookmarked: boolean): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    if (bookmarked) {
      const { error } = await fromExtended("nsfw_video_bookmarks").insert({
        user_id: user.id,
        video_id: videoId,
        created_at: new Date().toISOString(),
      });
      if (error) {
        logger.error("nsfw bookmarks: insert failed", { error: error.message });
        return false;
      }
      return true;
    }
    const { error } = await fromExtended("nsfw_video_bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("video_id", videoId);
    if (error) {
      logger.error("nsfw bookmarks: delete failed", { error: error.message });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("nsfw bookmarks: update error", { error: err });
    return false;
  }
}
