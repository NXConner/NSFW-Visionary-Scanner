import {
  EmergencyPlaceholder,
  ProgressPlaceholder,
  ViewerPlaceholder,
} from "@/components/placeholders";
import { DLCUnlock } from "@/components/DLCUnlock";
import DLCStorePage from "@/pages/DLCStorePage";
import * as LazyTabs from "@/pages/indexLazyTabs";

import type { TabRenderer } from "../types";
import { SectionWrap, Suspended } from "../common";

export const renderPremiumTab: TabRenderer = ({ activeTab }) => {
  switch (activeTab) {
    case "community-forum":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyTabs.LazyCommunityForum />
          </Suspended>
        </SectionWrap>
      );
    case "progress-sharing":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyTabs.LazyProgressSharingChallenges />
          </Suspended>
        </SectionWrap>
      );
    case "video-library":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyTabs.LazyVideoLibrary />
          </Suspended>
        </SectionWrap>
      );
    case "interactive-learning":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyTabs.LazyInteractiveLearning />
          </Suspended>
        </SectionWrap>
      );
    case "habit-tracker":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyTabs.LazyHabitTracker />
          </Suspended>
        </SectionWrap>
      );
    case "in-app-messaging":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyInAppMessaging />
          </Suspended>
        </SectionWrap>
      );
    case "live-support":
      return (
        <SectionWrap maxWidth="max-w-4xl">
          <Suspended>
            <LazyTabs.LazyLiveSupportChat />
          </Suspended>
        </SectionWrap>
      );
    // Removed: advanced-scanner and ai-scanning cases - now part of unified "scanner" tab
    case "advanced-reporting":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyAdvancedReportingSystem />
          </Suspended>
        </SectionWrap>
      );
    case "enhanced-diary":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyEnhancedDiaryFeatures />
          </Suspended>
        </SectionWrap>
      );
    case "advanced-routines":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyAdvancedRoutineFeatures />
          </Suspended>
        </SectionWrap>
      );
    case "dlc-system":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <DLCStorePage />
        </SectionWrap>
      );
    case "premium-marketplace":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyPremiumContentMarketplace />
          </Suspended>
        </SectionWrap>
      );
    case "subscription-tiers":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazySubscriptionTiers />
          </Suspended>
        </SectionWrap>
      );
    case "premium-addons":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyPremiumAddOns />
          </Suspended>
        </SectionWrap>
      );
    case "marketplace":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyMarketplaceSystem />
          </Suspended>
        </SectionWrap>
      );
    case "provider-portal":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyHealthcareProviderPortal />
          </Suspended>
        </SectionWrap>
      );
    case "ai-enhancement":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyConversationalAIEnhancement />
          </Suspended>
        </SectionWrap>
      );
    case "predictive-modeling":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyPredictiveHealthModeling />
          </Suspended>
        </SectionWrap>
      );
    case "health-integrations":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyHealthAppIntegrations />
          </Suspended>
        </SectionWrap>
      );
    case "api-webhooks":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyAPIWebhooks />
          </Suspended>
        </SectionWrap>
      );
    case "export-import":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyExportImportSystem />
          </Suspended>
        </SectionWrap>
      );
    case "mobile-wearable":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyMobileWearableFeatures />
          </Suspended>
        </SectionWrap>
      );
    case "security-privacy":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazySecurityPrivacyEnhancements />
          </Suspended>
        </SectionWrap>
      );
    case "expert-consultations":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyTabs.LazyExpertContentConsultations />
          </Suspended>
        </SectionWrap>
      );
    case "3dviewer":
      return (
        <SectionWrap maxWidth="max-w-4xl">
          <Suspended fallback={<ViewerPlaceholder />}>
            <LazyTabs.LazyModel3DViewer />
          </Suspended>
        </SectionWrap>
      );
    case "emergency":
      return (
        <Suspended fallback={<EmergencyPlaceholder />}>
          <LazyTabs.LazyEmergencyGuidance />
        </Suspended>
      );
    case "privacy":
      return (
        <SectionWrap maxWidth="max-w-4xl">
          <h1 className="text-3xl font-bold mb-6 text-center">Privacy &amp; Data Control</h1>
          <Suspended>
            <LazyTabs.LazyPrivacyDashboard />
          </Suspended>
        </SectionWrap>
      );
    case "activity":
      return (
        <SectionWrap maxWidth="max-w-4xl">
          <h1 className="text-3xl font-bold mb-6 text-center">Activity History</h1>
          <Suspended>
            <LazyTabs.LazyAuditTrail />
          </Suspended>
        </SectionWrap>
      );
    case "questionnaire":
      return (
        <Suspended>
          <LazyTabs.LazySymptomQuestionnaire />
        </Suspended>
      );
    case "compare":
      return (
        <Suspended fallback={<ProgressPlaceholder />}>
          <LazyTabs.LazyProgressPhotos />
        </Suspended>
      );
    case "doctors":
      return (
        <Suspended>
          <LazyTabs.LazyPhysicianLocator />
        </Suspended>
      );
    case "settings":
      return (
        <SectionWrap maxWidth="max-w-4xl">
          <h1 className="text-3xl font-bold mb-6 text-center gradient-text">Settings</h1>
          <Suspended>
            <LazyTabs.LazySettingsPanel />
          </Suspended>
        </SectionWrap>
      );
    case "/dlc":
      return <DLCUnlock />;
    case "/store":
      return <DLCStorePage />;
    default:
      return null;
  }
};
