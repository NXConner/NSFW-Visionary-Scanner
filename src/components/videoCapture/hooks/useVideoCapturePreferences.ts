import { useCallback, useState } from "react";
import type { VideoCaptureQuality } from "../types";

const LS_DEFAULT_QUALITY = "videoCapture.defaultQuality";
const LS_AUDIO_ENABLED = "videoCapture.audioEnabled";

function isQuality(v: unknown): v is VideoCaptureQuality {
  return v === "720p" || v === "1080p" || v === "2k" || v === "4k";
}

function safeStorageGet(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function useVideoCapturePreferences(): {
  quality: VideoCaptureQuality;
  setQuality: (next: VideoCaptureQuality) => void;
  audioEnabled: boolean;
  setAudioEnabled: (next: boolean) => void;
} {
  const [qualityState, setQualityState] = useState<VideoCaptureQuality>(() => {
    const stored = safeStorageGet(LS_DEFAULT_QUALITY);
    return isQuality(stored) ? stored : "2k";
  });

  const [audioEnabledState, setAudioEnabledState] = useState<boolean>(() => {
    const stored = safeStorageGet(LS_AUDIO_ENABLED);
    return stored === "1" || stored === "true";
  });

  const setQuality = useCallback((next: VideoCaptureQuality) => {
    setQualityState(next);
    safeStorageSet(LS_DEFAULT_QUALITY, next);
  }, []);

  const setAudioEnabled = useCallback((next: boolean) => {
    setAudioEnabledState(next);
    safeStorageSet(LS_AUDIO_ENABLED, next ? "1" : "0");
  }, []);

  return {
    quality: qualityState,
    setQuality,
    audioEnabled: audioEnabledState,
    setAudioEnabled,
  };
}
