import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { Video, VideoBookmark } from "./types";

type BookmarkRow = {
  id: string;
  video_id: string;
  notes: string | null;
  created_at: string | null;
  video: Video | null;
};

export async function bookmarkVideo(videoId: string, notes?: string): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to bookmark videos");
      return;
    }

    const { error } = await fromExtended("video_bookmarks").upsert(
      { user_id: user.id, video_id: videoId, notes: notes ?? null },
      { onConflict: "user_id,video_id" },
    );

    if (error) {
      logger.error("Error bookmarking video", { error: error.message });
      toast.error("Failed to bookmark video");
      return;
    }

    toast.success("Video bookmarked");
  } catch (err) {
    logger.error("Error bookmarking video", { error: err });
    toast.error("Failed to bookmark video");
  }
}

export async function removeBookmark(videoId: string): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await fromExtended("video_bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("video_id", videoId);
    if (error) {
      logger.error("Error removing bookmark", { error: error.message });
      toast.error("Failed to remove bookmark");
      return;
    }
    toast.success("Bookmark removed");
  } catch (err) {
    logger.error("Error removing bookmark", { error: err });
    toast.error("Failed to remove bookmark");
  }
}

export async function getBookmarkedVideos(): Promise<Video[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await fromExtended("video_bookmarks")
      .select("id, video_id, notes, created_at, video:video_library(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error getting bookmarks", { error: error.message });
      return [];
    }

    return (data as BookmarkRow[] | null | undefined)?.map(r => r.video).filter(Boolean) as Video[];
  } catch (err) {
    logger.error("Error getting bookmarks", { error: err });
    return [];
  }
}

export async function isVideoBookmarked(videoId: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await fromExtended("video_bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .maybeSingle();

    if (error) return false;
    return Boolean(data?.id);
  } catch {
    return false;
  }
}

export async function getVideoBookmark(videoId: string): Promise<VideoBookmark | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await fromExtended("video_bookmarks")
      .select("id, video_id, notes, created_at")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .maybeSingle();

    if (error) return null;
    return (data as VideoBookmark | null) ?? null;
  } catch {
    return null;
  }
}
