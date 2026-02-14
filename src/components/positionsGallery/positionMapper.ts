import { isHttpUrl } from "./privateAssets";
import type { DbPositionRow, Position } from "./model";
import {
  defaultTips,
  deriveStimulation,
  mapDifficulty,
  mapFlexibility,
  mapIntimacy,
  splitInstructions,
} from "./model";
import type { UserPositionMediaOverridesMap } from "@/lib/positions/userPositionMediaOverrides";

export function patchSignedAssetList(
  list: string[] | undefined,
  signed: Record<string, string>,
): string[] | undefined {
  if (!list || list.length === 0) return undefined;
  return list.map(v => (signed[v] ? String(signed[v]) : v));
}

export function applyOverridesToPosition(
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

export function mapRowToPosition(args: {
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
