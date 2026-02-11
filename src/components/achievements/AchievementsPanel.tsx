/**
 * Achievements Panel
 * Full view of all achievements with filtering and progress
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Star,
  Filter,
  Grid,
  List,
  Search,
  TrendingUp,
  Flame,
  Lock,
  Unlock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAchievements } from "@/contexts/AchievementContext";
import { AchievementBadge } from "./AchievementBadge";
import {
  type Achievement,
  type AchievementCategory,
  type AchievementRarity,
  getRarityColor,
} from "@/lib/achievements/achievementDefinitions";
import { type MilestoneProgress, getTierColor } from "@/lib/achievements/milestones";

export interface AchievementsPanelProps {
  className?: string;
  compact?: boolean;
}

type ViewMode = "grid" | "list";
type FilterRarity = AchievementRarity | "all";
type FilterStatus = "all" | "unlocked" | "locked";

const categoryIcons: Record<AchievementCategory, React.ReactNode> = {
  scanning: <Trophy className="h-4 w-4" />,
  consistency: <Flame className="h-4 w-4" />,
  exploration: <Star className="h-4 w-4" />,
  health: <TrendingUp className="h-4 w-4" />,
  social: <Star className="h-4 w-4" />,
  special: <Star className="h-4 w-4" />,
};

export function AchievementsPanel({ className, compact = false }: AchievementsPanelProps) {
  const {
    allAchievements,
    unlockedAchievements,
    milestoneProgress,
    stats,
    totalPoints,
    categories,
    unlockedCount,
    totalCount,
    completionPercentage,
    isUnlocked,
    getProgress,
  } = useAchievements();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRarity, setFilterRarity] = useState<FilterRarity>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | "all">("all");

  // Filter and sort achievements
  const filteredAchievements = useMemo(() => {
    return allAchievements.filter(achievement => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !achievement.name.toLowerCase().includes(query) &&
          !achievement.description.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Category filter
      if (activeCategory !== "all" && achievement.category !== activeCategory) {
        return false;
      }

      // Rarity filter
      if (filterRarity !== "all" && achievement.rarity !== filterRarity) {
        return false;
      }

      // Status filter
      const unlocked = isUnlocked(achievement.id);
      if (filterStatus === "unlocked" && !unlocked) return false;
      if (filterStatus === "locked" && unlocked) return false;

      return true;
    });
  }, [allAchievements, searchQuery, activeCategory, filterRarity, filterStatus, isUnlocked]);

  // Group by category for list view
  const groupedAchievements = useMemo(() => {
    const groups: Record<string, Achievement[]> = {};
    filteredAchievements.forEach(achievement => {
      const cat = achievement.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(achievement);
    });
    return groups;
  }, [filteredAchievements]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Trophy className="h-4 w-4" />
            <span>Achievements</span>
          </div>
          <div className="text-2xl font-bold">
            {unlockedCount} / {totalCount}
          </div>
          <Progress value={completionPercentage} className="mt-2 h-1" />
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Star className="h-4 w-4" />
            <span>Total Points</span>
          </div>
          <div className="text-2xl font-bold text-primary">{totalPoints}</div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Flame className="h-4 w-4" />
            <span>Current Streak</span>
          </div>
          <div className="text-2xl font-bold">{stats.currentStreak} days</div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <TrendingUp className="h-4 w-4" />
            <span>Total Scans</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalScans}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={filterRarity} onValueChange={val => setFilterRarity(val as FilterRarity)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Rarity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rarities</SelectItem>
            <SelectItem value="common">Common</SelectItem>
            <SelectItem value="uncommon">Uncommon</SelectItem>
            <SelectItem value="rare">Rare</SelectItem>
            <SelectItem value="epic">Epic</SelectItem>
            <SelectItem value="legendary">Legendary</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={val => setFilterStatus(val as FilterStatus)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unlocked">
              <div className="flex items-center gap-2">
                <Unlock className="h-3 w-3" />
                Unlocked
              </div>
            </SelectItem>
            <SelectItem value="locked">
              <div className="flex items-center gap-2">
                <Lock className="h-3 w-3" />
                Locked
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-none rounded-l-md"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-none rounded-r-md"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs
        value={activeCategory}
        onValueChange={val => setActiveCategory(val as AchievementCategory | "all")}
      >
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-xs">
            All
          </TabsTrigger>
          <TabsTrigger value="scanning" className="text-xs">
            <Trophy className="h-3 w-3 mr-1" />
            Scanning
          </TabsTrigger>
          <TabsTrigger value="consistency" className="text-xs">
            <Flame className="h-3 w-3 mr-1" />
            Consistency
          </TabsTrigger>
          <TabsTrigger value="exploration" className="text-xs">
            <Star className="h-3 w-3 mr-1" />
            Exploration
          </TabsTrigger>
          <TabsTrigger value="health" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Health
          </TabsTrigger>
          <TabsTrigger value="special" className="text-xs">
            <Star className="h-3 w-3 mr-1" />
            Special
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          <ScrollArea className="h-[500px] pr-4">
            {viewMode === "grid" ? (
              <motion.div
                className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3"
                layout
              >
                <AnimatePresence>
                  {filteredAchievements.map(achievement => {
                    const unlocked = isUnlocked(achievement.id);
                    const progress = getProgress(achievement.id);
                    const unlockedData = unlockedAchievements.find(
                      a => a.achievementId === achievement.id,
                    );

                    return (
                      <motion.div
                        key={achievement.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <AchievementBadge
                          achievement={achievement}
                          unlocked={unlocked}
                          unlockedAt={unlockedData?.unlockedAt}
                          size="md"
                          showProgress
                          progress={progress || undefined}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedAchievements).map(([category, achievements]) => (
                  <div key={category}>
                    <h4 className="font-medium capitalize mb-2 flex items-center gap-2">
                      {categoryIcons[category as AchievementCategory]}
                      {category}
                      <Badge variant="secondary" className="ml-auto">
                        {achievements.filter(a => isUnlocked(a.id)).length} / {achievements.length}
                      </Badge>
                    </h4>
                    <div className="space-y-2">
                      {achievements.map(achievement => {
                        const unlocked = isUnlocked(achievement.id);
                        const progress = getProgress(achievement.id);
                        const rarityColor = getRarityColor(achievement.rarity);

                        return (
                          <motion.div
                            key={achievement.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border",
                              unlocked ? "bg-muted/30" : "bg-muted/10 opacity-60",
                            )}
                            layout
                          >
                            <AchievementBadge
                              achievement={achievement}
                              unlocked={unlocked}
                              size="sm"
                              showTooltip={false}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                  {achievement.secret && !unlocked ? "???" : achievement.name}
                                </span>
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                                  style={{
                                    backgroundColor: `${rarityColor}20`,
                                    color: rarityColor,
                                  }}
                                >
                                  {achievement.rarity}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {achievement.secret && !unlocked
                                  ? "Secret achievement"
                                  : achievement.description}
                              </p>
                              {!unlocked && progress && (
                                <Progress value={progress.percentage} className="h-1 mt-2" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star size={14} style={{ color: rarityColor }} />
                              <span>{achievement.points}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredAchievements.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No achievements found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AchievementsPanel;
