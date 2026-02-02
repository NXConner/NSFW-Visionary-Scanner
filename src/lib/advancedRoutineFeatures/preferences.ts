import { logger } from "@/lib/logger";
import type { RoutinePreferences } from "./types";

const PREFERENCES_KEY = "routine_preferences";

const DEFAULT_PREFERENCES: RoutinePreferences = {
  defaultRestSeconds: 60,
  audioEnabled: true,
  audioCueVolume: 0.7,
  vibrationEnabled: true,
  countdownBeeps: true,
  autoAdvance: true,
};

export function getRoutinePreferences(): RoutinePreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    return stored
      ? { ...DEFAULT_PREFERENCES, ...(JSON.parse(stored) as Partial<RoutinePreferences>) }
      : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function updateRoutinePreferences(prefs: Partial<RoutinePreferences>): void {
  try {
    const current = getRoutinePreferences();
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ ...current, ...prefs }));
  } catch (error) {
    logger.error("Failed to save routine preferences", { error });
  }
}
