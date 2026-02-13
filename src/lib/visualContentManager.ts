/**
 * Visual Content Management System
 * Manages NSFW images, GIFs, videos, and animations for educational and demonstrational content
 * Supports SFW filtering for store-compliant versions
 */

import { isSFW, isNSFW } from "./featureFlags";

export interface VisualContent {
  id: string;
  type: "image" | "gif" | "video" | "animation";
  url: string;
  thumbnail?: string;
  category: string;
  tags: string[];
  title?: string;
  description?: string;
  duration?: number; // for videos
  inverted?: boolean; // if colors are inverted
}

export interface VisualContentCollection {
  id: string;
  name: string;
  description: string;
  category: string;
  items: VisualContent[];
}

/**
 * Repository configurations for fetching visual content
 */
export const REPOSITORY_CONFIGS = {
  RANDOM_SEX_POSITION: {
    owner: "raminr77",
    repo: "random-sex-position",
    branch: "main",
  },
  SEX_POSITIONS: {
    owner: "adminlove520",
    repo: "Sex-Positions",
    branch: "main",
  },
} as const;

type CacheEntry = { at: number; items: VisualContent[] };
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<VisualContent[]>>();

function nowMs(): number {
  return Date.now();
}

function cacheKey(featureId: string, category?: string): string {
  const f = String(featureId || "")
    .trim()
    .toLowerCase();
  const c = category ? String(category).trim().toLowerCase() : "";
  return `${f}::${c}`;
}

