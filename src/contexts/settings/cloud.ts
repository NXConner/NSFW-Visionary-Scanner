import type { StoredSettings } from "./types";

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function toTrimmedString(v: unknown): string {
  return String(v ?? "").trim();
}

function toFiniteNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export type CloudWallpaperV1 =
  | { kind: "none" }
  | { kind: "preset"; value: string }
  | {
      kind: "upload";
      bucket: string;
      path: string;
      mimeType: string;
      sizeBytes: number;
      updatedAtMs: number;
      ext?: string | null;
      isVideo?: boolean;
    };

export type CloudSettingsPayloadV1 = {
  v: 1;
  settings: StoredSettings;
  wallpaper: CloudWallpaperV1;
};

export function parseCloudSettingsPayload(value: unknown): CloudSettingsPayloadV1 | null {
  if (!isRecord(value)) return null;
  if (Number(value.v) !== 1) return null;

  const settings = (value as any).settings as unknown;
  if (!isRecord(settings)) return null;

  const wpRaw = (value as any).wallpaper as unknown;
  const wallpaper = normalizeWallpaper(wpRaw);

  // We intentionally don't deep-validate settings here; SettingsProvider normalizes it with defaults.
  return {
    v: 1,
    settings: settings as StoredSettings,
    wallpaper,
  };
}

export function normalizeWallpaper(value: unknown): CloudWallpaperV1 {
  if (!isRecord(value)) return { kind: "none" };
  const kind = toTrimmedString((value as any).kind).toLowerCase();

  if (kind === "preset") {
    const v = toTrimmedString((value as any).value);
    return v ? { kind: "preset", value: v } : { kind: "none" };
  }

  if (kind === "upload") {
    const bucket = toTrimmedString((value as any).bucket);
    const path = toTrimmedString((value as any).path);
    const mimeType = toTrimmedString((value as any).mimeType) || "application/octet-stream";
    const sizeBytes = toFiniteNumber((value as any).sizeBytes) ?? 0;
    const updatedAtMs = toFiniteNumber((value as any).updatedAtMs) ?? 0;
    const ext = toTrimmedString((value as any).ext) || null;
    const isVideo = Boolean((value as any).isVideo);
    if (!bucket || !path) return { kind: "none" };
    return {
      kind: "upload",
      bucket,
      path,
      mimeType,
      sizeBytes: Math.max(0, sizeBytes),
      updatedAtMs: Math.max(0, updatedAtMs),
      ext,
      isVideo,
    };
  }

  return { kind: "none" };
}

