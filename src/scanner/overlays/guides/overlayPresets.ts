import type { OverlayPreset } from "../types";

export const overlayPresets: OverlayPreset[] = [
  {
    id: "classic-frame",
    name: "Classic frame",
    description: "Framing guide + safe margins for consistent capture.",
  },
  {
    id: "centerline",
    name: "Centerline",
    description: "Centerline + endpoints to align subject along main axis.",
  },
  {
    id: "ruler-guide",
    name: "Ruler calibration",
    description: "Guides for placing a reference object / ruler.",
  },
  {
    id: "multi-angle",
    name: "Multi-angle",
    description: "Angle prompts and symmetry hints for 3-angle capture.",
  },
];