function uniqByUrl(items: VisualContent[]): VisualContent[] {
  const seen = new Set<string>();
  const out: VisualContent[] = [];
  for (const it of items) {
    const key = String(it.url || "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

/**
 * Fetches visual content from GitHub repositories
 */
export async function fetchVisualContentFromGitHub(
  owner: string,
  repo: string,
  path: string = "",
  branch: string = "main",
): Promise<VisualContent[]> {
  // Never fetch adult content in SFW/hybrid builds.
  // External NSFW content sources are restricted to explicit NSFW builds only.
  if (isSFW() || !isNSFW()) {
    return [];
  }

  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const files = await response.json();
    const content: VisualContent[] = [];

    for (const file of Array.isArray(files) ? files : [files]) {
      if (file.type === "file") {
        const extension = file.name.split(".").pop()?.toLowerCase();
        const isImage = ["jpg", "jpeg", "png", "webp"].includes(extension || "");
        const isGif = extension === "gif";
        const isVideo = ["mp4", "webm", "mov"].includes(extension || "");

        if (isImage || isGif || isVideo) {
          content.push({
            id: `github-${file.sha}`,
            type: isGif ? "gif" : isVideo ? "video" : "image",
            url: file.download_url,
            category: path.split("/").pop() || "general",
            tags: file.name
              .toLowerCase()
              .replace(/\.[^/.]+$/, "")
              .split(/[-_\s]+/),
            title: file.name.replace(/\.[^/.]+$/, ""),
          });
        }
      } else if (file.type === "dir") {
        // Recursively fetch from subdirectories
        const subContent = await fetchVisualContentFromGitHub(owner, repo, file.path, branch);
        content.push(...subContent);
      }
    }

    return content;
  } catch (error) {
    return [];
  }
}

/**
 * Gets visual content for a specific feature/component
 * Returns empty array if SFW mode and content is NSFW
 */
export async function getVisualContentForFeature(
  featureId: string,
  category?: string,
): Promise<VisualContent[]> {
  // External NSFW visual content is restricted to explicit NSFW builds only.
  if (isSFW() || !isNSFW()) {
    // Check if this feature requires NSFW content
    const nsfwFeatures = ["positions-gallery", "positions", "visual-content"];
    if (nsfwFeatures.includes(featureId.toLowerCase())) {
      return [];
    }
  }

  const fid = String(featureId || "")
    .trim()
    .toLowerCase();
  const cat = category ? String(category).trim().toLowerCase() : "";

  // Cache (in-memory) to avoid repeated GitHub API hits.
  const key = cacheKey(fid, cat);
  const cached = cache.get(key);
  if (cached && nowMs() - cached.at < CACHE_TTL_MS) {
    return cached.items;
  }

  const existing = inflight.get(key);
  if (existing) return await existing;

  const promise = (async (): Promise<VisualContent[]> => {
    // Only positions-related features currently have configured external sources.
    // Other feature areas are expected to use curated/first-party content (DLC/import pipeline).
    const isPositions =
      fid.includes("positions") || fid === "visual-content" || fid === "visual-content-system";
    if (!isPositions) {
      cache.set(key, { at: nowMs(), items: [] });
      return [];
    }

    const sources = [
      REPOSITORY_CONFIGS.RANDOM_SEX_POSITION,
      REPOSITORY_CONFIGS.SEX_POSITIONS,
    ] as const;

    const all: VisualContent[] = [];

    for (const src of sources) {
      // If a category is specified, try that path first (fast path); if it yields nothing,
      // fall back to the repo root (still filtered client-side).
      const primary = cat
        ? await fetchVisualContentFromGitHub(src.owner, src.repo, cat, src.branch)
        : [];
      const fallback =
        primary.length > 0
          ? []
          : await fetchVisualContentFromGitHub(src.owner, src.repo, "", src.branch);

      const merged = [...primary, ...fallback];
      all.push(...merged);
    }

    // Normalize + filter by category when provided.
    const filtered = cat
      ? all.filter(it => {
          const itemCat = String(it.category || "").toLowerCase();
          if (itemCat === cat) return true;
          if (itemCat.includes(cat)) return true;
          return it.tags?.some(t => String(t).toLowerCase() === cat) ?? false;
        })
      : all;

    // Hard cap to keep UI responsive if a repo has very large trees.
    const capped = uniqByUrl(filtered).slice(0, 800);

    // Stable-ish ordering for determinism in UI.
    capped.sort((a, b) => String(a.title || a.id).localeCompare(String(b.title || b.id)));

    cache.set(key, { at: nowMs(), items: capped });
    return capped;
  })().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return await promise;
}

/**
 * Categorizes visual content by feature area
 */
export const VISUAL_CONTENT_CATEGORIES = {
  POSITIONS: "positions",
  EDUCATIONAL: "educational",
  HEALTH_CONDITIONS: "health-conditions",
  EXERCISES: "exercises",
  EQUIPMENT: "equipment",
  TECHNIQUES: "techniques",
  TUTORIALS: "tutorials",
  ANATOMY: "anatomy",
  SYMPTOMS: "symptoms",
  TREATMENT: "treatment",
  PROGRESS: "progress",
  MEASUREMENT: "measurement",
  SAFETY: "safety",
} as const;

/**
 * Maps features to visual content categories
 */
export const FEATURE_VISUAL_MAP: Record<string, string[]> = {
  "positions-gallery": [VISUAL_CONTENT_CATEGORIES.POSITIONS],
  "educational-content": [
    VISUAL_CONTENT_CATEGORIES.EDUCATIONAL,
    VISUAL_CONTENT_CATEGORIES.ANATOMY,
    VISUAL_CONTENT_CATEGORIES.HEALTH_CONDITIONS,
  ],
  "education-center": [
    VISUAL_CONTENT_CATEGORIES.HEALTH_CONDITIONS,
    VISUAL_CONTENT_CATEGORIES.SYMPTOMS,
    VISUAL_CONTENT_CATEGORIES.TREATMENT,
  ],
  "mens-health-guide": [
    VISUAL_CONTENT_CATEGORIES.EXERCISES,
    VISUAL_CONTENT_CATEGORIES.EQUIPMENT,
    VISUAL_CONTENT_CATEGORIES.TECHNIQUES,
  ],
  "pe-routine-builder": [VISUAL_CONTENT_CATEGORIES.EXERCISES, VISUAL_CONTENT_CATEGORIES.TUTORIALS],
  "pumping-section": [
    VISUAL_CONTENT_CATEGORIES.EQUIPMENT,
    VISUAL_CONTENT_CATEGORIES.TECHNIQUES,
    VISUAL_CONTENT_CATEGORIES.SAFETY,
  ],
  "scanner-section": [VISUAL_CONTENT_CATEGORIES.MEASUREMENT, VISUAL_CONTENT_CATEGORIES.TUTORIALS],
  "scanner-tutorial": [VISUAL_CONTENT_CATEGORIES.TUTORIALS, VISUAL_CONTENT_CATEGORIES.MEASUREMENT],
  "onboarding-tutorial": [VISUAL_CONTENT_CATEGORIES.TUTORIALS],
  "ar-measurement-guides": [
    VISUAL_CONTENT_CATEGORIES.MEASUREMENT,
    VISUAL_CONTENT_CATEGORIES.TUTORIALS,
  ],
  "emergency-guidance": [VISUAL_CONTENT_CATEGORIES.SAFETY, VISUAL_CONTENT_CATEGORIES.SYMPTOMS],
  "progress-photos": [VISUAL_CONTENT_CATEGORIES.PROGRESS],
  "pe-progress-photos": [VISUAL_CONTENT_CATEGORIES.PROGRESS],
  "ai-scan-analysis": [
    VISUAL_CONTENT_CATEGORIES.ANATOMY,
    VISUAL_CONTENT_CATEGORIES.HEALTH_CONDITIONS,
  ],
} as const;
