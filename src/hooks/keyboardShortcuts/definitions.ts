export type KeyboardShortcutCategory =
  | "navigation"
  | "actions"
  | "admin"
  | "content"
  | "media"
  | "accessibility";

export interface KeyboardShortcutDefinition {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  category: KeyboardShortcutCategory;
}

export const KEYBOARD_SHORTCUT_DEFINITIONS: KeyboardShortcutDefinition[] = [
  // Actions
  { key: "k", ctrl: true, description: "Open Command Palette", category: "actions" },
  { key: "/", ctrl: true, description: "Show Keyboard Shortcuts", category: "actions" },
  { key: ",", ctrl: true, description: "Open Settings", category: "actions" },

  // Admin
  { key: "a", ctrl: true, shift: true, description: "Open Admin Panel", category: "admin" },
  { key: "d", ctrl: true, shift: true, description: "DLC Management", category: "admin" },

  // Accessibility
  {
    key: "f",
    ctrl: true,
    alt: true,
    description: "Toggle Large Font Mode",
    category: "accessibility",
  },
  {
    key: "c",
    ctrl: true,
    alt: true,
    description: "Cycle Color Blind Mode",
    category: "accessibility",
  },
];

export function formatShortcutKeys(def: KeyboardShortcutDefinition) {
  const parts: string[] = [];
  if (def.ctrl) parts.push("Ctrl");
  if (def.shift) parts.push("Shift");
  if (def.alt) parts.push("Alt");
  parts.push(def.key.length === 1 ? def.key.toUpperCase() : def.key);
  return parts.join("+");
}
