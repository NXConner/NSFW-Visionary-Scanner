import { useMemo } from "react";
import type { CameraSource, MaskTrack } from "@/lib/videoEditing";
import type { DetectedObject } from "@/hooks/useObjectDetection";
import type { TrackedObject } from "@/hooks/useObjectTracking";
import { MaskOverlay } from "@/components/videoEditing/multicam/MaskOverlay";
import type { VideoFilterState } from "./VideoFiltersPanel";
import type { FilterType } from "@/lib/imageFilters";

/**
 * Maps filter types to approximate CSS filter equivalents for preview.
 * Note: These are preview approximations - final render uses canvas processing.
 */
function getCssFilterForPreview(filterState: VideoFilterState): string {
  if (!filterState.enabled || !filterState.filterType) return "none";
  
  const { filterType, options } = filterState;
  
  switch (filterType) {
    case "celShading": {
      // Approximate with contrast and saturate
      const levels = options.levels ?? 4;
      const contrastBoost = 1 + (levels / 8) * 0.5;
      return `contrast(${contrastBoost}) saturate(1.2)`;
    }
    case "graphicNovel": {
      const contrast = options.contrast ?? 1.5;
      const saturation = options.saturation ?? 1.2;
      return `contrast(${contrast}) saturate(${saturation})`;
    }
    case "conceptArt": {
      const colorWash = options.colorWash ?? 0.4;
      const sepia = colorWash * 0.5;
      return `sepia(${sepia}) contrast(1.1)`;
    }
    case "inkedConceptArt": {
      // High contrast grayscale approximation
      const inkThickness = options.inkThickness ?? 2;
      const contrast = 1 + (inkThickness / 5) * 0.8;
      return `grayscale(0.8) contrast(${contrast})`;
    }
    case "sobel": {
      // Grayscale with high contrast for edge approximation
      const threshold = options.threshold ?? 50;
      const contrast = 1 + (200 - threshold) / 200;
      return `grayscale(1) contrast(${contrast * 2})`;
    }
    default:
      return "none";
  }
}

export function PreviewStage(props: {
  sources: CameraSource[];
  activeCameraIndex: number;
  registerVideoEl: (cameraIndex: number, el: HTMLVideoElement | null) => void;
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
  filterState?: VideoFilterState;
}): JSX.Element {
  const {
    sources,
    activeCameraIndex,
    registerVideoEl,
    playheadSeconds,
    durationSeconds,
    masks,
    activeMaskId,
    onSelectMask,
    onUpsertMask,
    detections,
    tracks,
    selectedTrackId,
    onSelectDetectionIndex,
    onAddMaskKeyframeFromDetection,
    filterState,
  } = props;

  const cssFilter = useMemo(() => {
    if (!filterState) return "none";
    return getCssFilterForPreview(filterState);
  }, [filterState]);

  return (
    <div className="relative bg-black">
      {sources.map(s => (
        <video
          key={s.cameraIndex}
          ref={el => registerVideoEl(s.cameraIndex, el)}
          src={s.videoUrl}
          playsInline
          muted
          preload="metadata"
          className="absolute inset-0 w-full h-full object-contain"
          style={{
            opacity: s.cameraIndex === activeCameraIndex ? 1 : 0,
            transition: "opacity 120ms ease, filter 200ms ease",
            filter: s.cameraIndex === activeCameraIndex ? cssFilter : "none",
          }}
        />
      ))}

      {/* Filter indicator badge */}
      {filterState?.enabled && filterState.filterType && (
        <div className="absolute top-2 right-2 z-10 px-2 py-1 text-xs bg-primary/80 text-primary-foreground rounded">
          {filterState.filterType} (preview)
        </div>
      )}

      <MaskOverlay
        playheadSeconds={playheadSeconds}
        durationSeconds={durationSeconds}
        masks={masks}
        activeMaskId={activeMaskId}
        onSelectMask={onSelectMask}
        onUpsertMask={onUpsertMask}
        detections={detections}
        tracks={tracks}
        selectedTrackId={selectedTrackId}
        onSelectDetectionIndex={onSelectDetectionIndex}
        onAddMaskKeyframeFromDetection={onAddMaskKeyframeFromDetection}
      />
    </div>
  );
}
