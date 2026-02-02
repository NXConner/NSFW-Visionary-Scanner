import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { Video, VideoPlaylist } from "./types";

export async function createPlaylist(
  playlist: Omit<
    VideoPlaylist,
    "id" | "user_id" | "created_at" | "updated_at" | "video_count" | "view_count"
  >,
): Promise<VideoPlaylist> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to create playlists");
      return { name: playlist.name, ...playlist };
    }

    const { data, error } = await fromExtended("video_playlists")
      .insert({
        user_id: user.id,
        name: playlist.name,
        description: playlist.description ?? null,
        is_public: Boolean(playlist.is_public),
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating playlist", { error: error.message });
      toast.error("Failed to create playlist");
      return { name: playlist.name, ...playlist };
    }

    toast.success("Playlist created");
    return data as unknown as VideoPlaylist;
  } catch (err) {
    logger.error("Error creating playlist", { error: err });
    toast.error("Failed to create playlist");
    return { name: playlist.name, ...playlist };
  }
}

export async function getPlaylists(_userId?: string): Promise<VideoPlaylist[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = fromExtended("video_playlists")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!user) query = query.eq("is_public", true);

    const { data, error } = await query;
    if (error) {
      logger.error("Error getting playlists", { error: error.message });
      return [];
    }
    return (data || []) as unknown as VideoPlaylist[];
  } catch (err) {
    logger.error("Error getting playlists", { error: err });
    return [];
  }
}

export async function addVideoToPlaylist(
  playlistId: string,
  videoId: string,
  orderIndex?: number,
): Promise<void> {
  try {
    const { error } = await fromExtended("playlist_videos").upsert(
      {
        playlist_id: playlistId,
        video_id: videoId,
        order_index: typeof orderIndex === "number" ? orderIndex : 0,
      },
      { onConflict: "playlist_id,video_id" },
    );

    if (error) {
      toast.error("Failed to add video");
      logger.error("Error adding video to playlist", { error: error.message });
      return;
    }
    toast.success("Video added to playlist");
  } catch (err) {
    logger.error("Error adding video to playlist", { error: err });
    toast.error("Failed to add video");
  }
}

export async function removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<void> {
  try {
    const { error } = await fromExtended("playlist_videos")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("video_id", videoId);
    if (error) {
      logger.error("Error removing video from playlist", { error: error.message });
      toast.error("Failed to remove video");
      return;
    }
    toast.success("Video removed from playlist");
  } catch (err) {
    logger.error("Error removing video from playlist", { error: err });
    toast.error("Failed to remove video");
  }
}

type PlaylistVideoRow = { order_index: number | null; video: Video | null };

export async function getPlaylistVideos(playlistId: string): Promise<Video[]> {
  try {
    const { data, error } = await fromExtended("playlist_videos")
      .select("order_index, video:video_library(*)")
      .eq("playlist_id", playlistId)
      .order("order_index", { ascending: true });

    if (error) {
      logger.error("Error getting playlist videos", { error: error.message });
      return [];
    }

    return ((data || []) as unknown as PlaylistVideoRow[])
      .map(r => r.video)
      .filter(Boolean) as Video[];
  } catch (err) {
    logger.error("Error getting playlist videos", { error: err });
    return [];
  }
}
