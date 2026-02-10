import { BUILD_ALLOW_ADULT_BUNDLE, BUILD_IS_NSFW, BUILD_IS_DIRECT } from "@/lib/buildFlags";
import type { Position } from "./model";
import type { NSFWPosition } from "@/data/nsfwPositions/types";
import { logger } from "@/lib/logger";

let cachedRaw: NSFWPosition[] | null = null;
let cachedPositions: Position[] | null = null;

const mapFallbackPosition = (pos: NSFWPosition): Position => {
  const { source: _source, ...rest } = pos;
  return {
    ...rest,
  };
};

/**
 * Check if NSFW fallback positions should be available.
 * This is more permissive than BUILD_ALLOW_ADULT_BUNDLE to handle edge cases
 * where env vars may not be perfectly set during development.
 */
const shouldAllowFallback = (): boolean => {
  // Strict check first
  if (BUILD_ALLOW_ADULT_BUNDLE) return true;
  
  // Fallback: allow if either flag suggests NSFW content should be available
  // This helps during development when env vars may not be perfectly configured
  if (BUILD_IS_NSFW || BUILD_IS_DIRECT) {
    logger.info("[nsfwFallback] Allowing fallback via relaxed check", {
      BUILD_ALLOW_ADULT_BUNDLE,
      BUILD_IS_NSFW,
      BUILD_IS_DIRECT,
    });
    return true;
  }
  
  return false;
};

const loadRawPositions = async (): Promise<NSFWPosition[]> => {
  if (!shouldAllowFallback()) {
    logger.info("[nsfwFallback] Fallback disabled by build flags");
    return [];
  }
  if (cachedRaw) return cachedRaw;
  try {
    const mod = await import("@/data/nsfwPositions");
    cachedRaw = mod.getGeneratedNsfwPositionsFromGitHubImages();
    logger.info("[nsfwFallback] Loaded raw positions", { count: cachedRaw.length });
    return cachedRaw;
  } catch (err) {
    logger.error("[nsfwFallback] Failed to load positions module", { error: err });
    return [];
  }
};

export const getNsfwFallbackPositions = async (): Promise<Position[]> => {
  if (!shouldAllowFallback()) {
    logger.info("[nsfwFallback] Fallback disabled, returning empty array");
    return [];
  }
  if (cachedPositions) return cachedPositions;
  const raw = await loadRawPositions();
  cachedPositions = raw.map(mapFallbackPosition);
  logger.info("[nsfwFallback] Mapped fallback positions", { count: cachedPositions.length });
  return cachedPositions;
};

export const getNsfwFallbackCategories = async (): Promise<string[]> => {
  const positions = await getNsfwFallbackPositions();
  if (positions.length === 0) return [];
  return Array.from(new Set(positions.map(p => p.category).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
};

export const findNsfwFallbackPositionById = async (
  id: string,
): Promise<Position | null> => {
  if (!BUILD_ALLOW_ADULT_BUNDLE) return null;
  const safeId = String(id || "").trim();
  if (!safeId) return null;
  const positions = await getNsfwFallbackPositions();
  return positions.find(p => p.id === safeId) ?? null;
};
