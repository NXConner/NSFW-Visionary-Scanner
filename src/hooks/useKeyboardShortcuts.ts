/**
 * Global Keyboard Shortcuts Hook
 * Provides comprehensive keyboard navigation for power users
 */

import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { emitNavigateTab, emitOpenCommandPalette, emitOpenShortcutsHelp } from "@/lib/appEvents";
import { createKeyboardShortcuts, type KeyboardShortcut } from "@/hooks/keyboardShortcuts";

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const { fontSize, setFontSize, colorBlindMode, setColorBlindMode } = useSettings();

  const shortcuts: KeyboardShortcut[] = useMemo(
    () =>
      createKeyboardShortcuts({
        navigateTab: emitNavigateTab,
        openCommandPalette: emitOpenCommandPalette,
        openShortcutsHelp: emitOpenShortcutsHelp,
        openAdminPanel: () => navigate("/admin"),
        openAdminDlc: () => navigate("/admin/dlc"),
        toggleLargeFont: () => {
          const next = fontSize === "large" || fontSize === "xlarge" ? "medium" : "large";
          setFontSize(next);
          toast.success(`Font size: ${next}`);
        },
        cycleColorBlindMode: () => {
          const next =
            colorBlindMode === "none"
              ? "protanopia"
              : colorBlindMode === "protanopia"
                ? "deuteranopia"
                : colorBlindMode === "deuteranopia"
                  ? "tritanopia"
                  : "none";
          setColorBlindMode(next);
          toast.success(`Color blind mode: ${next === "none" ? "off" : next}`);
        },
      }),
    [colorBlindMode, fontSize, navigate, setColorBlindMode, setFontSize],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Find matching shortcut (with null safety check)
      const shortcut = shortcuts.find(s => {
        if (!s.key || !event.key) return false;
        const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatch = s.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const shiftMatch = s.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = s.alt ? event.altKey : !event.altKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (shortcut) {
        // Don't prevent default for certain keys
        if (shortcut.ctrl || shortcut.alt || shortcut.shift) {
          event.preventDefault();
        }
        shortcut.action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, shortcuts]);

  return { shortcuts };
};
