import { useEffect, useMemo, useRef, useState } from "react";
import type { DetectedObject } from "@/hooks/useObjectDetection";

export interface TrackedObject extends DetectedObject {
  trackId: number;
  ageFrames: number;
  lastSeenAt: number;
  history: Array<{ cx: number; cy: number; t: number }>;
  velocity: { vx: number; vy: number }; // percent per second
}

export interface UseObjectTrackingOptions {
  enabled: boolean;
  iouThreshold?: number;
  maxTrackAgeMs?: number;
  maxHistoryPoints?: number;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function iou(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): number {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;

  const ix1 = Math.max(a.x, b.x);
  const iy1 = Math.max(a.y, b.y);
  const ix2 = Math.min(ax2, bx2);
  const iy2 = Math.min(ay2, by2);

  const iw = Math.max(0, ix2 - ix1);
  const ih = Math.max(0, iy2 - iy1);
  const inter = iw * ih;
  const union = a.width * a.height + b.width * b.height - inter;
  return union <= 0 ? 0 : inter / union;
}

function centroid(box: { x: number; y: number; width: number; height: number }) {
  return { cx: box.x + box.width / 2, cy: box.y + box.height / 2 };
}

export function useObjectTracking(detections: DetectedObject[], options: UseObjectTrackingOptions) {
  const [tracks, setTracks] = useState<TrackedObject[]>([]);
  const nextIdRef = useRef(1);
  const tracksRef = useRef<TrackedObject[]>([]);

  const cfg = useMemo(() => {
    return {
      enabled: options.enabled,
      iouThreshold: clamp(options.iouThreshold ?? 0.18, 0.05, 0.9),
      maxTrackAgeMs: clamp(options.maxTrackAgeMs ?? 900, 250, 5000),
      maxHistoryPoints: clamp(options.maxHistoryPoints ?? 18, 6, 80),
    };
  }, [options.enabled, options.iouThreshold, options.maxTrackAgeMs, options.maxHistoryPoints]);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    if (!cfg.enabled) {
      setTracks([]);
      tracksRef.current = [];
      return;
    }

    const now = performance.now();
    const existing = tracksRef.current;

    const matchedTrackIds = new Set<number>();
    const matchedDetIds = new Set<number>();

    // Greedy IoU matching
    type Pair = { ti: number; di: number; score: number };
    const pairs: Pair[] = [];
    for (let ti = 0; ti < existing.length; ti++) {
      for (let di = 0; di < detections.length; di++) {
        pairs.push({ ti, di, score: iou(existing[ti].box, detections[di].box) });
      }
    }
    pairs.sort((a, b) => b.score - a.score);

    const nextTracks: TrackedObject[] = [];

    for (const p of pairs) {
      if (p.score < cfg.iouThreshold) break;
      if (matchedTrackIds.has(p.ti) || matchedDetIds.has(p.di)) continue;

      matchedTrackIds.add(p.ti);
      matchedDetIds.add(p.di);

      const prev = existing[p.ti];
      const det = detections[p.di];

      const cPrev = prev.history.length
        ? prev.history[prev.history.length - 1]
        : centroid(prev.box);
      const cNow = centroid(det.box);
      const dt = Math.max(16, now - prev.lastSeenAt);
      const vx = ((cNow.cx - cPrev.cx) / dt) * 1000;
      const vy = ((cNow.cy - cPrev.cy) / dt) * 1000;

      const history = [...prev.history, { ...cNow, t: now }].slice(-cfg.maxHistoryPoints);

      nextTracks.push({
        ...det,
        trackId: prev.trackId,
        ageFrames: prev.ageFrames + 1,
        lastSeenAt: now,
        history,
        velocity: { vx, vy },
      });
    }

    // Carry over unmatched tracks if not stale
    for (const prev of existing) {
      const isMatched = nextTracks.some(t => t.trackId === prev.trackId);
      if (isMatched) continue;
      if (now - prev.lastSeenAt <= cfg.maxTrackAgeMs) {
        nextTracks.push(prev);
      }
    }

    // Create tracks for unmatched detections
    for (let di = 0; di < detections.length; di++) {
      if (matchedDetIds.has(di)) continue;
      const det = detections[di];
      const id = nextIdRef.current++;
      const cNow = centroid(det.box);
      nextTracks.push({
        ...det,
        trackId: id,
        ageFrames: 1,
        lastSeenAt: now,
        history: [{ ...cNow, t: now }],
        velocity: { vx: 0, vy: 0 },
      });
    }

    nextTracks.sort((a, b) => b.score - a.score);
    setTracks(nextTracks);
  }, [detections, cfg.enabled, cfg.iouThreshold, cfg.maxTrackAgeMs, cfg.maxHistoryPoints]);

  return {
    tracks,
  };
}
