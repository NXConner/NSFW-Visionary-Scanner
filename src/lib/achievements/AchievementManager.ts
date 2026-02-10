/**
 * Achievement Manager
 * Core logic for tracking and unlocking achievements
 */

import {
  allAchievements,
  getAchievement,
  type Achievement,
  type AchievementCategory,
  type AchievementTrigger,
  type AchievementCriteria,
} from './achievementDefinitions';
import {
  allMilestones,
  getMilestone,
  calculateMilestoneProgress,
  type Milestone,
  type MilestoneProgress,
} from './milestones';

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: string;
  notified: boolean;
}

export interface AchievementStats {
  totalScans: number;
  currentStreak: number;
  longestStreak: number;
  lastScanDate: string | null;
  featuresUsed: Set<string>;
  healthChecks: number;
  socialShares: number;
  totalPoints: number;
  accountCreatedAt: string;
  customMetrics: Record<string, number>;
}

export interface AchievementManagerState {
  unlockedAchievements: Map<string, UnlockedAchievement>;
  milestoneProgress: Map<string, MilestoneProgress>;
  stats: AchievementStats;
}

export type AchievementEventType = 
  | 'achievement_unlocked'
  | 'milestone_completed'
  | 'milestone_progress'
  | 'stats_updated'
  | 'points_earned';

export interface AchievementEvent {
  type: AchievementEventType;
  data: unknown;
}

export type AchievementListener = (event: AchievementEvent) => void;

const STORAGE_KEY = 'achievement_manager_state';

/**
 * Achievement Manager Class
 */
