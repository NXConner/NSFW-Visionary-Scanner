export type PositionDifficulty = "easy" | "medium" | "hard" | "expert";
export type PositionFlexibility = "low" | "medium" | "high";
export type PositionIntimacy = "low" | "medium" | "high";

export type NSFWPosition = {
  /** Stable string id (safe to store in localStorage as-is) */
  id: string;
  name: string;
  category: string;
  difficulty: PositionDifficulty;
  description: string;
  summary?: string;

  instructions: string[];
  benefits: string[];
  tips: string[];
  tags: string[];
  stimulationType: string[];
  requiredFlexibility: PositionFlexibility;
  intimacyLevel: PositionIntimacy;

  images?: string[];
  gifs?: string[];
  videos?: string[];
  animations?: string[];
  /** Optional provenance for transparency/debugging */
  source?: {
    kind: "github-images";
    key: string;
    path: string;
  };
};
