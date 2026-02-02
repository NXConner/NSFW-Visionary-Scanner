export type HealthTopicCategory = "curvature" | "sti" | "infection" | "skin" | "general";
export type HealthTopicSeverity = "informational" | "mild" | "moderate" | "serious";

export interface HealthTopicFaq {
  question: string;
  answer: string;
}

export interface HealthTopic {
  id: string;
  title: string;
  category: HealthTopicCategory;
  severity: HealthTopicSeverity;
  overview: string;
  causes: string[];
  symptoms: string[];
  diagnosis: string;
  treatment: string[];
  prevention: string[];
  whenToSeeDoctor: string[];
  faqs: HealthTopicFaq[];
}