export class AchievementManager {
  private state: AchievementManagerState;
  private listeners: Set<AchievementListener> = new Set();
  private initialized: boolean = false;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): AchievementManagerState {
    return {
      unlockedAchievements: new Map(),
      milestoneProgress: new Map(),
      stats: {
        totalScans: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastScanDate: null,
        featuresUsed: new Set(),
        healthChecks: 0,
        socialShares: 0,
        totalPoints: 0,
        accountCreatedAt: new Date().toISOString(),
        customMetrics: {},
      },
    };
  }

  /**
   * Initialize from persisted state
   */
  initialize(): void {
    if (this.initialized) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        this.state.unlockedAchievements = new Map(
          Object.entries(parsed.unlockedAchievements || {})
        );
        this.state.milestoneProgress = new Map(
          Object.entries(parsed.milestoneProgress || {})
        );
        this.state.stats = {
          ...this.state.stats,
          ...parsed.stats,
          featuresUsed: new Set(parsed.stats?.featuresUsed || []),
        };
      }
    } catch (error) {
      console.error('Failed to load achievement state:', error);
    }

    this.initialized = true;
  }

  /**
   * Persist state to storage
   */
  private persist(): void {
    try {
      const toStore = {
        unlockedAchievements: Object.fromEntries(this.state.unlockedAchievements),
        milestoneProgress: Object.fromEntries(this.state.milestoneProgress),
        stats: {
          ...this.state.stats,
          featuresUsed: Array.from(this.state.stats.featuresUsed),
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error('Failed to persist achievement state:', error);
    }
  }

  /**
   * Subscribe to achievement events
   */
  subscribe(listener: AchievementListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: AchievementEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  // ============ STAT TRACKING ============

  /**
   * Record a scan
   */
  recordScan(scanData?: { quality?: number; duration?: number }): void {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = this.state.stats.lastScanDate;

    // Update scan count
    this.state.stats.totalScans++;

    // Update streak
    if (lastDate) {
      const lastDateObj = new Date(lastDate);
      const todayObj = new Date(today);
      const diffDays = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        this.state.stats.currentStreak++;
      } else if (diffDays > 1) {
        // Streak broken
        this.state.stats.currentStreak = 1;
      }
      // Same day - no streak change
    } else {
      this.state.stats.currentStreak = 1;
    }

    // Update longest streak
    if (this.state.stats.currentStreak > this.state.stats.longestStreak) {
      this.state.stats.longestStreak = this.state.stats.currentStreak;
    }

    this.state.stats.lastScanDate = today;

    // Custom metrics
    if (scanData?.quality) {
      this.state.stats.customMetrics['best_quality'] = Math.max(
        this.state.stats.customMetrics['best_quality'] || 0,
        scanData.quality
      );
    }
    if (scanData?.duration) {
      this.state.stats.customMetrics['fastest_scan'] = Math.min(
        this.state.stats.customMetrics['fastest_scan'] || Infinity,
        scanData.duration
      );
    }

    this.emit({ type: 'stats_updated', data: { stat: 'scan', value: this.state.stats.totalScans } });
    this.checkAchievements('scan_count');
    this.checkAchievements('consecutive_days');
    this.checkMilestones('scanning');
    this.checkMilestones('consistency');
    this.persist();
  }

  /**
   * Record feature usage
   */
  recordFeatureUse(featureId: string): void {
    this.state.stats.featuresUsed.add(featureId);
    this.emit({ type: 'stats_updated', data: { stat: 'feature_use', feature: featureId } });
    this.checkAchievements('feature_use');
    this.checkMilestones('exploration');
    this.persist();
  }

  /**
   * Record health check
   */
  recordHealthCheck(): void {
    this.state.stats.healthChecks++;
    this.emit({ type: 'stats_updated', data: { stat: 'health_check', value: this.state.stats.healthChecks } });
    this.checkAchievements('health_check');
    this.checkMilestones('health');
    this.persist();
  }

  /**
   * Record social share
   */
  recordSocialShare(): void {
    this.state.stats.socialShares++;
    this.emit({ type: 'stats_updated', data: { stat: 'social_share', value: this.state.stats.socialShares } });
    this.checkAchievements('social_share');
    this.persist();
  }

  /**
   * Record custom milestone
   */
  recordMilestone(milestoneKey: string): void {
    this.state.stats.customMetrics[milestoneKey] = (this.state.stats.customMetrics[milestoneKey] || 0) + 1;
    this.checkAchievements('milestone');
    this.persist();
  }

  /**
   * Set custom metric
   */
  setCustomMetric(key: string, value: number): void {
    this.state.stats.customMetrics[key] = value;
    this.checkAchievements('custom');
    this.persist();
  }

  // ============ ACHIEVEMENT CHECKING ============

  /**
   * Check achievements of a specific trigger type
   */
  private checkAchievements(triggerType: AchievementTrigger): void {
    const relevantAchievements = allAchievements.filter(a => a.criteria.type === triggerType);

    for (const achievement of relevantAchievements) {
      if (this.state.unlockedAchievements.has(achievement.id)) continue;
      if (this.checkCriteria(achievement.criteria)) {
        this.unlockAchievement(achievement);
      }
    }
  }

  /**
   * Check if criteria is met
   */
  private checkCriteria(criteria: AchievementCriteria): boolean {
    const comparison = criteria.comparison || 'gte';
    let currentValue = 0;

    switch (criteria.type) {
      case 'scan_count':
        currentValue = this.state.stats.totalScans;
        break;

      case 'consecutive_days':
        currentValue = this.state.stats.currentStreak;
        break;

      case 'feature_use':
        if (criteria.additionalConditions?.unique) {
          currentValue = this.state.stats.featuresUsed.size;
        } else if (criteria.additionalConditions?.feature) {
          currentValue = this.state.stats.featuresUsed.has(criteria.additionalConditions.feature as string) ? 1 : 0;
        }
        break;

      case 'health_check':
        currentValue = this.state.stats.healthChecks;
        break;

      case 'social_share':
        currentValue = this.state.stats.socialShares;
        break;

      case 'measurement_accuracy':
        currentValue = this.state.stats.customMetrics['best_quality'] || 0;
        break;

      case 'time_based':
        if (criteria.additionalConditions?.unit === 'days') {
          const created = new Date(this.state.stats.accountCreatedAt);
          const now = new Date();
          currentValue = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        } else if (criteria.additionalConditions?.before || criteria.additionalConditions?.after) {
          const hour = new Date().getHours();
          if (criteria.additionalConditions.before) {
            return hour < criteria.threshold;
          } else {
            return hour >= criteria.threshold;
          }
        }
        break;

      case 'milestone':
        const milestoneKey = criteria.additionalConditions?.milestone as string;
        currentValue = this.state.stats.customMetrics[milestoneKey] || 0;
        break;

      case 'custom':
        const metricKey = criteria.additionalConditions?.metric as string;
        if (metricKey) {
          currentValue = this.state.stats.customMetrics[metricKey] || 0;
        }
        break;
    }

    return this.compare(currentValue, criteria.threshold, comparison);
  }

  private compare(value: number, threshold: number, comparison: string): boolean {
    switch (comparison) {
      case 'eq': return value === threshold;
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return value >= threshold;
    }
  }

  /**
   * Unlock an achievement
   */
  private unlockAchievement(achievement: Achievement): void {
    const unlocked: UnlockedAchievement = {
      achievementId: achievement.id,
      unlockedAt: new Date().toISOString(),
      notified: false,
    };

    this.state.unlockedAchievements.set(achievement.id, unlocked);
    this.state.stats.totalPoints += achievement.points;

    this.emit({
      type: 'achievement_unlocked',
      data: { achievement, unlocked },
    });

    this.emit({
      type: 'points_earned',
      data: { points: achievement.points, source: 'achievement', achievementId: achievement.id },
    });

    this.persist();
  }

  /**
   * Manually unlock achievement (for special cases)
   */
  forceUnlockAchievement(achievementId: string): boolean {
    const achievement = getAchievement(achievementId);
    if (!achievement) return false;
    if (this.state.unlockedAchievements.has(achievementId)) return false;

    this.unlockAchievement(achievement);
    return true;
  }

  // ============ MILESTONE CHECKING ============

  /**
   * Check milestones for a category
   */
  private checkMilestones(category: AchievementCategory): void {
    const relevantMilestones = allMilestones.filter(m => m.category === category);

    for (const milestone of relevantMilestones) {
      const currentValue = this.getMilestoneCurrentValue(milestone);
      const existingProgress = this.state.milestoneProgress.get(milestone.id);

      const progress = calculateMilestoneProgress(
        milestone,
        currentValue,
        existingProgress?.completedAt
      );

      // Check if newly completed
      if (progress.status === 'completed' && existingProgress?.status !== 'completed') {
        progress.completedAt = new Date().toISOString();

        // Award milestone rewards
        for (const reward of milestone.rewards) {
          if (reward.type === 'points') {
            this.state.stats.totalPoints += reward.value as number;
            this.emit({
              type: 'points_earned',
              data: { points: reward.value, source: 'milestone', milestoneId: milestone.id },
            });
          }
        }

        this.emit({
          type: 'milestone_completed',
          data: { milestone, progress },
        });
      } else if (progress.percentage !== existingProgress?.percentage) {
        this.emit({
          type: 'milestone_progress',
          data: { milestone, progress },
        });
      }

      this.state.milestoneProgress.set(milestone.id, progress);
    }

    this.persist();
  }

  private getMilestoneCurrentValue(milestone: Milestone): number {
    switch (milestone.category) {
      case 'scanning':
        return this.state.stats.totalScans;
      case 'consistency':
        return this.state.stats.longestStreak;
      case 'health':
        return this.state.stats.healthChecks;
      case 'exploration':
        return this.state.stats.featuresUsed.size;
      default:
        return 0;
    }
  }

  // ============ GETTERS ============

  /**
   * Get all unlocked achievements
   */
  getUnlockedAchievements(): UnlockedAchievement[] {
    return Array.from(this.state.unlockedAchievements.values());
  }

  /**
   * Check if achievement is unlocked
   */
  isAchievementUnlocked(id: string): boolean {
    return this.state.unlockedAchievements.has(id);
  }

  /**
   * Get achievement progress
   */
  getAchievementProgress(id: string): { current: number; target: number; percentage: number } | null {
    const achievement = getAchievement(id);
    if (!achievement) return null;

    let current = 0;
    const target = achievement.criteria.threshold;

    switch (achievement.criteria.type) {
      case 'scan_count':
        current = this.state.stats.totalScans;
        break;
      case 'consecutive_days':
        current = this.state.stats.currentStreak;
        break;
      case 'feature_use':
        current = this.state.stats.featuresUsed.size;
        break;
      case 'health_check':
        current = this.state.stats.healthChecks;
        break;
      case 'social_share':
        current = this.state.stats.socialShares;
        break;
    }

    return {
      current,
      target,
      percentage: Math.min(100, (current / target) * 100),
    };
  }

  /**
   * Get all milestone progress
   */
  getAllMilestoneProgress(): MilestoneProgress[] {
    return Array.from(this.state.milestoneProgress.values());
  }

  /**
   * Get stats
   */
  getStats(): AchievementStats {
    return { ...this.state.stats };
  }

  /**
   * Get total points
   */
  getTotalPoints(): number {
    return this.state.stats.totalPoints;
  }

  /**
   * Mark achievement as notified
   */
  markAsNotified(achievementId: string): void {
    const unlocked = this.state.unlockedAchievements.get(achievementId);
    if (unlocked) {
      unlocked.notified = true;
      this.state.unlockedAchievements.set(achievementId, unlocked);
      this.persist();
    }
  }

  /**
   * Get unnotified achievements
   */
  getUnnotifiedAchievements(): UnlockedAchievement[] {
    return Array.from(this.state.unlockedAchievements.values()).filter(a => !a.notified);
  }

  /**
   * Reset all progress (use with caution)
   */
  resetProgress(): void {
    this.state = this.createInitialState();
    localStorage.removeItem(STORAGE_KEY);
    this.persist();
  }
}

// Singleton instance
let managerInstance: AchievementManager | null = null;

export function getAchievementManager(): AchievementManager {
  if (!managerInstance) {
    managerInstance = new AchievementManager();
    managerInstance.initialize();
  }
  return managerInstance;
}
