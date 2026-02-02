import { allPositions } from "@/data/positionsData/allPositions";
import type { BuildPositionsImportResult, PositionsImportItem } from "./types";
import {
  dedupeBySlug,
  ensureUniqueSlug,
  inferDifficultyFromTags,
  inferFlexibilityFromTags,
  inferIntimacyFromTags,
  normalizeCategory,
  uniq,
} from "./utils";

function joinLines(lines: string[] | undefined): string | null {
  const out = (lines || []).map(s => String(s || "").trim()).filter(Boolean);
  if (out.length === 0) return null;
  return out.join("\n");
}

function baselineDescription(category: string): string {
  const c = String(category || "").toLowerCase();
  if (c.includes("tantric")) return "Mindful, connection-focused position guidance.";
  if (c.includes("oral")) return "Oral-focused position guidance with comfort tips.";
  if (c.includes("furniture") || c.includes("assisted"))
    return "Prop-assisted position guidance for comfort and accessibility.";
  return "Position guidance with safety-first, comfort-forward tips.";
}

export async function buildPositionsImportFromBuiltInGuides(): Promise<BuildPositionsImportResult> {
  const sources = ["built-in:src/data/positionsData/*"];
  const usedSlugs = new Set<string>();
  const items: PositionsImportItem[] = [];

  for (const p of allPositions) {
    const name = String(p.name || "").trim();
    if (!name) continue;

    const tags = uniq([String(p.category || ""), ...(p.tags || [])].map(x => String(x || "").trim()).filter(Boolean)).slice(
      0,
      24,
    );
    const category = normalizeCategory(String(p.category || ""), tags);
    const difficulty = inferDifficultyFromTags([p.difficulty, ...tags]);
    const flexibility = inferFlexibilityFromTags([p.requiredFlexibility, ...tags]);
    const intimacy = inferIntimacyFromTags([p.intimacyLevel, ...tags]);

    const slug = ensureUniqueSlug({ desired: `${name}-${category}`, used: usedSlugs });

    items.push({
      position_slug: slug,
      position_name: name,
      description: String(p.description || baselineDescription(p.category)),
      detailed_instructions: joinLines(p.instructions),
      category,
      difficulty_level: difficulty,
      intimacy_level: intimacy,
      required_flexibility: flexibility,
      tags,
      benefits: (p.benefits || []).map(x => String(x || "").trim()).filter(Boolean).slice(0, 16),
      tips: (p.tips || []).map(x => String(x || "").trim()).filter(Boolean).slice(0, 16),
      // Built-in guide data is text-first; media can be attached later via admin uploads or overrides.
      image_url: null,
      image_url_illustrated: null,
      thumbnail_url: null,
      is_premium: false,
      requires_dlc: true,
      is_active: true,
    });
  }

  const deduped = dedupeBySlug(items);
  for (let i = 0; i < deduped.length; i++) deduped[i]!.sort_order = i + 1;

  return { items: deduped, sources };
}

