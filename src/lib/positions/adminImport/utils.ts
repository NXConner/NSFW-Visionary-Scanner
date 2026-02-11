import type {
  PositionsImportCategory,
  PositionsImportDifficulty,
  PositionsImportFlexibility,
  PositionsImportIntimacy,
} from "./types";

export function slugify(input: string): string {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function safeArray(value: unknown, max = 64): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(x => String(x || "").trim())
    .filter(Boolean)
    .slice(0, Math.max(0, max));
}

export function inferDifficultyFromTags(tags: string[]): PositionsImportDifficulty | null {
  const t = new Set(tags.map(x => x.toLowerCase()));
  if (t.has("expert")) return "expert";
  if (t.has("advanced") || t.has("hard")) return "advanced";
  if (t.has("intermediate") || t.has("medium")) return "intermediate";
  if (t.has("beginner") || t.has("easy")) return "beginner";
  return null;
}

export function inferFlexibilityFromTags(tags: string[]): PositionsImportFlexibility | null {
  const t = new Set(tags.map(x => x.toLowerCase()));
  if (t.has("acrobatic") || t.has("flexible") || t.has("stretch")) return "high";
  if (t.has("balance") || t.has("standing") || t.has("squat")) return "moderate";
  if (t.has("some") || t.has("moderate")) return "some";
  return null;
}

export function inferIntimacyFromTags(tags: string[]): PositionsImportIntimacy | null {
  const t = new Set(tags.map(x => x.toLowerCase()));
  if (t.has("very_high")) return "very_high";
  if (t.has("high") || t.has("romantic") || t.has("close") || t.has("cuddle")) return "high";
  if (t.has("medium") || t.has("gentle") || t.has("slow")) return "medium";
  if (t.has("low")) return "low";
  return null;
}

export function normalizeCategory(raw: string, tags: string[] = []): PositionsImportCategory {
  const s = `${raw || ""}`.toLowerCase();
  const t = new Set(tags.map(x => x.toLowerCase()));
  if (s.includes("tantric") || t.has("tantric")) return "tantric";
  if (s.includes("kama") || s.includes("sutra") || t.has("kamasutra") || t.has("kama"))
    return "kama_sutra";
  if (s.includes("acro") || t.has("acrobatic")) return "acrobatic";
  if (s.includes("rom") || t.has("romantic") || t.has("cuddle")) return "romantic";
  if (s.includes("quick") || t.has("quickie")) return "quickie";
  if (s.includes("oral") || t.has("oral")) return "oral";
  if (s.includes("manual") || t.has("manual")) return "manual";
  if (s.includes("modern")) return "modern";
  if (s.includes("advanced") || t.has("advanced") || t.has("expert")) return "advanced";
  return "classic";
}

export function dedupeBySlug<T extends { position_slug: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const slug = String(it.position_slug || "").trim();
    if (!slug) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push(it);
  }
  return out;
}

export function ensureUniqueSlug(params: { desired: string; used: Set<string> }): string {
  const base = slugify(params.desired) || "position";
  if (!params.used.has(base)) {
    params.used.add(base);
    return base;
  }
  for (let i = 2; i < 10000; i++) {
    const next = `${base}-${i}`;
    if (!params.used.has(next)) {
      params.used.add(next);
      return next;
    }
  }
  // fall back: should never happen
  const fallback = `${base}-${Date.now()}`;
  params.used.add(fallback);
  return fallback;
}
