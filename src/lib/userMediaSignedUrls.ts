import { supabase } from "@/integrations/supabase/client";
import { isHttpUrl } from "@/lib/nsfwAssets";

type CacheEntry = { signedUrl: string; expiresAt: number };

const SIGNED_URL_CACHE = new Map<string, CacheEntry>();
const CACHE_REFRESH_BUFFER_MS = 10_000;

function clampExpires(value?: number): number {
  const raw = Number(value ?? 300);
  return Math.max(30, Math.min(60 * 60, raw));
}

export async function signUserMediaPath(params: {
  bucket: string;
  path: string;
  expiresInSeconds?: number;
  forceRefresh?: boolean;
}): Promise<string> {
  const bucket = String(params.bucket || "").trim();
  const path = String(params.path || "").trim();
  if (!bucket || !path) throw new Error("Missing path or bucket");
  if (isHttpUrl(path)) return path;

  const expiresInSeconds = clampExpires(params.expiresInSeconds);
  const cacheKey = `${bucket}::${path}`;

  if (!params.forceRefresh) {
    const cached = SIGNED_URL_CACHE.get(cacheKey);
    if (cached && cached.expiresAt - CACHE_REFRESH_BUFFER_MS > Date.now()) {
      return cached.signedUrl;
    }
  }

  const { data, error } = await supabase.functions.invoke("get-user-media-signed-url", {
    body: { bucket, path, expiresInSeconds },
  });
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Unable to sign media URL");
  }

  const signedUrl = String(data.signedUrl);
  SIGNED_URL_CACHE.set(cacheKey, {
    signedUrl,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });
  return signedUrl;
}

export async function signUserMediaPaths(params: {
  bucket: string;
  paths: string[];
  expiresInSeconds?: number;
}): Promise<Record<string, string>> {
  const uniq = Array.from(new Set(params.paths.filter(Boolean))).filter(p => !isHttpUrl(p));
  if (uniq.length === 0) return {};

  const results = await Promise.allSettled(
    uniq.slice(0, 256).map(async path => ({
      path,
      signedUrl: await signUserMediaPath({
        bucket: params.bucket,
        path,
        expiresInSeconds: params.expiresInSeconds,
      }),
    })),
  );

  const map: Record<string, string> = {};
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    map[r.value.path] = r.value.signedUrl;
  }
  return map;
}
