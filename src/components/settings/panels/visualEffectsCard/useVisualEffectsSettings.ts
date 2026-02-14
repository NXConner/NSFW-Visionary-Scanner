import { useCallback, useState } from "react";
import { toast } from "sonner";

import type {
  VisualEffectsFilterKey,
  VisualEffectsScope,
  VisualEffectsSettings,
} from "@/lib/visualEffectsSettings";
import { defaultSettings, loadSettings, saveSettings } from "@/lib/visualEffectsSettings";

export function useVisualEffectsSettings(): {
  settings: VisualEffectsSettings;
  setScope: (scope: VisualEffectsScope) => void;
  setFilterEnabled: (filterKey: VisualEffectsFilterKey, enabled: boolean) => void;
  setFilterOptions: (
    filterKey: VisualEffectsFilterKey,
    updater: (prev: Record<string, unknown>) => Record<string, unknown>,
  ) => void;
  resetFilter: (filterKey: VisualEffectsFilterKey) => void;
  resetAll: () => void;
} {
  const [settings, setSettings] = useState<VisualEffectsSettings>(loadSettings);

  const update = useCallback(
    (updater: (prev: VisualEffectsSettings) => VisualEffectsSettings, toastMsg?: string) => {
      setSettings(prev => {
        const next = updater(prev);
        saveSettings(next);
        return next;
      });
      if (toastMsg) toast.success(toastMsg);
    },
    [],
  );

  const setScope = useCallback(
    (scope: VisualEffectsScope) => {
      update(prev => ({ ...prev, scope }), "Visual effects scope updated");
    },
    [update],
  );

  const setFilterEnabled = useCallback(
    (filterKey: VisualEffectsFilterKey, enabled: boolean) => {
      update(prev => ({ ...prev, [filterKey]: { ...prev[filterKey], enabled } }));
    },
    [update],
  );

  const setFilterOptions = useCallback(
    (
      filterKey: VisualEffectsFilterKey,
      updater: (prev: Record<string, unknown>) => Record<string, unknown>,
    ) => {
      update(prev => ({
        ...prev,
        [filterKey]: {
          ...prev[filterKey],
          options: updater(prev[filterKey].options as unknown as Record<string, unknown>),
        },
      }));
    },
    [update],
  );

  const resetFilter = useCallback(
    (filterKey: VisualEffectsFilterKey) => {
      update(
        prev => ({
          ...prev,
          [filterKey]: defaultSettings[filterKey],
        }),
        `${filterKey} reset to defaults`,
      );
    },
    [update],
  );

  const resetAll = useCallback(() => {
    update(() => defaultSettings, "All filters reset to defaults");
  }, [update]);

  return { settings, setScope, setFilterEnabled, setFilterOptions, resetFilter, resetAll };
}
