import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { fromExtended } from "@/lib/supabaseExtensions";
import type { VideoDownload } from "./types";

export async function downloadVideo(videoId: string): Promise<VideoDownload | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to download videos");
      return null;
    }

    const { data, error } = await fromExtended("video_downloads")
      .upsert(
        {
          user_id: user.id,
          video_id: videoId,
          download_status: "pending",
          download_progress: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,video_id" },
      )
      .select()
      .single();

    if (error) {
      logger.error("Error creating download record", { error: error.message });
      toast.error("Failed to start download");
      return null;
    }

    toast.success("Download queued");
    return data as unknown as VideoDownload;
  } catch (err) {
    logger.error("Error downloading video", { error: err });
    toast.error("Failed to start download");
    return null;
  }
}

export async function getDownloadedVideos(): Promise<VideoDownload[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await fromExtended("video_downloads")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      logger.error("Error getting downloaded videos", { error: error.message });
      return [];
    }

    return (data || []) as unknown as VideoDownload[];
  } catch (err) {
    logger.error("Error getting downloaded videos", { error: err });
    return [];
  }
}

export async function deleteDownloadedVideo(downloadId: string): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await fromExtended("video_downloads")
      .delete()
      .eq("id", downloadId)
      .eq("user_id", user.id);
    if (error) {
      logger.error("Error deleting download", { error: error.message });
      toast.error("Failed to delete download");
      return;
    }
    toast.success("Download removed");
  } catch (err) {
    logger.error("Error deleting download", { error: err });
    toast.error("Failed to delete download");
  }
}
