export type CockWorshipingSectionId =
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
  | "faq";

export type CockWorshipingTone = "education" | "consent" | "communication" | "safety";

export interface CockWorshipingBullet {
  id: string;
  text: string;
  tone?: CockWorshipingTone;
}

export interface CockWorshipingCallout {
  id: string;
  title: string;
  body: string;
  tone: "note" | "warning" | "tip";
}

export interface CockWorshipingSection {
  id: CockWorshipingSectionId;
  title: string;
  summary?: string;
  bullets?: CockWorshipingBullet[];
  callouts?: CockWorshipingCallout[];
}

export interface CockWorshipingResource {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

export interface CockWorshipingContent {
  title: string;
  subtitle: string;
  contentRating: "18+";
  disclaimer: {
    title: string;
    body: string;
  };
  sections: CockWorshipingSection[];
  resources: CockWorshipingResource[];
}

