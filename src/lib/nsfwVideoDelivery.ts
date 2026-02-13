import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { getDeviceId, getDevicePlatform } from "@/dlc/core/device";
import type { VideoQuality } from "@/lib/offlineMedia/videoCache";
import { getCachedVideoUrl } from "@/lib/offlineMedia/videoCache";
import { logger } from "@/lib/logger";

export type ResolvedVideoSource = {
  sourceType: "cached" | "remote";
  url: string;
  cacheHit?: boolean;
  assetPath?: string;
  packageId?: string;
};

export type VideoPlaybackMode = "cache_first" | "stream";

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function pickVideoField(video: Record<string, unknown>, quality: VideoQuality): string | null {
  const candidate =
    quality === "4k"
      ? video.video_url_4k
      : quality === "sd"
        ? video.video_url_sd
        : video.video_url_hd;
  return candidate ? String(candidate) : null;
}

function inferPackageIdFromAssetPath(assetPath: string): string {
  const first = assetPath.split("/")[0];
  return first || "dlc-videos";
}

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
  return inferPackageIdFromAssetPath(assetPath);
}

export async function getNSFWVideoPlaybackUrl(params: {
  videoId: string;
  quality: VideoQuality;
  mode?: VideoPlaybackMode;
}): Promise<ResolvedVideoSource | null> {
  const mode: VideoPlaybackMode = params.mode ?? "cache_first";

  // Prefer offline cache first (unless streaming is explicitly requested)
  if (mode !== "stream") {
    try {
      const cached = await getCachedVideoUrl(params.videoId, params.quality);
      if (cached) return { sourceType: "cached", url: cached, cacheHit: true };
    } catch {
      // ignore cache errors and fall back to remote
    }
  }

  // Fetch video row and resolve remote URL (direct or signed)
  const { data: video, error } = await fromExtended("nsfw_video_content")
    .select("id, dlc_pack_id, video_url_sd, video_url_hd, video_url_4k, is_active, is_approved")
    .eq("id", params.videoId)
    .maybeSingle();

  if (error || !video) {
    logger.error("nsfwVideoDelivery: failed to load video row", { error: error?.message });
    return null;
  }

  const candidate = pickVideoField(video as Record<string, unknown>, params.quality);
  if (!candidate) return null;

  if (isHttpUrl(candidate)) return { sourceType: "remote", url: candidate };

  const assetPath = candidate;
  const videoRecord = video as Record<string, unknown>;
  const packageId = await resolvePackageIdForVideo({
    dlcPackId: videoRecord?.dlc_pack_id ? String(videoRecord.dlc_pack_id) : null,
    assetPath,
  });
  const deviceId = getDeviceId();
  const devicePlatform = getDevicePlatform();

  const { data: signed, error: signedError } = await supabase.functions.invoke(
    "get-dlc-signed-url",
    {
      body: {
        packageId,
        assetPath,
        // Streaming needs a longer-lived URL; offline download uses its own flow.
        expiresInSeconds: mode === "stream" ? 60 * 60 : 5 * 60,
        deviceId,
        devicePlatform,
      },
    },
  );

  if (signedError || !signed?.signedUrl) {
    logger.error("nsfwVideoDelivery: failed to sign video url", { error: signedError?.message });
    return null;
  }

  return {
    sourceType: "remote",
    url: String(signed.signedUrl),
    assetPath,
    packageId,
  };
}
