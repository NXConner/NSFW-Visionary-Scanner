/**
 * Hook for managing position images.
 *
 * Production-safe: loads images from Supabase `nsfw_positions_gallery` instead of
 * bundling external image catalogs in the client.
 */

import { useState, useEffect, useCallback } from "react";
import { fromExtended } from "@/lib/supabaseExtensions";
import { getDeviceId, getDevicePlatform } from "@/dlc/core/device";
import { isHttpUrl, signAssetPaths } from "@/lib/nsfwAssets";

interface PositionImage {
  id: string;
  name: string;
  originalUrl: string;
  invertedUrl?: string;
  category?: string;
  tags?: string[];
}

interface UsePositionImagesReturn {
  images: PositionImage[];
  isLoading: boolean;
  error: string | null;
  progress: number;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and managing position images
 */
export function usePositionImages(
  autoLoad: boolean = true,
  autoInvert: boolean = true,
): UsePositionImagesReturn {
  const [images, setImages] = useState<PositionImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const loadImages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      const { data, error } = await fromExtended("nsfw_positions_gallery")
        .select("id,position_name,category,tags,image_url,image_url_illustrated,thumbnail_url")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(500);

      if (error) throw new Error(error.message);

      const rows = (data || []) as Array<{
        id: string;
        position_name: string;
        category: string | null;
        tags: string[] | null;
        image_url: string | null;
        image_url_illustrated: string | null;
        thumbnail_url: string | null;
      }>;

      const deviceId = getDeviceId();
      const devicePlatform = getDevicePlatform();

      const positionImages: PositionImage[] = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]!;
        const url = r.image_url_illustrated || r.image_url || r.thumbnail_url;
        if (!url) continue;
        positionImages.push({
          id: String(r.id),
          name: String(r.position_name || "Untitled").trim(),
          originalUrl: String(url),
          category: r.category ? String(r.category) : undefined,
          tags: Array.isArray(r.tags) ? r.tags : undefined,
          invertedUrl: autoInvert ? undefined : undefined,
        });
      }

      // Best-effort sign any private storage paths.
      const toSign = positionImages.map(p => p.originalUrl).filter(u => u && !isHttpUrl(u));
      if (toSign.length > 0) {
        const map = await signAssetPaths({
          assetPaths: toSign,
          deviceId,
          devicePlatform,
          expiresInSeconds: 5 * 60,
        });
        if (Object.keys(map).length > 0) {
          for (const img of positionImages) {
            if (!isHttpUrl(img.originalUrl) && map[img.originalUrl]) {
              img.originalUrl = map[img.originalUrl]!;
            }
          }
        }
      }

      setImages(positionImages);
      setProgress(100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load images";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [autoInvert]);

  useEffect(() => {
    if (autoLoad) {
      loadImages();
    }
  }, [autoLoad, loadImages]);

  return {
    images,
    isLoading,
    error,
    progress,
    refresh: loadImages,
  };
}
