import type { KeyboardShortcutCategory, KeyboardShortcutDefinition } from "./definitions";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  category: KeyboardShortcutCategory;
  action: () => void;
}

export interface KeyboardShortcutActions {
  navigateTab: (tabId: string) => void;
  openCommandPalette: () => void;
  openShortcutsHelp: () => void;
  openAdminPanel: () => void;
  openAdminDlc: () => void;
  toggleLargeFont: () => void;
  cycleColorBlindMode: () => void;
}

function withAction(def: KeyboardShortcutDefinition, action: () => void): KeyboardShortcut {
  return { ...def, action };
}

export function createKeyboardShortcuts(actions: KeyboardShortcutActions): KeyboardShortcut[] {
  return [
    // Actions
    withAction(
      { key: "k", ctrl: true, description: "Open Command Palette", category: "actions" },
      actions.openCommandPalette,
    ),
    withAction(
      { key: "/", ctrl: true, description: "Show Keyboard Shortcuts", category: "actions" },
      actions.openShortcutsHelp,
    ),
    withAction({ key: ",", ctrl: true, description: "Open Settings", category: "actions" }, () =>
      actions.navigateTab("settings"),
    ),

    // Admin
    withAction(
      { key: "a", ctrl: true, shift: true, description: "Open Admin Panel", category: "admin" },
      actions.openAdminPanel,
    ),
    withAction(
      { key: "d", ctrl: true, shift: true, description: "DLC Management", category: "admin" },
      actions.openAdminDlc,
    ),

    // Accessibility
    withAction(
      {
        key: "f",
        ctrl: true,
        alt: true,
        description: "Toggle Large Font Mode",
        category: "accessibility",
      },
      actions.toggleLargeFont,
    ),
    withAction(
      {
        key: "c",
        ctrl: true,
        alt: true,
        description: "Cycle Color Blind Mode",
        category: "accessibility",
      },
      actions.cycleColorBlindMode,
    ),
  ];
}
