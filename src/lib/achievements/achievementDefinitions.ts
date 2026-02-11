/**
 * Achievement Definitions
 * All achievement badges and their criteria
 */

export type AchievementCategory =
  | "scanning"
  | "consistency"
  | "exploration"
  | "health"
  | "social"
  | "special";

export type AchievementRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type AchievementTrigger =
  | "scan_count"
  | "consecutive_days"
  | "feature_use"
  | "measurement_accuracy"
  | "health_check"
  | "social_share"
  | "milestone"
  | "time_based"
  | "custom";

export interface AchievementCriteria {
  type: AchievementTrigger;
  threshold: number;
  comparison?: "gte" | "lte" | "eq" | "gt" | "lt";
  additionalConditions?: Record<string, unknown>;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string; // Icon name (lucide)
  criteria: AchievementCriteria;
  points: number;
  secret?: boolean; // Hidden until unlocked
  prerequisiteIds?: string[];
  rewards?: AchievementReward[];
}

export interface AchievementReward {
  type: "feature_unlock" | "badge" | "theme" | "points" | "title";
  value: string;
  description?: string;
}

// ============ SCANNING ACHIEVEMENTS ============

export const scanningAchievements: Achievement[] = [
  {
    id: "first_scan",
    name: "First Steps",
    description: "Complete your first scan",
    category: "scanning",
    rarity: "common",
    icon: "Camera",
    criteria: { type: "scan_count", threshold: 1 },
    points: 10,
  },
  {
    id: "scan_10",
    name: "Getting Started",
    description: "Complete 10 scans",
    category: "scanning",
    rarity: "common",
    icon: "Camera",
    criteria: { type: "scan_count", threshold: 10 },
    points: 25,
  },
  {
    id: "scan_50",
    name: "Dedicated Scanner",
    description: "Complete 50 scans",
    category: "scanning",
    rarity: "uncommon",
    icon: "Target",
    criteria: { type: "scan_count", threshold: 50 },
    points: 50,
  },
  {
    id: "scan_100",
    name: "Century Club",
    description: "Complete 100 scans",
    category: "scanning",
    rarity: "rare",
    icon: "Award",
    criteria: { type: "scan_count", threshold: 100 },
    points: 100,
  },
  {
    id: "scan_500",
    name: "Veteran Scanner",
    description: "Complete 500 scans",
    category: "scanning",
    rarity: "epic",
    icon: "Trophy",
    criteria: { type: "scan_count", threshold: 500 },
    points: 250,
  },
  {
    id: "scan_1000",
    name: "Scanning Legend",
    description: "Complete 1,000 scans",
    category: "scanning",
    rarity: "legendary",
    icon: "Crown",
    criteria: { type: "scan_count", threshold: 1000 },
    points: 500,
    rewards: [{ type: "title", value: "Scanning Legend", description: "Exclusive title" }],
  },
  {
    id: "perfect_scan",
    name: "Perfect Shot",
    description: "Achieve a perfect quality scan (100%)",
    category: "scanning",
    rarity: "rare",
    icon: "Star",
    criteria: { type: "measurement_accuracy", threshold: 100 },
    points: 75,
  },
  {
    id: "quick_scanner",
    name: "Speed Demon",
    description: "Complete a scan in under 5 seconds",
    category: "scanning",
    rarity: "uncommon",
    icon: "Zap",
    criteria: {
      type: "custom",
      threshold: 5,
      additionalConditions: { metric: "scan_time_seconds" },
    },
    points: 30,
  },
];

// ============ CONSISTENCY ACHIEVEMENTS ============

