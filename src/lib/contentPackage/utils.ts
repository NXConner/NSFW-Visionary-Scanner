import type { ContentFile } from "./types";

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function normalizeChecksumHex(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^sha256:/, "");
}

export function guessMimeType(params: { path: string; declaredType: ContentFile["type"] }): string {
  const p = params.path.toLowerCase();
  if (params.declaredType === "video") {
    if (p.endsWith(".webm")) return "video/webm";
    if (p.endsWith(".mov")) return "video/quicktime";
    return "video/mp4";
  }
  if (params.declaredType === "gif") return "image/gif";
  if (params.declaredType === "image") {
    if (p.endsWith(".webp")) return "image/webp";
    if (p.endsWith(".png")) return "image/png";
    return "image/jpeg";
  }
  if (p.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

export function inferPackageIdFromAssetPath(assetPath: string): string {
  const first = String(assetPath || "").split("/")[0];
  return first || "dlc";
}
