import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { MobileWidgetConfiguration, JsonObject } from "./types";

const WIDGETS_KEY = "mobile_widget_configurations";

function getStoredWidgets(): MobileWidgetConfiguration[] {
  try {
    const stored = localStorage.getItem(WIDGETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveWidgets(widgets: MobileWidgetConfiguration[]): void {
  try {
    localStorage.setItem(WIDGETS_KEY, JSON.stringify(widgets));
  } catch {
    // ignore
  }
}

export async function createMobileWidget(
  widgetType: MobileWidgetConfiguration["widget_type"],
  widgetName: string,
  platform: MobileWidgetConfiguration["platform"],
  widgetConfig: JsonObject = {},
): Promise<MobileWidgetConfiguration | null> {
  try {
    const widgets = getStoredWidgets();

    const newWidget: MobileWidgetConfiguration = {
      id: crypto.randomUUID(),
      user_id: "local",
      widget_type: widgetType,
      widget_name: widgetName,
      platform,
      widget_config: widgetConfig,
      refresh_frequency_minutes: 15,
      is_active: true,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    widgets.push(newWidget);
    saveWidgets(widgets);
    toast.success(`Widget "${widgetName}" created!`);
    return newWidget;
  } catch (error) {
    logger.error("Failed to create widget", { error });
    toast.error("Failed to create widget");
    return null;
  }
}

export async function getMobileWidgets(): Promise<MobileWidgetConfiguration[]> {
  try {
    return getStoredWidgets();
  } catch (error) {
    logger.error("Failed to load widgets", { error });
    return [];
  }
}

export async function updateMobileWidget(
  widgetId: string,
  updates: Partial<MobileWidgetConfiguration>,
): Promise<MobileWidgetConfiguration | null> {
  try {
    const widgets = getStoredWidgets();
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return null;

    Object.assign(widget, updates, { updated_at: new Date().toISOString() });
    saveWidgets(widgets);
    return widget;
  } catch (error) {
    logger.error("Failed to update widget", { error });
    return null;
  }
}

export async function deleteMobileWidget(widgetId: string): Promise<boolean> {
  try {
    const widgets = getStoredWidgets();
    const filtered = widgets.filter(w => w.id !== widgetId);
    saveWidgets(filtered);
    toast.success("Widget deleted");
    return true;
  } catch (error) {
    logger.error("Failed to delete widget", { error });
    toast.error("Failed to delete widget");
    return false;
  }
}
