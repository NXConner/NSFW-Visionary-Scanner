import React, { useEffect, useMemo, useState } from "react";

import { AIRoutineRecommendations } from "@/components/AIRoutineRecommendations";
import { StepByStepVisualGuide } from "@/components/StepByStepVisualGuide";
import { VisualContentDisplay } from "@/components/VisualContentDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Gauge,
  Heart,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Waves,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { useGenericStorage } from "@/hooks/useGenericStorage";
import { useVisualContent, VISUAL_CONTENT_CATEGORIES } from "@/hooks/useVisualContent";
import { useOptionalDLCFeature } from "@/dlc/context/DLCContext";

import { exercises } from "@/components/peRoutineBuilder/data/exercises";
import { presetRoutines } from "@/components/peRoutineBuilder/data/presetRoutines";
import type {
  ExperienceLevel,
  Goal,
  Routine,
  UserProgress,
} from "@/components/peRoutineBuilder/types";

const getLevelColor = (level: ExperienceLevel) => {
  switch (level) {
    case "beginner":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "intermediate":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "advanced":
      return "bg-red-500/20 text-red-400 border-red-500/30";
  }
};

export const PERoutineBuilder = () => {
  const [progress, setProgress] = useGenericStorage<UserProgress>("pe_routine_progress", {
    currentDay: 1,
    completedSessions: [],
    currentRoutineId: null,
    startDate: null,
  });

  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel>("beginner");
  const [selectedGoal, setSelectedGoal] = useState<Goal>("both");
  const [activeExercise, setActiveExercise] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showExerciseVisual, setShowExerciseVisual] = useState<string | null>(null);

  const { content: exerciseVisuals } = useVisualContent({
    categories: [VISUAL_CONTENT_CATEGORIES.EXERCISES, VISUAL_CONTENT_CATEGORIES.TUTORIALS],
    autoLoad: true,
    autoInvert: true,
  });

  const currentRoutine = useMemo(
    () => presetRoutines.find(r => r.id === progress.currentRoutineId) || null,
    [progress.currentRoutineId],
  );

  // DLC tiering for the routine builder (when unlocked via DLC instead of subscription).
  // If subscription already unlocked this screen, DLC tiering is purely additive (no restrictions).
  const { isAvailable: hasPeBeginner } = useOptionalDLCFeature("pe_routines_beginner");
  const { isAvailable: hasPeIntermediate } = useOptionalDLCFeature("pe_routines_intermediate");
  const { isAvailable: hasPeAdvanced } = useOptionalDLCFeature("pe_routines_advanced");

  const allowedLevels = useMemo<ExperienceLevel[]>(() => {
    // No DLC context or no tier flags => default to all (subscription path or older builds).
    const anyTier = hasPeBeginner || hasPeIntermediate || hasPeAdvanced;
    if (!anyTier) return ["beginner", "intermediate", "advanced"];
    if (hasPeAdvanced) return ["beginner", "intermediate", "advanced"];
    if (hasPeIntermediate) return ["beginner", "intermediate"];
    // Beginner tier is the minimum.
    return ["beginner"];
  }, [hasPeAdvanced, hasPeBeginner, hasPeIntermediate]);

  // Keep selected level in sync with allowed set (prevents empty lists after purchase).
  useEffect(() => {
    if (allowedLevels.includes(selectedLevel)) return;
    setSelectedLevel(allowedLevels[0] ?? "beginner");
  }, [allowedLevels, selectedLevel]);

  const filteredRoutines = useMemo(
    () =>
      presetRoutines.filter(
        r =>
          r.level === selectedLevel &&
          (r.goal === selectedGoal || r.goal === "both" || selectedGoal === "both"),
      ),
    [selectedGoal, selectedLevel],
  );

  const startRoutine = (routineId: string) => {
    setProgress({
      ...progress,
      currentRoutineId: routineId,
      startDate: new Date().toISOString(),
      currentDay: 1,
      completedSessions: [],
    });
    toast.success("Routine started! Good luck on your journey.");
  };

  const completeSession = () => {
    const today = new Date().toISOString().split("T")[0];
    if (!progress.completedSessions.includes(today)) {
      setProgress({
        ...progress,
        completedSessions: [...progress.completedSessions, today],
        currentDay: progress.currentDay + 1,
      });
      toast.success("Session completed! Great work!");
    }
    setIsSessionActive(false);
    setActiveExercise(0);
  };

  const resetProgress = () => {
    setProgress({
      currentDay: 1,
      completedSessions: [],
      currentRoutineId: null,
      startDate: null,
    });
    toast.info("Progress reset");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">PE Routine Builder</h2>
        <p className="text-muted-foreground">
          Build your personalized penis enhancement workout plan
        </p>
      </div>

      <Tabs defaultValue={currentRoutine ? "active" : "ai"} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ai" className="gap-1">
            <Sparkles className="w-4 h-4" />
            AI Recommend
          </TabsTrigger>
          <TabsTrigger value="browse">Browse Routines</TabsTrigger>
          <TabsTrigger value="active" disabled={!currentRoutine}>
            Active Routine
          </TabsTrigger>
          <TabsTrigger value="exercises">Exercise Library</TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <AIRoutineRecommendations />
        </TabsContent>

        <TabsContent value="browse">
          <Card className="glass-card border-border/50 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Find Your Perfect Routine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Experience Level</Label>
                  <Select
                    value={selectedLevel}
                    onValueChange={v => setSelectedLevel(v as ExperienceLevel)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedLevels.includes("beginner") ? (
                        <SelectItem value="beginner">Beginner (0-3 months)</SelectItem>
                      ) : null}
                      {allowedLevels.includes("intermediate") ? (
                        <SelectItem value="intermediate">Intermediate (3-12 months)</SelectItem>
                      ) : null}
                      {allowedLevels.includes("advanced") ? (
                        <SelectItem value="advanced">Advanced (12+ months)</SelectItem>
                      ) : null}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Primary Goal</Label>
                  <Select value={selectedGoal} onValueChange={v => setSelectedGoal(v as Goal)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="length">Length Focus</SelectItem>
                      <SelectItem value="girth">Girth Focus</SelectItem>
                      <SelectItem value="both">Balanced (Both)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {filteredRoutines.map(routine => (
              <Card key={routine.id} className="glass-card border-border/50 hover-lift">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{routine.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4" /> {routine.totalDuration} min
                        <span className="mx-1">•</span>
                        <Calendar className="w-4 h-4" /> {routine.daysPerWeek}x/week
                      </CardDescription>
                    </div>
                    <Badge className={getLevelColor(routine.level)}>{routine.level}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {routine.exercises.map((ex, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <ChevronRight className="w-4 h-4 text-primary" />
                        <span>{ex.name}</span>
                        <span className="text-muted-foreground">({ex.duration} min)</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => startRoutine(routine.id)}
                    disabled={progress.currentRoutineId === routine.id}
                  >
                    {progress.currentRoutineId === routine.id
                      ? "Currently Active"
                      : "Start This Routine"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active">
          {currentRoutine && (
            <div className="space-y-6">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{currentRoutine.name}</CardTitle>
                      <CardDescription>
                        Day {progress.currentDay} • {progress.completedSessions.length} sessions
                        completed
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={resetProgress}>
                      <RotateCcw className="w-4 h-4 mr-2" /> Reset
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Weekly Progress</span>
                      <span>
                        {progress.completedSessions.length % currentRoutine.daysPerWeek} /{" "}
                        {currentRoutine.daysPerWeek}
                      </span>
                    </div>
                    <Progress
                      value={
                        ((progress.completedSessions.length % currentRoutine.daysPerWeek) /
                          currentRoutine.daysPerWeek) *
                        100
                      }
                    />
                  </div>

                  {!isSessionActive ? (
                    <Button className="w-full" size="lg" onClick={() => setIsSessionActive(true)}>
                      <Play className="w-5 h-5 mr-2" /> Start Today's Session
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                        <div>
                          <p className="font-semibold">
                            {currentRoutine.exercises[activeExercise]?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Exercise {activeExercise + 1} of {currentRoutine.exercises.length}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {currentRoutine.exercises[activeExercise]?.duration} min
                        </Badge>
                      </div>

                      <Card className="bg-muted/30">
                        <CardContent className="pt-4 space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Instructions:</h4>
                            <ol className="space-y-2">
                              {currentRoutine.exercises[activeExercise]?.instructions.map(
                                (inst, i) => (
                                  <li key={i} className="flex gap-2 text-sm">
                                    <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">
                                      {i + 1}
                                    </span>
                                    {inst}
                                  </li>
                                ),
                              )}
                            </ol>
                          </div>

                          {exerciseVisuals.length > 0 && (
                            <div className="pt-4 border-t border-border/50">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-sm">Visual Demonstration</h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setShowExerciseVisual(
                                      currentRoutine.exercises[activeExercise]?.id || null,
                                    )
                                  }
                                >
                                  View Full Guide
                                </Button>
                              </div>
                              <VisualContentDisplay
                                content={exerciseVisuals
                                  .filter(v =>
                                    v.tags.some(
                                      tag =>
                                        currentRoutine.exercises[activeExercise]?.name
                                          .toLowerCase()
                                          .includes(tag) ||
                                        tag.includes(
                                          currentRoutine.exercises[activeExercise]?.name
                                            .toLowerCase()
                                            .split(" ")[0] || "",
                                        ),
                                    ),
                                  )
                                  .slice(0, 1)}
                                showThumbnails={false}
                              />
                            </div>
                          )}

                          {currentRoutine.exercises[activeExercise]?.warnings.length > 0 && (
                            <div className="p-3 bg-orange-500/10 rounded border border-orange-500/30">
                              <p className="text-sm text-orange-400 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {currentRoutine.exercises[activeExercise]?.warnings[0]}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <div className="flex gap-3">
                        {activeExercise > 0 && (
                          <Button
                            variant="outline"
                            onClick={() => setActiveExercise(activeExercise - 1)}
                          >
                            Previous
                          </Button>
                        )}
                        {activeExercise < currentRoutine.exercises.length - 1 ? (
                          <Button
                            className="flex-1"
                            onClick={() => setActiveExercise(activeExercise + 1)}
                          >
                            Next Exercise <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        ) : (
                          <Button className="flex-1" onClick={completeSession}>
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Complete Session
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="exercises">
          <div className="grid md:grid-cols-2 gap-4">
            {exercises.map(exercise => {
              const matchingVisuals = exerciseVisuals.filter(v =>
                v.tags.some(
                  tag =>
                    exercise.name.toLowerCase().includes(tag) ||
                    tag.includes(exercise.name.toLowerCase().split(" ")[0]),
                ),
              );

              return (
                <Card key={exercise.id} className="glass-card border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {exercise.type === "warmup" && <Zap className="w-5 h-5 text-orange-400" />}
                        {exercise.type === "stretch" && (
                          <Activity className="w-5 h-5 text-blue-400" />
                        )}
                        {exercise.type === "jelq" && <Waves className="w-5 h-5 text-purple-400" />}
                        {exercise.type === "pump" && <Gauge className="w-5 h-5 text-cyan-400" />}
                        {exercise.type === "kegel" && <Target className="w-5 h-5 text-green-400" />}
                        {exercise.type === "cooldown" && (
                          <Heart className="w-5 h-5 text-pink-400" />
                        )}
                        {exercise.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={
                          exercise.intensity === "low"
                            ? "border-green-500/30 text-green-400"
                            : exercise.intensity === "medium"
                              ? "border-yellow-500/30 text-yellow-400"
                              : "border-red-500/30 text-red-400"
                        }
                      >
                        {exercise.intensity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{exercise.description}</p>

                    {matchingVisuals.length > 0 && (
                      <div className="mb-3">
                        <VisualContentDisplay
                          content={matchingVisuals.slice(0, 1)}
                          showThumbnails={false}
                          className="max-h-48"
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      {exercise.level.map(l => (
                        <Badge key={l} variant="secondary" className="text-xs">
                          {l}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 inline mr-1" /> {exercise.duration} min
                      {exercise.sets && <> • {exercise.sets} sets</>}
                      {exercise.reps && (
                        <>
                          {" "}
                          × {exercise.reps} {exercise.type === "kegel" ? "reps" : "sec"}
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => setShowExerciseVisual(exercise.id)}
                    >
                      View Step-by-Step Guide
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {showExerciseVisual && (
        <Dialog open={!!showExerciseVisual} onOpenChange={() => setShowExerciseVisual(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {exercises.find(e => e.id === showExerciseVisual)?.name || "Exercise Guide"}
              </DialogTitle>
            </DialogHeader>
            {(() => {
              const exercise = exercises.find(e => e.id === showExerciseVisual);
              if (!exercise) return null;

              const visualContent = exerciseVisuals.filter(v =>
                v.tags.some(
                  tag =>
                    exercise.name.toLowerCase().includes(tag) ||
                    tag.includes(exercise.name.toLowerCase().split(" ")[0]),
                ),
              );

              return (
                <StepByStepVisualGuide
                  title={exercise.name}
                  description={exercise.description}
                  steps={exercise.instructions.map((inst, idx) => ({
                    number: idx + 1,
                    title: `Step ${idx + 1}`,
                    description: inst,
                    instructions: [inst],
                    visualContent: visualContent.slice(idx, idx + 1),
                    caution: idx === 0 ? exercise.warnings[0] : undefined,
                  }))}
                  onComplete={() => setShowExerciseVisual(null)}
                />
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PERoutineBuilder;
