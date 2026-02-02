import type { GitHubFile } from "@/lib/githubImageFetcher";
import { fetchImagesFromMultipleRepos, REPOSITORY_CONFIGS } from "@/lib/githubImageFetcher";
import type { BuildPositionsImportResult, PositionsImportItem } from "./types";
import {
  dedupeBySlug,
  ensureUniqueSlug,
  inferDifficultyFromTags,
  inferFlexibilityFromTags,
  inferIntimacyFromTags,
  normalizeCategory,
  slugify,
  uniq,
} from "./utils";

type ParsedFromPath = { name: string; categoryHint?: string; tags: string[] };

function stripExt(fileName: string): string {
  return String(fileName).replace(/\.[^/.]+$/, "");
}

function toTitleCase(value: string): string {
  return value
    .trim()
    .split(/[\s_-]+/g)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function parseFromPath(path: string): ParsedFromPath {
  const parts = String(path || "").split("/").filter(Boolean);
  const fileName = parts[parts.length - 1] ?? path;
  const dir = parts.length >= 2 ? parts[parts.length - 2] : undefined;
  const base = stripExt(fileName);
  const tokens = base
    .split(/[-_]+/g)
    .map(t => t.trim())
    .filter(t => t.length >= 2)
    .map(t => t.toLowerCase());
  return {
    name: toTitleCase(base),
    categoryHint: dir ? String(dir) : undefined,
    tags: uniq(tokens).slice(0, 24),
  };
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
  const tips: string[] = [
    "Use controlled movement and keep your core engaged to reduce joint strain.",
    "Consider warm-up stretching for hips and lower back if needed.",
    "Hydrate and take breaks as needed.",
  ];
  if (t.has("standing") || t.has("balance")) tips.unshift("Use a wall/chair for balance and reduce fall risk.");
  if (t.has("floor") || t.has("knees")) tips.unshift("Use a mat/blanket to protect knees and elbows.");
  return tips.slice(0, 8);
}

function defaultBenefits(tags: string[]): string[] {
  const t = new Set(tags.map(x => x.toLowerCase()));
  const benefits: string[] = [
    "Encourages communication and teamwork between partners.",
    "Can be adapted with props for comfort and accessibility.",
  ];
  if (t.has("standing")) benefits.push("Offers variation in height/angle without complex setup.");
  if (t.has("cuddle") || t.has("close") || t.has("romantic")) benefits.push("Supports closeness and eye contact.");
  return benefits.slice(0, 8);
}

export async function buildPositionsImportFromGitHubSources(): Promise<BuildPositionsImportResult> {
  const sources = [
    `github:${REPOSITORY_CONFIGS.RANDOM_SEX_POSITION.owner}/${REPOSITORY_CONFIGS.RANDOM_SEX_POSITION.repo}@${REPOSITORY_CONFIGS.RANDOM_SEX_POSITION.branch}`,
    `github:${REPOSITORY_CONFIGS.SEX_POSITIONS.owner}/${REPOSITORY_CONFIGS.SEX_POSITIONS.repo}@${REPOSITORY_CONFIGS.SEX_POSITIONS.branch}`,
  ];

  const files: GitHubFile[] = await fetchImagesFromMultipleRepos([
    REPOSITORY_CONFIGS.RANDOM_SEX_POSITION,
    REPOSITORY_CONFIGS.SEX_POSITIONS,
  ]);

  const usedSlugs = new Set<string>();
  const items: PositionsImportItem[] = [];

  for (const f of files) {
    const url = String(f.download_url || "").trim();
    if (!url) continue;
    const parsed = parseFromPath(f.path);
    const tags = uniq([slugify(parsed.categoryHint || ""), ...parsed.tags].filter(Boolean)).slice(0, 24);
    const category = normalizeCategory(parsed.categoryHint || "", tags);
    const difficulty = inferDifficultyFromTags(tags);
    const flexibility = inferFlexibilityFromTags(tags);
    const intimacy = inferIntimacyFromTags(tags);

    const positionName = parsed.name || "Untitled";
    const positionSlug = ensureUniqueSlug({ desired: `${positionName}-${category}`, used: usedSlugs });

    items.push({
      position_slug: positionSlug,
      position_name: positionName,
      description: "Illustrated position reference with safety-first guidance.",
      detailed_instructions: defaultInstructions().join("\n"),
      category,
      difficulty_level: difficulty,
      intimacy_level: intimacy,
      required_flexibility: flexibility,
      tags,
      benefits: defaultBenefits(tags),
      tips: defaultTips(tags),
      image_url_illustrated: url,
      thumbnail_url: url,
      is_premium: false,
      requires_dlc: true,
      is_active: true,
    });
  }

  const deduped = dedupeBySlug(items);
  for (let i = 0; i < deduped.length; i++) deduped[i]!.sort_order = i + 1;

  return { items: deduped, sources };
}

