import type { DLCFeature } from "../types";

export const POSITIONS_FEATURES: DLCFeature[] = [
  {
    id: "positions_gallery",
    name: "Positions Gallery",
    description: "100+ intimate positions with visual guides",
    icon: "Heart",
    category: "positions",
  },
  {
    id: "position_details",
    name: "Position Details",
    description: "Detailed instructions and tips for each position",
    icon: "Info",
    category: "positions",
  },
  {
    id: "position_favorites",
    name: "Favorites",
    description: "Save and organize your favorite positions",
    icon: "Star",
    category: "positions",
  },
  {
    id: "position_filters",
    name: "Advanced Filters",
    description: "Filter by difficulty, category, and more",
    icon: "Filter",
    category: "positions",
  },
  {
    id: "position_playlists",
    name: "Position Playlists",
    description: "Create custom position playlists",
    icon: "List",
    category: "positions",
  },
];

export const VIDEO_FEATURES: DLCFeature[] = [
  {
    id: "video_library",
    name: "Video Library",
    description: "Premium adult video content library",
    icon: "Video",
    category: "videos",
  },
  {
    id: "video_streaming",
    name: "HD Streaming",
    description: "Stream videos in high definition",
    icon: "Play",
    category: "videos",
  },
  {
    id: "video_downloads",
    name: "Offline Downloads",
    description: "Download videos for offline viewing",
    icon: "Download",
    category: "videos",
  },
  {
    id: "video_playlists",
    name: "Video Playlists",
    description: "Create and manage video playlists",
    icon: "List",
    category: "videos",
  },
  {
    id: "video_progress",
    name: "Progress Tracking",
    description: "Track your viewing progress",
    icon: "CheckCircle",
    category: "videos",
  },
];

export const ANALYTICS_FEATURES: DLCFeature[] = [
  {
    id: "wellness_analytics",
    name: "Wellness Analytics",
    description: "Detailed intimate wellness tracking",
    icon: "BarChart",
    category: "analytics",
  },
  {
    id: "partner_sync",
    name: "Partner Sync",
    description: "Sync data with your partner",
    icon: "Users",
    category: "analytics",
  },
  {
    id: "intimate_reports",
    name: "Intimate Reports",
    description: "Generate detailed wellness reports",
    icon: "FileText",
    category: "analytics",
  },
  {
    id: "trend_analysis",
    name: "Trend Analysis",
    description: "Analyze patterns and trends",
    icon: "TrendingUp",
    category: "analytics",
  },
  {
    id: "relationship_insights",
    name: "Relationship Insights",
    description: "AI-powered relationship insights",
    icon: "Lightbulb",
    category: "analytics",
  },
];

export const COMMUNITY_FEATURES: DLCFeature[] = [
  {
    id: "private_forum",
    name: "Private Forum",
    description: "Access to private adult community forum",
    icon: "MessageCircle",
    category: "community",
  },
  {
    id: "private_groups",
    name: "Private Groups",
    description: "Join or create private discussion groups",
    icon: "Users",
    category: "community",
  },
  {
    id: "expert_qa",
    name: "Expert Q&A",
    description: "Ask questions to verified experts",
    icon: "HelpCircle",
    category: "community",
  },
  {
    id: "creator_marketplace",
    name: "Creator Marketplace",
    description: "Access premium content from creators",
    icon: "ShoppingBag",
    category: "marketplace",
  },
  {
    id: "exclusive_content",
    name: "Exclusive Content",
    description: "Members-only exclusive content",
    icon: "Lock",
    category: "community",
  },
];

export const ADVANCED_FEATURES: DLCFeature[] = [
  {
    id: "multi_camera",
    name: "Multi-Camera Recording",
    description: "Record with multiple cameras simultaneously",
    icon: "Camera",
    category: "advanced",
  },
  {
    id: "intimate_dates",
    name: "Intimate Date Planner",
    description: "Plan and schedule intimate dates",
    icon: "Calendar",
    category: "advanced",
  },
  {
    id: "ai_companion",
    name: "AI Companion Chat",
    description: "Chat with an AI companion for suggestions",
    icon: "MessageSquare",
    category: "advanced",
  },
  {
    id: "partner_video_sync",
    name: "Partner Video Sync",
    description: "Sync video recording with partner",
    icon: "Link",
    category: "advanced",
  },
];

export const TOPICS_LIBRARY_FEATURE: DLCFeature = {
  id: "topics_library",
  name: "Topics Library",
  description: "Access the Topics Library module",
  icon: "BookOpen",
  category: "topics",
};

export const TOPIC_PACK_FEATURES: Record<
  "topic_power_dynamics" | "topic_tantric" | "topic_kama_sutra" | "topic_roleplay" | "topic_male_pleasure",
  DLCFeature
> = {
  topic_power_dynamics: {
    id: "topic_power_dynamics",
    name: "Power Dynamics",
    description: "Unlock power dynamics topic content",
    icon: "Shield",
    category: "topics",
  },
  topic_tantric: {
    id: "topic_tantric",
    name: "Tantric & Mindful Intimacy",
    description: "Unlock tantric topic content",
    icon: "Sparkles",
    category: "topics",
  },
  topic_kama_sutra: {
    id: "topic_kama_sutra",
    name: "Classic Texts & Positions",
    description: "Unlock classic texts/positions topic content",
    icon: "BookOpen",
    category: "topics",
  },
  topic_roleplay: {
    id: "topic_roleplay",
    name: "Roleplay & Fantasy",
    description: "Unlock roleplay topic content",
    icon: "Mask",
    category: "topics",
  },
  topic_male_pleasure: {
    id: "topic_male_pleasure",
    name: "Male Pleasure & Pelvic Health",
    description: "Unlock male pleasure/pelvic health topic content",
    icon: "HeartPulse",
    category: "topics",
  },
};

/**
 * NSFW scanner + detection DLC features
 * (Used by addon-defined packages and/or DB-backed catalog entries.)
 */
export const NSFW_SCANNER_FEATURES: DLCFeature[] = [
  {
    id: "nsfw_scanner_mode",
    name: "NSFW Scanner Mode",
    description: "Enable adult-only scanning mode and policy controls",
    icon: "Shield",
    category: "advanced",
  },
  {
    id: "explicit_content_detection",
    name: "Explicit Content Detection",
    description: "On-device explicit content detection (NSFWJS + TFJS)",
    icon: "Eye",
    category: "advanced",
  },
];

export const ADVANCED_NSFW_DETECTION_FEATURES: DLCFeature[] = [
  {
    id: "advanced_nsfw_detection",
    name: "Advanced NSFW Detection Modes",
    description: "Multi-model detection, ensemble scoring, and detailed breakdowns",
    icon: "Sparkles",
    category: "advanced",
  },
  {
    id: "nsfw_detection_history",
    name: "Detection History",
    description: "Store and review past detection results (opt-in; no image content stored)",
    icon: "BarChart",
    category: "advanced",
  },
  {
    id: "nsfw_comparison_mode",
    name: "Comparison Mode",
    description: "Compare results across enabled models and thresholds",
    icon: "Columns",
    category: "advanced",
  },
];
