/**
 * Achievement System Component
 * Displays achievements, badges, streaks, milestones, and leaderboards
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Award, Trophy, Flame, Target, TrendingUp, Users,
  Lock, CheckCircle2, Star, Zap, Calendar, Loader2
} from 'lucide-react'
import {
  getAchievementDefinitions,
  getUserAchievements,
  getUserStreaks,
  getUserMilestones,
  getLeaderboard,
  optInToLeaderboard,
  getAchievementStats,
  type UserAchievement,
  type UserStreak,
  type UserMilestone,
  type AchievementDefinition
} from '@/lib/achievements'
import { toast } from 'sonner'

const categoryIcons = {
  consistency: Flame,
  progress: TrendingUp,
  health: Target,
  community: Users,
  premium: Star,
  special: Trophy
}

const categoryColors = {
  consistency: 'text-orange-500',
  progress: 'text-blue-500',
  health: 'text-green-500',
  community: 'text-purple-500',
  premium: 'text-yellow-500',
  special: 'text-pink-500'
}

export const AchievementSystem = () => {
  const [definitions, setDefinitions] = useState<AchievementDefinition[]>([])
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [streaks, setStreaks] = useState<UserStreak[]>([])
  const [milestones, setMilestones] = useState<UserMilestone[]>([])
  const [leaderboard, setLeaderboard] = useState<Array<{ display_name: string; score: number; rank: number }>>([])
  const [stats, setStats] = useState<{
    total_achievements: number
    unlocked_achievements: number
    total_points: number
    completion_percentage: number
    recent_unlocks: UserAchievement[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    const [defs, userAchievements, userStreaks, userMilestones, statsData] = await Promise.all([
      getAchievementDefinitions(),
      getUserAchievements(),
      getUserStreaks(),
      getUserMilestones(),
      getAchievementStats()
    ])
    setDefinitions(defs)
    setAchievements(userAchievements)
    setStreaks(userStreaks)
    setMilestones(userMilestones)
    setStats(statsData)
    setIsLoading(false)
  }

  const handleOptInLeaderboard = async () => {
    const success = await optInToLeaderboard('achievements', true)
    if (success) {
      toast.success('Opted in to leaderboard!')
      const leaderboardData = await getLeaderboard('achievements', 'all_time', 10)
      setLeaderboard(leaderboardData)
    }
  }

  const filteredDefinitions = selectedCategory === 'all'
    ? definitions
    : definitions.filter(d => d.category === selectedCategory)

  const categories = ['all', ...new Set(definitions.map(d => d.category))]

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {stats && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Achievement Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-primary/10">
                <div className="text-2xl font-bold">{stats.unlocked_achievements}</div>
                <div className="text-sm text-muted-foreground">Unlocked</div>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10">
                <div className="text-2xl font-bold">{stats.total_achievements}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10">
                <div className="text-2xl font-bold">{stats.total_points}</div>
                <div className="text-sm text-muted-foreground">Points</div>
              </div>
              <div className="p-4 rounded-lg bg-purple-500/10">
                <div className="text-2xl font-bold">{stats.completion_percentage.toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </div>
            {stats.total_achievements > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{stats.completion_percentage.toFixed(1)}%</span>
                </div>
                <Progress value={stats.completion_percentage} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="achievements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="streaks">Streaks</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>
                Unlock achievements by completing challenges and reaching milestones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Button>
                ))}
              </div>

              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDefinitions.map((def) => {
                    const userAchievement = achievements.find(a => a.achievement_id === def.id)
                    const isUnlocked = userAchievement?.is_unlocked || false
                    const progress = userAchievement?.progress || 0
                    const requirement = def.requirement_value || 0
                    const progressPercent = requirement > 0 ? Math.min((progress / requirement) * 100, 100) : 0
                    const Icon = categoryIcons[def.category] || Award

                    return (
                      <Card
                        key={def.id}
                        className={`border-2 ${isUnlocked ? 'border-primary' : 'border-muted'}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                isUnlocked ? 'bg-primary/20' : 'bg-muted'
                              }`}
                            >
                              {isUnlocked ? (
                                <CheckCircle2 className={`w-6 h-6 ${categoryColors[def.category]}`} />
                              ) : (
                                <Icon className={`w-6 h-6 ${categoryColors[def.category]}`} />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{def.name}</h3>
                                {def.is_premium && (
                                  <Badge variant="outline" className="text-xs">
                                    Premium
                                  </Badge>
                                )}
                                {isUnlocked && (
                                  <Badge variant="default" className="text-xs">
                                    Unlocked
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{def.description}</p>
                              {!isUnlocked && requirement > 0 && (
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Progress</span>
                                    <span>{progress} / {requirement}</span>
                                  </div>
                                  <Progress value={progressPercent} className="h-1.5" />
                                </div>
                              )}
                              {isUnlocked && userAchievement?.unlocked_at && (
                                <div className="text-xs text-muted-foreground mt-2">
                                  Unlocked {new Date(userAchievement.unlocked_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streaks" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5" />
                Your Streaks
              </CardTitle>
              <CardDescription>
                Maintain daily streaks to unlock achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {streaks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Flame className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active streaks yet. Start tracking your activities!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {streaks.map((streak) => (
                    <Card key={streak.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Flame className="w-5 h-5 text-orange-500" />
                              <h3 className="font-semibold capitalize">{streak.streak_type} Streak</h3>
                            </div>
                            <div className="text-3xl font-bold text-primary">{streak.current_streak}</div>
                            <div className="text-sm text-muted-foreground">
                              Longest: {streak.longest_streak} days
                            </div>
                            {streak.last_activity_date && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Last activity: {new Date(streak.last_activity_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-lg">
                            {streak.current_streak} 🔥
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Milestones
              </CardTitle>
              <CardDescription>
                Celebrate your progress milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {milestones.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No milestones yet. Keep tracking to reach milestones!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Target className="w-5 h-5 text-primary" />
                          <div>
                            <div className="font-medium capitalize">
                              {milestone.milestone_type.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(milestone.achieved_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-lg">
                          {milestone.milestone_value}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Leaderboard
              </CardTitle>
              <CardDescription>
                Compete with others (opt-in, anonymous)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleOptInLeaderboard} variant="outline">
                Opt In to Leaderboard
              </Button>

              <ScrollArea className="h-[400px]">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No leaderboard data yet. Opt in to participate!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry) => (
                      <div
                        key={entry.rank}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                            {entry.rank}
                          </div>
                          <div>
                            <div className="font-medium">{entry.display_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {entry.score} points
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">
                          <Trophy className="w-3 h-3 mr-1" />
                          Rank {entry.rank}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

