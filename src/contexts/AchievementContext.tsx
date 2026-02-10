/**
 * Achievement Context
 * Global state management for achievements
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  AchievementManager,
  getAchievementManager,
  type UnlockedAchievement,
  type AchievementStats,
  type AchievementEvent,
} from '@/lib/achievements/AchievementManager';
import {
  type Achievement,
  type AchievementCategory,
  allAchievements,
  getAchievement,
  getAchievementsByCategory,
} from '@/lib/achievements/achievementDefinitions';
import {
  type MilestoneProgress,
  type Milestone,
  allMilestones,
  getMilestone,
  milestoneCategories,
} from '@/lib/achievements/milestones';
import { useSettings } from '@/contexts/settings';

export interface AchievementContextValue {
  // State
  unlockedAchievements: UnlockedAchievement[];
  milestoneProgress: MilestoneProgress[];
  stats: AchievementStats;
  totalPoints: number;
  recentlyUnlocked: Achievement | null;
  showingToast: boolean;

  // Computed
  allAchievements: Achievement[];
  allMilestones: Milestone[];
  categories: typeof milestoneCategories;
  unlockedCount: number;
  totalCount: number;
  completionPercentage: number;

  // Actions
  recordScan: (scanData?: { quality?: number; duration?: number }) => void;
  recordFeatureUse: (featureId: string) => void;
  recordHealthCheck: () => void;
  recordSocialShare: () => void;
  recordMilestone: (milestoneKey: string) => void;

  // Queries
  isUnlocked: (achievementId: string) => boolean;
  getAchievementById: (id: string) => Achievement | undefined;
  getProgress: (achievementId: string) => { current: number; target: number; percentage: number } | null;
  getAchievementsByCategory: (category: AchievementCategory) => Achievement[];
  getMilestoneById: (id: string) => Milestone | undefined;

  // UI
  dismissToast: () => void;
  markAsNotified: (achievementId: string) => void;
}

const AchievementContext = createContext<AchievementContextValue | null>(null);

export interface AchievementProviderProps {
  children: ReactNode;
}

export function AchievementProvider({ children }: AchievementProviderProps) {
  const { settings } = useSettings();
  const achievementSettings = settings.achievements;

  const [manager] = useState(() => getAchievementManager());
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [milestoneProgress, setMilestoneProgress] = useState<MilestoneProgress[]>([]);
  const [stats, setStats] = useState<AchievementStats>(() => manager.getStats());
  const [totalPoints, setTotalPoints] = useState(0);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<Achievement | null>(null);
  const [showingToast, setShowingToast] = useState(false);

  // Initialize and subscribe to events
  useEffect(() => {
    // Load initial state
    setUnlockedAchievements(manager.getUnlockedAchievements());
    setMilestoneProgress(manager.getAllMilestoneProgress());
    setStats(manager.getStats());
    setTotalPoints(manager.getTotalPoints());

    // Check for unnotified achievements on load
    const unnotified = manager.getUnnotifiedAchievements();
    if (unnotified.length > 0 && achievementSettings?.showNotifications) {
      const achievement = getAchievement(unnotified[0].achievementId);
      if (achievement) {
        setRecentlyUnlocked(achievement);
        setShowingToast(true);
      }
    }

    // Subscribe to events
    const unsubscribe = manager.subscribe((event: AchievementEvent) => {
      switch (event.type) {
        case 'achievement_unlocked': {
          const { achievement } = event.data as { achievement: Achievement };
          setUnlockedAchievements(manager.getUnlockedAchievements());
          setTotalPoints(manager.getTotalPoints());
          
          if (achievementSettings?.showNotifications) {
            setRecentlyUnlocked(achievement);
            setShowingToast(true);
          }
          break;
        }

        case 'milestone_completed':
        case 'milestone_progress':
          setMilestoneProgress(manager.getAllMilestoneProgress());
          break;

        case 'stats_updated':
          setStats(manager.getStats());
          break;

        case 'points_earned':
          setTotalPoints(manager.getTotalPoints());
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [manager, achievementSettings?.showNotifications]);

  // Actions
  const recordScan = useCallback((scanData?: { quality?: number; duration?: number }) => {
    if (achievementSettings?.enabled !== false) {
      manager.recordScan(scanData);
    }
  }, [manager, achievementSettings?.enabled]);

  const recordFeatureUse = useCallback((featureId: string) => {
    if (achievementSettings?.enabled !== false) {
      manager.recordFeatureUse(featureId);
    }
  }, [manager, achievementSettings?.enabled]);

  const recordHealthCheck = useCallback(() => {
    if (achievementSettings?.enabled !== false) {
      manager.recordHealthCheck();
    }
  }, [manager, achievementSettings?.enabled]);

  const recordSocialShare = useCallback(() => {
    if (achievementSettings?.enabled !== false) {
      manager.recordSocialShare();
    }
  }, [manager, achievementSettings?.enabled]);

  const recordMilestone = useCallback((milestoneKey: string) => {
    if (achievementSettings?.enabled !== false) {
      manager.recordMilestone(milestoneKey);
    }
  }, [manager, achievementSettings?.enabled]);

  // Queries
  const isUnlocked = useCallback((achievementId: string) => {
    return manager.isAchievementUnlocked(achievementId);
  }, [manager]);

  const getAchievementById = useCallback((id: string) => {
    return getAchievement(id);
  }, []);

  const getProgress = useCallback((achievementId: string) => {
    return manager.getAchievementProgress(achievementId);
  }, [manager]);

  const getMilestoneById = useCallback((id: string) => {
    return getMilestone(id);
  }, []);

  // UI
  const dismissToast = useCallback(() => {
    if (recentlyUnlocked) {
      manager.markAsNotified(recentlyUnlocked.id);
    }
    setShowingToast(false);
    setRecentlyUnlocked(null);
  }, [manager, recentlyUnlocked]);

  const markAsNotified = useCallback((achievementId: string) => {
    manager.markAsNotified(achievementId);
  }, [manager]);

  // Computed values
  const unlockedCount = unlockedAchievements.length;
  const totalCount = allAchievements.length;
  const completionPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const value: AchievementContextValue = {
    // State
    unlockedAchievements,
    milestoneProgress,
    stats,
    totalPoints,
    recentlyUnlocked,
    showingToast,

    // Computed
    allAchievements,
    allMilestones,
    categories: milestoneCategories,
    unlockedCount,
    totalCount,
    completionPercentage,

    // Actions
    recordScan,
    recordFeatureUse,
    recordHealthCheck,
    recordSocialShare,
    recordMilestone,

    // Queries
    isUnlocked,
    getAchievementById,
    getProgress,
    getAchievementsByCategory,
    getMilestoneById,

    // UI
    dismissToast,
    markAsNotified,
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}

export function useAchievements(): AchievementContextValue {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
}

export default AchievementContext;
