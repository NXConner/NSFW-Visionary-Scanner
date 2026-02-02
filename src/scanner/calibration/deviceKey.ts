import { getPlatformKind } from "@/scanner/utils/platform";

/**
 * Device key used to scope calibration profiles.
 * This is not intended to uniquely identify a user; it is used to reduce calibration drift across devices.
 */
export function getCalibrationDeviceKey(): string {
  const platform = getPlatformKind();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "unknown-ua";
  const lang = typeof navigator !== "undefined" ? navigator.language : "unknown-lang";
  const dpr = typeof window !== "undefined" ? String(window.devicePixelRatio || 1) : "1";
  const screenW = typeof window !== "undefined" ? String(window.screen?.width || 0) : "0";
  const screenH = typeof window !== "undefined" ? String(window.screen?.height || 0) : "0";

  // Keep stable but avoid pulling in hashing dependencies; store the raw key string.
  return `v1|${platform}|${dpr}|${screenW}x${screenH}|${lang}|${ua}`;
}
