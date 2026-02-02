import { HUB_TABS, type HubTab } from "@/lib/navigation/tabRouting";

/**
 * Primary tab order for swipe navigation (Option A).
 * Keep core hubs only; deep links to legacy tabs are resolved separately.
 */
export const tabsOrder: readonly string[] = [...HUB_TABS];

export type TabId = HubTab;
