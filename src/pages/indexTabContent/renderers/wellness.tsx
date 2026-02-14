import {
  AIChatPlaceholder,
  EducationPlaceholder,
  GuidePlaceholder,
  PositionsPlaceholder,
  ProgressPlaceholder,
  PumpingPlaceholder,
  RoutinesPlaceholder,
} from "@/components/placeholders";
import * as LazyTabs from "@/pages/indexLazyTabs";

import type { TabRenderer } from "../types";
import { LockedFeature, SectionWrap, Suspended } from "../common";

export const renderWellnessTab: TabRenderer = ({ activeTab, onNavigateTab, checkFeature }) => {
  switch (activeTab) {
    case "diary":
      return (
        <Suspended>
          <LazyTabs.LazyHealthDiarySection />
        </Suspended>
      );
    case "pumping":
      return (
        <Suspended fallback={<PumpingPlaceholder />}>
          <LazyTabs.LazyPumpingSection />
        </Suspended>
      );
    case "guide":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended fallback={<GuidePlaceholder />}>
            <LazyTabs.LazyMensHealthGuide />
          </Suspended>
        </SectionWrap>
      );
    case "routines":
      return checkFeature("customRoutines") ? (
        <Suspended fallback={<RoutinesPlaceholder />}>
          <LazyTabs.LazyPERoutineBuilder />
        </Suspended>
      ) : (
        <LockedFeature feature="PE Routine Builder" tier="Premium" />
      );
    case "pe-progress":
      return checkFeature("peProgressPhotos") ? (
        <Suspended fallback={<ProgressPlaceholder />}>
          <LazyTabs.LazyPEProgressPhotos />
        </Suspended>
      ) : (
        <LockedFeature feature="PE Progress Photos" tier="Premium" />
      );
    case "positions":
      return checkFeature("positionsGallery") ? (
        <Suspended fallback={<PositionsPlaceholder />}>
          <LazyTabs.LazyPositionsGallery />
        </Suspended>
      ) : (
        <LockedFeature feature="Positions Gallery" tier="Premium" />
      );
    case "video-capture":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyVideoCaptureTab />
          </Suspended>
        </SectionWrap>
      );
    case "photo-editor":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyPhotoEditorTab />
          </Suspended>
        </SectionWrap>
      );
    case "partner-sync":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyTabs.LazyPartnerSyncTab onNavigateToTab={onNavigateTab} />
          </Suspended>
        </SectionWrap>
      );
    case "date-night-planner":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyTabs.LazyDateNightHub initialTab="planner" />
          </Suspended>
        </SectionWrap>
      );
    case "date-night-templates":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyTabs.LazyDateNightHub initialTab="templates" />
          </Suspended>
        </SectionWrap>
      );
    case "date-night-history":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyTabs.LazyDateNightHub initialTab="history" />
          </Suspended>
        </SectionWrap>
      );
    case "ai-chat":
      return (
        <SectionWrap maxWidth="max-w-2xl">
          <h1 className="text-3xl font-bold mb-6 text-center gradient-text">AI Health Assistant</h1>
          <p className="text-muted-foreground text-center mb-8">
            Get personalized guidance on PE methods, health conditions, and wellness tips.
          </p>
          <Suspended fallback={<AIChatPlaceholder />}>
            <LazyTabs.LazyAIHealthChatbot />
          </Suspended>
        </SectionWrap>
      );
    case "health-monitoring":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyTabs.LazyComprehensiveHealthMonitoring />
          </Suspended>
        </SectionWrap>
      );
    case "health-dashboard":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyTabs.LazyAdvancedHealthDashboard />
          </Suspended>
        </SectionWrap>
      );
    case "ai-insights":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyTabs.LazyAIHealthInsights />
          </Suspended>
        </SectionWrap>
      );
    case "prostate-testicular":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyTabs.LazyProstateTesticularHealth />
          </Suspended>
        </SectionWrap>
      );
    case "sexual-wellness":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyTabs.LazySexualWellnessTracking />
          </Suspended>
        </SectionWrap>
      );
    case "pelvic-floor":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyTabs.LazyPelvicFloorHub />
          </Suspended>
        </SectionWrap>
      );
    case "sexual-health-education":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyTabs.LazySexualHealthEducation />
          </Suspended>
        </SectionWrap>
      );
    case "education":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended fallback={<EducationPlaceholder />}>
            <LazyTabs.LazyEducationCenter />
          </Suspended>
        </SectionWrap>
      );
    default:
      return null;
  }
};
