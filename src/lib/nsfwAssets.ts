import { supabase } from "@/integrations/supabase/client";

export type DevicePlatform = "web" | "android" | "ios";

type CacheEntry = { signedUrl: string; expiresAt: number };

const SIGNED_URL_CACHE = new Map<string, CacheEntry>();
const CACHE_REFRESH_BUFFER_MS = 10_000;

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function inferPackageIdFromAssetPath(assetPath: string, fallback: string = "dlc"): string {
  const first = String(assetPath || "").split("/")[0];
  return first || fallback;
}

function clampExpires(value?: number): number {
  const raw = Number(value ?? 300);
  return Math.max(30, Math.min(60 * 60, raw));
}

export async function signAssetPath(params: {
  assetPath: string;
  deviceId: string;
  devicePlatform: DevicePlatform;
  expiresInSeconds?: number;
  packageId?: string;
  forceRefresh?: boolean;
}): Promise<string> {
  const assetPath = String(params.assetPath || "").trim();
  if (!assetPath) throw new Error("Missing asset path");

  const packageId = params.packageId || inferPackageIdFromAssetPath(assetPath);
  const expiresInSeconds = clampExpires(params.expiresInSeconds);
  const cacheKey = `${packageId}::${assetPath}`;

  if (!params.forceRefresh) {
    const cached = SIGNED_URL_CACHE.get(cacheKey);
    if (cached && cached.expiresAt - CACHE_REFRESH_BUFFER_MS > Date.now()) {
      return cached.signedUrl;
    }
  }

  const { data, error } = await supabase.functions.invoke("get-dlc-signed-url", {
    body: {
      packageId,
      assetPath,
      expiresInSeconds,
      deviceId: params.deviceId,
      devicePlatform: params.devicePlatform,
    },
  });

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Failed to sign asset URL");
  }

  const signedUrl = String(data.signedUrl);
  SIGNED_URL_CACHE.set(cacheKey, {
    signedUrl,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });
  return signedUrl;
}

export async function signAssetPaths(params: {
  assetPaths: string[];
  deviceId: string;
  devicePlatform: DevicePlatform;
  expiresInSeconds?: number;
  packageIdResolver?: (assetPath: string) => string;
}): Promise<Record<string, string>> {
  const uniq = Array.from(new Set(params.assetPaths.filter(Boolean))).filter(p => !isHttpUrl(p));
  if (uniq.length === 0) return {};

  const expiresInSeconds = clampExpires(params.expiresInSeconds);

  const results = await Promise.allSettled(
    uniq.slice(0, 256).map(async assetPath => {
      const packageId = params.packageIdResolver
        ? params.packageIdResolver(assetPath)
        : inferPackageIdFromAssetPath(assetPath);
      const signedUrl = await signAssetPath({
        assetPath,
        packageId,
        expiresInSeconds,
        deviceId: params.deviceId,
        devicePlatform: params.devicePlatform,
      });
      return { assetPath, signedUrl };
    }),
  );

  const map: Record<string, string> = {};
  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value) continue;
    map[r.value.assetPath] = r.value.signedUrl;
  }

  return map;
}
