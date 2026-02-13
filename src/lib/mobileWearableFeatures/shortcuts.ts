import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { AppShortcut, JsonObject } from "./types";

const SHORTCUTS_KEY = "app_shortcuts";

const DEFAULT_SHORTCUTS: AppShortcut[] = [
  {
    id: "shortcut-1",
    user_id: "local",
    shortcut_type: "scan",
    shortcut_name: "Quick Scan",
    shortcut_icon: "camera",
    shortcut_action: { route: "/scanner" },
    platform: "both",
    usage_count: 0,
    last_used_at: null,
    is_active: true,
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "shortcut-2",
    user_id: "local",
    shortcut_type: "diary_entry",
    shortcut_name: "Add Diary Entry",
    shortcut_icon: "book",
    shortcut_action: { route: "/diary", action: "new" },
    platform: "both",
    usage_count: 0,
    last_used_at: null,
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "shortcut-3",
    user_id: "local",
    shortcut_type: "routine_start",
    shortcut_name: "Start Routine",
    shortcut_icon: "dumbbell",
    shortcut_action: { route: "/routines", action: "start" },
    platform: "both",
    usage_count: 0,
    last_used_at: null,
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getStoredShortcuts(): AppShortcut[] {
  try {
    const stored = localStorage.getItem(SHORTCUTS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SHORTCUTS;
  } catch {
    return DEFAULT_SHORTCUTS;
  }
}

function saveShortcuts(shortcuts: AppShortcut[]): void {
  try {
    localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcuts));
  } catch {
    // ignore
  }
}

export async function createAppShortcut(
  shortcutType: AppShortcut["shortcut_type"],
  shortcutName: string,
  shortcutAction: JsonObject,
  platform: AppShortcut["platform"] = "both",
): Promise<AppShortcut | null> {
  try {
    const shortcuts = getStoredShortcuts();
    const maxOrder = shortcuts.reduce((max, s) => Math.max(max, s.sort_order), -1);

    const newShortcut: AppShortcut = {
      id: crypto.randomUUID(),
      user_id: "local",
      shortcut_type: shortcutType,
      shortcut_name: shortcutName,
      shortcut_icon: null,
      shortcut_action: shortcutAction,
      platform,
      usage_count: 0,
      last_used_at: null,
      is_active: true,
      sort_order: maxOrder + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    shortcuts.push(newShortcut);
    saveShortcuts(shortcuts);
    toast.success(`Shortcut "${shortcutName}" created!`);
    return newShortcut;
  } catch (error) {
    logger.error("Failed to create shortcut", { error });
    toast.error("Failed to create shortcut");
    return null;
  }
}

export async function getAppShortcuts(): Promise<AppShortcut[]> {
  try {
    return getStoredShortcuts().sort((a, b) => a.sort_order - b.sort_order);
  } catch (error) {
    logger.error("Failed to load shortcuts", { error });
    return [];
  }
}

export async function useShortcut(shortcutId: string): Promise<JsonObject | null> {
  try {
    const shortcuts = getStoredShortcuts();
    const shortcut = shortcuts.find(s => s.id === shortcutId);
    if (!shortcut) return null;

    shortcut.usage_count = (shortcut.usage_count || 0) + 1;
    shortcut.last_used_at = new Date().toISOString();
    shortcut.updated_at = new Date().toISOString();
    saveShortcuts(shortcuts);

    return shortcut.shortcut_action;
  } catch (error) {
    logger.error("Failed to use shortcut", { error });
    return null;
  }
}

export async function deleteAppShortcut(shortcutId: string): Promise<boolean> {
  try {
    const shortcuts = getStoredShortcuts();
    const filtered = shortcuts.filter(s => s.id !== shortcutId);
    saveShortcuts(filtered);
    toast.success("Shortcut deleted");
    return true;
  } catch (error) {
    logger.error("Failed to delete shortcut", { error });
    toast.error("Failed to delete shortcut");
    return false;
  }
}
