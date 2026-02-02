import { toast } from "sonner";
import type { ActiveSession, RoutineExercise, RoutineTemplate } from "./types";
import { playEndCue, playRestCue, playStartCue } from "./audio";
import { vibrate } from "./vibration";

const SESSION_KEY = "active_routine_session";

export function startSession(
  template?: RoutineTemplate,
  customExercises?: RoutineExercise[],
): ActiveSession {
  const exercises = template?.exercises || customExercises || [];

  const session: ActiveSession = {
    id: `session-${Date.now()}`,
    template_id: template?.id,
    routine_name: template?.template_name || "Custom Session",
    exercises,
    current_exercise_index: 0,
    current_set: 1,
    is_resting: false,
    elapsed_seconds: 0,
    started_at: new Date(),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  playStartCue();
  vibrate([100, 50, 100]);
  toast.success("Session started!");
  return session;
}

export function getActiveSession(): ActiveSession | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored) as Omit<ActiveSession, "started_at" | "paused_at"> & {
      started_at: string;
      paused_at?: string;
    };
    return {
      ...session,
      started_at: new Date(session.started_at),
      paused_at: session.paused_at ? new Date(session.paused_at) : undefined,
    };
  } catch {
    return null;
  }
}

export function updateSession(updates: Partial<ActiveSession>): ActiveSession | null {
  const session = getActiveSession();
  if (!session) return null;
  const updated = { ...session, ...updates };
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  return updated;
}

export function nextSet(): ActiveSession | null {
  const session = getActiveSession();
  if (!session) return null;

  const currentExercise = session.exercises[session.current_exercise_index];

  if (session.current_set < currentExercise.sets) {
    playRestCue();
    vibrate(200);
    return updateSession({ current_set: session.current_set + 1, is_resting: true });
  }
  return nextExercise();
}

export function nextExercise(): ActiveSession | null {
  const session = getActiveSession();
  if (!session) return null;

  if (session.current_exercise_index < session.exercises.length - 1) {
    playStartCue();
    vibrate([100, 50, 100]);
    return updateSession({
      current_exercise_index: session.current_exercise_index + 1,
      current_set: 1,
      is_resting: false,
    });
  }
  return endSession();
}

export function endRest(): ActiveSession | null {
  playStartCue();
  vibrate(100);
  return updateSession({ is_resting: false });
}

export function pauseSession(): ActiveSession | null {
  return updateSession({ paused_at: new Date() });
}

export function resumeSession(): ActiveSession | null {
  return updateSession({ paused_at: undefined });
}

export function endSession(): ActiveSession | null {
  const session = getActiveSession();
  localStorage.removeItem(SESSION_KEY);
  playEndCue();
  vibrate([100, 100, 100, 100, 300]);
  toast.success("Session complete! Great job! 💪");
  return session;
}