export const consistencyAchievements: Achievement[] = [
  {
    id: "streak_3",
    name: "Getting Consistent",
    description: "Scan 3 days in a row",
    category: "consistency",
    rarity: "common",
    icon: "Flame",
    criteria: { type: "consecutive_days", threshold: 3 },
    points: 15,
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Scan 7 days in a row",
    category: "consistency",
    rarity: "uncommon",
    icon: "Flame",
    criteria: { type: "consecutive_days", threshold: 7 },
    points: 35,
  },
  {
    id: "streak_14",
    name: "Two Week Triumph",
    description: "Scan 14 days in a row",
    category: "consistency",
    rarity: "rare",
    icon: "TrendingUp",
    criteria: { type: "consecutive_days", threshold: 14 },
    points: 75,
  },
  {
    id: "streak_30",
    name: "Monthly Master",
    description: "Scan 30 days in a row",
    category: "consistency",
    rarity: "epic",
    icon: "Calendar",
    criteria: { type: "consecutive_days", threshold: 30 },
    points: 150,
  },
  {
    id: "streak_100",
    name: "Unstoppable",
    description: "Scan 100 days in a row",
    category: "consistency",
    rarity: "legendary",
    icon: "Crown",
    criteria: { type: "consecutive_days", threshold: 100 },
    points: 500,
    rewards: [{ type: "badge", value: "unstoppable_badge", description: "Exclusive badge" }],
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Complete a scan before 7 AM",
    category: "consistency",
    rarity: "uncommon",
    icon: "Sunrise",
    criteria: { type: "time_based", threshold: 7, additionalConditions: { before: true } },
    points: 20,
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Complete a scan after 11 PM",
    category: "consistency",
    rarity: "uncommon",
    icon: "Moon",
    criteria: { type: "time_based", threshold: 23, additionalConditions: { after: true } },
    points: 20,
  },
];

// ============ EXPLORATION ACHIEVEMENTS ============

export const explorationAchievements: Achievement[] = [
  {
    id: "feature_ar",
    name: "Augmented Reality",
    description: "Use the AR measurement overlay",
    category: "exploration",
    rarity: "common",
    icon: "Layers",
    criteria: {
      type: "feature_use",
      threshold: 1,
      additionalConditions: { feature: "ar_overlay" },
    },
    points: 15,
  },
  {
    id: "feature_voice",
    name: "Voice Activated",
    description: "Use voice guidance for scanning",
    category: "exploration",
    rarity: "common",
    icon: "Mic",
    criteria: {
      type: "feature_use",
      threshold: 1,
      additionalConditions: { feature: "voice_guidance" },
    },
    points: 15,
  },
  {
    id: "feature_enhance",
    name: "Image Enhancer",
    description: "Use the image enhancement feature",
    category: "exploration",
    rarity: "common",
    icon: "Wand2",
    criteria: {
      type: "feature_use",
      threshold: 1,
      additionalConditions: { feature: "image_enhancement" },
    },
    points: 15,
  },
  {
    id: "feature_export",
    name: "Data Exporter",
    description: "Export your measurement data",
    category: "exploration",
    rarity: "uncommon",
    icon: "Download",
    criteria: {
      type: "feature_use",
      threshold: 1,
      additionalConditions: { feature: "data_export" },
    },
    points: 20,
  },
  {
    id: "feature_multi_profile",
    name: "Profile Pro",
    description: "Create multiple profiles",
    category: "exploration",
    rarity: "uncommon",
    icon: "Users",
    criteria: { type: "feature_use", threshold: 2, additionalConditions: { feature: "profiles" } },
    points: 25,
  },
  {
    id: "explorer",
    name: "Feature Explorer",
    description: "Try 10 different features",
    category: "exploration",
    rarity: "rare",
    icon: "Compass",
    criteria: { type: "feature_use", threshold: 10, additionalConditions: { unique: true } },
    points: 100,
  },
  {
    id: "power_user",
    name: "Power User",
    description: "Use all major features at least once",
    category: "exploration",
    rarity: "epic",
    icon: "Rocket",
    criteria: { type: "custom", threshold: 1, additionalConditions: { all_features: true } },
    points: 200,
  },
];

// ============ HEALTH ACHIEVEMENTS ============

