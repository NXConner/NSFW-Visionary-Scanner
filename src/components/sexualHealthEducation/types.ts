import type {
  EducationModule,
  UserProgress,
  EducationQA,
  ExpertContent,
  ResearchUpdate,
  BookmarkContentType,
} from "@/lib/sexualHealthEducation";

export type SexualHealthEducationTab = "modules" | "qa" | "experts" | "research";

export type CategoryId =
  | "all"
  | "anatomy"
  | "function"
  | "conditions"
  | "treatment"
  | "prevention"
  | "wellness"
  | "relationships"
  | "myths";

export type CategoryOption = { id: CategoryId; label: string };

export type {
  EducationModule,
  UserProgress,
  EducationQA,
  ExpertContent,
  ResearchUpdate,
  BookmarkContentType,
};
