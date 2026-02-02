import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/Footer";
import { useGestureNavigation } from "@/hooks/useGestureNavigation";
import { FloatingQuickActions } from "@/components/FloatingQuickActions";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { useDisclaimer } from "@/hooks/useDisclaimer";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { MeshGradient, PageTransition, ParticleField } from "@/components/premium";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { tabsOrder, type TabId } from "@/pages/indexTabsOrder";
import { resolveTabRequest, type HubTab, HUB_TABS } from "@/lib/navigation/tabRouting";
import { TabContent } from "@/pages/indexTabContent";
import { useNSFWAvailable } from "@/dlc/context/DLCContext";
import { useLocation } from "react-router-dom";
import { AppShell } from "@/components/appShell";

const Index = () => {
  // activeTab can be either a HubTab or a direct tab ID (like "date-night-planner")
  const [activeTab, setActiveTab] = useState<string>("home");
  const [hubSections, setHubSections] = useState<Partial<Record<HubTab, string>>>({});
  const { hasAccepted: disclaimerAccepted, isLoading: disclaimerLoading } = useDisclaimer();
  const premiumMesh = useFeatureFlag("premium_mesh");
  const premiumParticles = useFeatureFlag("premium_particles");
  const pendingTabKey = "__MORPHOSCAN_PENDING_TAB__";
  const location = useLocation();

  const gestureEnabled = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
    [],
  );

  const changeTab = useCallback((nextTab: string) => {
    const resolved = resolveTabRequest(nextTab);
    if (resolved) {
      // Tab maps to a hub, set the hub as active
      setActiveTab(resolved.hub);
      if (resolved.section) {
        setHubSections(prev => ({ ...prev, [resolved.hub]: resolved.section }));
      }
    } else if (nextTab && nextTab.trim()) {
      // Tab doesn't map to a hub, set it as a direct tab ID
      // This allows tabs like "date-night-planner" to work directly
      setActiveTab(nextTab.trim());
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Support deep-links: "/?tab=<tabId>" (e.g. /?tab=3dviewer)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const next = (params.get("tab") || "").trim();
    if (!next) return;
    if (next) changeTab(next);
  }, [location.search, changeTab]);

  // Listen for navigation events from settings
  useEffect(() => {
    const handleNavigateTab = (e: CustomEvent<string>) => {
      changeTab(e.detail);
    };
    window.addEventListener("navigate-tab", handleNavigateTab as EventListener);
    // Apply any tab requested before the listener was mounted (startup/E2E hardening).
    try {
      const pending = (window as any)?.[pendingTabKey];
      if (typeof pending === "string" && pending.length > 0) {
        (window as any)[pendingTabKey] = undefined;
        changeTab(pending);
      }
    } catch {
      // ignore
    }
    return () => window.removeEventListener("navigate-tab", handleNavigateTab as EventListener);
  }, [changeTab, pendingTabKey]);

  const nsfw = useNSFWAvailable();

  // If adult-only content gets disabled (e.g. admin master toggle OFF), bounce out of adult-only tabs immediately.
  useEffect(() => {
    if (!activeTab.startsWith("nsfw-")) return;
    if (nsfw.isLoading) return;
    if (!nsfw.requiresDLC) return;
    setActiveTab("home");
  }, [activeTab, nsfw.isLoading, nsfw.requiresDLC]);

  const effectiveTabsOrder = useMemo(() => tabsOrder, []);

  const moveTab = useCallback(
    (direction: 1 | -1) => {
      const index = effectiveTabsOrder.indexOf(activeTab as TabId);
      if (index === -1) return;
      const nextIndex = (index + direction + effectiveTabsOrder.length) % effectiveTabsOrder.length;
      setActiveTab(effectiveTabsOrder[nextIndex]);
    },
    [activeTab, effectiveTabsOrder],
  );

  const gestureRef = useGestureNavigation<HTMLDivElement>({
    onSwipeLeft: useCallback(() => moveTab(1), [moveTab]),
    onSwipeRight: useCallback(() => moveTab(-1), [moveTab]),
    enabled: gestureEnabled,
    threshold: 60,
  });

  const { hasFeature } = useFeatureAccess();

  return (
    <AppShell activeTab={activeTab} onTabChange={changeTab}>
      {/* First-launch disclaimer modal */}
      {!disclaimerLoading && !disclaimerAccepted && <MedicalDisclaimer mode="modal" showCheckbox />}

      <main id="main-content" ref={gestureRef} className="flex-1 relative pb-20 md:pb-0">
        {activeTab === "progress" && hubSections.progress === "health" && (
          <>
            {premiumMesh && <MeshGradient variant="dashboard" intensity="default" />}
            {premiumParticles && (
              <ParticleField
                className="opacity-50"
                density={0.00005}
                connectDistance={135}
                speed={1}
                maxParticles={120}
              />
            )}
          </>
        )}
        <PageTransition transitionKey={activeTab} variant="fade-scale">
          <TabContent
            activeTab={activeTab}
            onNavigateTab={changeTab}
            hasFeature={hasFeature}
            hubSections={hubSections}
          />
        </PageTransition>
      </main>
      {activeTab === "home" && <Footer />}
      <FloatingQuickActions onNavigate={changeTab} />
    </AppShell>
  );
};

export default Index;
