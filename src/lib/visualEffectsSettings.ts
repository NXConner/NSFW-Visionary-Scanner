/**
 * Visual Effects Settings Storage
 *
 * Manages storage and retrieval of visual effects settings
 */

import type {
  CelShadingOptions,
  GraphicNovelOptions,
  ConceptArtOptions,
  InkedConceptArtOptions,
  SobelFilterOptions,
} from "./imageFilters";

export type VisualEffectsScope = "capture" | "ui" | "both";

export const visualEffectsFilterKeys = [
  "celShading",
  "graphicNovel",
  "conceptArt",
  "inkedConceptArt",
  "sobel",
] as const;

export type VisualEffectsFilterKey = (typeof visualEffectsFilterKeys)[number];

export interface VisualEffectsSettings {
  /**
   * Controls where the visual effects are applied.
   * - capture: apply when capturing images (scanner/camera)
   * - ui: apply when rendering images in the UI (progress photos, galleries, etc.)
   * - both: apply in both places
   */
  scope: VisualEffectsScope;
  celShading: {
    enabled: boolean;
    options: CelShadingOptions;
  };
  graphicNovel: {
    enabled: boolean;
    options: GraphicNovelOptions;
  };
  conceptArt: {
    enabled: boolean;
    options: ConceptArtOptions;
  };
  inkedConceptArt: {
    enabled: boolean;
    options: InkedConceptArtOptions;
  };
  sobel: {
    enabled: boolean;
    options: SobelFilterOptions;
  };
}

export const defaultSettings: VisualEffectsSettings = {
  scope: "capture",
  celShading: {
    enabled: false,
    options: {
      levels: 4,
      edgeThreshold: 0.3,
      edgeColor: "#000000",
    },
  },
  graphicNovel: {
    enabled: false,
    options: {
      contrast: 1.5,
      saturation: 1.2,
      halftone: 0.3,
    },
  },
  conceptArt: {
    enabled: false,
    options: {
      sketch: 0.5,
      colorWash: 0.4,
      vignette: 0.3,
    },
  },
  inkedConceptArt: {
    enabled: false,
    options: {
      inkThickness: 2,
      inkColor: "#000000",
      paperTexture: 0.2,
    },
  },
  sobel: {
    enabled: false,
    options: {
      threshold: 50,
      invert: false,
      blur: 0,
    },
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeFilter<TOptions>(params: {
  base: { enabled: boolean; options: TOptions };
  incoming: unknown;
}): { enabled: boolean; options: TOptions } {
  const { base, incoming } = params;
  if (!isRecord(incoming)) return base;
  const enabled = typeof incoming.enabled === "boolean" ? incoming.enabled : base.enabled;
  const options = isRecord(incoming.options)
    ? ({ ...base.options, ...incoming.options } as TOptions)
    : base.options;
  return { enabled, options };
}

function mergeScope(incoming: unknown): VisualEffectsScope {
  if (!isRecord(incoming)) return defaultSettings.scope;
  const s = incoming.scope;
  if (s === "capture" || s === "ui" || s === "both") return s;
  return defaultSettings.scope;
}

function mergeSettings(incoming: unknown): VisualEffectsSettings {
  if (!isRecord(incoming)) return defaultSettings;
  return {
    scope: mergeScope(incoming),
    celShading: mergeFilter({ base: defaultSettings.celShading, incoming: incoming.celShading }),
    graphicNovel: mergeFilter({
      base: defaultSettings.graphicNovel,
      incoming: incoming.graphicNovel,
    }),
    conceptArt: mergeFilter({ base: defaultSettings.conceptArt, incoming: incoming.conceptArt }),
    inkedConceptArt: mergeFilter({
      base: defaultSettings.inkedConceptArt,
      incoming: incoming.inkedConceptArt,
    }),
    sobel: mergeFilter({ base: defaultSettings.sobel, incoming: incoming.sobel }),
  };
}

export function loadSettings(): VisualEffectsSettings {
  try {
    const stored = localStorage.getItem("visualEffectsSettings");
    if (stored) {
      return mergeSettings(JSON.parse(stored));
    }
  } catch (error) {
    // Ignore errors
  }
  return defaultSettings;
}

export function saveSettings(settings: VisualEffectsSettings): void {
  try {
    localStorage.setItem("visualEffectsSettings", JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("visual-effects-changed", { detail: settings }));
  } catch (error) {
    // Ignore errors
  }
}

export function getVisualEffectsSettings(): VisualEffectsSettings {
  return loadSettings();
}

export function getEnabledFilters(): Array<{
  type: VisualEffectsFilterKey;
  options: any;
}> {
  const settings = loadSettings();
  const enabled: Array<{ type: VisualEffectsFilterKey; options: any }> = [];

  for (const key of visualEffectsFilterKeys) {
    if (settings[key].enabled) {
      enabled.push({ type: key, options: settings[key].options });
    }
  }

  return enabled;
}

export function shouldApplyVisualEffectsToCapture(): boolean {
  const { scope } = loadSettings();
  return scope === "capture" || scope === "both";
}

export function shouldApplyVisualEffectsToUI(): boolean {
  const { scope } = loadSettings();
  return scope === "ui" || scope === "both";
}
