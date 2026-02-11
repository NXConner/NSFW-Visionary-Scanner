export type MemoryCategory =
  | "identity"
  | "preference"
  | "boundary"
  | "relationship"
  | "tone"
  | "other";

export type MemoryCue = {
  key: string;
  value: string;
  category: MemoryCategory;
  lastMentionedAt: string;
  confidence: number;
};

type MemoryPattern = {
  key: string;
  category: MemoryCategory;
  regex: RegExp;
  group?: number;
  confidence: number;
};

const MEMORY_PATTERNS: MemoryPattern[] = [
  {
    key: "name",
    category: "identity",
    regex: /\bmy name is ([a-z][a-z' ]{1,32})\b/i,
    group: 1,
    confidence: 0.85,
  },
  {
    key: "name",
    category: "identity",
    regex: /\bcall me ([a-z][a-z' ]{1,32})\b/i,
    group: 1,
    confidence: 0.8,
  },
  {
    key: "pronouns",
    category: "identity",
    regex: /\bmy pronouns are ([a-z/\s]{2,30})\b/i,
    group: 1,
    confidence: 0.7,
  },
  {
    key: "likes",
    category: "preference",
    regex:
      /\b(?:i|i really)\s+(?:like|love|enjoy|prefer|am into|want|fantasize about)\s+([^.!?\n]{3,80})/i,
    group: 1,
    confidence: 0.6,
  },
  {
    key: "ok_with",
    category: "preference",
    regex: /\bi(?:'m| am)\s+(?:ok|okay)\s+with\s+([^.!?\n]{3,80})/i,
    group: 1,
    confidence: 0.6,
  },
  {
    key: "avoid",
    category: "boundary",
    regex:
      /\b(?:i|i really)\s+(?:do not like|don't like|dislike|hate|am not into|do not want)\s+([^.!?\n]{3,80})/i,
    group: 1,
    confidence: 0.7,
  },
  {
    key: "boundaries",
    category: "boundary",
    regex: /\bmy boundaries (?:are|include)\s+([^.!?\n]{3,80})/i,
    group: 1,
    confidence: 0.8,
  },
  {
    key: "not_ok_with",
    category: "boundary",
    regex: /\bi(?:'m| am)\s+not\s+ok(?:ay)?\s+with\s+([^.!?\n]{3,80})/i,
    group: 1,
    confidence: 0.8,
  },
  {
    key: "safe_word",
    category: "boundary",
    regex: /\bmy safe word is\s+([a-z0-9](?:[a-z0-9]|-){1,19})\b/i,
    group: 1,
    confidence: 0.9,
  },
  {
    key: "relationship_status",
    category: "relationship",
    regex: /\bi am\s+(single|married|in a relationship|seeing someone|engaged)\b/i,
    group: 1,
    confidence: 0.6,
  },
  {
    key: "tone",
    category: "tone",
    regex: /\bplease be\s+(gentle|slow|soft|firm|direct|playful|romantic)\b/i,
    group: 1,
    confidence: 0.6,
  },
];

function cleanPhrase(value: string): string {
  let cleaned = String(value || "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const trimChars = new Set(['"', "'", ":", " "]);
  while (cleaned && trimChars.has(cleaned[0])) {
    cleaned = cleaned.slice(1);
  }
  while (cleaned && trimChars.has(cleaned[cleaned.length - 1])) {
    cleaned = cleaned.slice(0, -1);
  }
  cleaned = cleaned.replace(/^-+/, "").replace(/-+$/, "");
  return cleaned.trim().slice(0, 120);
}

export function extractMemoryCues(message: string, nowIso: string): MemoryCue[] {
  const text = String(message || "").trim();
  if (!text) return [];

  const cues: MemoryCue[] = [];
  const seen = new Set<string>();

  for (const pattern of MEMORY_PATTERNS) {
    const match = pattern.regex.exec(text);
    if (!match) continue;
    const raw = match[pattern.group ?? 1] ?? "";
    const cleaned = cleanPhrase(String(raw));
    if (!cleaned) continue;
    const key = `${pattern.category}:${pattern.key}:${cleaned.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cues.push({
      key: pattern.key,
      value: cleaned,
      category: pattern.category,
      lastMentionedAt: nowIso,
      confidence: pattern.confidence,
    });
  }

  return cues;
}

export function mergeMemoryCues(
  existing: MemoryCue[],
  next: MemoryCue[],
  maxItems: number,
): MemoryCue[] {
  const merged = new Map<string, MemoryCue>();
  for (const cue of existing || []) {
    const key = `${cue.category}:${cue.key}:${cue.value.toLowerCase()}`;
    merged.set(key, cue);
  }
  for (const cue of next || []) {
    const key = `${cue.category}:${cue.key}:${cue.value.toLowerCase()}`;
    merged.set(key, cue);
  }

  const ordered = Array.from(merged.values()).sort((a, b) =>
    b.lastMentionedAt.localeCompare(a.lastMentionedAt),
  );
  return ordered.slice(0, Math.max(0, maxItems));
}

export function getMemoryFromContext(messages: Array<{ context_data?: unknown }>): MemoryCue[] {
  for (let i = (messages?.length ?? 0) - 1; i >= 0; i -= 1) {
    const ctx = (messages[i] as { context_data?: unknown })?.context_data;
    if (!ctx || typeof ctx !== "object") continue;
    const record = ctx as Record<string, unknown>;
    const memory = (record.memory ?? record.memoryCues) as unknown;
    if (!Array.isArray(memory)) continue;
    const cues = memory
      .map(item => item as Partial<MemoryCue>)
      .filter(item => typeof item?.value === "string" && typeof item?.category === "string")
      .map(item => ({
        key: String(item.key || "note"),
        value: String(item.value || ""),
        category: (item.category as MemoryCategory) || "other",
        lastMentionedAt: String(item.lastMentionedAt || ""),
        confidence: Number(item.confidence ?? 0.5),
      }));
    if (cues.length > 0) return cues;
  }
  return [];
}

export function summarizeMemory(cues: MemoryCue[]): string[] {
  if (!cues || cues.length === 0) return [];
  const labelMap: Record<string, string> = {
    name: "Name",
    pronouns: "Pronouns",
    likes: "Likes",
    ok_with: "Ok with",
    avoid: "Avoids",
    boundaries: "Boundaries",
    not_ok_with: "Not ok with",
    safe_word: "Safe word",
    relationship_status: "Relationship",
    tone: "Tone preference",
  };

  const grouped = new Map<string, Set<string>>();
  for (const cue of cues) {
    const label = labelMap[cue.key] || cue.key;
    if (!grouped.has(label)) grouped.set(label, new Set());
    grouped.get(label)?.add(cue.value);
  }

  const lines: string[] = [];
  for (const [label, values] of grouped.entries()) {
    const list = Array.from(values).slice(0, 3).join(", ");
    lines.push(`${label}: ${list}`);
  }

  return lines.slice(0, 8);
}
