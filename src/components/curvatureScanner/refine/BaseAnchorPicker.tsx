import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { mapObjectContainTapToImagePx } from "./tapToImagePx";

/**
 * User-assisted anchoring:
 * Click the base region on the captured image. We use that click to decide which end of the
 * extracted centerline is the base, then compute a base-relative angle.
 */
export function BaseAnchorPicker({
  imageDataUrl,
  onPick,
  onCancel,
}: {
  imageDataUrl: string;
  onPick: (pt: { xPx: number; yPx: number; xPct: number; yPct: number }) => void;
  onCancel: () => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [naturalSize, setNaturalSize] = React.useState<{ w: number; h: number } | null>(null);
  const [kbdPct, setKbdPct] = React.useState<{ xPct: number; yPct: number }>({ xPct: 50, yPct: 82 });

  return (
    <div ref={containerRef} className="absolute inset-0 z-30">
      <button
        type="button"
        className="absolute inset-0"
        onClick={e => {
          const container = containerRef.current;
          if (!container || !naturalSize) return;
          const rect = container.getBoundingClientRect();
          const mapped = mapObjectContainTapToImagePx({
            containerRect: rect,
            naturalWidth: naturalSize.w,
            naturalHeight: naturalSize.h,
            clientX: e.clientX,
            clientY: e.clientY,
          });
          if (mapped.kind === "miss") return;
          onPick({ xPx: mapped.xPx, yPx: mapped.yPx, xPct: mapped.xPct, yPct: mapped.yPct });
        }}
        onKeyDown={e => {
          if (!naturalSize) return;
          const step = e.shiftKey ? 5 : 2;
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            setKbdPct(p => ({ xPct: Math.max(0, p.xPct - step), yPct: p.yPct }));
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            setKbdPct(p => ({ xPct: Math.min(100, p.xPct + step), yPct: p.yPct }));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setKbdPct(p => ({ xPct: p.xPct, yPct: Math.max(0, p.yPct - step) }));
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setKbdPct(p => ({ xPct: p.xPct, yPct: Math.min(100, p.yPct + step) }));
          } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const xPx = (kbdPct.xPct / 100) * naturalSize.w;
            const yPx = (kbdPct.yPct / 100) * naturalSize.h;
            onPick({ xPx, yPx, xPct: kbdPct.xPct, yPct: kbdPct.yPct });
          }
        }}
        aria-label="Pick base point. Click/tap to choose, or use arrow keys then press Enter."
      >
        <img
          src={imageDataUrl}
          alt="Pick base"
          className="w-full h-full object-contain"
          onLoad={e => {
            const img = e.currentTarget;
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
            }
          }}
        />
      </button>

      <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 w-[min(640px,92%)]">
        <div className="rounded-xl border border-border/50 bg-background/70 backdrop-blur px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium">Tap the base location</div>
            <Badge variant="outline" className="bg-background/60">
              refine
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Tap where the object meets the baseline. Keyboard: arrow keys move selection, Enter confirms.
          </div>
        </div>
      </div>

      <button
        type="button"
        className="absolute bottom-3 right-3 rounded-lg border border-border/50 bg-background/70 backdrop-blur px-3 py-2 text-xs"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}

