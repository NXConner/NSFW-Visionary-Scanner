/**
 * NSFW Video Content System
 * Handles NSFW educational videos, technique demonstrations, expert interviews, tutorials, playlists, downloads, and recommendations
 */

import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "./logger";
import { toast } from "sonner";
import type { VideoQuality } from "@/lib/offlineMedia/videoCache";
import { downloadNSFWVideoOffline } from "@/lib/nsfwVideoDownloads";

// ==================== NSFW Video Content ====================

export interface NSFWVideoContent {
  id: string;
  title: string;
  description: string;
  category:
    | "technique"
    | "tutorial"
    | "expert_interview"
    | "educational"
    | "demonstration"
    | "advanced"
    | "beginner";
  video_url_sd: string | null;
  video_url_hd: string | null;
  video_url_4k: string | null;
  video_duration_seconds: number | null;
  thumbnail_url: string | null;
  preview_gif_url: string | null;
  tags: string[] | null;
  difficulty_level: "beginner" | "intermediate" | "advanced" | "expert" | null;
  content_rating: "educational" | "demonstrative" | "explicit" | null;
  expert_id: string | null;
  expert_name: string | null;
  expert_credentials: string | null;
  step_by_step_guide: any;
  key_points: string[] | null;
  warnings: string[] | null;
  prerequisites: string[] | null;
  view_count: number;
  like_count: number;
  favorite_count: number;
  share_count: number;
  average_rating: number | null;
  rating_count: number;
  is_premium: boolean;
  is_featured: boolean;
  requires_dlc: boolean;
  dlc_pack_id: string | null;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getNSFWVideos(
  category?: NSFWVideoContent["category"],
  difficultyLevel?: NSFWVideoContent["difficulty_level"],
): Promise<NSFWVideoContent[]> {
  try {
    let query = fromExtended("nsfw_video_content")
      .select("*")
      .eq("is_approved", true)
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("view_count", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }
    if (difficultyLevel) {
      query = query.eq("difficulty_level", difficultyLevel);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching videos:", { error: error.message });
      return [];
    }

    return (data || []) as NSFWVideoContent[];
  } catch (error) {
    logger.error("Error in getNSFWVideos:", { error });
    return [];
  }
}

// ==================== Video Playlists ====================

export interface NSFWVideoPlaylist {
  id: string;
  user_id: string | null;
  playlist_name: string;
  description: string | null;
  category: string | null;
  video_ids: string[];
  video_count: number;
  total_duration_seconds: number | null;
  is_public: boolean;
  is_featured: boolean;
  is_curated: boolean;
  view_count: number;
  like_count: number;
  copy_count: number;
  auto_play_next: boolean;
  shuffle_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type NSFWVideoPlaylistCreate = {
  playlist_name: string;
  description?: string | null;
  category?: string | null;
  video_ids?: string[];
  is_public?: boolean;
  auto_play_next?: boolean;
  shuffle_enabled?: boolean;
};

export async function createVideoPlaylist(
  playlistName: string,
  videoIds: string[],
  description?: string,
  isPublic: boolean = false,
): Promise<NSFWVideoPlaylist | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to create playlist");
      return null;
    }

    const { data, error } = await fromExtended("nsfw_video_playlists")
      .insert({
        user_id: user.id,
        playlist_name: playlistName,
        description: description || null,
        video_ids: videoIds,
        video_count: videoIds.length,
        is_public: isPublic,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating playlist:", { error: error.message });
      toast.error("Failed to create playlist");
      return null;
    }

    toast.success("Playlist created!");
    return data as NSFWVideoPlaylist;
  } catch (error) {
    logger.error("Error in createVideoPlaylist:", { error });
    return null;
  }
}

async function computePlaylistDurationSeconds(videoIds: string[]): Promise<number | null> {
  try {
    if (!Array.isArray(videoIds) || videoIds.length === 0) return 0;
    const { data, error } = await fromExtended("nsfw_video_content")
      .select("id, video_duration_seconds")
      .in("id", videoIds);

    if (error) return null;

    const map = new Map<string, number>();
    for (const row of (data || []) as Array<{
      id: string;
      video_duration_seconds: number | null;
    }>) {
      map.set(String(row.id), Number(row.video_duration_seconds ?? 0));
    }
    let total = 0;
    for (const id of videoIds) total += map.get(id) ?? 0;
    return total;
  } catch {
    return null;
  }
}

