export interface Position {
  id: string;
  name: string;
  category: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  description: string;
  instructions: string[];
  benefits: string[];
  tips: string[];
  tags: string[];
  stimulationType: string[];
  requiredFlexibility: "low" | "medium" | "high";
  intimacyLevel: "low" | "medium" | "high";
  images?: string[];
  videos?: string[];
  gifs?: string[];
  animations?: string[];
}
