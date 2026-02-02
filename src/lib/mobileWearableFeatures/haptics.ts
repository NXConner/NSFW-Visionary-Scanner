import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { HapticFeedbackPreferences, JsonObject } from "./types";

const HAPTIC_PREFS_KEY = "haptic_feedback_preferences";

const DEFAULT_HAPTIC_PATTERNS: JsonObject = {
  success: [100],
  error: [50, 100, 50],
  warning: [100, 50, 100],
  notification: [200],
};

function getStoredPrefs(): HapticFeedbackPreferences | null {
  try {
    const stored = localStorage.getItem(HAPTIC_PREFS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function savePrefs(prefs: HapticFeedbackPreferences): void {
  try {
    localStorage.setItem(HAPTIC_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export async function getHapticPreferences(): Promise<HapticFeedbackPreferences | null> {
  try {
    let prefs = getStoredPrefs();
    if (prefs) return prefs;

    // Create default preferences
    prefs = {
      id: crypto.randomUUID(),
      user_id: "local",
      haptic_enabled: true,
      haptic_intensity: "medium",
      haptic_patterns: DEFAULT_HAPTIC_PATTERNS,
      disable_on_low_battery: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    savePrefs(prefs);
    return prefs;
  } catch (error) {
    logger.error("Failed to load haptic preferences", { error });
    return null;
  }
}

export async function updateHapticPreferences(
  preferences: Partial<HapticFeedbackPreferences>,
): Promise<boolean> {
  try {
    const current = await getHapticPreferences();
    if (!current) return false;

    const updated = {
      ...current,
      ...preferences,
      updated_at: new Date().toISOString(),
    };
    savePrefs(updated);
    toast.success("Haptic settings updated");
    return true;
  } catch (error) {
    logger.error("Failed to update haptic preferences", { error });
    toast.error("Failed to update settings");
    return false;
  }
}

export async function triggerHaptic(
  type: "success" | "error" | "warning" | "notification" | "custom",
  customPattern?: number[],
): Promise<void> {
  const prefs = await getHapticPreferences();
  if (!prefs?.haptic_enabled) return;

  let pattern: number[] = [];
  const patterns = prefs.haptic_patterns as { [k: string]: unknown } | null;

  if (type === "custom" && Array.isArray(customPattern)) {
    pattern = customPattern;
  } else {
    const raw = patterns?.[type];
    pattern = Array.isArray(raw) ? raw.map(v => Number(v)).filter(v => Number.isFinite(v)) : [100];
  }

  if (prefs.haptic_intensity === "light") {
    pattern = pattern.map(p => Math.round(p * 0.5));
  } else if (prefs.haptic_intensity === "strong") {
    pattern = pattern.map(p => Math.round(p * 1.5));
  }

  try {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}
