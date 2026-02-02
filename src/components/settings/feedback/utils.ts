import type { FeedbackKind } from "@/lib/feedback";
import { Bug, HeartHandshake, ListPlus, MessageSquareText, Sparkles } from "lucide-react";

export function kindLabel(kind: FeedbackKind) {
  switch (kind) {
    case "bug":
      return "Bug";
    case "glitch":
      return "Glitch";
    case "error":
      return "Error";
    case "feature_request":
      return "Feature request";
    case "expansion_request":
      return "Expansion request";
    case "wishlist":
      return "Wishlist";
    case "praise":
      return "Praise";
    default:
      return "Feedback";
  }
}

export function kindIcon(kind: FeedbackKind) {
  switch (kind) {
    case "bug":
    case "glitch":
    case "error":
      return Bug;
    case "feature_request":
      return Sparkles;
    case "expansion_request":
      return ListPlus;
    case "wishlist":
      return HeartHandshake;
    default:
      return MessageSquareText;
  }
}

export function statusBadgeVariant(status?: string | null) {
  switch (status) {
    case "resolved":
      return "default" as const;
    case "in_progress":
      return "secondary" as const;
    case "triaged":
      return "outline" as const;
    case "won't_fix":
    case "duplicate":
      return "destructive" as const;
    case "new":
    default:
      return "secondary" as const;
  }
}

export function splitTags(raw: string) {
  return raw
    .split(",")
    .map(t => t.trim())
    .filter(Boolean)
    .slice(0, 12);
}
