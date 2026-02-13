/**
 * Shared types for NSFW Education modules
 * Used across Bondage/BDSM, Tantric, Kama Sutra, and other intimate education content
 */

export type EducationSectionId =
  | "overview"
  | "why"
  | "key-components"
  | "how-to"
  | "examples"
  | "benefits"
  | "pros-cons"
  | "differences"
  | "boundaries-safety"
  | "aftercare"
  | "faq"
  | "history"
  | "philosophy"
  | "techniques"
  | "positions"
  | "preparation"
  | "equipment"
  | "communication";

export type EducationTone =
  | "education"
  | "consent"
  | "communication"
  | "safety"
  | "spiritual"
  | "practical";

export interface EducationBullet {
  id: string;
  text: string;
  tone?: EducationTone;
}

export interface EducationCallout {
  id: string;
  title: string;
  body: string;
  tone: "note" | "warning" | "tip";
}

export interface EducationSection {
  id: EducationSectionId;
  title: string;
  summary?: string;
  bullets?: EducationBullet[];
  callouts?: EducationCallout[];
}

export interface EducationResource {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

export interface EducationContent {
  title: string;
  subtitle: string;
  contentRating: "18+";
  icon?: string;
  disclaimer: {
    title: string;
    body: string;
  };
  sections: EducationSection[];
  resources: EducationResource[];
}

export type NsfwEducationCategory =
  | "cock-worshiping"
  | "bondage-bdsm"
  | "tantric"
  | "kama-sutra"
  | "submissive";
