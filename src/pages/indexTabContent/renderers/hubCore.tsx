import { PageSkeleton } from "@/components/ui/skeleton-loader";
import { HeroSection } from "@/components/HeroSection";
import * as LazyTabs from "@/pages/indexLazyTabs";

import type { TabRenderer } from "../types";
import { SectionWrap, Suspended } from "../common";

export const renderHubCoreTab: TabRenderer = ({ activeTab, onNavigateTab, hubSections }) => {
  switch (activeTab) {
    case "home":
      return <HeroSection onGetStarted={() => onNavigateTab("scanner")} />;
    case "scanner":
      // Unified Scanner Page - contains all scanning features:
      // Main scanner, curvature, advanced (3D/time-lapse/batch), AI analysis, history
      return (
        <Suspended fallback={<PageSkeleton />}>
          <LazyTabs.LazyUnifiedScannerPage initialTab={hubSections?.scanner as any} />
        </Suspended>
      );
    case "progress":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyProgressHub initialTab={hubSections?.progress} />
          </Suspended>
        </SectionWrap>
      );
    case "learn":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyLearnHub initialTab={hubSections?.learn} />
          </Suspended>
        </SectionWrap>
      );
    case "community":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyCommunityHub initialTab={hubSections?.community} />
          </Suspended>
        </SectionWrap>
      );
    case "profile":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyProfileHub initialTab={hubSections?.profile} />
          </Suspended>
        </SectionWrap>
      );
    default:
      return null;
  }
};
