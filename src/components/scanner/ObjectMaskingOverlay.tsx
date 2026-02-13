import { useMemo } from "react";
import type { TrackedObject } from "@/hooks/useObjectTracking";

export type MaskingMode = "none" | "blur" | "darken" | "pixelate";

interface ObjectMaskingOverlayProps {
  /** All tracked objects */
  tracks: TrackedObject[];
  /** ID of the selected/focused track (null = no selection) */
  selectedTrackId: number | null;
  /** Masking mode for non-selected objects */
  maskingMode: MaskingMode;
  /** Opacity/intensity of the mask (0-100) */
  maskIntensity?: number;
  /** Whether to show a highlight border on selected object */
  showSelectionHighlight?: boolean;
}

/**
 * Overlay that masks (blurs, darkens, or pixelates) all objects except the selected one.
 * Great for focusing attention on a single tracked object.
 */
export function ObjectMaskingOverlay({
  tracks,
  selectedTrackId,
  maskingMode,
  maskIntensity = 60,
  showSelectionHighlight = true,
}: ObjectMaskingOverlayProps) {
  const selectedTrack = useMemo(
    () => (selectedTrackId != null ? tracks.find(t => t.trackId === selectedTrackId) : null),
    [tracks, selectedTrackId],
  );

  const otherTracks = useMemo(
    () => tracks.filter(t => t.trackId !== selectedTrackId),
    [tracks, selectedTrackId],
  );

  if (maskingMode === "none" || tracks.length === 0) return null;

  const getMaskStyle = (): React.CSSProperties => {
    switch (maskingMode) {
      case "blur":
        return {
          backdropFilter: `blur(${Math.round(maskIntensity / 10)}px)`,
          WebkitBackdropFilter: `blur(${Math.round(maskIntensity / 10)}px)`,
          background: `rgba(0, 0, 0, ${maskIntensity / 400})`,
        };
      case "darken":
        return {
          background: `rgba(0, 0, 0, ${maskIntensity / 100})`,
        };
      case "pixelate":
        // CSS pixelation approximation using blur + contrast
        return {
          backdropFilter: `blur(${Math.round(maskIntensity / 15)}px) contrast(1.2)`,
          WebkitBackdropFilter: `blur(${Math.round(maskIntensity / 15)}px) contrast(1.2)`,
          background: `rgba(0, 0, 0, ${maskIntensity / 500})`,
        };
      default:
        return {};
    }
  };

  const maskStyle = getMaskStyle();

  return (
    <div className="absolute inset-0 pointer-events-none z-25">
      {/* Mask over non-selected objects */}
      {otherTracks.map(track => (
        <div
          key={`mask-${track.trackId}`}
          className="absolute rounded-lg transition-all duration-200"
          style={{
            left: `${track.box.x}%`,
            top: `${track.box.y}%`,
            width: `${track.box.width}%`,
            height: `${track.box.height}%`,
            ...maskStyle,
          }}
        />
      ))}

      {/* Selection highlight on the tracked object */}
      {showSelectionHighlight && selectedTrack && (
        <div
          className="absolute rounded-lg transition-all duration-150"
          style={{
            left: `${selectedTrack.box.x}%`,
            top: `${selectedTrack.box.y}%`,
            width: `${selectedTrack.box.width}%`,
            height: `${selectedTrack.box.height}%`,
            border: "3px solid hsl(var(--primary))",
            boxShadow: "0 0 20px hsl(var(--primary) / 0.4), inset 0 0 10px hsl(var(--primary) / 0.1)",
          }}
        >
          {/* Corner brackets for selection emphasis */}
          <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-primary" />
          <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-primary" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-primary" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-primary" />

          {/* Tracking indicator */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full whitespace-nowrap">
            Tracking
          </div>
        </div>
      )}

      {/* Vignette effect when masking is active and an object is selected */}
      {selectedTrack && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at ${selectedTrack.box.x + selectedTrack.box.width / 2}% ${selectedTrack.box.y + selectedTrack.box.height / 2}%, transparent 20%, rgba(0,0,0,${maskIntensity / 300}) 80%)`,
          }}
        />
      )}
    </div>
  );
}
