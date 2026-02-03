import type { DLCFeature } from "../types";

export const ADVANCED_NSFW_DETECTION_FEATURES: DLCFeature[] = [
  {
    id: "advanced_nsfw_detection",
    name: "Advanced NSFW Detection",
    description: "Multi-model ensemble detection with confidence scoring.",
    icon: "Shield",
    category: "advanced",
  },
  {
    id: "nsfw_detection_history",
    name: "Detection History",
    description: "Optional detection history with anonymized metadata.",
    icon: "History",
    category: "advanced",
  },
  {
    id: "nsfw_detection_controls",
    name: "Detection Controls",
    description: "Granular thresholds and model selection controls.",
    icon: "Sliders",
    category: "advanced",
  },
];
