import { useEffect, useMemo, useState } from "react";

export type CameraFocusMode = "auto" | "continuous" | "manual" | "single-shot";

type MediaTrackWithCapabilities = MediaStreamTrack & {
  getCapabilities?: () => Record<string, unknown>;
};

export interface CameraCapabilitySnapshot {
  hasTorch: boolean;
  hasZoom: boolean;
  zoom?: { min: number; max: number; step: number };

  hasFocus: boolean;
  focusModes?: CameraFocusMode[];
  focusDistance?: { min: number; max: number; step: number };

  hasExposureLock: boolean;
  exposureModes?: string[];

  hasWhiteBalanceLock: boolean;
  whiteBalanceModes?: string[];
}

function toNumberRange(v: unknown): { min: number; max: number; step: number } | undefined {
  if (!v || typeof v !== "object") return undefined;
  const obj = v as { min?: unknown; max?: unknown; step?: unknown };
  if (typeof obj.min !== "number" || typeof obj.max !== "number") return undefined;
  return {
    min: obj.min,
    max: obj.max,
    step: typeof obj.step === "number" ? obj.step : 0.1,
  };
}

function normalizeFocusModes(modes: unknown): CameraFocusMode[] | undefined {
  if (!Array.isArray(modes)) return undefined;
  const allowed = new Set<CameraFocusMode>(["auto", "continuous", "manual", "single-shot"]);
  const normalized = modes
    .filter((m): m is string => typeof m === "string")
    .map(m =>
      m === "continuous"
        ? "continuous"
        : m === "single-shot"
          ? "single-shot"
          : m === "manual"
            ? "manual"
            : "auto",
    )
    .filter((m): m is CameraFocusMode => allowed.has(m as CameraFocusMode));
  return normalized.length ? Array.from(new Set(normalized)) : undefined;
}

export function useCameraCapabilities(
  track: MediaStreamTrack | null | undefined,
): CameraCapabilitySnapshot {
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!track) return;

    // Some browsers update capabilities after applyConstraints().
    const onSettings = () => setNonce(n => n + 1);
    // No standard event, but constraints changes often coincide with 'ended' or 'mute' changes.
    track.addEventListener?.("mute", onSettings);
    track.addEventListener?.("unmute", onSettings);
    return () => {
      track.removeEventListener?.("mute", onSettings);
      track.removeEventListener?.("unmute", onSettings);
    };
  }, [track]);

  return useMemo(() => {
    // Ensure the memo depends on nonce (capabilities refresh after applyConstraints).
    void nonce;

    const t = track as MediaTrackWithCapabilities | null | undefined;
    if (!t || typeof t.getCapabilities !== "function") {
      return {
        hasTorch: false,
        hasZoom: false,
        hasFocus: false,
        hasExposureLock: false,
        hasWhiteBalanceLock: false,
      };
    }

    const caps = t.getCapabilities?.() as Record<string, unknown> | undefined;

    const zoom = toNumberRange(caps?.zoom);
    const focusDistance = toNumberRange(caps?.focusDistance);

    const focusModes = normalizeFocusModes(caps?.focusMode);

    const exposureModes = Array.isArray(caps?.exposureMode)
      ? (caps?.exposureMode as unknown[]).filter((m): m is string => typeof m === "string")
      : undefined;

    const whiteBalanceModes = Array.isArray(caps?.whiteBalanceMode)
      ? (caps?.whiteBalanceMode as unknown[]).filter((m): m is string => typeof m === "string")
      : undefined;

    return {
      hasTorch: !!(caps?.torch as boolean | undefined),
      hasZoom: !!zoom,
      zoom,
      hasFocus: !!(focusModes?.length || focusDistance),
      focusModes,
      focusDistance,
      hasExposureLock: !!exposureModes?.length,
      exposureModes,
      hasWhiteBalanceLock: !!whiteBalanceModes?.length,
      whiteBalanceModes,
    };
  }, [track, nonce]);
}
