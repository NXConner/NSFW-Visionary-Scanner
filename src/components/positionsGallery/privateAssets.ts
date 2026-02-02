import { supabase } from "@/integrations/supabase/client";

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function inferPackageIdFromAssetPath(assetPath: string): string {
  const first = assetPath.split("/")[0];
  return first || "dlc-positions";
}

export async function signAssetPaths(params: {
  assetPaths: string[];
  deviceId: string;
  devicePlatform: "web" | "android" | "ios";
  expiresInSeconds?: number;
}): Promise<Record<string, string>> {
  const expiresInSeconds = Math.max(
    30,
    Math.min(60 * 60, Number(params.expiresInSeconds ?? 5 * 60)),
  );
  const uniq = Array.from(new Set(params.assetPaths.filter(Boolean))).filter(p => !isHttpUrl(p));
  if (uniq.length === 0) return {};

  const results = await Promise.allSettled(
    uniq.slice(0, 256).map(async assetPath => {
      const packageId = inferPackageIdFromAssetPath(assetPath);
      const { data, error } = await supabase.functions.invoke("get-dlc-signed-url", {
        body: {
          packageId,
          assetPath,
          expiresInSeconds,
          deviceId: params.deviceId,
          devicePlatform: params.devicePlatform,
        },
      });
      if (error || !data?.signedUrl) return null;
      return { assetPath, signedUrl: String(data.signedUrl) };
    }),
  );

  const map: Record<string, string> = {};
  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value) continue;
    map[r.value.assetPath] = r.value.signedUrl;
  }
  return map;
}
