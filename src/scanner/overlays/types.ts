export type OverlayPresetId = "classic-frame" | "centerline" | "ruler-guide" | "multi-angle";

export interface OverlayPreset {
  id: OverlayPresetId;
  name: string;
  description: string;
}

