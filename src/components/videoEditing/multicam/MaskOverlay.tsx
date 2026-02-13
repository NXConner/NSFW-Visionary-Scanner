import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import type { DetectedObject } from "@/hooks/useObjectDetection";
import type { TrackedObject } from "@/hooks/useObjectTracking";
import type { MaskTrack, NormalizedPoint } from "@/lib/videoEditing";
import { clamp, roundTo, uuidLike } from "@/lib/videoEditing";
import { toast } from "sonner";

function pointFromEvent(e: React.PointerEvent, container: HTMLElement): NormalizedPoint {
  const r = container.getBoundingClientRect();
  const x = ((e.clientX - r.left) / Math.max(1, r.width)) * 100;
  const y = ((e.clientY - r.top) / Math.max(1, r.height)) * 100;
  return { xPct: clamp(x, -50, 150), yPct: clamp(y, -50, 150) };
}

function polygonToPath(points: NormalizedPoint[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  const parts = [`M ${first.xPct} ${first.yPct}`];
  for (const p of rest) parts.push(`L ${p.xPct} ${p.yPct}`);
  parts.push("Z");
  return parts.join(" ");
}

function maskAtTime(m: MaskTrack, t: number) {
  if (!m.keyframes.length) return null;
  let last = m.keyframes[0];
  for (const k of m.keyframes) {
    if (k.atSeconds <= t) last = k;
    else break;
  }
  return last ?? null;
}

export function MaskOverlay(props: {
  playheadSeconds: number;
  durationSeconds: number;
  masks: MaskTrack[];
  activeMaskId: string | null;
  onSelectMask: (id: string | null) => void;
  onUpsertMask: (next: MaskTrack) => void;
  detections: DetectedObject[];
  tracks: TrackedObject[];
  selectedTrackId: number | null;
  onSelectDetectionIndex: (idx: number) => void;
  onAddMaskKeyframeFromDetection: () => void;
}): JSX.Element {
  const {
    playheadSeconds,
    masks,
    activeMaskId,
    onSelectMask,
    onUpsertMask,
    detections,
    tracks,
    selectedTrackId,
    onSelectDetectionIndex,
    onAddMaskKeyframeFromDetection,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [draftPoints, setDraftPoints] = useState<NormalizedPoint[]>([]);

  const activeMask = useMemo(
    () => masks.find(m => m.id === activeMaskId) ?? null,
    [activeMaskId, masks],
  );

  const activeKeyframe = useMemo(() => {
    if (!activeMask) return null;
    return maskAtTime(activeMask, playheadSeconds);
  }, [activeMask, playheadSeconds]);

  const commitPolygonToMask = useCallback(() => {
    const pts = draftPoints.slice();
    if (pts.length < 3) {
      toast.info("Add at least 3 points");
      return;
    }
    const mask: MaskTrack =
      activeMask ??
      ({
        id: uuidLike(),
        name: `Mask`,
        mode: "exclude",
        feather: 0.15,
        blur: 0,
        keyframes: [],
      } satisfies MaskTrack);

    const kf = {
      atSeconds: roundTo(playheadSeconds, 3),
      shape: { kind: "polygon" as const, points: pts },
      strength: 1,
    };

    const next: MaskTrack = {
      ...mask,
      keyframes: [...mask.keyframes, kf].sort((a, b) => a.atSeconds - b.atSeconds),
    };
    onUpsertMask(next);
    onSelectMask(next.id);
    setDraftPoints([]);
    setDrawMode(false);
    toast.success("Polygon mask keyframe added");
  }, [activeMask, draftPoints, onSelectMask, onUpsertMask, playheadSeconds]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {/* Mask preview overlay */}
      {masks.map(m => {
        const k = maskAtTime(m, playheadSeconds);
        if (!k) return null;
        const isActive = m.id === activeMaskId;
        const stroke = isActive ? "hsl(var(--primary))" : "rgba(255,255,255,0.55)";
        const fill = isActive ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)";
        if (k.shape.kind === "rect") {
          return (
            <div
              key={m.id}
              className="absolute pointer-events-none"
              style={{
                left: `${k.shape.xPct}%`,
                top: `${k.shape.yPct}%`,
                width: `${k.shape.wPct}%`,
                height: `${k.shape.hPct}%`,
                border: `2px solid ${stroke}`,
                background: fill,
                borderRadius: `${(k.shape.radiusPct ?? 0) * 0.2}px`,
              }}
            />
          );
        }
        return (
          <svg key={m.id} className="absolute inset-0 w-full h-full pointer-events-none">
            <path
              d={polygonToPath(k.shape.points)}
              fill={fill}
              stroke={stroke}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        );
      })}

      {/* Detection boxes (clickable) */}
      {detections.map((d, idx) => {
        const track = tracks[idx];
        const isSelected = selectedTrackId != null ? track?.trackId === selectedTrackId : idx === 0;
        const color = isSelected ? "hsl(var(--primary))" : "rgba(255,255,255,0.55)";
        return (
          <button
            key={`${d.id}:${idx}`}
            className="absolute z-10"
            style={{
              left: `${d.box.x}%`,
              top: `${d.box.y}%`,
              width: `${d.box.width}%`,
              height: `${d.box.height}%`,
              border: `2px solid ${color}`,
              background: "rgba(0,0,0,0.08)",
              pointerEvents: "auto",
            }}
            onClick={e => {
              e.stopPropagation();
              onSelectDetectionIndex(idx);
            }}
            title={`${d.className} ${(d.score * 100).toFixed(0)}%`}
          >
            <span className="sr-only">Select detection</span>
          </button>
        );
      })}

      {/* Overlay controls */}
      <div className="absolute left-3 top-3 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Mask</Badge>
          <Button
            size="sm"
            variant={drawMode ? "default" : "outline"}
            onClick={() => {
              setDrawMode(v => !v);
              setDraftPoints([]);
            }}
          >
            {drawMode ? "Drawing…" : "Draw polygon"}
          </Button>
          {detections.length > 0 && (
            <Button size="sm" variant="outline" className="gap-2" onClick={onAddMaskKeyframeFromDetection}>
              <Plus className="w-4 h-4" />
              From detection
            </Button>
          )}
        </div>

        {activeMask && (
          <div className="text-xs text-muted-foreground">
            Active: <span className="text-foreground">{activeMask.name}</span>
            {activeKeyframe ? (
              <span className="ml-2">KF @ {roundTo(activeKeyframe.atSeconds, 3)}s</span>
            ) : (
              <span className="ml-2">No keyframe at this time</span>
            )}
          </div>
        )}
      </div>

      {/* Polygon drawing */}
      {drawMode && (
        <div
          className="absolute inset-0 z-30"
          style={{ cursor: "crosshair" }}
          onPointerDown={e => {
            const container = containerRef.current;
            if (!container) return;
            const p = pointFromEvent(e, container);
            setDraftPoints(prev => [...prev, p].slice(0, 512));
          }}
          onDoubleClick={e => {
            e.preventDefault();
            commitPolygonToMask();
          }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {draftPoints.length >= 2 && (
              <path
                d={polygonToPath(draftPoints)}
                fill="rgba(255,255,255,0.05)"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {draftPoints.map((p, i) => (
              <circle
                key={i}
                cx={`${p.xPct}%`}
                cy={`${p.yPct}%`}
                r="4"
                fill="hsl(var(--primary))"
                opacity="0.9"
              />
            ))}
          </svg>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
            <div className="text-xs text-white/80 bg-black/40 px-2 py-1 rounded">
              Click to add points · Double-click to commit · Points: {draftPoints.length}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setDraftPoints([])}>
                Clear
              </Button>
              <Button size="sm" onClick={commitPolygonToMask} disabled={draftPoints.length < 3}>
                Commit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDrawMode(false);
                  setDraftPoints([]);
                }}
                aria-label="Cancel drawing"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

