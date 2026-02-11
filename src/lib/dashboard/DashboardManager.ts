// Dashboard Manager for Customizable Widget Arrangement
import { v4 as uuidv4 } from "uuid";

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
  visible: boolean;
  locked: boolean;
}

export type WidgetType =
  | "quick_scan"
  | "recent_scans"
  | "health_summary"
  | "achievements"
  | "medication_reminder"
  | "symptom_tracker"
  | "trend_chart"
  | "stats_overview"
  | "tutorials_progress"
  | "quick_actions";

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardPreferences {
  currentLayoutId: string;
  autoArrange: boolean;
  showWidgetBorders: boolean;
  animationsEnabled: boolean;
  compactMode: boolean;
  gridSize: number;
}

const STORAGE_KEY = "dashboard_layouts";
const PREFS_KEY = "dashboard_preferences";

const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: "w-1",
    type: "quick_scan",
    title: "Quick Scan",
    position: { x: 0, y: 0 },
    size: { width: 2, height: 2 },
    config: {},
    visible: true,
    locked: false,
  },
  {
    id: "w-2",
    type: "recent_scans",
    title: "Recent Scans",
    position: { x: 2, y: 0 },
    size: { width: 2, height: 2 },
    config: { limit: 5 },
    visible: true,
    locked: false,
  },
  {
    id: "w-3",
    type: "health_summary",
    title: "Health Summary",
    position: { x: 0, y: 2 },
    size: { width: 2, height: 1 },
    config: {},
    visible: true,
    locked: false,
  },
  {
    id: "w-4",
    type: "achievements",
    title: "Achievements",
    position: { x: 2, y: 2 },
    size: { width: 2, height: 1 },
    config: { showRecent: true },
    visible: true,
    locked: false,
  },
  {
    id: "w-5",
    type: "stats_overview",
    title: "Stats Overview",
    position: { x: 0, y: 3 },
    size: { width: 4, height: 1 },
    config: {},
    visible: true,
    locked: false,
  },
];

