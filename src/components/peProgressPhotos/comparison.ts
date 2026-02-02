import type { PEProgressEntry } from "./types";

export function getComparison(left: PEProgressEntry, right: PEProgressEntry) {
  return {
    bpelDiff: right.lengthBPEL - left.lengthBPEL,
    nbpelDiff: right.lengthNBPEL - left.lengthNBPEL,
    flaccidDiff: right.lengthFlaccid - left.lengthFlaccid,
    girthBaseDiff: right.girthBase - left.girthBase,
    girthMidDiff: right.girthMid - left.girthMid,
    girthHeadDiff: right.girthHead - left.girthHead,
  };
}
