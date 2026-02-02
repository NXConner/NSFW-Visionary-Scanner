export interface PEProgressEntry {
  id: string;
  date: string;
  imageData: string;
  lengthBPEL: number; // Bone-pressed erect length
  lengthNBPEL: number; // Non-bone-pressed erect length
  lengthFlaccid: number;
  girthBase: number;
  girthMid: number;
  girthHead: number;
  notes: string;
  routine: string;
}

export type PEProgressViewMode = "compare" | "timeline" | "overlay";

export type PEProgressEntryDraft = Partial<PEProgressEntry>;
