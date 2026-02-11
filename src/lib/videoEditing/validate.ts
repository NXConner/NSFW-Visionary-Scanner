import type { TimelineSpec, TimelineSpecV1, MaskTrack, MaskMode, MaskKeyframe } from "./types";
import { clamp } from "./time";

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function safeNumber(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeTimeline(input: TimelineSpec): TimelineSpecV1 {
  const t = input as TimelineSpecV1;
  const duration = clamp(safeNumber(t.durationSeconds, 0), 0, 60 * 60 * 8);

  const sources = Array.isArray(t.sources)
    ? t.sources
        .map(s => ({
          cameraIndex: clamp(Math.floor(safeNumber(s.cameraIndex, 0)), 0, 32),
          videoUrl: String((s as any).videoUrl || ""),
          storagePath: (s as any).storagePath ?? null,
          syncOffsetSeconds: safeNumber((s as any).syncOffsetSeconds, 0),
          label: (s as any).label ?? null,
        }))
        .filter(s => Boolean(s.videoUrl))
    : [];

  const cameraSwitches = Array.isArray(t.cameraSwitches)
    ? t.cameraSwitches
        .map(e => ({
          id: String((e as any).id || ""),
          atSeconds: clamp(safeNumber((e as any).atSeconds, 0), 0, duration || 0),
          cameraIndex: clamp(Math.floor(safeNumber((e as any).cameraIndex, 0)), 0, 32),
          transition:
            (e as any).transition === "crossfade" || (e as any).transition === "dip_to_black"
              ? (e as any).transition
              : "cut",
          transitionDurationMs: clamp(
            Math.floor(safeNumber((e as any).transitionDurationMs, 0)),
            0,
            10000,
          ),
        }))
        .filter(e => Boolean(e.id))
        .sort((a, b) => a.atSeconds - b.atSeconds)
    : [];

  const masks: MaskTrack[] = Array.isArray(t.masks)
    ? t.masks
        .map(
          (m): MaskTrack => ({
            id: String((m as any).id || ""),
            name: String((m as any).name || "Mask"),
            mode: ((m as any).mode === "include" ? "include" : "exclude") as MaskMode,
            feather: clamp(safeNumber((m as any).feather, 0.15), 0, 1),
            blur: clamp(safeNumber((m as any).blur, 0), 0, 1),
            sourceTrackId: (m as any).sourceTrackId ? String((m as any).sourceTrackId) : undefined,
            keyframes: Array.isArray((m as any).keyframes)
              ? (m as any).keyframes
                  .map((k: any) => {
                    const atSeconds = clamp(safeNumber(k?.atSeconds, 0), 0, duration || 0);
                    const shape = k?.shape;
                    if (!isObject(shape)) return null;
                    if (shape.kind === "rect") {
                      return {
                        atSeconds,
                        shape: {
                          kind: "rect" as const,
                          xPct: clamp(safeNumber(shape.xPct, 0), -50, 150),
                          yPct: clamp(safeNumber(shape.yPct, 0), -50, 150),
                          wPct: clamp(safeNumber(shape.wPct, 0), 0, 200),
                          hPct: clamp(safeNumber(shape.hPct, 0), 0, 200),
                          radiusPct: clamp(safeNumber(shape.radiusPct, 0), 0, 50),
                        },
                        strength: clamp(safeNumber(k?.strength, 1), 0, 1),
                      };
                    }
                    if (shape.kind === "polygon") {
                      const pts = Array.isArray((shape as any).points) ? (shape as any).points : [];
                      const points = pts
                        .map((p: any) => ({
                          xPct: clamp(safeNumber(p?.xPct, 0), -50, 150),
                          yPct: clamp(safeNumber(p?.yPct, 0), -50, 150),
                        }))
                        .slice(0, 512);
                      if (points.length < 3) return null;
                      return {
                        atSeconds,
                        shape: { kind: "polygon" as const, points },
                        strength: clamp(safeNumber(k?.strength, 1), 0, 1),
                      };
                    }
                    return null;
                  })
                  .filter(Boolean)
                  .sort((a: any, b: any) => a.atSeconds - b.atSeconds)
              : [],
          }),
        )
        .filter(m => Boolean(m.id))
    : [];

  const syncMarkers = Array.isArray((t as any).syncMarkers)
    ? (t as any).syncMarkers
        .map((m: any) => ({
          id: String(m?.id || ""),
          atSeconds: clamp(safeNumber(m?.atSeconds, 0), 0, duration || 0),
          label: m?.label ? String(m.label) : undefined,
        }))
        .filter((m: any) => Boolean(m.id))
        .sort((a: any, b: any) => a.atSeconds - b.atSeconds)
    : undefined;

  return {
    version: 1,
    kind: "multicam",
    baseRecordingId: String((t as any).baseRecordingId || ""),
    durationSeconds: duration,
    sources,
    cameraSwitches,
    masks,
    syncMarkers,
    meta: isObject((t as any).meta) ? ((t as any).meta as Record<string, unknown>) : undefined,
  };
}

export function isTimelineSpecV1(v: unknown): v is TimelineSpecV1 {
  if (!isObject(v)) return false;
  if ((v as any).version !== 1) return false;
  if ((v as any).kind !== "multicam") return false;
  if (typeof (v as any).baseRecordingId !== "string") return false;
  if (!Number.isFinite(Number((v as any).durationSeconds))) return false;
  if (!Array.isArray((v as any).sources)) return false;
  if (!Array.isArray((v as any).cameraSwitches)) return false;
  if (!Array.isArray((v as any).masks)) return false;
  return true;
}