export async function getVideoPlaylists(params?: {
  scope?: "mine" | "public" | "all";
  limit?: number;
}): Promise<NSFWVideoPlaylist[]> {
  try {
    const scope = params?.scope ?? "mine";
    const limit = Math.max(1, Math.min(200, Number(params?.limit ?? 50)));

    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    let query = fromExtended("nsfw_video_playlists")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (scope === "public" || (!user && scope !== "mine")) {
      query = query.eq("is_public", true);
    } else if (scope === "mine") {
      if (!user) return [];
      query = query.eq("user_id", user.id);
    } else if (scope === "all") {
      if (user) query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
      else query = query.eq("is_public", true);
    }

    const { data, error } = await query;
    if (error) {
      logger.error("Error fetching playlists:", { error: error.message });
      return [];
    }
    return (data || []) as NSFWVideoPlaylist[];
  } catch (error) {
    logger.error("Error in getVideoPlaylists:", { error });
    return [];
  }
}

export async function updateVideoPlaylist(
  playlistId: string,
  updates: Partial<NSFWVideoPlaylistCreate>,
): Promise<NSFWVideoPlaylist | null> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Please sign in");
      return null;
    }

    const patch: Record<string, unknown> = {};
    if (updates.playlist_name != null) patch.playlist_name = updates.playlist_name;
    if (updates.description !== undefined) patch.description = updates.description ?? null;
    if (updates.category !== undefined) patch.category = updates.category ?? null;
    if (updates.is_public !== undefined) patch.is_public = Boolean(updates.is_public);
    if (updates.auto_play_next !== undefined)
      patch.auto_play_next = Boolean(updates.auto_play_next);
    if (updates.shuffle_enabled !== undefined)
      patch.shuffle_enabled = Boolean(updates.shuffle_enabled);
    if (updates.video_ids !== undefined) {
      const ids = Array.isArray(updates.video_ids) ? updates.video_ids.map(String) : [];
      patch.video_ids = ids;
      patch.video_count = ids.length;
      const dur = await computePlaylistDurationSeconds(ids);
      patch.total_duration_seconds = dur;
    }
    patch.updated_at = new Date().toISOString();

    const { data, error } = await fromExtended("nsfw_video_playlists")
      .update(patch)
      .eq("id", playlistId)
      .select("*")
      .single();

    if (error) {
      logger.error("Error updating playlist:", { error: error.message });
      toast.error("Failed to update playlist");
      return null;
    }
    return data as NSFWVideoPlaylist;
  } catch (error) {
    logger.error("Error in updateVideoPlaylist:", { error });
    toast.error("Failed to update playlist");
    return null;
  }
}

export async function deleteVideoPlaylist(playlistId: string): Promise<boolean> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Please sign in");
      return false;
    }

    const { error } = await fromExtended("nsfw_video_playlists")
      .delete()
      .eq("id", playlistId);
    if (error) {
      logger.error("Error deleting playlist:", { error: error.message });
      toast.error("Failed to delete playlist");
      return false;
    }
    toast.success("Playlist deleted");
    return true;
  } catch (error) {
    logger.error("Error in deleteVideoPlaylist:", { error });
    toast.error("Failed to delete playlist");
    return false;
  }
}

export async function addVideoToPlaylist(
  playlistId: string,
  videoId: string,
): Promise<NSFWVideoPlaylist | null> {
  try {
    const { data, error } = await fromExtended("nsfw_video_playlists")
      .select("id, video_ids")
      .eq("id", playlistId)
      .maybeSingle();
    if (error || !data) return null;
    const current = Array.isArray((data as any).video_ids)
      ? ((data as any).video_ids as string[]).map(String)
      : [];
    if (current.includes(String(videoId))) return null;
    const next = [...current, String(videoId)];
    return await updateVideoPlaylist(playlistId, { video_ids: next });
  } catch {
    return null;
  }
}

