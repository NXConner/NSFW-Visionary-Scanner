import type { LucideIcon } from "lucide-react";
import { BarChart3, BookOpen, Heart, MessageCircle, Shield, Video } from "lucide-react";

export type NsfwFeature = {
  id: string;
  title: string;
  icon: LucideIcon;
  tabId: string;
  summary: string;
  details: string[];
  howTo: string[];
};

export const NSFW_FEATURES: NsfwFeature[] = [
  {
    id: "nsfw-positions",
    title: "Positions Gallery",
    icon: Heart,
    tabId: "positions",
    summary:
      "Browse the positions library with filters, favorites, and optional private media overrides.",
    details: [
      "Filters by category and difficulty.",
      "Favorite positions locally for quick access.",
      "Optionally upload your own private image/GIF/video per position (stored under your account).",
    ],
    howTo: [
      "Open the gallery and use Search + Difficulty to narrow results.",
      "Tap a card to view steps, tips, and media.",
      "Use the heart icon to favorite a position.",
      "In a position detail, use the Media tab to upload private overrides.",
    ],
  },
  {
    id: "nsfw-videos",
    title: "NSFW Video Library",
    icon: Video,
    tabId: "nsfw-videos",
    summary: "Stream or download authorized videos (signed URL delivery) with offline caching.",
    details: [
      "Streaming uses short-lived signed URLs.",
      "Offline downloads are cached locally and tracked in the DB.",
      "Quality selection supported where available.",
    ],
    howTo: [
      "Browse videos and open a player.",
      "Choose Stream or Download for offline use.",
      "Manage downloads in the Downloads tab and resume if interrupted.",
    ],
  },
  {
    id: "nsfw-forum",
    title: "NSFW Community Forum",
    icon: MessageCircle,
    tabId: "nsfw-forum",
    summary: "Adult-only community discussions and support spaces (gated by age + entitlements).",
    details: [
      "Threads and content are moderated and gated.",
      "Designed for educational and wellness-focused discussion.",
    ],
    howTo: [
      "Open the forum and browse categories.",
      "Create a post/thread from within the forum UI.",
      "Use search and filters to find topics quickly.",
    ],
  },
  {
    id: "nsfw-analytics",
    title: "Sexual Wellness Analytics",
    icon: BarChart3,
    tabId: "nsfw-wellness-analytics",
    summary: "Track wellness signals over time and generate insights and trends.",
    details: ["Trend views and summaries.", "Designed to be privacy-first with clear controls."],
    howTo: [
      "Log entries as you go.",
      "Use dashboard views to spot trends and patterns.",
      "Export insights when needed.",
    ],
  },
  {
    id: "nsfw-advanced",
    title: "NSFW Advanced Features",
    icon: Shield,
    tabId: "nsfw-advanced",
    summary: "Advanced adult-only tools and workflows, accessible only when unlocked.",
    details: ["Feature set may vary by build/channel.", "Always gated behind age verification."],
    howTo: [
      "Open the Advanced NSFW section.",
      "Follow on-screen guidance per tool.",
      "Use Settings to manage privacy and device controls.",
    ],
  },
  {
    id: "nsfw-topics",
    title: "Topics Library",
    icon: BookOpen,
    tabId: "home",
    summary: "Browse DLC-backed adult topics (content is delivered via admin import).",
    details: [
      "Topic packs unlock access to specific topic sections.",
      "Content items are imported via the Admin DLC import pipeline (topics).",
    ],
    howTo: [
      "Open Topics Library from the NSFW Hub quick actions.",
      "Purchase a Topic Pack to unlock a topic.",
      "Ask an admin to import topic items into your account’s catalog.",
    ],
  },
];
