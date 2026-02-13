import { useCallback, useEffect, useRef, useState } from "react";
import { clamp } from "@/lib/videoEditing/time";
import type { CameraSource } from "@/lib/videoEditing/types";

export function useMultiCamPlayback(params: { durationSeconds: number; sources: CameraSource[] }) {
  const { durationSeconds, sources } = params;

  const videoElsRef = useRef<Map<number, HTMLVideoElement>>(new Map());
  const [playhead, setPlayhead] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const registerVideoEl = useCallback((cameraIndex: number, el: HTMLVideoElement | null) => {
    if (!el) return;
    videoElsRef.current.set(cameraIndex, el);
  }, []);

  const getVideoEl = useCallback((cameraIndex: number): HTMLVideoElement | null => {
    return videoElsRef.current.get(cameraIndex) ?? null;
  }, []);

  const syncAllVideosToPlayhead = useCallback(
    async (t: number, alsoPlayPause: boolean) => {
      const clamped = clamp(t, 0, durationSeconds || 0);
      const targets = sources.map(s => ({ s, el: videoElsRef.current.get(s.cameraIndex) }));

      for (const { s, el } of targets) {
        if (!el) continue;
        const offset = Number(s.syncOffsetSeconds || 0);
        const maxDur = Math.max(0, el.duration || durationSeconds || 0);
        const targetTime = clamp(clamped + offset, 0, maxDur);
        if (Number.isFinite(targetTime)) {
          if (Math.abs((el.currentTime || 0) - targetTime) > 0.09) {
            try {
              el.currentTime = targetTime;
            } catch {
              // ignore
            }
          }
        }

        if (alsoPlayPause) {
          el.playbackRate = playbackRate;
          if (isPlaying) {
            try {
              el.muted = true;
              await el.play();
            } catch {
              // ignore
            }
          } else {
            try {
              el.pause();
            } catch {
              // ignore
            }
          }
        }
      }
    },
    [durationSeconds, isPlaying, playbackRate, sources],
  );

  const tick = useCallback(
    (nowMs: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (!isPlaying) return;
      if (document.visibilityState === "hidden") return;
      const last = lastTickRef.current || nowMs;
      lastTickRef.current = nowMs;
      const dt = (nowMs - last) / 1000;
      if (!Number.isFinite(dt) || dt <= 0) return;
      setPlayhead(prev => clamp(prev + dt * playbackRate, 0, durationSeconds || 0));
    },
    [durationSeconds, isPlaying, playbackRate],
  );

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);

  useEffect(() => {
    void syncAllVideosToPlayhead(playhead, false);
  }, [playhead, syncAllVideosToPlayhead]);

  const togglePlay = useCallback(async () => {
    setIsPlaying(p => !p);
    await syncAllVideosToPlayhead(playhead, true);
  }, [playhead, syncAllVideosToPlayhead]);

  const seek = useCallback(
    async (t: number) => {
      const next = clamp(t, 0, durationSeconds || 0);
      setPlayhead(next);
      await syncAllVideosToPlayhead(next, true);
    },
    [durationSeconds, syncAllVideosToPlayhead],
  );

  const setRate = useCallback(
    async (rate: number) => {
      const r = clamp(Number(rate || 1), 0.25, 3);
      setPlaybackRate(r);
      await syncAllVideosToPlayhead(playhead, true);
    },
    [playhead, syncAllVideosToPlayhead],
  );

  return {
    registerVideoEl,
    getVideoEl,
    playhead,
    setPlayhead,
    seek,
    isPlaying,
    togglePlay,
    playbackRate,
    setPlaybackRate: setRate,
  };
}
