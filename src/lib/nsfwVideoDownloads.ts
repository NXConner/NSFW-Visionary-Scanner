import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { secureDownloader } from "@/dlc/security";
import { getDeviceId, getDevicePlatform } from "@/dlc/core/device";
import { cacheVideoBytes, type VideoQuality } from "@/lib/offlineMedia/videoCache";
import { logger } from "@/lib/logger";
import { inferPackageIdFromAssetPath, isHttpUrl, signAssetPath } from "@/lib/nsfwAssets";

type DownloadProgressCb = (p: {
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
}) => void;

const dlcPackageIdCache = new Map<string, string>();

async function resolvePackageIdForVideo(params: {
  dlcPackId: string | null;
  assetPath: string;
}): Promise<string> {
  const { dlcPackId, assetPath } = params;
  if (dlcPackId) {
    const cached = dlcPackageIdCache.get(dlcPackId);
    if (cached) return cached;
    const { data, error } = await fromExtended("dlc_packages")
      .select("package_id")
      .eq("id", dlcPackId)
      .maybeSingle();
    if (!error && data?.package_id) {
      dlcPackageIdCache.set(dlcPackId, String(data.package_id));
      return String(data.package_id);
    }
  }
  return inferPackageIdFromAssetPath(assetPath, "dlc-videos");
}

function guessMimeType(assetPathOrUrl: string): string {
  const s = assetPathOrUrl.toLowerCase();
  if (s.endsWith(".webm")) return "video/webm";
  if (s.endsWith(".mov")) return "video/quicktime";
  if (s.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
  return "video/mp4";
}

async function resolveVideoAsset(
  videoId: string,
  quality: VideoQuality,
): Promise<{ asset: string; dlcPackId: string | null } | null> {
  const { data: video, error } = await fromExtended("nsfw_video_content")
    .select("id, dlc_pack_id, video_url_sd, video_url_hd, video_url_4k, is_active, is_approved")
    .eq("id", videoId)
    .maybeSingle();

  if (error || !video) {
    logger.error("nsfwVideoDownloads: resolveVideoAsset failed", { error: error?.message });
    return null;
  }

  const candidate =
    quality === "4k"
      ? video.video_url_4k
      : quality === "sd"
        ? video.video_url_sd
        : video.video_url_hd;
  if (!candidate) return null;
  return {
    asset: String(candidate),
    dlcPackId: (video as any)?.dlc_pack_id ? String((video as any).dlc_pack_id) : null,
  };
}

async function resolveDownloadUrl(params: {
  assetPathOrUrl: string;
  dlcPackId: string | null;
}): Promise<{ url: string; assetRef: string }> {
  const { assetPathOrUrl, dlcPackId } = params;
  if (isHttpUrl(assetPathOrUrl)) return { url: assetPathOrUrl, assetRef: assetPathOrUrl };

  const assetPath = assetPathOrUrl;
  const packageId = await resolvePackageIdForVideo({ dlcPackId, assetPath });
  const deviceId = getDeviceId();
  const devicePlatform = getDevicePlatform();

  const signedUrl = await signAssetPath({
    assetPath,
    packageId,
    expiresInSeconds: 900,
    deviceId,
    devicePlatform,
  });
  return { url: signedUrl, assetRef: assetPath };
}

async function upsertDownloadRow(params: {
  videoId: string;
  quality: VideoQuality;
  status: "pending" | "downloading" | "completed" | "failed" | "paused";
  filePath: string;
  fileSizeBytes?: number | null;
  downloadedBytes?: number;
  progress?: number;
  errorMessage?: string | null;
}): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return;

  // Find latest row for this video+quality and update it; otherwise insert.
  const { data: existing } = await fromExtended("nsfw_video_downloads")
    .select("id")
    .eq("user_id", user.id)
    .eq("video_id", params.videoId)
    .eq("quality", params.quality)
    .order("created_at", { ascending: false })
    .limit(1);

  const base = {
    video_id: params.videoId,
    user_id: user.id,
    quality: params.quality,
    file_path: params.filePath,
    file_size_bytes: params.fileSizeBytes ?? null,
    download_status: params.status,
    downloaded_bytes: params.downloadedBytes ?? 0,
    download_progress: params.progress ?? 0,
    updated_at: new Date().toISOString(),
  };

  if (params.status === "completed") {
    (base as any).downloaded_at = new Date().toISOString();
    (base as any).completed_at = new Date().toISOString();
    // App-level DRM expiry: 30 days
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    (base as any).expires_at = expires.toISOString();
  }

  if (existing?.[0]?.id) {
    await fromExtended("nsfw_video_downloads").update(base).eq("id", existing[0].id);
  } else {
    await fromExtended("nsfw_video_downloads").insert(base);
  }
}

export async function downloadNSFWVideoOffline(params: {
  videoId: string;
  quality: VideoQuality;
  onProgress?: DownloadProgressCb;
}): Promise<{ success: boolean; cacheKey?: string; error?: string }> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return { success: false, error: "Please sign in" };

    const assetRes = await resolveVideoAsset(params.videoId, params.quality);
    if (!assetRes) return { success: false, error: "Video not available in this quality" };

    const { url, assetRef } = await resolveDownloadUrl({
      assetPathOrUrl: assetRes.asset,
      dlcPackId: assetRes.dlcPackId,
    });
    const mimeType = guessMimeType(assetRef);

    await upsertDownloadRow({
      videoId: params.videoId,
      quality: params.quality,
      status: "downloading",
      filePath: `nsfw_video:${params.videoId}:${params.quality}`,
      downloadedBytes: 0,
      progress: 0,
    });

    const key = `nsfw_video:${params.videoId}:${params.quality}`;
    const result = await secureDownloader.download({
      packageId: key,
      url,
      onProgress: p => {
        params.onProgress?.({
          progress: p.progress ?? 0,
          downloadedBytes: p.downloadedBytes ?? 0,
          totalBytes: p.totalBytes ?? 0,
        });
        void upsertDownloadRow({
          videoId: params.videoId,
          quality: params.quality,
          status: "downloading",
          filePath: key,
          downloadedBytes: p.downloadedBytes ?? 0,
          fileSizeBytes: p.totalBytes || null,
          progress: p.progress ?? 0,
        });
      },
    });

    if (!result.success || !result.data) {
      await upsertDownloadRow({
        videoId: params.videoId,
        quality: params.quality,
        status: "failed",
        filePath: key,
        errorMessage: result.error || "Download failed",
      });
      return { success: false, error: result.error || "Download failed" };
    }

    const cached = await cacheVideoBytes({
      videoId: params.videoId,
      quality: params.quality,
      bytes: result.data,
      mimeType,
    });

    await upsertDownloadRow({
      videoId: params.videoId,
      quality: params.quality,
      status: "completed",
      filePath: cached.cacheKey,
      fileSizeBytes: cached.meta.sizeBytes,
      downloadedBytes: cached.meta.sizeBytes,
      progress: 100,
    });

    return { success: true, cacheKey: cached.cacheKey };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed";
    logger.error("nsfwVideoDownloads: downloadNSFWVideoOffline error", { error: message });
    return { success: false, error: message };
  }
}
