import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDeviceId, getDevicePlatform } from "@/dlc/core/device";
import {
  fetchMyPositionMediaOverrides,
  type UserPositionMediaOverridesMap,
} from "@/lib/positions/userPositionMediaOverrides";
import type { DbPositionRow, Position } from "./model";
import {
  defaultTips,
  deriveStimulation,
  mapDifficulty,
  mapFlexibility,
  mapIntimacy,
  splitInstructions,
} from "./model";
import { fetchPositionById, fetchPositionCategories, fetchPositionsPage } from "./db";
import { isHttpUrl, signAssetPaths } from "./privateAssets";

type Args = {
  enabled: boolean;
  searchTerm: string;
  selectedCategory: string;
  selectedDifficulty: string;
  pageSize?: number;
};

type Result = {
  page: number;
  pageSize: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  positions: Position[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  categories: string[];
  refreshOverrides: () => Promise<void>;
  openPositionById: (positionId: string) => Promise<Position | null>;
};

function patchSigned(
  list: string[] | undefined,
  signed: Record<string, string>,
): string[] | undefined {
  if (!list || list.length === 0) return undefined;
  return list.map(v => (signed[v] ? String(signed[v]) : v));
}

function applyOverridesToPosition(
  position: Position,
  overridesMap: UserPositionMediaOverridesMap,
): Position {
  const o = overridesMap[position.id];
  if (!o) return position;
  const imageUrl = o.image?.public_url || undefined;
  const gifUrl = o.gif?.public_url || undefined;
  const videoUrl = o.video?.public_url || undefined;
  return {
    ...position,
    images: imageUrl ? [imageUrl] : position.images,
    gifs: gifUrl ? [gifUrl] : position.gifs,
    videos: videoUrl ? [videoUrl] : position.videos,
  };
}

function mapRowToPosition(args: {
  row: DbPositionRow;
  signed: Record<string, string>;
  toSign: string[];
}): Position {
  const { row, signed, toSign } = args;

  const category = String(row.category || "general");
  const tags = Array.from(
    new Set(
      [category, ...(Array.isArray(row.tags) ? row.tags : [])]
        .map(x => String(x || "").trim())
        .filter(Boolean),
    ),
  ).slice(0, 24);

  const instructions = splitInstructions(row.detailed_instructions);

  const images: string[] = [];
  const primaryImage = row.image_url_illustrated || row.image_url || row.thumbnail_url;
  if (primaryImage) {
    const img = String(primaryImage);
    if (!isHttpUrl(img) && !signed[img]) toSign.push(img);
    images.push(signed[img] ? String(signed[img]) : img);
  }

  const videos: string[] = [];
  if (row.video_tutorial_url) {
    const v = String(row.video_tutorial_url);
    if (!isHttpUrl(v) && !signed[v]) toSign.push(v);
    videos.push(signed[v] ? String(signed[v]) : v);
  }

  const animations: string[] = [];
  if (row.animation_url) {
    const a = String(row.animation_url);
    if (!isHttpUrl(a) && !signed[a]) toSign.push(a);
    animations.push(signed[a] ? String(signed[a]) : a);
  }

  return {
    id: String(row.id),
    name: String(row.position_name || "Untitled").trim(),
    category,
    difficulty: mapDifficulty(row.difficulty_level),
    description: String(row.description || "").trim() || "Description not provided.",
    summary: undefined,
    instructions: instructions.length > 0 ? instructions : ["Instructions not provided yet."],
    benefits:
      Array.isArray(row.benefits) && row.benefits.length > 0
        ? row.benefits
        : ["Benefits not provided yet."],
    tips: Array.isArray(row.tips) && row.tips.length > 0 ? row.tips : defaultTips(),
    tags,
    stimulationType: deriveStimulation(tags, category),
    requiredFlexibility: mapFlexibility(row.required_flexibility),
    intimacyLevel: mapIntimacy(row.intimacy_level),
    images: images.length > 0 ? images : undefined,
    videos: videos.length > 0 ? videos : undefined,
    gifs: undefined,
    animations: animations.length > 0 ? animations : undefined,
  };
}

export function usePositionsGalleryData(args: Args): Result {
  const { enabled, searchTerm, selectedCategory, selectedDifficulty } = args;
  const pageSize = Math.max(1, args.pageSize ?? 48);

  const [page, setPage] = useState(0);
  const [positionsRaw, setPositionsRaw] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [overridesMap, setOverridesMap] = useState<UserPositionMediaOverridesMap>({});

  // Keep signed asset cache out of the dependency graph to avoid refetch loops.
  const signedRef = useRef<Record<string, string>>({});

  const refreshOverrides = useCallback(async () => {
    try {
      const map = await fetchMyPositionMediaOverrides();
      setOverridesMap(map);
    } catch {
      setOverridesMap({});
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchPositionCategories();
      setCategories(cats);
    } catch {
      setCategories([]);
    }
  }, []);

  const signForRows = useCallback(async (toSign: string[]) => {
    const unique = Array.from(new Set(toSign.map(x => String(x || "").trim()).filter(Boolean)));
    if (unique.length === 0) return {};

    const deviceId = getDeviceId();
    const devicePlatform = getDevicePlatform();
    try {
      return await signAssetPaths({
        assetPaths: unique,
        deviceId,
        devicePlatform,
        expiresInSeconds: 5 * 60,
      });
    } catch {
      return {};
    }
  }, []);

  const loadPositions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { rows, count } = await fetchPositionsPage({
        page,
        pageSize,
        searchTerm,
        selectedCategory,
        selectedDifficulty,
      });

      const toSign: string[] = [];
      const mapped = rows.map((r: DbPositionRow) =>
        mapRowToPosition({ row: r, signed: signedRef.current, toSign }),
      );

      const newlySigned = await signForRows(toSign);
      if (Object.keys(newlySigned).length > 0) {
        signedRef.current = { ...signedRef.current, ...newlySigned };
      }

      const finalSigned = signedRef.current;
      const patched = mapped.map(p => ({
        ...p,
        images: patchSigned(p.images, finalSigned),
        videos: patchSigned(p.videos, finalSigned),
        animations: patchSigned(p.animations, finalSigned),
      }));

      setPositionsRaw(patched);
      setTotalCount(typeof count === "number" ? count : patched.length);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load positions";
      setError(msg);
      setPositionsRaw([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, selectedCategory, selectedDifficulty, signForRows]);

  const openPositionById = useCallback(
    async (positionId: string): Promise<Position | null> => {
      const id = String(positionId || "").trim();
      if (!id) return null;

      setError(null);
      try {
        const row = await fetchPositionById(id);
        if (!row) {
          setError("Position not found");
          return null;
        }

        const toSign: string[] = [];
        const mapped = mapRowToPosition({ row, signed: signedRef.current, toSign });

        const newlySigned = await signForRows(toSign);
        if (Object.keys(newlySigned).length > 0) {
          signedRef.current = { ...signedRef.current, ...newlySigned };
        }

        const finalSigned = signedRef.current;
        const patched: Position = {
          ...mapped,
          images: patchSigned(mapped.images, finalSigned),
          videos: patchSigned(mapped.videos, finalSigned),
          animations: patchSigned(mapped.animations, finalSigned),
        };

        return applyOverridesToPosition(patched, overridesMap);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load position";
        setError(msg);
        return null;
      }
    },
    [overridesMap, signForRows],
  );

  // Reset pagination on filter/search changes.
  useEffect(() => {
    setPage(0);
  }, [searchTerm, selectedCategory, selectedDifficulty]);

  // When gating disables content, clear local state so we don't render stale data.
  useEffect(() => {
    if (enabled) return;
    setPositionsRaw([]);
    setTotalCount(0);
    setError(null);
    setLoading(false);
  }, [enabled]);

  // Initial load when enabled.
  useEffect(() => {
    if (!enabled) return;
    void loadCategories();
    void refreshOverrides();
  }, [enabled, loadCategories, refreshOverrides]);

  // Load page content.
  useEffect(() => {
    if (!enabled) return;
    void loadPositions();
  }, [enabled, loadPositions]);

  const positions = useMemo(() => {
    if (!overridesMap || Object.keys(overridesMap).length === 0) return positionsRaw;
    return positionsRaw.map(p => applyOverridesToPosition(p, overridesMap));
  }, [overridesMap, positionsRaw]);

  return {
    page,
    pageSize,
    setPage,
    positions,
    totalCount,
    loading,
    error,
    categories,
    refreshOverrides,
    openPositionById,
  };
}
