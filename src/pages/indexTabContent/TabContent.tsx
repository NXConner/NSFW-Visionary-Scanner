import { useAuth } from "@/contexts/AuthContext";
import type { HubTab } from "@/lib/navigation/tabRouting";
import { isAnySuperAdminPersisted } from "@/lib/superAdmin";
import NotFound from "@/pages/NotFound";

import { renderAdultTab } from "./adultTabs";
import type { FeatureAccessFn } from "./common";
import type { TabRenderArgs } from "./types";
import { renderHubCoreTab } from "./renderers/hubCore";
import { renderPremiumTab } from "./renderers/premium";
import { renderWellnessTab } from "./renderers/wellness";

// CRITICAL: Get cached super admin status SYNCHRONOUSLY outside component
// This runs ONCE at module load time, ensuring it's available on the very first render
// NO DEPENDENCY ON USER ID - checks if ANY super admin is persisted in localStorage
const INITIAL_SUPER_ADMIN_CACHED = isAnySuperAdminPersisted();

export function TabContent({
  activeTab,
  onNavigateTab,
  hasFeature,
  hubSections,
}: {
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  hasFeature: FeatureAccessFn;
  hubSections?: Partial<Record<HubTab, string>>;
}): JSX.Element {
  // SUPER ADMIN BYPASS: Get privileged status to ensure all features are accessible
  const { isSuperAdmin, hasFullAccess, allFeaturesUnlocked } = useAuth();

  // Use the module-level cached value - guaranteed to be set before first render
  const isPrivileged =
    isSuperAdmin || hasFullAccess || allFeaturesUnlocked || INITIAL_SUPER_ADMIN_CACHED;

  // Privileged users bypass all feature checks
  const checkFeature = (feature: string): boolean => {
    if (isPrivileged) return true;
    return hasFeature(feature);
  };

  const args: TabRenderArgs = {
    activeTab,
    onNavigateTab,
    checkFeature,
    hubSections,
  };

  const rendered = renderHubCoreTab(args) ?? renderWellnessTab(args) ?? renderPremiumTab(args);
  if (rendered) return rendered;

  if (renderAdultTab) {
    const adult = renderAdultTab(activeTab);
    if (adult) return adult;
  }

  return <NotFound />;
}
