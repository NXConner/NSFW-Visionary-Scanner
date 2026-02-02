import { useEffect, useMemo, useRef, useState } from "react";

export type ObjectDetectionStatus = "idle" | "loading" | "ready" | "error";

export interface DetectionBox {
  // Percent coordinates within the rendered (object-cover) video rect.
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedObject {
  id: string;
  className: string;
  score: number;
  box: DetectionBox;
  boxPx: { x: number; y: number; width: number; height: number };
}

export interface UseObjectDetectionOptions {
  enabled: boolean;
  threshold: number; // 0..1
  maxObjects: number;
  targetFps?: number;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function mapVideoBBoxToCoverPercent(
  videoEl: HTMLVideoElement,
  bboxPx: { x: number; y: number; width: number; height: number },
): DetectionBox | null {
  const rect = videoEl.getBoundingClientRect();
  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;
  if (!rect.width || !rect.height || !vw || !vh) return null;

  // object-fit: cover
  const scale = Math.max(rect.width / vw, rect.height / vh);
  const displayW = vw * scale;
  const displayH = vh * scale;
  const offsetX = (rect.width - displayW) / 2;
  const offsetY = (rect.height - displayH) / 2;

  const x = bboxPx.x * scale + offsetX;
  const y = bboxPx.y * scale + offsetY;
  const w = bboxPx.width * scale;
  const h = bboxPx.height * scale;

  return {
    x: (x / rect.width) * 100,
    y: (y / rect.height) * 100,
    width: (w / rect.width) * 100,
    height: (h / rect.height) * 100,
  };
}

function nearlyEqual(a: number, b: number, eps: number): boolean {
  return Math.abs(a - b) <= eps;
}

function detectionsSimilar(a: DetectedObject[], b: DetectedObject[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const da = a[i];
    const db = b[i];
    if (!da || !db) return false;
    if (da.className !== db.className) return false;
    if (!nearlyEqual(da.score, db.score, 0.015)) return false;
    // % coords are what the UI uses; small jitter shouldn't rerender everything.
    if (!nearlyEqual(da.box.x, db.box.x, 0.35)) return false;
    if (!nearlyEqual(da.box.y, db.box.y, 0.35)) return false;
    if (!nearlyEqual(da.box.width, db.box.width, 0.35)) return false;
    if (!nearlyEqual(da.box.height, db.box.height, 0.35)) return false;
  }
  return true;
}

export function useObjectDetection(
  videoEl: HTMLVideoElement | null,
  options: UseObjectDetectionOptions,
) {
  const [status, setStatus] = useState<ObjectDetectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [detections, setDetections] = useState<DetectedObject[]>([]);
  const [fps, setFps] = useState(0);
  const [lastInferenceMs, setLastInferenceMs] = useState<number | null>(null);

  const modelRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameAtRef = useRef<number>(0);
  const fpsWindowRef = useRef<number[]>([]);
  const inFlightRef = useRef(false);
  const lastPublishedDetectionsRef = useRef<DetectedObject[]>([]);
  const lastFpsPublishAtRef = useRef<number>(0);
  const lastInferencePublishAtRef = useRef<number>(0);
  const coverCacheRef = useRef<{
    at: number;
    rectW: number;
    rectH: number;
    vw: number;
    vh: number;
    scale: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const effectiveTargetFps = useMemo(
    () => clamp(options.targetFps ?? 18, 5, 30),
    [options.targetFps],
  );
  const minFrameDelta = useMemo(() => 1000 / effectiveTargetFps, [effectiveTargetFps]);

  useEffect(() => {
    if (!options.enabled) {
      setStatus("idle");
      setError(null);
      setDetections([]);
      setFps(0);
      setLastInferenceMs(null);
      lastPublishedDetectionsRef.current = [];
      fpsWindowRef.current = [];
      lastFrameAtRef.current = 0;
      lastFpsPublishAtRef.current = 0;
      lastInferencePublishAtRef.current = 0;
      inFlightRef.current = false;
      coverCacheRef.current = null;
      return;
    }

    let cancelled = false;

    const loadModel = async () => {
      try {
        setStatus("loading");
        setError(null);

        // Ensure TFJS is initialized before loading coco-ssd.
        await import("@tensorflow/tfjs");
        const coco = await import("@tensorflow-models/coco-ssd");
        if (cancelled) return;
        modelRef.current = await coco.load();
        if (cancelled) return;
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load ML model";
        setStatus("error");
        setError(msg);
      }
    };

    if (!modelRef.current) void loadModel();
    else setStatus("ready");

    return () => {
      cancelled = true;
    };
  }, [options.enabled]);

  useEffect(() => {
    if (!options.enabled) return;
    if (status !== "ready") return;
    if (!videoEl) return;

    let cancelled = false;

    const tick = (t: number) => {
      if (cancelled) return;
      rafRef.current = requestAnimationFrame(tick);
      if (document.visibilityState === "hidden") return;
      if (!modelRef.current) return;
      if (inFlightRef.current) return;
      if (t - lastFrameAtRef.current < minFrameDelta) return;
      if (videoEl.readyState < 2 || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) return;

      lastFrameAtRef.current = t;
      inFlightRef.current = true;

      const started = performance.now();

      void (async () => {
        try {
          const raw = (await modelRef.current.detect(videoEl)) as Array<{
            bbox: [number, number, number, number];
            class: string;
            score: number;
          }>;

          const now = performance.now();
          const inferenceMs = now - started;

          // Compute object-fit: cover mapping (cached; avoid forcing layout every inference).
          const vw = videoEl.videoWidth;
          const vh = videoEl.videoHeight;
          if (!vw || !vh) return;

          const cache = coverCacheRef.current;
          const shouldRefreshCache =
            !cache || now - cache.at > 250 || cache.vw !== vw || cache.vh !== vh;

          const rect = shouldRefreshCache ? videoEl.getBoundingClientRect() : null;
          const rectW = rect ? rect.width : (cache?.rectW ?? 0);
          const rectH = rect ? rect.height : (cache?.rectH ?? 0);
          if (!rectW || !rectH) return;

          const scale = Math.max(rectW / vw, rectH / vh);
          const displayW = vw * scale;
          const displayH = vh * scale;
          const offsetX = (rectW - displayW) / 2;
          const offsetY = (rectH - displayH) / 2;

          if (shouldRefreshCache) {
            coverCacheRef.current = {
              at: now,
              rectW,
              rectH,
              vw,
              vh,
              scale,
              offsetX,
              offsetY,
            };
          }

          const filtered = raw
            .filter(r => r.score >= options.threshold)
            .sort((a, b) => b.score - a.score)
            .slice(0, clamp(options.maxObjects, 1, 25));

          const next: DetectedObject[] = filtered
            .map((r, idx) => {
              const [x, y, w, h] = r.bbox;
              const boxPx = { x, y, width: w, height: h };
              // Map px->percent using the cached rect/scale (same math as mapVideoBBoxToCoverPercent).
              const pxX = boxPx.x * scale + offsetX;
              const pxY = boxPx.y * scale + offsetY;
              const pxW = boxPx.width * scale;
              const pxH = boxPx.height * scale;
              const box = {
                x: (pxX / rectW) * 100,
                y: (pxY / rectH) * 100,
                width: (pxW / rectW) * 100,
                height: (pxH / rectH) * 100,
              };
              return {
                id: `${r.class}-${idx}`,
                className: r.class,
                score: r.score,
                box: {
                  x: clamp(box.x, -50, 150),
                  y: clamp(box.y, -50, 150),
                  width: clamp(box.width, 0, 200),
                  height: clamp(box.height, 0, 200),
                },
                boxPx,
              } as DetectedObject;
            })
            .filter(Boolean);

          // Only publish detections when meaningfully changed (cuts rerenders/GC).
          if (!detectionsSimilar(lastPublishedDetectionsRef.current, next)) {
            lastPublishedDetectionsRef.current = next;
            setDetections(next);
          }

          // FPS over sliding window (publish at most ~4Hz)
          fpsWindowRef.current.push(now);
          const cutoff = now - 1500;
          while (fpsWindowRef.current.length && fpsWindowRef.current[0] < cutoff)
            fpsWindowRef.current.shift();
          if (fpsWindowRef.current.length >= 2) {
            const span =
              fpsWindowRef.current[fpsWindowRef.current.length - 1] - fpsWindowRef.current[0];
            const frames = fpsWindowRef.current.length - 1;
            const computedFps = span > 0 ? Math.round((frames / span) * 1000) : 0;
            if (now - lastFpsPublishAtRef.current >= 250) {
              lastFpsPublishAtRef.current = now;
              setFps(computedFps);
            }
          }

          // Inference duration (publish at most ~10Hz)
          if (now - lastInferencePublishAtRef.current >= 100) {
            lastInferencePublishAtRef.current = now;
            setLastInferenceMs(inferenceMs);
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "ML inference failed";
          setError(msg);
          setStatus("error");
          lastPublishedDetectionsRef.current = [];
          setDetections([]);
        } finally {
          inFlightRef.current = false;
        }
      })();
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      inFlightRef.current = false;
    };
  }, [options.enabled, status, videoEl, minFrameDelta, options.threshold, options.maxObjects]);

  return {
    status,
    error,
    detections,
    fps,
    lastInferenceMs,
  };
}
