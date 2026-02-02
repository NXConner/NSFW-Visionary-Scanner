export const APP_EVENT_NAVIGATE_TAB = "navigate-tab";
export const APP_EVENT_OPEN_COMMAND_PALETTE = "open-command-palette";
export const APP_EVENT_OPEN_SHORTCUTS_HELP = "open-shortcuts-help";

export function emitNavigateTab(tabId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>(APP_EVENT_NAVIGATE_TAB, { detail: tabId }));
}

export function emitOpenCommandPalette() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(APP_EVENT_OPEN_COMMAND_PALETTE));
}

export function emitOpenShortcutsHelp() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(APP_EVENT_OPEN_SHORTCUTS_HELP));
}
