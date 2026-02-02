import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  getHabitTemplates,
  createHabit,
  getUserHabits,
  logHabitEntry,
  getTodayHabitStatus,
  getHabitStreaks,
  getHabitAnalytics,
  updateHabit,
  deleteHabit,
  type HabitDefinition,
  type UserHabit,
  type HabitEntry,
  type HabitTemplate,
  type HabitAnalytics,
} from "@/lib/habitTracker";
import {
  CheckCircle2,
  Circle,
  Flame,
  TrendingUp,
  Plus,
  Calendar,
  Target,
  BarChart3,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const HabitTracker = () => {
  type HabitFrequency = "daily" | "weekly" | "custom";
  type HabitCategory = "pe_routine" | "health" | "wellness" | "lifestyle" | "custom";

  const [activeTab, setActiveTab] = useState("today");
  const [loading, setLoading] = useState(false);
  const [habits, setHabits] = useState<UserHabit[]>([]);
  const [templates, setTemplates] = useState<HabitTemplate[]>([]);
  const [todayStatus, setTodayStatus] = useState<{
    habits: UserHabit[];
    completed: string[];
    pending: string[];
  } | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<UserHabit | null>(null);
  const [analytics, setAnalytics] = useState<HabitAnalytics | null>(null);

  const [newHabit, setNewHabit] = useState({
    name: "",
    description: "",
    category: "custom" as HabitCategory,
    frequency: "daily" as HabitFrequency,
    target_value: 1,
    unit: "times",
  });

  const isHabitFrequency = (v: string): v is HabitFrequency =>
    v === "daily" || v === "weekly" || v === "custom";

  const isHabitCategory = (v: string): v is HabitCategory =>
    v === "pe_routine" || v === "health" || v === "wellness" || v === "lifestyle" || v === "custom";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "today": {
          const status = await getTodayHabitStatus();
          setTodayStatus(status);
          setHabits(status.habits);
          break;
        }
        case "habits": {
          const habitsData = await getUserHabits();
          setHabits(habitsData);
          break;
        }
        case "templates": {
          const templatesData = await getHabitTemplates();
          setTemplates(templatesData);
          break;
        }
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateHabit = async () => {
    if (!newHabit.name) {
      toast.error("Please enter a habit name");
      return;
    }

    setLoading(true);
    try {
      await createHabit(newHabit);
      toast.success("Habit created!");
      setNewHabit({
        name: "",
        description: "",
        category: "custom",
        frequency: "daily",
        target_value: 1,
        unit: "times",
      });
      await loadData();
    } catch (error) {
      toast.error("Failed to create habit");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteHabit = async (habitId: string) => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await logHabitEntry(habitId, today, 1);
      toast.success("Habit completed!");
      await loadData();
    } catch (error) {
      toast.error("Failed to complete habit");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalytics = async (habit: UserHabit) => {
    setSelectedHabit(habit);
    try {
      const analyticsData = await getHabitAnalytics(habit.id!);
      setAnalytics(analyticsData);
    } catch (error) {
      toast.error("Failed to load analytics");
    }
  };

  const isCompleted = (habitId: string): boolean => {
    return todayStatus?.completed.includes(habitId) || false;
  };

  if (selectedHabit && analytics) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => {
            setSelectedHabit(null);
            setAnalytics(null);
          }}
        >
          ← Back to Habits
        </Button>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Analytics: {selectedHabit.custom_name || "Habit"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold">{analytics.completionRate.toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold">{analytics.currentStreak}</p>
                <p className="text-sm text-muted-foreground">Current Streak</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold">{analytics.longestStreak}</p>
                <p className="text-sm text-muted-foreground">Longest Streak</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold">{analytics.completedEntries}</p>
                <p className="text-sm text-muted-foreground">Total Completions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Habits</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="gradient-text">Habit</span> Tracker
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Build healthy habits, track your progress, and maintain streaks.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="habits">My Habits</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Today Tab */}
        <TabsContent value="today" className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : todayStatus && todayStatus.habits.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Today's Habits</h3>
                <Badge variant="outline">
                  {todayStatus.completed.length} / {todayStatus.habits.length} completed
                </Badge>
              </div>
              {todayStatus.habits.map(habit => {
                const completed = isCompleted(habit.id!);
                const habitDef = habit.habit_definition;

                return (
                  <Card key={habit.id} variant="glass">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <button
                            onClick={() => handleCompleteHabit(habit.id!)}
                            className="flex-shrink-0"
                            disabled={loading || completed}
                          >
                            {completed ? (
                              <CheckCircle2 className="w-6 h-6 text-green-500" />
                            ) : (
                              <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                            )}
                          </button>
                          <div className="flex-1">
                            <h4 className="font-semibold">
                              {habit.custom_name || habitDef?.name || "Habit"}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              {habit.current_streak && habit.current_streak > 0 && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Flame className="w-3 h-3 text-orange-500" />
                                  {habit.current_streak} day streak
                                </Badge>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {habit.completion_rate?.toFixed(0) || 0}% completion rate
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAnalytics(habit)}
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No habits yet. Create one to get started!</p>
            </div>
          )}
        </TabsContent>

        {/* Habits Tab */}
        <TabsContent value="habits" className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Create New Habit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Habit name (e.g., Daily PE Routine)"
                value={newHabit.name}
                onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
              />
              <Textarea
                placeholder="Description (optional)"
                value={newHabit.description}
                onChange={e => setNewHabit({ ...newHabit, description: e.target.value })}
                rows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block" htmlFor="habit-frequency">
                    Frequency
                  </label>
                  <select
                    id="habit-frequency"
                    value={newHabit.frequency}
                    onChange={e => {
                      const next = e.target.value;
                      if (!isHabitFrequency(next)) return;
                      setNewHabit({ ...newHabit, frequency: next });
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block" htmlFor="habit-category">
                    Category
                  </label>
                  <select
                    id="habit-category"
                    value={newHabit.category}
                    onChange={e => {
                      const next = e.target.value;
                      if (!isHabitCategory(next)) return;
                      setNewHabit({ ...newHabit, category: next });
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="pe_routine">PE Routine</option>
                    <option value="health">Health</option>
                    <option value="wellness">Wellness</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={handleCreateHabit}
                disabled={loading}
                className="w-full"
                variant="gradient"
              >
                {loading ? "Creating..." : "Create Habit"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">My Habits</h3>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : habits.length > 0 ? (
              habits.map(habit => {
                const habitDef = habit.habit_definition;

                return (
                  <Card key={habit.id} variant="glass">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-2">
                            {habit.custom_name || habitDef?.name || "Habit"}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            {habitDef?.description}
                          </p>
                          <div className="flex items-center gap-4">
                            {habit.current_streak && habit.current_streak > 0 && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-500" />
                                {habit.current_streak} day streak
                              </Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {habit.total_completions || 0} total completions
                            </span>
                          </div>
                          {habit.completion_rate !== undefined && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>Completion Rate</span>
                                <span>{habit.completion_rate.toFixed(0)}%</span>
                              </div>
                              <Progress value={habit.completion_rate} className="h-2" />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewAnalytics(habit)}
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteHabit(habit.habit_definition_id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No habits yet. Create one to get started!</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(template => (
                <Card key={template.id} variant="glass">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.is_featured && <Badge className="bg-yellow-500">Featured</Badge>}
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline">{template.frequency}</Badge>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <Button
                      onClick={() => {
                        const category =
                          template.category && isHabitCategory(template.category)
                            ? template.category
                            : "custom";
                        const frequency =
                          template.frequency && isHabitFrequency(template.frequency)
                            ? template.frequency
                            : "daily";
                        setNewHabit({
                          name: template.name,
                          description: template.description || "",
                          category,
                          frequency,
                          target_value: template.target_value || 1,
                          unit: template.unit || "times",
                        });
                        setActiveTab("habits");
                      }}
                      className="w-full"
                      variant="outline"
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No templates available yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
