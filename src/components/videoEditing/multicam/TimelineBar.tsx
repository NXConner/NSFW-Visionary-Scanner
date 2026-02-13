import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { CameraSwitchEvent } from "@/lib/videoEditing";
import { clamp, formatTimecode, roundTo } from "@/lib/videoEditing";

function pct(atSeconds: number, durationSeconds: number): number {
  if (!durationSeconds) return 0;
  return clamp((atSeconds / durationSeconds) * 100, 0, 100);
}

export function TimelineBar(props: {
  durationSeconds: number;
  playheadSeconds: number;
  cameraSwitches: CameraSwitchEvent[];
  onSeek: (t: number) => void;
  onUpdateSwitch: (next: CameraSwitchEvent) => void;
  onDeleteSwitch: (id: string) => void;
}): JSX.Element {
  const { durationSeconds, playheadSeconds, cameraSwitches, onSeek, onUpdateSwitch, onDeleteSwitch } =
    props;

  const barRef = useRef<HTMLDivElement | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...cameraSwitches].sort((a, b) => a.atSeconds - b.atSeconds),
    [cameraSwitches],
  );

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const el = barRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = clamp(clientX - r.left, 0, r.width || 1);
      const t = durationSeconds ? (x / (r.width || 1)) * durationSeconds : 0;
      onSeek(t);
    },
    [durationSeconds, onSeek],
  );

  const timeFromClientX = useCallback(
    (clientX: number) => {
      const el = barRef.current;
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      const x = clamp(clientX - r.left, 0, r.width || 1);
      const t = durationSeconds ? (x / (r.width || 1)) * durationSeconds : 0;
      return roundTo(t, 3);
    },
    [durationSeconds],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragId) return;
      const t = timeFromClientX(e.clientX);
      const item = sorted.find(s => s.id === dragId);
      if (!item) return;
      onUpdateSwitch({ ...item, atSeconds: t });
    },
    [dragId, onUpdateSwitch, sorted, timeFromClientX],
  );

  const onPointerUp = useCallback(() => {
    setDragId(null);
  }, []);

  const attachWindowDrag = useCallback(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  }, [onPointerMove, onPointerUp]);

  const detachWindowDrag = useCallback(() => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove, onPointerUp]);

  useEffect(() => {
    return () => detachWindowDrag();
  }, [detachWindowDrag]);

  return (
    <div className="p-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="text-xs text-muted-foreground">
          Timeline · {formatTimecode(playheadSeconds)} / {formatTimecode(durationSeconds)}
        </div>
        <div className="text-xs text-muted-foreground">{sorted.length} switches</div>
      </div>

      <div
        ref={barRef}
        className="relative h-12 rounded-md border border-border/60 bg-muted/20 overflow-hidden"
        onClick={e => seekFromClientX(e.clientX)}
        role="button"
        tabIndex={0}
        aria-label="Timeline seek bar"
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            // Seek to current pointer position approximation (center of bar) when keyboard-triggered.
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            seekFromClientX(rect.left + rect.width / 2);
          }
        }}
      >
        {/* playhead */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-primary"
          style={{ left: `${pct(playheadSeconds, durationSeconds)}%` }}
        />

        {/* switches */}
        {sorted.map(s => (
          <div
            key={s.id}
            className="absolute top-0 bottom-0 flex items-center"
            style={{ left: `${pct(s.atSeconds, durationSeconds)}%` }}
          >
            <div className="flex items-center gap-1 -translate-x-1/2">
              <button
                className="h-8 w-8 rounded bg-background/80 border border-border/70 hover:bg-background shadow-sm"
                title={`${formatTimecode(s.atSeconds)} · Cam ${s.cameraIndex + 1}`}
                onClick={e => {
                  e.stopPropagation();
                  onSeek(s.atSeconds);
                }}
                onPointerDown={e => {
                  e.stopPropagation();
                  setDragId(s.id);
                  attachWindowDrag();
                }}
              >
                <div className="text-[10px] font-mono leading-none">
                  C{s.cameraIndex + 1}
                </div>
              </button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={e => {
                  e.stopPropagation();
                  onDeleteSwitch(s.id);
                }}
                aria-label="Delete switch"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

