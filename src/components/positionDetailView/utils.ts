import type { Position } from "@/components/positionsGallery/model";

export function getDifficultyBadgeClass(difficulty: Position["difficulty"]): string {
  switch (difficulty) {
    case "easy":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "hard":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "expert":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "";
  }
}

export function sanitizeForFolder(value: string): string {
  return String(value)
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 64);
}
