export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type Goal = "length" | "girth" | "both" | "maintenance";

export interface Exercise {
  id: string;
  name: string;
  type: "warmup" | "stretch" | "jelq" | "pump" | "kegel" | "cooldown";
  duration: number; // minutes
  sets?: number;
  reps?: number;
  intensity: "low" | "medium" | "high";
  description: string;
  instructions: string[];
  warnings: string[];
  level: ExperienceLevel[];
  targetArea: ("length" | "girth" | "both")[];
}

export interface Routine {
  id: string;
  name: string;
  level: ExperienceLevel;
  goal: Goal;
  exercises: Exercise[];
  daysPerWeek: number;
  totalDuration: number;
}

export interface UserProgress {
  currentDay: number;
  completedSessions: string[];
  currentRoutineId: string | null;
  startDate: string | null;
}
