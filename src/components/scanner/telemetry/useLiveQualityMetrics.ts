import * as React from "react";
import { computeLiveQualityScores, type LiveQualityScores } from "@/scanner/quality";

export type LiveQualityState = {
  scores: LiveQualityScores;
  updatedAt: number;
};

const DEFAULT_SCORES: LiveQualityScores = {
  lightingScore: 0,
  sharpnessScore: 0,
  qualityScore: 0,
  debug: { meanLuma: 0, stdLuma: 0, edgeMean: 0, edgeDensity: 0 },
};

export function useLiveQualityMetrics(args: {
  enabled: boolean;
  videoEl: HTMLVideoElement | null;
  /**
   * Target sampling rate. Keep low to protect UI thread.
   * 3–6 fps is usually enough for auto-capture gating.
   */
  sampleFps?: number;
  /**
   * Processing resolution. Lower = faster and still good enough for blur detection.
   */
  sampleSize?: { width: number; height: number };
}): LiveQualityState {
  const { enabled, videoEl } = args;
  const sampleFps = Math.max(1, Math.min(10, Number(args.sampleFps ?? 4)));
  const sampleSize = args.sampleSize ?? { width: 160, height: 120 };

  const [state, setState] = React.useState<LiveQualityState>({
    scores: DEFAULT_SCORES,
    updatedAt: 0,
  });

  const lastAtRef = React.useRef(0);
  const lastPublishedRef = React.useRef<LiveQualityScores>(DEFAULT_SCORES);

  const scoresChangedMeaningfully = React.useCallback(
    (a: LiveQualityScores, b: LiveQualityScores) => {
      // Avoid rerenders for tiny fluctuations; the UI only needs coarse-grained feedback.
      if (Math.abs(a.lightingScore - b.lightingScore) >= 1) return true;
      if (Math.abs(a.sharpnessScore - b.sharpnessScore) >= 1) return true;
      if (Math.abs(a.qualityScore - b.qualityScore) >= 1) return true;
      return false;
    },
    [],
  );

  React.useEffect(() => {
    if (!enabled) return;
    if (!videoEl) return;

    const canvas: HTMLCanvasElement | OffscreenCanvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(sampleSize.width, sampleSize.height)
        : Object.assign(document.createElement("canvas"), {
            width: sampleSize.width,
            height: sampleSize.height,
          });

    const ctx = canvas.getContext("2d", { willReadFrequently: true } as any) as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!ctx) return;

    const intervalMs = 1000 / sampleFps;

    let stopped = false;
    let timeoutId: number | null = null;

    const scheduleNext = (delayMs: number) => {
      if (stopped) return;
      timeoutId = window.setTimeout(sampleOnce, delayMs);
    };

    const sampleOnce = () => {
      if (stopped) return;
      const now = performance.now();
      const delta = now - lastAtRef.current;
      if (delta < intervalMs) {
        scheduleNext(Math.max(0, intervalMs - delta));
        return;
      }
      lastAtRef.current = now;

      // Avoid work when the tab is backgrounded.
      if (document.visibilityState === "hidden") {
        scheduleNext(intervalMs);
        return;
      }

      // Only sample when video has real frames.
      if (videoEl.videoWidth <= 0 || videoEl.videoHeight <= 0) {
        scheduleNext(intervalMs);
        return;
      }

      try {
        (ctx as any).drawImage(videoEl, 0, 0, sampleSize.width, sampleSize.height);
        const imageData = (ctx as any).getImageData(
          0,
          0,
          sampleSize.width,
          sampleSize.height,
        ) as ImageData;
        const scores = computeLiveQualityScores(imageData);

        // Only publish when meaningfully changed (reduces rerenders/GC).
        if (scoresChangedMeaningfully(lastPublishedRef.current, scores)) {
          lastPublishedRef.current = scores;
          setState({ scores, updatedAt: Date.now() });
        }
      } catch {
        // ignore transient draw errors
      } finally {
        scheduleNext(intervalMs);
      }
    };

    scheduleNext(0);
    return () => {
      stopped = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [enabled, videoEl, sampleFps, sampleSize.height, sampleSize.width, scoresChangedMeaningfully]);

  return state;
}
