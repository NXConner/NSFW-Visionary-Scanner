/**
 * Achievements Page
 * Full page view for achievements and milestones
 */

import React from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Target, Flame, Heart, Compass } from "lucide-react";
import { AchievementsPanel } from "@/components/achievements/AchievementsPanel";
import { AchievementToast } from "@/components/achievements/AchievementToast";
import { useAchievements } from "@/contexts/AchievementContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getTierColor } from "@/lib/achievements/milestones";

export function AchievementsPage() {
  const {
    recentlyUnlocked,
    showingToast,
    dismissToast,
    categories,
    milestoneProgress,
    stats,
    totalPoints,
    unlockedCount,
    totalCount,
    completionPercentage,
    getMilestoneById,
  } = useAchievements();

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Toast for newly unlocked achievements */}
      <AchievementToast
        achievement={recentlyUnlocked}
        isVisible={showingToast}
        onDismiss={dismissToast}
      />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Achievements</h1>
        </div>
        <p className="text-muted-foreground">
          Track your progress and unlock badges as you explore the app
        </p>
      </motion.div>

      {/* Main content */}
      <Tabs defaultValue="achievements" className="space-y-6">
        <TabsList>
          <TabsTrigger value="achievements" className="gap-2">
            <Trophy className="h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="milestones" className="gap-2">
            <Target className="h-4 w-4" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <Star className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <AchievementsPanel />
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones">
          <div className="space-y-6">
            {categories.map(category => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {category.category === "scanning" && <Trophy className="h-5 w-5" />}
                    {category.category === "consistency" && <Flame className="h-5 w-5" />}
                    {category.category === "health" && <Heart className="h-5 w-5" />}
                    {category.category === "exploration" && <Compass className="h-5 w-5" />}
                    {category.name}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.milestones.map(milestone => {
                      const progress = milestoneProgress.find(p => p.milestoneId === milestone.id);
                      const tierColor = getTierColor(milestone.tier);
                      const isCompleted = progress?.status === "completed";

                      return (
                        <div
                          key={milestone.id}
                          className="flex items-center gap-4 p-4 rounded-lg border bg-muted/20"
                        >
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
                            style={{ backgroundColor: tierColor }}
                          >
                            {milestone.tier}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{milestone.name}</span>
                              {isCompleted && (
                                <Badge variant="secondary" className="text-xs">
                                  Complete!
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {milestone.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <Progress value={progress?.percentage || 0} className="flex-1 h-2" />
                              <span className="text-sm text-muted-foreground">
                                {progress?.currentValue || 0} / {milestone.targetValue}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star size={14} className="text-yellow-500" />
                              <span>
                                {milestone.rewards
                                  .filter(r => r.type === "points")
                                  .reduce((sum, r) => sum + (r.value as number), 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overall Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary mb-2">
                  {completionPercentage.toFixed(1)}%
                </div>
                <Progress value={completionPercentage} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  {unlockedCount} of {totalCount} achievements unlocked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Star className="h-8 w-8 text-yellow-500" />
                  <span className="text-4xl font-bold">{totalPoints}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Points earned from achievements and milestones
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Flame className="h-8 w-8 text-orange-500" />
                  <span className="text-4xl font-bold">{stats.currentStreak}</span>
                  <span className="text-muted-foreground">days</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Longest streak: {stats.longestStreak} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Scans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.totalScans}</div>
                <p className="text-sm text-muted-foreground mt-2">Scans completed since joining</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Features Explored</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.featuresUsed.size}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Different features you've tried
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Health Checks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.healthChecks}</div>
                <p className="text-sm text-muted-foreground mt-2">Health self-checks completed</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AchievementsPage;
