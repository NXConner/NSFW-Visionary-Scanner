// Premium Themes Manager
import { v4 as uuidv4 } from "uuid";

export interface Theme {
  id: string;
  name: string;
  description: string;
  category: "light" | "dark" | "colorful" | "minimal" | "premium";
  isPremium: boolean;
  isCustom: boolean;
  preview: string; // gradient or color preview
  colors: ThemeColors;
  fonts?: ThemeFonts;
  effects?: ThemeEffects;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  mono: string;
}

export interface ThemeEffects {
  borderRadius: "none" | "small" | "medium" | "large" | "full";
  shadows: "none" | "subtle" | "medium" | "dramatic";
  animations: "none" | "minimal" | "normal" | "playful";
  blur: boolean;
  glow: boolean;
}

export interface ThemePreferences {
  currentThemeId: string;
  autoSwitchTime?: { light: string; dark: string };
  useSystemTheme: boolean;
  customCSS?: string;
}

const STORAGE_KEY = "custom_themes";
const PREFS_KEY = "theme_preferences";

const BUILT_IN_THEMES: Theme[] = [
  {
    id: "default-dark",
    name: "Default Dark",
    description: "The standard dark theme",
    category: "dark",
    isPremium: false,
    isCustom: false,
    preview: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    colors: {
      primary: "#3b82f6",
      secondary: "#8b5cf6",
      accent: "#06b6d4",
      background: "#0f0f14",
      surface: "#1a1a24",
      text: "#ffffff",
      textMuted: "#9ca3af",
      border: "#374151",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
    effects: {
      borderRadius: "medium",
      shadows: "subtle",
      animations: "normal",
      blur: true,
      glow: false,
    },
  },
  {
    id: "default-light",
    name: "Default Light",
    description: "Clean light theme",
    category: "light",
    isPremium: false,
    isCustom: false,
    preview: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    colors: {
      primary: "#2563eb",
      secondary: "#7c3aed",
      accent: "#0891b2",
      background: "#ffffff",
      surface: "#f8fafc",
      text: "#1e293b",
      textMuted: "#64748b",
      border: "#e2e8f0",
      success: "#16a34a",
      warning: "#d97706",
      error: "#dc2626",
      info: "#2563eb",
    },
    effects: {
      borderRadius: "medium",
      shadows: "subtle",
      animations: "normal",
      blur: false,
      glow: false,
    },
  },
  {
    id: "midnight-purple",
    name: "Midnight Purple",
    description: "Deep purple accents on dark background",
    category: "dark",
    isPremium: true,
    isCustom: false,
    preview: "linear-gradient(135deg, #1e1b4b 0%, #581c87 100%)",
    colors: {
      primary: "#a855f7",
      secondary: "#ec4899",
      accent: "#f472b6",
      background: "#0c0a1d",
      surface: "#1e1b4b",
      text: "#faf5ff",
      textMuted: "#c4b5fd",
      border: "#4c1d95",
      success: "#34d399",
      warning: "#fbbf24",
      error: "#f87171",
      info: "#a855f7",
    },
    effects: {
      borderRadius: "large",
      shadows: "dramatic",
      animations: "playful",
      blur: true,
      glow: true,
    },
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    description: "Calming blue and teal tones",
    category: "colorful",
    isPremium: true,
    isCustom: false,
    preview: "linear-gradient(135deg, #0c4a6e 0%, #0d9488 100%)",
    colors: {
      primary: "#0ea5e9",
      secondary: "#14b8a6",
      accent: "#06b6d4",
      background: "#0c1929",
      surface: "#0c4a6e",
      text: "#f0f9ff",
      textMuted: "#7dd3fc",
      border: "#0369a1",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#f43f5e",
      info: "#0ea5e9",
    },
    effects: {
      borderRadius: "large",
      shadows: "medium",
      animations: "normal",
      blur: true,
      glow: true,
    },
  },
  {
    id: "sunset-warmth",
    name: "Sunset Warmth",
    description: "Warm orange and red gradients",
    category: "colorful",
    isPremium: true,
    isCustom: false,
    preview: "linear-gradient(135deg, #7c2d12 0%, #dc2626 50%, #f59e0b 100%)",
    colors: {
      primary: "#f97316",
      secondary: "#ef4444",
      accent: "#fbbf24",
      background: "#1c1412",
      surface: "#451a03",
      text: "#fff7ed",
      textMuted: "#fdba74",
      border: "#9a3412",
      success: "#84cc16",
      warning: "#fbbf24",
      error: "#ef4444",
      info: "#f97316",
    },
    effects: {
      borderRadius: "medium",
      shadows: "dramatic",
      animations: "playful",
      blur: true,
      glow: true,
    },
  },
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    description: "Clean monochrome design",
    category: "minimal",
    isPremium: false,
    isCustom: false,
    preview: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
    colors: {
      primary: "#a1a1aa",
      secondary: "#71717a",
      accent: "#d4d4d8",
      background: "#09090b",
      surface: "#18181b",
      text: "#fafafa",
      textMuted: "#a1a1aa",
      border: "#3f3f46",
      success: "#a1a1aa",
      warning: "#a1a1aa",
      error: "#a1a1aa",
      info: "#a1a1aa",
    },
    effects: {
      borderRadius: "small",
      shadows: "none",
      animations: "minimal",
      blur: false,
      glow: false,
    },
  },
  {
    id: "neon-cyber",
    name: "Neon Cyber",
    description: "Cyberpunk-inspired neon colors",
    category: "premium",
    isPremium: true,
    isCustom: false,
    preview: "linear-gradient(135deg, #000000 0%, #1a002e 50%, #00ff88 100%)",
    colors: {
      primary: "#00ff88",
      secondary: "#ff00ff",
      accent: "#00ffff",
      background: "#000000",
      surface: "#0a0a0f",
      text: "#00ff88",
      textMuted: "#00cc6a",
      border: "#00ff8855",
      success: "#00ff88",
      warning: "#ffff00",
      error: "#ff0055",
      info: "#00ffff",
    },
    effects: {
      borderRadius: "none",
      shadows: "dramatic",
      animations: "playful",
      blur: true,
      glow: true,
    },
  },
];