export class DashboardManager {
  private layouts: Map<string, DashboardLayout> = new Map();
  private preferences: DashboardPreferences;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.preferences = this.getDefaultPreferences();
    this.load();
  }

  private getDefaultPreferences(): DashboardPreferences {
    return {
      currentLayoutId: "default",
      autoArrange: true,
      showWidgetBorders: true,
      animationsEnabled: true,
      compactMode: false,
      gridSize: 4,
    };
  }

  private load(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        parsed.forEach((layout: DashboardLayout) => this.layouts.set(layout.id, layout));
      }

      const prefs = localStorage.getItem(PREFS_KEY);
      if (prefs) {
        this.preferences = { ...this.preferences, ...JSON.parse(prefs) };
      }
    } catch (e) {
      console.error("Failed to load dashboard:", e);
    }

    // Ensure default layout exists
    if (!this.layouts.has("default")) {
      this.layouts.set("default", {
        id: "default",
        name: "Default Layout",
        description: "Standard dashboard layout",
        widgets: [...DEFAULT_WIDGETS],
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      this.save();
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.layouts.values())));
      localStorage.setItem(PREFS_KEY, JSON.stringify(this.preferences));
      this.notifyListeners();
    } catch (e) {
      console.error("Failed to save dashboard:", e);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb());
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Layouts
  getLayouts(): DashboardLayout[] {
    return Array.from(this.layouts.values());
  }

  getLayout(id: string): DashboardLayout | undefined {
    return this.layouts.get(id);
  }

  getCurrentLayout(): DashboardLayout {
    return this.layouts.get(this.preferences.currentLayoutId) || this.layouts.get("default")!;
  }

  createLayout(name: string, description?: string): DashboardLayout {
    const layout: DashboardLayout = {
      id: uuidv4(),
      name,
      description,
      widgets: [...DEFAULT_WIDGETS.map(w => ({ ...w, id: uuidv4() }))],
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.layouts.set(layout.id, layout);
    this.save();
    return layout;
  }

  duplicateLayout(layoutId: string, newName: string): DashboardLayout | null {
    const source = this.layouts.get(layoutId);
    if (!source) return null;

    const layout: DashboardLayout = {
      ...source,
      id: uuidv4(),
      name: newName,
      isDefault: false,
      widgets: source.widgets.map(w => ({ ...w, id: uuidv4() })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.layouts.set(layout.id, layout);
    this.save();
    return layout;
  }

  deleteLayout(id: string): boolean {
    if (id === "default") return false;
    const result = this.layouts.delete(id);
    if (result && this.preferences.currentLayoutId === id) {
      this.preferences.currentLayoutId = "default";
    }
    this.save();
    return result;
  }

  switchLayout(layoutId: string): void {
    if (this.layouts.has(layoutId)) {
      this.preferences.currentLayoutId = layoutId;
      this.save();
    }
  }

  // Widgets
  addWidget(layoutId: string, type: WidgetType, title: string): DashboardWidget | null {
    const layout = this.layouts.get(layoutId);
    if (!layout) return null;

    const widget: DashboardWidget = {
      id: uuidv4(),
      type,
      title,
      position: this.findNextPosition(layout),
      size: this.getDefaultSize(type),
      config: {},
      visible: true,
      locked: false,
    };

    layout.widgets.push(widget);
    layout.updatedAt = new Date().toISOString();
    this.save();
    return widget;
  }

  updateWidget(
    layoutId: string,
    widgetId: string,
    updates: Partial<DashboardWidget>,
  ): DashboardWidget | null {
    const layout = this.layouts.get(layoutId);
    if (!layout) return null;

    const idx = layout.widgets.findIndex(w => w.id === widgetId);
    if (idx === -1) return null;

    layout.widgets[idx] = { ...layout.widgets[idx], ...updates };
    layout.updatedAt = new Date().toISOString();
    this.save();
    return layout.widgets[idx];
  }

  removeWidget(layoutId: string, widgetId: string): boolean {
    const layout = this.layouts.get(layoutId);
    if (!layout) return false;

    const idx = layout.widgets.findIndex(w => w.id === widgetId);
    if (idx === -1) return false;

    layout.widgets.splice(idx, 1);
    layout.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  moveWidget(layoutId: string, widgetId: string, position: { x: number; y: number }): void {
    this.updateWidget(layoutId, widgetId, { position });
  }

  resizeWidget(layoutId: string, widgetId: string, size: { width: number; height: number }): void {
    this.updateWidget(layoutId, widgetId, { size });
  }

  private findNextPosition(layout: DashboardLayout): { x: number; y: number } {
    const grid = this.preferences.gridSize;
    const occupied = new Set<string>();

    layout.widgets.forEach(w => {
      for (let x = w.position.x; x < w.position.x + w.size.width; x++) {
        for (let y = w.position.y; y < w.position.y + w.size.height; y++) {
          occupied.add(`${x},${y}`);
        }
      }
    });

    for (let y = 0; y < 100; y++) {
      for (let x = 0; x < grid; x++) {
        if (!occupied.has(`${x},${y}`)) {
          return { x, y };
        }
      }
    }
    return { x: 0, y: 0 };
  }

  private getDefaultSize(type: WidgetType): { width: number; height: number } {
    const sizes: Record<WidgetType, { width: number; height: number }> = {
      quick_scan: { width: 2, height: 2 },
      recent_scans: { width: 2, height: 2 },
      health_summary: { width: 2, height: 1 },
      achievements: { width: 2, height: 1 },
      medication_reminder: { width: 2, height: 1 },
      symptom_tracker: { width: 2, height: 2 },
      trend_chart: { width: 3, height: 2 },
      stats_overview: { width: 4, height: 1 },
      tutorials_progress: { width: 2, height: 1 },
      quick_actions: { width: 1, height: 2 },
    };
    return sizes[type] || { width: 2, height: 1 };
  }

  // Preferences
  getPreferences(): DashboardPreferences {
    return { ...this.preferences };
  }

  updatePreferences(updates: Partial<DashboardPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.save();
  }

  getAvailableWidgetTypes(): { type: WidgetType; name: string; description: string }[] {
    return [
      { type: "quick_scan", name: "Quick Scan", description: "Start a new scan quickly" },
      { type: "recent_scans", name: "Recent Scans", description: "View your recent scan history" },
      { type: "health_summary", name: "Health Summary", description: "Overview of health metrics" },
      { type: "achievements", name: "Achievements", description: "Recent achievement progress" },
      {
        type: "medication_reminder",
        name: "Medication Reminder",
        description: "Upcoming medication reminders",
      },
      { type: "symptom_tracker", name: "Symptom Tracker", description: "Quick symptom logging" },
      { type: "trend_chart", name: "Trend Chart", description: "Visual trend analysis" },
      { type: "stats_overview", name: "Stats Overview", description: "Key statistics at a glance" },
      {
        type: "tutorials_progress",
        name: "Tutorials Progress",
        description: "Tutorial completion status",
      },
      { type: "quick_actions", name: "Quick Actions", description: "Frequently used actions" },
    ];
  }

  resetLayout(layoutId: string): void {
    const layout = this.layouts.get(layoutId);
    if (layout) {
      layout.widgets = [...DEFAULT_WIDGETS.map(w => ({ ...w, id: uuidv4() }))];
      layout.updatedAt = new Date().toISOString();
      this.save();
    }
  }
}

let instance: DashboardManager | null = null;
export function getDashboardManager(): DashboardManager {
  if (!instance) instance = new DashboardManager();
  return instance;
}
