import { nsfwPositionImagesAll } from "./generated";
import type {
  NSFWPosition,
  PositionDifficulty,
  PositionFlexibility,
  PositionIntimacy,
} from "./types";

function normalizeCategory(value?: string): string {
  const v = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return v || "misc";
}

function inferDifficulty(tags: string[]): PositionDifficulty {
  const t = new Set(tags.map(x => x.toLowerCase()));
  if (t.has("expert") || t.has("advanced") || t.has("hard")) return "hard";
  if (t.has("medium") || t.has("intermediate")) return "medium";
  if (t.has("easy") || t.has("beginner")) return "easy";
  return "medium";
}

function inferFlexibility(tags: string[]): PositionFlexibility {
  const t = new Set(tags.map(x => x.toLowerCase()));
  if (t.has("flexible") || t.has("stretch") || t.has("acrobatic")) return "high";
  if (t.has("standing") || t.has("squat") || t.has("balance")) return "medium";
  return "low";
}

function inferIntimacy(tags: string[]): PositionIntimacy {
  const t = new Set(tags.map(x => x.toLowerCase()));
  if (t.has("romantic") || t.has("close") || t.has("cuddle")) return "high";
  if (t.has("slow") || t.has("gentle")) return "medium";
  return "medium";
}

function defaultInstructions(): string[] {
  return [
    "Confirm mutual consent and boundaries before starting.",
    "Use a stable surface; add pillows/bolsters for comfort and support.",
    "Start slowly, communicate often, and adjust angles to avoid strain.",
    "Stop immediately if there is pain, numbness, dizziness, or discomfort.",
  ];
}

function defaultTips(tags: string[]): string[] {
  const t = new Set(tags.map(x => x.toLowerCase()));
  const tips = [
    "Use controlled movement and keep your core engaged to reduce joint strain.",
    "Keep a towel/wipes nearby and hydrate if this is a longer session.",
    "Consider warm-up stretching for hips and lower back if needed.",
  ];
  if (t.has("standing")) tips.unshift("Use a wall/chair for balance and reduce fall risk.");
  if (t.has("floor")) tips.unshift("Use a mat/blanket to protect knees and elbows.");
  return tips.slice(0, 6);
}

function defaultBenefits(tags: string[]): string[] {
  const t = new Set(tags.map(x => x.toLowerCase()));
  const benefits = [
    "Encourages communication and teamwork between partners.",
    "Can be adapted with props for comfort and accessibility.",
  ];
  if (t.has("standing")) benefits.push("Offers variation in height/angle without complex setup.");
  if (t.has("cuddle") || t.has("close")) benefits.push("Supports closeness and eye contact.");
  return benefits.slice(0, 6);
}

function deriveStimulationType(tags: string[]): string[] {
  // Keep this deliberately general / non-explicit.
  const t = new Set(tags.map(x => x.toLowerCase()));
  const out = new Set<string>();
  out.add("Connection & intimacy");
  if (t.has("standing") || t.has("balance")) out.add("Full-body engagement");
  if (t.has("slow") || t.has("gentle")) out.add("Low intensity");
  if (t.has("acrobatic") || t.has("flexible")) out.add("High intensity");
  return Array.from(out).slice(0, 6);
}

export function getGeneratedNsfwPositionsFromGitHubImages(): NSFWPosition[] {
  return nsfwPositionImagesAll.map(img => {
    const tags = Array.isArray(img.tags) ? img.tags : [];
    const category = normalizeCategory(img.category);
    const name = String(img.name || "Untitled").trim();
    const difficulty = inferDifficulty(tags);
    const requiredFlexibility = inferFlexibility(tags);
    const intimacyLevel = inferIntimacy(tags);

    const position: NSFWPosition = {
      id: img.key,
      name,
      category,
      difficulty,
      description: "Illustrated position reference with safety-first guidance.",
      summary: "Explore variations, save favorites, and attach your own media.",
      instructions: defaultInstructions(),
      benefits: defaultBenefits(tags),
      tips: defaultTips(tags),
      tags: Array.from(new Set([category, ...tags])).slice(0, 24),
      stimulationType: deriveStimulationType(tags),
      requiredFlexibility,
      intimacyLevel,
      images: [img.url],
      source: { kind: "github-images", key: img.key, path: img.path },
    };

    return position;
  });
}
