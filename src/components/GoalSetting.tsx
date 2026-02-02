import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Trophy,
  Calendar,
  TrendingUp,
  Plus,
  Trash2,
  CheckCircle2,
  Flame,
  Star,
  Award,
} from "lucide-react";
import { Reveal, AnimatedNumber, TiltCard } from "@/components/premium";

interface Goal {
  id: string;
  type: "length" | "circumference" | "sessions";
  targetValue: number;
  currentValue: number;
  startValue: number;
  deadline: string;
  createdAt: string;
  title: string;
}

interface GoalSettingProps {
  currentMeasurements: {
    length: number;
    circumference: number;
  };
  totalSessions?: number;
}

const GOALS_STORAGE_KEY = "growth-tracker-goals";

export const GoalSetting = ({ currentMeasurements, totalSessions = 0 }: GoalSettingProps) => {
  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const stored = localStorage.getItem(GOALS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState<{
    type: "length" | "circumference" | "sessions";
    targetValue: number;
    deadline: string;
    title: string;
  }>({
    type: "length",
    targetValue: 0,
    deadline: "",
    title: "",
  });

  // Persist goals to localStorage
  useEffect(() => {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  // Update current values based on measurements
  useEffect(() => {
    setGoals(prev =>
      prev.map(goal => ({
        ...goal,
        currentValue:
          goal.type === "length"
            ? currentMeasurements.length
            : goal.type === "circumference"
              ? currentMeasurements.circumference
              : totalSessions,
      })),
    );
  }, [currentMeasurements, totalSessions]);

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.targetValue || !newGoal.deadline) return;

    const startValue =
      newGoal.type === "length"
        ? currentMeasurements.length
        : newGoal.type === "circumference"
          ? currentMeasurements.circumference
          : totalSessions;

    const goal: Goal = {
      id: Date.now().toString(),
      type: newGoal.type,
      targetValue: newGoal.targetValue,
      currentValue: startValue,
      startValue,
      deadline: newGoal.deadline,
      createdAt: new Date().toISOString(),
      title: newGoal.title,
    };

    setGoals(prev => [...prev, goal]);
    setIsAddingGoal(false);
    setNewGoal({ type: "length", targetValue: 0, deadline: "", title: "" });
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const getProgress = (goal: Goal) => {
    const totalNeeded = goal.targetValue - goal.startValue;
    const achieved = goal.currentValue - goal.startValue;
    return Math.min(100, Math.max(0, (achieved / totalNeeded) * 100));
  };

  const getDaysRemaining = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getGoalStatus = (goal: Goal) => {
    const progress = getProgress(goal);
    const daysRemaining = getDaysRemaining(goal.deadline);

    if (progress >= 100) return { status: "completed", color: "success" };
    if (daysRemaining < 0) return { status: "overdue", color: "destructive" };
    if (daysRemaining <= 7) return { status: "urgent", color: "warning" };
    return { status: "active", color: "primary" };
  };

  const completedGoals = goals.filter(g => getProgress(g) >= 100);
  const activeGoals = goals.filter(g => getProgress(g) < 100);

  return (
    <Reveal>
      <TiltCard variant="glass" maxTilt={4} className="rounded-2xl">
        <Card variant="glass" className="border-0 bg-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-primary" />
                Goals & Milestones
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingGoal(true)}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Goal
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-2">
              <Reveal delay={0.05}>
                <div className="text-center p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Trophy className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-bold">
                    <AnimatedNumber value={completedGoals.length} />
                  </div>
                  <div className="text-xs text-muted-foreground">Achieved</div>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="text-center p-3 rounded-xl bg-accent/10 border border-accent/20">
                  <Flame className="w-5 h-5 text-accent mx-auto mb-1" />
                  <div className="text-lg font-bold">
                    <AnimatedNumber value={activeGoals.length} />
                  </div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="text-center p-3 rounded-xl bg-success/10 border border-success/20">
                  <Star className="w-5 h-5 text-success mx-auto mb-1" />
                  <div className="text-lg font-bold">
                    <AnimatedNumber value={totalSessions} />
                  </div>
                  <div className="text-xs text-muted-foreground">Sessions</div>
                </div>
              </Reveal>
            </div>

            {/* Add goal form */}
            <AnimatePresence>
              {isAddingGoal && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Plus className="w-4 h-4 text-primary" />
                      New Goal
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Goal Title</Label>
                        <Input
                          placeholder="e.g., Reach 16cm length"
                          value={newGoal.title}
                          onChange={e => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Goal Type</Label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          {(["length", "circumference", "sessions"] as const).map(type => (
                            <Button
                              key={type}
                              variant={newGoal.type === type ? "default" : "outline"}
                              size="sm"
                              onClick={() => setNewGoal(prev => ({ ...prev, type }))}
                              className="capitalize"
                            >
                              {type === "circumference" ? "Girth" : type}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">
                            Target {newGoal.type === "sessions" ? "Sessions" : "(cm)"}
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            value={newGoal.targetValue || ""}
                            onChange={e =>
                              setNewGoal(prev => ({
                                ...prev,
                                targetValue: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Deadline</Label>
                          <Input
                            type="date"
                            value={newGoal.deadline}
                            onChange={e =>
                              setNewGoal(prev => ({ ...prev, deadline: e.target.value }))
                            }
                            className="mt-1"
                            min={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => setIsAddingGoal(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={handleAddGoal}
                        disabled={!newGoal.title || !newGoal.targetValue || !newGoal.deadline}
                      >
                        Create Goal
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active goals */}
            {activeGoals.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Active Goals</h4>
                {activeGoals.map((goal, index) => {
                  const progress = getProgress(goal);
                  const daysRemaining = getDaysRemaining(goal.deadline);
                  const { status, color } = getGoalStatus(goal);

                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium">{goal.title}</h5>
                            <Badge
                              variant="outline"
                              className={`text-${color} border-${color}/30 bg-${color}/10`}
                            >
                              {status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {goal.type === "sessions"
                              ? `${goal.currentValue} / ${goal.targetValue} sessions`
                              : `${goal.currentValue.toFixed(1)} / ${goal.targetValue.toFixed(1)} cm`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {daysRemaining > 0
                              ? `${daysRemaining} days left`
                              : daysRemaining === 0
                                ? "Due today"
                                : `${Math.abs(daysRemaining)} days overdue`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <TrendingUp className="w-3 h-3 text-success" />
                          <span className="text-success">
                            +{(goal.currentValue - goal.startValue).toFixed(1)}
                            {goal.type !== "sessions" && " cm"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Completed goals */}
            {completedGoals.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-success" />
                  Completed ({completedGoals.length})
                </h4>
                {completedGoals.slice(0, 3).map((goal, index) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{goal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Achieved {goal.targetValue}
                        {goal.type !== "sessions" && " cm"}
                      </p>
                    </div>
                    <Award className="w-5 h-5 text-warning" />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {goals.length === 0 && !isAddingGoal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <Target className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <h4 className="font-medium mb-1">No goals yet</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Set your first goal to track progress
                </p>
                <Button variant="outline" onClick={() => setIsAddingGoal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Goal
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </TiltCard>
    </Reveal>
  );
};
