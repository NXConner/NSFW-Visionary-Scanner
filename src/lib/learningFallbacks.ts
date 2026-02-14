export type ModuleFallbackInput = {
  title: string;
  description?: string | null;
  category?: string | null;
  difficultyLevel?: string | null;
  estimatedMinutes?: number | null;
};

export type LessonFallbackInput = {
  title: string;
  contentType?: string | null;
  estimatedMinutes?: number | null;
  moduleTitle?: string | null;
};

export type FallbackSection = {
  title: string;
  bullets: string[];
  note?: string;
};

export type FallbackContent = {
  summary: string;
  sections: FallbackSection[];
};

function normalize(value: unknown): string {
  return String(value ?? "").trim();
}

function toLabel(value: string | null | undefined, fallback: string): string {
  const v = normalize(value);
  return v || fallback;
}

function formatMinutes(minutes?: number | null): string | null {
  const n = Number(minutes ?? 0);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 60) return `${Math.round(n)} min`;
  const hrs = Math.floor(n / 60);
  const mins = Math.round(n % 60);
  return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
}

export function buildModuleFallback(input: ModuleFallbackInput): FallbackContent {
  const topic = toLabel(input.category, "Uncategorized");
  const difficulty = toLabel(input.difficultyLevel, "Unspecified");
  const duration = formatMinutes(input.estimatedMinutes);

  const summaryParts: string[] = [];
  const description = normalize(input.description);
  if (description) summaryParts.push(description);

  // Do not generate “fake” educational content. Be explicit when content isn't published yet.
  summaryParts.push("This module content is not available yet.");
  summaryParts.push(`Category: ${topic}.`);
  summaryParts.push(`Difficulty: ${difficulty}.`);
  if (duration) summaryParts.push(`Estimated time: ${duration}.`);

  return {
    summary: summaryParts.join(" "),
    sections: [],
  };
}

export function buildLessonFallback(input: LessonFallbackInput): FallbackContent {
  const contentType = normalize(input.contentType || "guide");
  const duration = formatMinutes(input.estimatedMinutes);
  const moduleLabel = toLabel(input.moduleTitle, "this module");

  const summaryParts = [
    "This lesson content is not available yet.",
    `Module: ${moduleLabel}.`,
    `Format: ${contentType}.`,
  ];
  if (duration) summaryParts.push(`Estimated time: ${duration}.`);

  return {
    summary: summaryParts.join(" "),
    sections: [],
  };
}
