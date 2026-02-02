/**
 * Positions Module Types
 */

export interface Position {
  id: string;
  name: string;
  category: PositionCategory;
  difficulty: PositionDifficulty;
  description: string;
  instructions: string[];
  benefits: string[];
  tips: string[];
  tags: string[];
  stimulationType: string[];
  requiredFlexibility: FlexibilityLevel;
  intimacyLevel: IntimacyLevel;
  images?: string[];
  videos?: string[];
  gifs?: string[];
  animations?: string[];
}

export type PositionCategory =
  | "classic"
  | "partner-on-top"
  | "rear-entry"
  | "side-by-side"
  | "standing"
  | "sitting"
  | "side-entry"
  | "athletic"
  | "oral"
  | "tantric"
  | "oral-variations"
  | "furniture-assisted";

export type PositionDifficulty = "easy" | "medium" | "hard" | "expert";
export type FlexibilityLevel = "low" | "medium" | "high";
export type IntimacyLevel = "low" | "medium" | "high";

export interface PositionFilter {
  category?: PositionCategory[];
  difficulty?: PositionDifficulty[];
  flexibility?: FlexibilityLevel[];
  intimacy?: IntimacyLevel[];
  tags?: string[];
  search?: string;
}

export interface PositionPlaylist {
  id: string;
  name: string;
  description?: string;
  positionIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PositionFavorite {
  positionId: string;
  addedAt: Date;
  notes?: string;
  rating?: number;
}

export interface PositionsState {
  positions: Position[];
  favorites: string[];
  playlists: PositionPlaylist[];
  filters: PositionFilter;
  selectedPosition?: Position;
  isLoading: boolean;
  error: string | null;
}
