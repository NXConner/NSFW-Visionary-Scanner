import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";

export type NsfwStats = {
  favoritesPositions: number;
  downloadedVideos: number;
  inProgressDownloads: number;
  watchHistoryCount: number;
};

export async function fetchNsfwStats(): Promise<NsfwStats> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) {
    return {
      favoritesPositions: 0,
      downloadedVideos: 0,
      inProgressDownloads: 0,
      watchHistoryCount: 0,
    };
  }

  const [fav, downloads, watch] = await Promise.allSettled([
    fromExtended("nsfw_positions_favorites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    fromExtended("nsfw_video_downloads")
      .select("download_status", { count: "exact" })
      .eq("user_id", user.id),
    fromExtended("nsfw_video_watch_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const favoritesPositions = fav.status === "fulfilled" ? Number(fav.value.count ?? 0) : 0;

  let downloadedVideos = 0;
  let inProgressDownloads = 0;
  if (downloads.status === "fulfilled") {
    const rows = (downloads.value.data || []) as Array<{ download_status: string | null }>;
    downloadedVideos = rows.filter(r => r.download_status === "completed").length;
    inProgressDownloads = rows.filter(
      r => r.download_status === "downloading" || r.download_status === "paused",
    ).length;
  }

  const watchHistoryCount = watch.status === "fulfilled" ? Number(watch.value.count ?? 0) : 0;

  return { favoritesPositions, downloadedVideos, inProgressDownloads, watchHistoryCount };
}