export async function removeVideoFromPlaylist(
  playlistId: string,
  videoId: string,
): Promise<NSFWVideoPlaylist | null> {
  try {
    const { data, error } = await fromExtended("nsfw_video_playlists")
      .select("id, video_ids")
      .eq("id", playlistId)
      .maybeSingle();
    if (error || !data) return null;
    const current = Array.isArray((data as any).video_ids)
      ? ((data as any).video_ids as string[]).map(String)
      : [];
    const next = current.filter(id => id !== String(videoId));
    return await updateVideoPlaylist(playlistId, { video_ids: next });
  } catch {
    return null;
  }
}

export async function getPlaylistVideos(playlist: NSFWVideoPlaylist): Promise<NSFWVideoContent[]> {
  try {
    const ids = Array.isArray(playlist.video_ids) ? playlist.video_ids.map(String) : [];
    if (ids.length === 0) return [];

    const { data, error } = await fromExtended("nsfw_video_content")
      .select("*")
      .in("id", ids);

    if (error) {
      logger.error("Error fetching playlist videos:", { error: error.message });
      return [];
    }

    const rows = (data || []) as NSFWVideoContent[];
    const order = new Map<string, number>(ids.map((id, idx) => [id, idx]));
    return rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  } catch (error) {
    logger.error("Error in getPlaylistVideos:", { error });
    return [];
  }
}

// ==================== Video Progress Tracking ====================

export interface NSFWVideoProgress {
  id: string;
  video_id: string;
  user_id: string;
  current_position_seconds: number;
  watched_duration_seconds: number;
  completion_percentage: number;
  is_completed: boolean;
  playback_speed: number;
  quality_preference: "sd" | "hd" | "4k" | "auto";
  watched_at: string;
  completed_at: string | null;
  last_position_updated_at: string;
  created_at: string;
  updated_at: string;
}

export async function updateVideoProgress(
  videoId: string,
  currentPositionSeconds: number,
  watchedDurationSeconds: number,
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const completionPercentage =
      watchedDurationSeconds > 0
        ? Math.min(
            100,
            (watchedDurationSeconds / (watchedDurationSeconds + currentPositionSeconds)) * 100,
          )
        : 0;

    const { error } = await fromExtended("nsfw_video_progress").upsert(
      {
        video_id: videoId,
        user_id: user.id,
        current_position_seconds: currentPositionSeconds,
        watched_duration_seconds: watchedDurationSeconds,
        completion_percentage: completionPercentage,
        is_completed: completionPercentage >= 90,
        last_position_updated_at: new Date().toISOString(),
      },
      {
        onConflict: "video_id,user_id",
      },
    );

    if (error) {
      logger.error("Error updating progress:", { error: error.message });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Error in updateVideoProgress:", { error });
    return false;
  }
}

// ==================== Video Downloads ====================

export interface NSFWVideoDownload {
  id: string;
  video_id: string;
  user_id: string;
  quality: "sd" | "hd" | "2k" | "4k";
  file_path: string;
  file_size_bytes: number | null;
  download_status: "pending" | "downloading" | "completed" | "failed" | "paused";
  downloaded_bytes: number;
  download_progress: number;
  downloaded_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function requestVideoDownload(
  videoId: string,
  quality: NSFWVideoDownload["quality"],
  onProgress?: (progress: number) => void,
): Promise<NSFWVideoDownload | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to download video");
      return null;
    }

    const result = await downloadNSFWVideoOffline({
      videoId,
      quality: quality as VideoQuality,
      onProgress: p => onProgress?.(p.progress),
    });

    if (!result.success) {
      toast.error(result.error || "Failed to download");
      return null;
    }

    toast.success("Saved for offline");

    // Return latest download row
    const { data: downloads, error: fetchError } = await fromExtended("nsfw_video_downloads")
      .select("*")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .eq("quality", quality)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) return null;
    return (downloads?.[0] ?? null) as NSFWVideoDownload | null;
  } catch (error) {
    logger.error("Error in requestVideoDownload:", { error });
    return null;
  }
}

export async function getVideoDownloads(): Promise<NSFWVideoDownload[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await fromExtended("nsfw_video_downloads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching downloads:", { error: error.message });
      return [];
    }

    return (data || []) as NSFWVideoDownload[];
  } catch (error) {
    logger.error("Error in getVideoDownloads:", { error });
    return [];
  }
}
