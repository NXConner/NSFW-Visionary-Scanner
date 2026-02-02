import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { VideoRating } from "./types";

export async function rateVideo(
  videoId: string,
  rating: number,
  reviewText?: string,
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to rate videos");
      return;
    }

    const { error } = await fromExtended("video_ratings").upsert(
      {
        user_id: user.id,
        video_id: videoId,
        rating,
        review_text: reviewText ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,video_id" },
    );

    if (error) {
      logger.error("Error rating video", { error: error.message });
      toast.error("Failed to save rating");
      return;
    }

    toast.success("Rating saved");
  } catch (err) {
    logger.error("Error rating video", { error: err });
    toast.error("Failed to save rating");
  }
}

export async function getVideoRating(videoId: string): Promise<VideoRating | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await fromExtended("video_ratings")
      .select("*")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .maybeSingle();

    if (error) return null;
    return (data as VideoRating | null) ?? null;
  } catch {
    return null;
  }
}

export async function getVideoRatings(videoId: string): Promise<VideoRating[]> {
  try {
    const { data, error } = await fromExtended("video_ratings")
      .select("*")
      .eq("video_id", videoId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      logger.error("Error getting video ratings", { error: error.message });
      return [];
    }
    return (data || []) as VideoRating[];
  } catch (err) {
    logger.error("Error getting video ratings", { error: err });
    return [];
  }
}
