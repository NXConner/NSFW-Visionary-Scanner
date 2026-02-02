import type { Position } from "./types";
import { classicPositions } from "./classic";
import { tantricPositions } from "./tantric";
import { oralVariationPositions } from "./oralVariations";
import { furnitureAssistedPositions } from "./furnitureAssisted";

export const allPositions: Position[] = [
  ...classicPositions,
  ...tantricPositions,
  ...oralVariationPositions,
  ...furnitureAssistedPositions,
];
