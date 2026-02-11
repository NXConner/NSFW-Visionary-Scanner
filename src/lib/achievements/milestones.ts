/**
 * Milestone Tracking
 * Tracks progress toward major milestones
 */

import { type AchievementCategory } from "./achievementDefinitions";

export type MilestoneStatus = "locked" | "in_progress" | "completed";

export interface Milestone {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  targetValue: number;
  unit: string;
  icon: string;
  tier: number; // 1-5, higher = more difficult
  rewards: MilestoneReward[];
}

export interface MilestoneReward {
  type: "points" | "badge" | "feature_unlock" | "title";
  value: string | number;
  description: string;
}

export interface MilestoneProgress {
  milestoneId: string;
  currentValue: number;
  targetValue: number;
  percentage: number;
  status: MilestoneStatus;
  completedAt?: string;
  tier: number;
}

export interface MilestoneCategory {
  category: AchievementCategory;
  name: string;
  description: string;
  milestones: Milestone[];
}

// ============ SCANNING MILESTONES ============

export const scanningMilestones: Milestone[] = [
  {
    id: "ms_scan_tier1",
    name: "Scanner Initiate",
    description: "Complete 10 scans",
    category: "scanning",
    targetValue: 10,
    unit: "scans",
    icon: "Camera",
    tier: 1,
    rewards: [{ type: "points", value: 50, description: "50 bonus points" }],
  },
  {
    id: "ms_scan_tier2",
    name: "Scanner Apprentice",
    description: "Complete 50 scans",
    category: "scanning",
    targetValue: 50,
    unit: "scans",
    icon: "Camera",
    tier: 2,
    rewards: [{ type: "points", value: 100, description: "100 bonus points" }],
  },
  {
    id: "ms_scan_tier3",
    name: "Scanner Expert",
    description: "Complete 200 scans",
    category: "scanning",
    targetValue: 200,
    unit: "scans",
    icon: "Award",
    tier: 3,
    rewards: [
      { type: "points", value: 200, description: "200 bonus points" },
      { type: "badge", value: "expert_scanner", description: "Expert Scanner badge" },
    ],
  },
  {
    id: "ms_scan_tier4",
    name: "Scanner Master",
    description: "Complete 500 scans",
    category: "scanning",
    targetValue: 500,
    unit: "scans",
    icon: "Trophy",
    tier: 4,
    rewards: [
      { type: "points", value: 400, description: "400 bonus points" },
      { type: "title", value: "Master Scanner", description: "Master Scanner title" },
    ],
  },
  {
    id: "ms_scan_tier5",
    name: "Scanner Legend",
    description: "Complete 1,000 scans",
    category: "scanning",
    targetValue: 1000,
    unit: "scans",
    icon: "Crown",
    tier: 5,
    rewards: [
      { type: "points", value: 1000, description: "1,000 bonus points" },
      { type: "badge", value: "legend_badge", description: "Legendary badge" },
      {
        type: "feature_unlock",
        value: "legend_features",
        description: "Exclusive legend features",
      },
    ],
  },
];

// ============ CONSISTENCY MILESTONES ============

export const consistencyMilestones: Milestone[] = [
  {
    id: "ms_streak_tier1",
    name: "Consistency Starter",
    description: "Achieve a 7-day streak",
    category: "consistency",
    targetValue: 7,
    unit: "days",
    icon: "Flame",
    tier: 1,
    rewards: [{ type: "points", value: 50, description: "50 bonus points" }],
  },
  {
    id: "ms_streak_tier2",
    name: "Consistency Builder",
    description: "Achieve a 14-day streak",
    category: "consistency",
    targetValue: 14,
    unit: "days",
    icon: "Flame",
    tier: 2,
    rewards: [{ type: "points", value: 100, description: "100 bonus points" }],
  },
  {
    id: "ms_streak_tier3",
    name: "Consistency Champion",
    description: "Achieve a 30-day streak",
    category: "consistency",
    targetValue: 30,
    unit: "days",
    icon: "TrendingUp",
    tier: 3,
    rewards: [
      { type: "points", value: 250, description: "250 bonus points" },
      { type: "badge", value: "consistency_champion", description: "Champion badge" },
    ],
  },
  {
    id: "ms_streak_tier4",
    name: "Consistency Master",
    description: "Achieve a 60-day streak",
    category: "consistency",
    targetValue: 60,
    unit: "days",
    icon: "Calendar",
    tier: 4,
    rewards: [
      { type: "points", value: 500, description: "500 bonus points" },
      { type: "title", value: "Consistency Master", description: "Consistency Master title" },
    ],
  },
  {
    id: "ms_streak_tier5",
    name: "Consistency Legend",
    description: "Achieve a 100-day streak",
    category: "consistency",
    targetValue: 100,
    unit: "days",
    icon: "Crown",
    tier: 5,
    rewards: [
      { type: "points", value: 1000, description: "1,000 bonus points" },
      { type: "badge", value: "unstoppable_badge", description: "Unstoppable badge" },
    ],
  },
];

