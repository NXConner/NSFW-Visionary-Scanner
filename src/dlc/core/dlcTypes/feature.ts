export type DLCFeatureCategory =
  | "positions"
  | "videos"
  | "analytics"
  | "community"
  | "advanced"
  | "topics"
  | "marketplace";

export type DLCFeature = {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: DLCFeatureCategory;
};

