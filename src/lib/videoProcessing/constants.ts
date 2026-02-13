import type { VideoQuality } from "./types";

export const QUALITY_PRESETS: Record<
  VideoQuality,
  { width: number; height: number; bitrate: number }
> = {
  "720p": { width: 1280, height: 720, bitrate: 4_000_000 },
  "1080p": { width: 1920, height: 1080, bitrate: 8_000_000 },
  "2k": { width: 2560, height: 1440, bitrate: 15_000_000 },
  "4k": { width: 3840, height: 2160, bitrate: 25_000_000 },
};