// ============ HEALTH MILESTONES ============

export const healthMilestones: Milestone[] = [
  {
    id: "ms_health_tier1",
    name: "Health Beginner",
    description: "Complete 5 health checks",
    category: "health",
    targetValue: 5,
    unit: "checks",
    icon: "Heart",
    tier: 1,
    rewards: [{ type: "points", value: 30, description: "30 bonus points" }],
  },
  {
    id: "ms_health_tier2",
    name: "Health Aware",
    description: "Complete 20 health checks",
    category: "health",
    targetValue: 20,
    unit: "checks",
    icon: "Activity",
    tier: 2,
    rewards: [{ type: "points", value: 75, description: "75 bonus points" }],
  },
  {
    id: "ms_health_tier3",
    name: "Health Conscious",
    description: "Complete 50 health checks",
    category: "health",
    targetValue: 50,
    unit: "checks",
    icon: "Stethoscope",
    tier: 3,
    rewards: [
      { type: "points", value: 150, description: "150 bonus points" },
      { type: "badge", value: "health_conscious", description: "Health Conscious badge" },
    ],
  },
];

// ============ EXPLORATION MILESTONES ============

export const explorationMilestones: Milestone[] = [
  {
    id: "ms_explore_tier1",
    name: "Curious Explorer",
    description: "Try 5 different features",
    category: "exploration",
    targetValue: 5,
    unit: "features",
    icon: "Compass",
    tier: 1,
    rewards: [{ type: "points", value: 40, description: "40 bonus points" }],
  },
  {
    id: "ms_explore_tier2",
    name: "Feature Hunter",
    description: "Try 10 different features",
    category: "exploration",
    targetValue: 10,
    unit: "features",
    icon: "Map",
    tier: 2,
    rewards: [
      { type: "points", value: 100, description: "100 bonus points" },
      { type: "badge", value: "explorer", description: "Explorer badge" },
    ],
  },
  {
    id: "ms_explore_tier3",
    name: "Power User",
    description: "Master 15 different features",
    category: "exploration",
    targetValue: 15,
    unit: "features",
    icon: "Rocket",
    tier: 3,
    rewards: [
      { type: "points", value: 200, description: "200 bonus points" },
      { type: "title", value: "Power User", description: "Power User title" },
    ],
  },
];

// All milestones combined
export const allMilestones: Milestone[] = [
  ...scanningMilestones,
  ...consistencyMilestones,
  ...healthMilestones,
  ...explorationMilestones,
];

// Milestone categories for UI organization
export const milestoneCategories: MilestoneCategory[] = [
  {
    category: "scanning",
    name: "Scanning",
    description: "Complete scans to progress",
    milestones: scanningMilestones,
  },
  {
    category: "consistency",
    name: "Consistency",
    description: "Build and maintain streaks",
    milestones: consistencyMilestones,
  },
  {
    category: "health",
    name: "Health",
    description: "Track your health journey",
    milestones: healthMilestones,
  },
  {
    category: "exploration",
    name: "Exploration",
    description: "Discover all features",
    milestones: explorationMilestones,
  },
];

// Map for quick access
export const milestonesMap: Map<string, Milestone> = new Map(allMilestones.map(m => [m.id, m]));

/**
 * Get milestone by ID
 */
export function getMilestone(id: string): Milestone | undefined {
  return milestonesMap.get(id);
}

/**
 * Calculate milestone progress
 */
export function calculateMilestoneProgress(
  milestone: Milestone,
  currentValue: number,
  completedAt?: string,
): MilestoneProgress {
  const percentage = Math.min(100, (currentValue / milestone.targetValue) * 100);
  let status: MilestoneStatus = "locked";

  if (currentValue >= milestone.targetValue || completedAt) {
    status = "completed";
  } else if (currentValue > 0) {
    status = "in_progress";
  }

  return {
    milestoneId: milestone.id,
    currentValue,
    targetValue: milestone.targetValue,
    percentage,
    status,
    completedAt,
    tier: milestone.tier,
  };
}

/**
 * Get next milestone in a category
 */
export function getNextMilestone(
  category: AchievementCategory,
  currentValue: number,
): Milestone | undefined {
  const categoryMilestones = allMilestones
    .filter(m => m.category === category)
    .sort((a, b) => a.targetValue - b.targetValue);

  return categoryMilestones.find(m => m.targetValue > currentValue);
}

/**
 * Get tier color
 */
export function getTierColor(tier: number): string {
  switch (tier) {
    case 1:
      return "#9CA3AF"; // gray
    case 2:
      return "#22C55E"; // green
    case 3:
      return "#3B82F6"; // blue
    case 4:
      return "#A855F7"; // purple
    case 5:
      return "#F59E0B"; // gold
    default:
      return "#9CA3AF";
  }
}
