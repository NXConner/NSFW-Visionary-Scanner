export type PositionsImportCategory =
  | "classic"
  | "advanced"
  | "tantric"
  | "kama_sutra"
  | "modern"
  | "acrobatic"
  | "romantic"
  | "quickie"
  | "oral"
  | "manual";

export type PositionsImportDifficulty = "beginner" | "intermediate" | "advanced" | "expert";
export type PositionsImportFlexibility = "none" | "some" | "moderate" | "high";
export type PositionsImportIntimacy = "low" | "medium" | "high" | "very_high";

export type PositionsImportItem = {
  position_slug: string;
  position_name: string;
  description: string;
  detailed_instructions?: string | null;
  category: PositionsImportCategory;
  difficulty_level?: PositionsImportDifficulty | null;
  intimacy_level?: PositionsImportIntimacy | null;
  required_flexibility?: PositionsImportFlexibility | null;
  tags?: string[];
  benefits?: string[];
  tips?: string[];
  image_url?: string | null;
  image_url_illustrated?: string | null;
  thumbnail_url?: string | null;
  video_tutorial_url?: string | null;
  animation_url?: string | null;
  sort_order?: number;
  is_premium?: boolean;
  requires_dlc?: boolean;
  is_active?: boolean;
};

export type BuildPositionsImportResult = {
  items: PositionsImportItem[];
  sources: string[];
};
