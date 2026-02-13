import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";
import type { Position } from "./model";
import type { NSFWPosition } from "@/data/nsfwPositions/types";

let cachedRaw: NSFWPosition[] | null = null;
let cachedPositions: Position[] | null = null;

const mapFallbackPosition = (pos: NSFWPosition): Position => {
  const { source: _source, ...rest } = pos;
  return {
    ...rest,
  };
};

const loadRawPositions = async (): Promise<NSFWPosition[]> => {
  if (!BUILD_ALLOW_ADULT_BUNDLE) return [];
  if (cachedRaw) return cachedRaw;
  const mod = await import("@/data/nsfwPositions");
  cachedRaw = mod.getGeneratedNsfwPositionsFromGitHubImages();
  return cachedRaw;
};

export const getNsfwFallbackPositions = async (): Promise<Position[]> => {
  if (!BUILD_ALLOW_ADULT_BUNDLE) return [];
  if (cachedPositions) return cachedPositions;
  const raw = await loadRawPositions();
  cachedPositions = raw.map(mapFallbackPosition);
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
