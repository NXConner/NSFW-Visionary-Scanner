export type Position = {
  id: string;
  name: string;
  category: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  description: string;
  summary?: string;
  instructions: string[];
  benefits: string[];
  tips: string[];
  tags: string[];
  stimulationType: string[];
  requiredFlexibility: "low" | "medium" | "high";
  intimacyLevel: "low" | "medium" | "high";
  images?: string[];
  gifs?: string[];
  videos?: string[];
  animations?: string[];
};

export type DbDifficulty = "beginner" | "intermediate" | "advanced" | "expert" | null;
export type DbFlexibility = "none" | "some" | "moderate" | "high" | null;
export type DbIntimacy = "low" | "medium" | "high" | "very_high" | null;

export type DbPositionRow = {
  id: string;
  position_name: string;
  position_slug: string;
  description: string | null;
  detailed_instructions: string | null;
  category: string | null;
  difficulty_level: DbDifficulty;
  intimacy_level: DbIntimacy;
  required_flexibility: DbFlexibility;
  tags: string[] | null;
  benefits: string[] | null;
  tips: string[] | null;
  variations: string[] | null;
  image_url: string | null;
  image_url_illustrated: string | null;
  thumbnail_url: string | null;
  video_tutorial_url: string | null;
  animation_url: string | null;
  is_active: boolean | null;
};

export function mapDifficulty(d: DbDifficulty): Position["difficulty"] {
  if (d === "expert") return "expert";
  if (d === "advanced") return "hard";
  if (d === "intermediate") return "medium";
  return "easy";
}

export function mapFlexibility(f: DbFlexibility): Position["requiredFlexibility"] {
  if (f === "high") return "high";
  if (f === "moderate") return "medium";
  return "low";
}

export function mapIntimacy(i: DbIntimacy): Position["intimacyLevel"] {
  if (i === "very_high") return "high";
  if (i === "high") return "high";
  if (i === "medium") return "medium";
  return "low";
}

export function splitInstructions(text: string | null): string[] {
  if (!text) return [];
  const normalized = String(text).replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const lines = normalized
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);
  if (lines.length === 1) return [lines[0]];
  return lines;
}

export function defaultInstructions(): string[] {
  return [
    "Confirm mutual consent and boundaries before starting.",
    "Use a stable surface; add pillows/bolsters for comfort and support.",
    "Start slowly, communicate often, and adjust angles to avoid strain.",
    "Stop immediately if there is pain, numbness, dizziness, or discomfort.",
  ];
}

export function defaultTips(): string[] {
  return [
    "Use controlled movement and keep your core engaged to reduce joint strain.",
    "Consider warm-up stretching for hips and lower back if needed.",
    "Hydrate and take breaks as needed.",
  ];
}

export function defaultBenefits(): string[] {
  return [
    "Encourages communication and teamwork between partners.",
    "Can be adapted with props for comfort and accessibility.",
  ];
}

export function deriveStimulation(tags: string[], category: string): string[] {
  const out = new Set<string>();
  out.add("Connection & intimacy");
  const t = new Set(tags.map(x => x.toLowerCase()));
  if (category.toLowerCase().includes("tantric") || t.has("tantric")) out.add("Mindfulness");
  if (t.has("standing") || t.has("balance") || category.toLowerCase().includes("acrobatic"))
    out.add("Full-body engagement");
  if (t.has("gentle") || t.has("slow") || category.toLowerCase().includes("romantic"))
    out.add("Low intensity");
  return Array.from(out).slice(0, 6);
}