export const healthAchievements: Achievement[] = [
  {
    id: "health_check",
    name: "Health Conscious",
    description: "Complete a health self-check",
    category: "health",
    rarity: "common",
    icon: "Heart",
    criteria: { type: "health_check", threshold: 1 },
    points: 20,
  },
  {
    id: "health_tracker",
    name: "Health Tracker",
    description: "Log health data for 7 days",
    category: "health",
    rarity: "uncommon",
    icon: "Activity",
    criteria: { type: "health_check", threshold: 7 },
    points: 40,
  },
  {
    id: "health_guru",
    name: "Wellness Warrior",
    description: "Maintain health tracking for 30 days",
    category: "health",
    rarity: "rare",
    icon: "Stethoscope",
    criteria: { type: "health_check", threshold: 30 },
    points: 100,
  },
  {
    id: "symptom_tracker",
    name: "Symptom Sleuth",
    description: "Track symptoms for a week",
    category: "health",
    rarity: "uncommon",
    icon: "ClipboardList",
    criteria: {
      type: "feature_use",
      threshold: 7,
      additionalConditions: { feature: "symptom_tracking" },
    },
    points: 35,
  },
  {
    id: "medication_reminder",
    name: "Medication Master",
    description: "Set up medication reminders",
    category: "health",
    rarity: "common",
    icon: "Pill",
    criteria: {
      type: "feature_use",
      threshold: 1,
      additionalConditions: { feature: "medication_reminders" },
    },
    points: 15,
  },
];

// ============ SOCIAL ACHIEVEMENTS ============

export const socialAchievements: Achievement[] = [
  {
    id: "first_share",
    name: "Social Butterfly",
    description: "Share your progress for the first time",
    category: "social",
    rarity: "uncommon",
    icon: "Share2",
    criteria: { type: "social_share", threshold: 1 },
    points: 25,
  },
  {
    id: "share_10",
    name: "Spreading the Word",
    description: "Share your achievements 10 times",
    category: "social",
    rarity: "rare",
    icon: "Megaphone",
    criteria: { type: "social_share", threshold: 10 },
    points: 75,
  },
];

// ============ SPECIAL ACHIEVEMENTS ============

export const specialAchievements: Achievement[] = [
  {
    id: "beta_tester",
    name: "Beta Tester",
    description: "Participated in the beta program",
    category: "special",
    rarity: "epic",
    icon: "TestTube",
    criteria: { type: "custom", threshold: 1 },
    points: 150,
    secret: true,
  },
  {
    id: "anniversary",
    name: "Anniversary",
    description: "Been using the app for one year",
    category: "special",
    rarity: "legendary",
    icon: "Cake",
    criteria: { type: "time_based", threshold: 365, additionalConditions: { unit: "days" } },
    points: 500,
    rewards: [
      { type: "theme", value: "anniversary_theme", description: "Exclusive anniversary theme" },
    ],
  },
  {
    id: "tutorial_complete",
    name: "Quick Learner",
    description: "Complete the tutorial",
    category: "special",
    rarity: "common",
    icon: "GraduationCap",
    criteria: {
      type: "milestone",
      threshold: 1,
      additionalConditions: { milestone: "tutorial_complete" },
    },
    points: 10,
  },
  {
    id: "feedback_given",
    name: "Feedback Champion",
    description: "Provide feedback to help improve the app",
    category: "special",
    rarity: "uncommon",
    icon: "MessageSquare",
    criteria: { type: "feature_use", threshold: 1, additionalConditions: { feature: "feedback" } },
    points: 30,
  },
];

// Combined list of all achievements
export const allAchievements: Achievement[] = [
  ...scanningAchievements,
  ...consistencyAchievements,
  ...explorationAchievements,
  ...healthAchievements,
  ...socialAchievements,
  ...specialAchievements,
];

// Map for quick access
export const achievementsMap: Map<string, Achievement> = new Map(
  allAchievements.map(a => [a.id, a]),
);

/**
 * Get achievement by ID
 */
export function getAchievement(id: string): Achievement | undefined {
  return achievementsMap.get(id);
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return allAchievements.filter(a => a.category === category);
}

/**
 * Get achievements by rarity
 */
export function getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
  return allAchievements.filter(a => a.rarity === rarity);
}

/**
 * Calculate total possible points
 */
export function getTotalPossiblePoints(): number {
  return allAchievements.reduce((sum, a) => sum + a.points, 0);
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity: AchievementRarity): string {
  switch (rarity) {
    case "common":
      return "#9CA3AF"; // gray
    case "uncommon":
      return "#22C55E"; // green
    case "rare":
      return "#3B82F6"; // blue
    case "epic":
      return "#A855F7"; // purple
    case "legendary":
      return "#F59E0B"; // orange/gold
    default:
      return "#9CA3AF";
  }
}
