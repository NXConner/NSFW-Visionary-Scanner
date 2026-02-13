import type { HubTab } from "@/lib/navigation/tabRouting";

export type FeatureCheckFn = (feature: string) => boolean;

export type TabRenderArgs = {
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  checkFeature: FeatureCheckFn;
  hubSections?: Partial<Record<HubTab, string>>;
};

export type TabRenderer = (args: TabRenderArgs) => JSX.Element | null;
