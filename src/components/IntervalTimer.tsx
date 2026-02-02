import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  SkipForward,
  Square,
  Timer,
  Volume2,
  VolumeX,
  Vibrate,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ActiveSession,
  getActiveSession,
  startSession,
  pauseSession,
  resumeSession,
  nextSet,
  endRest,
  endSession,
  getRoutinePreferences,
  playCountdownBeep,
  RoutineTemplate,
  RoutineExercise,
} from "@/lib/advancedRoutineFeatures";

interface IntervalTimerProps {
  template?: RoutineTemplate;
  customExercises?: RoutineExercise[];
  onComplete?: () => void;
}

export function IntervalTimer({ template, customExercises, onComplete }: IntervalTimerProps) {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [preferences] = useState(() => getRoutinePreferences());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check for existing session
    const existing = getActiveSession();
    if (existing) {
      setSession(existing);
    }
  }, []);

  useEffect(() => {
    if (!session) return;

    const currentExercise = session.exercises[session.current_exercise_index];
    if (!currentExercise) return;

    if (session.is_resting) {
      setTimeRemaining(currentExercise.rest_seconds);
    } else if (currentExercise.duration_seconds) {
      setTimeRemaining(currentExercise.duration_seconds);
    } else {
      setTimeRemaining(0); // Rep-based exercise
    }
  }, [session, session?.current_exercise_index, session?.current_set, session?.is_resting]);

  useEffect(() => {
    if (!session || isPaused || timeRemaining <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Timer complete
          if (session.is_resting) {
            const updated = endRest();
            setSession(updated);
          } else if (preferences.autoAdvance) {
            const updated = nextSet();
            setSession(updated);
          }
          return 0;
        }

        // Countdown beeps for last 3 seconds
        if (prev <= 4 && preferences.countdownBeeps) {
          playCountdownBeep();
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session, isPaused, timeRemaining, preferences.autoAdvance, preferences.countdownBeeps]);

  const handleStart = useCallback(() => {
    const newSession = startSession(template, customExercises);
    setSession(newSession);
    setIsPaused(false);
  }, [template, customExercises]);

  const handlePause = useCallback(() => {
    if (isPaused) {
      resumeSession();
    } else {
      pauseSession();
    }
    setIsPaused(!isPaused);
  }, [isPaused]);

  const handleNext = useCallback(() => {
    if (!session) return;
    const updated = nextSet();
    setSession(updated);
  }, [session]);

  const handleStop = useCallback(() => {
    endSession();
    setSession(null);
    setTimeRemaining(0);
    onComplete?.();
  }, [onComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Interval Timer
          </CardTitle>
          <CardDescription>Start a guided workout session with timed intervals</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleStart} className="w-full">
            <Play className="w-4 h-4 mr-2" />
            Start Session
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentExercise = session.exercises[session.current_exercise_index];
  const progress =
    (session.current_exercise_index * 100) / session.exercises.length +
    (session.current_set * 100) / (currentExercise?.sets || 1) / session.exercises.length;

  return (
    <Card
      className={cn(
        "transition-colors",
        session.is_resting
          ? "border-blue-500/50 bg-blue-500/5"
          : "border-green-500/50 bg-green-500/5",
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{session.routine_name}</CardTitle>
            <CardDescription>
              Exercise {session.current_exercise_index + 1} of {session.exercises.length}
            </CardDescription>
          </div>
          <Badge variant={session.is_resting ? "secondary" : "default"}>
            {session.is_resting ? "Rest" : "Work"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Exercise */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">{currentExercise?.name}</h3>
          <p className="text-muted-foreground">
            Set {session.current_set} of {currentExercise?.sets}
            {currentExercise?.reps && ` • ${currentExercise.reps} reps`}
          </p>
        </div>

        {/* Timer Display */}
        {timeRemaining > 0 && (
          <div className="text-center">
            <div
              className={cn(
                "text-6xl font-mono font-bold",
                timeRemaining <= 3 ? "text-red-500 animate-pulse" : "",
              )}
            >
              {formatTime(timeRemaining)}
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Overall Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePause}>
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <SkipForward className="w-5 h-5" />
          </Button>
          <Button variant="destructive" size="icon" onClick={handleStop}>
            <Square className="w-5 h-5" />
          </Button>
        </div>

        {/* Next Up */}
        {session.current_exercise_index < session.exercises.length - 1 && (
          <div className="text-center text-sm text-muted-foreground">
            <span>Next: </span>
            <span className="font-medium">
              {session.exercises[session.current_exercise_index + 1]?.name}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default IntervalTimer;