export class ThemeManager {
  private themes: Map<string, Theme> = new Map();
  private preferences: ThemePreferences;
  private listeners: Set<(theme: Theme) => void> = new Set();

  constructor() {
    BUILT_IN_THEMES.forEach(t => this.themes.set(t.id, t));
    this.preferences = this.getDefaultPreferences();
    this.load();
  }

  private getDefaultPreferences(): ThemePreferences {
    return {
      currentThemeId: "default-dark",
      useSystemTheme: false,
    };
  }

  private load(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        parsed.forEach((theme: Theme) => this.themes.set(theme.id, theme));
      }

      const prefs = localStorage.getItem(PREFS_KEY);
      if (prefs) {
        this.preferences = { ...this.preferences, ...JSON.parse(prefs) };
      }
    } catch (e) {
      console.error("Failed to load themes:", e);
    }
  }

  private save(): void {
    try {
      const customThemes = Array.from(this.themes.values()).filter(t => t.isCustom);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customThemes));
      localStorage.setItem(PREFS_KEY, JSON.stringify(this.preferences));
    } catch (e) {
      console.error("Failed to save themes:", e);
    }
  }

  subscribe(callback: (theme: Theme) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const theme = this.getCurrentTheme();
    this.listeners.forEach(cb => cb(theme));
  }

  getThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  getTheme(id: string): Theme | undefined {
    return this.themes.get(id);
  }

  getThemesByCategory(category: Theme["category"]): Theme[] {
    return this.getThemes().filter(t => t.category === category);
  }

  getCurrentTheme(): Theme {
    if (this.preferences.useSystemTheme) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return this.themes.get(prefersDark ? "default-dark" : "default-light")!;
    }
    return this.themes.get(this.preferences.currentThemeId) || this.themes.get("default-dark")!;
  }

  setTheme(themeId: string): void {
    if (this.themes.has(themeId)) {
      this.preferences.currentThemeId = themeId;
      this.preferences.useSystemTheme = false;
      this.save();
      this.applyTheme(this.themes.get(themeId)!);
      this.notifyListeners();
    }
  }

  createCustomTheme(name: string, baseThemeId?: string): Theme {
    const base = baseThemeId ? this.themes.get(baseThemeId) : this.themes.get("default-dark");
    const theme: Theme = {
      ...base!,
      id: uuidv4(),
      name,
      description: "Custom theme",
      isPremium: false,
      isCustom: true,
      colors: { ...base!.colors },
      effects: { ...base!.effects },
    };
    this.themes.set(theme.id, theme);
    this.save();
    return theme;
  }

  updateTheme(themeId: string, updates: Partial<Theme>): Theme | null {
    const theme = this.themes.get(themeId);
    if (!theme || !theme.isCustom) return null;

    const updated = { ...theme, ...updates };
    this.themes.set(themeId, updated);
    this.save();

    if (this.preferences.currentThemeId === themeId) {
      this.applyTheme(updated);
      this.notifyListeners();
    }
    return updated;
  }

  updateThemeColors(themeId: string, colors: Partial<ThemeColors>): Theme | null {
    const theme = this.themes.get(themeId);
    if (!theme || !theme.isCustom) return null;

    theme.colors = { ...theme.colors, ...colors };
    this.themes.set(themeId, theme);
    this.save();

    if (this.preferences.currentThemeId === themeId) {
      this.applyTheme(theme);
      this.notifyListeners();
    }
    return theme;
  }

  deleteTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId);
    if (!theme || !theme.isCustom) return false;

    this.themes.delete(themeId);
    if (this.preferences.currentThemeId === themeId) {
      this.preferences.currentThemeId = "default-dark";
    }
    this.save();
    this.notifyListeners();
    return true;
  }

  applyTheme(theme: Theme): void {
    const root = document.documentElement;

    // Apply colors as CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply effects
    if (theme.effects) {
      const radiusMap = {
        none: "0",
        small: "0.25rem",
        medium: "0.5rem",
        large: "1rem",
        full: "9999px",
      };
      root.style.setProperty("--border-radius", radiusMap[theme.effects.borderRadius]);
      root.style.setProperty("--enable-blur", theme.effects.blur ? "1" : "0");
      root.style.setProperty("--enable-glow", theme.effects.glow ? "1" : "0");
    }

    // Apply custom CSS if present
    if (this.preferences.customCSS) {
      let styleEl = document.getElementById("custom-theme-css");
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "custom-theme-css";
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = this.preferences.customCSS;
    }
  }

  getPreferences(): ThemePreferences {
    return { ...this.preferences };
  }

  updatePreferences(updates: Partial<ThemePreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.save();
    if (updates.useSystemTheme !== undefined) {
      this.applyTheme(this.getCurrentTheme());
      this.notifyListeners();
    }
  }

  exportTheme(themeId: string): string | null {
    const theme = this.themes.get(themeId);
    if (!theme) return null;
    return JSON.stringify(theme, null, 2);
  }

  importTheme(json: string): Theme | null {
    try {
      const theme = JSON.parse(json) as Theme;
      theme.id = uuidv4();
      theme.isCustom = true;
      theme.isPremium = false;
      this.themes.set(theme.id, theme);
      this.save();
      return theme;
    } catch (e) {
      console.error("Failed to import theme:", e);
      return null;
    }
  }

  // Initialize on load
  init(): void {
    this.applyTheme(this.getCurrentTheme());

    if (this.preferences.useSystemTheme) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        this.applyTheme(this.getCurrentTheme());
        this.notifyListeners();
      });
    }
  }
}

let instance: ThemeManager | null = null;
export function getThemeManager(): ThemeManager {
  if (!instance) {
    instance = new ThemeManager();
    instance.init();
  }
  return instance;
}
