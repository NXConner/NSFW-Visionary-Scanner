import * as React from "react";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/ui/skeleton-loader";
import {
  AIChatPlaceholder,
  EducationPlaceholder,
  EmergencyPlaceholder,
  GuidePlaceholder,
  PositionsPlaceholder,
  ProgressPlaceholder,
  PumpingPlaceholder,
  RoutinesPlaceholder,
  ViewerPlaceholder,
} from "@/components/placeholders";
import { HeroSection } from "@/components/HeroSection";
import { DLCUnlock } from "@/components/DLCUnlock";
import DLCStorePage from "@/pages/DLCStorePage";
import NotFound from "@/pages/NotFound";
import { LockedFeaturePanel } from "@/components/LockedFeaturePanel";
import { FeatureGate as DlcFeatureGate } from "@/dlc/components/FeatureGate";
import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";
import { useAuth } from "@/contexts/AuthContext";
import { isSuperAdminCached, isAnySuperAdminPersisted } from "@/lib/superAdmin";
import {
  LazyAdvancedHealthDashboard,
  LazyAdvancedReportingSystem,
  LazyAdvancedRoutineFeatures,
  LazyAIHealthChatbot,
  LazyAIHealthInsights,
  LazyAPIWebhooks,
  LazyAuditTrail,
  LazyCommunityForum,
  LazyComprehensiveHealthMonitoring,
  LazyConversationalAIEnhancement,
  LazyEducationCenter,
  LazyEducationalContent,
  LazyEmergencyGuidance,
  LazyEnhancedDiaryFeatures,
  LazyExpertContentConsultations,
  LazyExportImportSystem,
  LazyHabitTracker,
  LazyHealthAppIntegrations,
  LazyHealthDiarySection,
  LazyInAppMessaging,
  LazyInteractiveLearning,
  LazyLiveSupportChat,
  LazyMarketplaceSystem,
  LazyMensHealthGuide,
  LazyPelvicFloorHub,
  LazyMobileWearableFeatures,
  LazyModel3DViewer,
  LazyNSFWAdvancedFeatures,
  LazyNSFWCockWorshipingEducation,
  LazyNSFWEducationHub,
  LazyNSFWCommunityForum,
  LazyNSFWSexualWellnessAnalytics,
  LazyNSFWVideoContent,
  LazyPEProgressPhotos,
  LazyPERoutineBuilder,
  LazyPhysicianLocator,
  LazyPositionsGallery,
  LazyPredictiveHealthModeling,
  LazyPremiumAddOns,
  LazyPremiumContentMarketplace,
  LazyPrivacyDashboard,
  LazyProfileSection,
  LazyProgressPhotos,
  LazyProgressSharingChallenges,
  LazyProstateTesticularHealth,
  LazyPumpingSection,
  LazyUnifiedScannerPage,
  LazySecurityPrivacyEnhancements,
  LazySexualHealthEducation,
  LazySexualWellnessTracking,
  LazySubscriptionTiers,
  LazySymptomQuestionnaire,
  LazyVideoLibrary,
  LazyHealthcareProviderPortal,
  LazySettingsPanel,
  LazyVideoCaptureTab,
  LazyPhotoEditorTab,
  LazyPartnerSyncTab,
  LazyDateNightHub,
  LazyProgressHub,
  LazyLearnHub,
  LazyCommunityHub,
  LazyProfileHub,
} from "@/pages/indexLazyTabs";
import type { HubTab } from "@/lib/navigation/tabRouting";

type FeatureAccessFn = (feature: string) => boolean;

function SectionWrap({
  children,
  maxWidth = "max-w-6xl",
  className,
}: {
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}) {
  return (
    <section className={["min-h-screen px-4 py-20", className].filter(Boolean).join(" ")}>
      <div className={`container mx-auto ${maxWidth}`}>{children}</div>
    </section>
  );
}

function Suspended({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return <Suspense fallback={fallback ?? <PageSkeleton />}>{children}</Suspense>;
}

function LockedFeature({ feature, tier }: { feature: string; tier: string }) {
  return (
    <SectionWrap maxWidth="max-w-4xl">
      <LockedFeaturePanel feature={feature} tier={tier} />
    </SectionWrap>
  );
}

type AdultTabRenderer = (activeTab: string) => React.ReactNode;

let renderAdultTab: AdultTabRenderer | null = null;
if (BUILD_ALLOW_ADULT_BUNDLE) {
  const LazyNsfwSessionGate = React.lazy(() =>
    import("@/components/nsfw/NsfwSessionGate").then(m => ({ default: m.NsfwSessionGate })),
  );

  renderAdultTab = (activeTab: string) => {
    switch (activeTab) {
      case "nsfw-videos":
        return (
          <SectionWrap maxWidth="max-w-7xl">
            <Suspended>
              <LazyNsfwSessionGate>
                <DlcFeatureGate
                  featureId="video_library"
                  fallbackTitle="NSFW Video Library"
                  fallbackDescription="Requires the Video Library DLC."
                >
                  <Suspended>
                    <LazyNSFWVideoContent />
                  </Suspended>
                </DlcFeatureGate>
              </LazyNsfwSessionGate>
            </Suspended>
          </SectionWrap>
        );
      case "nsfw-cock-worshiping":
      case "nsfw-education-hub":
        return (
          <SectionWrap maxWidth="max-w-6xl">
            <Suspended>
              <LazyNsfwSessionGate>
                <DlcFeatureGate
                  featureId="intimate_education"
                  fallbackTitle="Intimate Education Hub"
                  fallbackDescription="Requires the Intimate Education add-on."
                >
                  <Suspended>
                    <LazyNSFWEducationHub />
                  </Suspended>
                </DlcFeatureGate>
              </LazyNsfwSessionGate>
            </Suspended>
          </SectionWrap>
        );
      case "nsfw-forum":
        return (
          <SectionWrap maxWidth="max-w-7xl">
            <Suspended>
              <LazyNsfwSessionGate>
                <DlcFeatureGate
                  featureId="private_forum"
                  fallbackTitle="NSFW Community"
                  fallbackDescription="Requires the Private Community DLC."
                >
                  <Suspended>
                    <LazyNSFWCommunityForum />
                  </Suspended>
                </DlcFeatureGate>
              </LazyNsfwSessionGate>
            </Suspended>
          </SectionWrap>
        );
      case "nsfw-wellness-analytics":
        return (
          <SectionWrap maxWidth="max-w-7xl">
            <Suspended>
              <LazyNsfwSessionGate>
                <DlcFeatureGate
                  featureId="wellness_analytics"
                  fallbackTitle="NSFW Wellness Analytics"
                  fallbackDescription="Requires the Wellness Analytics DLC."
                >
                  <Suspended>
                    <LazyNSFWSexualWellnessAnalytics />
                  </Suspended>
                </DlcFeatureGate>
              </LazyNsfwSessionGate>
            </Suspended>
          </SectionWrap>
        );
      case "nsfw-advanced":
        return (
          <SectionWrap maxWidth="max-w-7xl">
            <Suspended>
              <LazyNsfwSessionGate>
                <DlcFeatureGate
                  featureId="multi_camera"
                  fallbackTitle="NSFW Advanced Features"
                  fallbackDescription="Requires the Advanced Features Pack."
                >
                  <Suspended>
                    <LazyNSFWAdvancedFeatures />
                  </Suspended>
                </DlcFeatureGate>
              </LazyNsfwSessionGate>
            </Suspended>
          </SectionWrap>
        );
      default:
        return null;
    }
  };
}

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
}) {
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

  switch (activeTab) {
    case "home":
      return <HeroSection onGetStarted={() => onNavigateTab("scanner")} />;
    case "scanner":
      // Unified Scanner Page - contains all scanning features:
      // Main scanner, curvature, advanced (3D/time-lapse/batch), AI analysis, history
      return (
        <Suspended fallback={<PageSkeleton />}>
          <LazyUnifiedScannerPage initialTab={hubSections?.scanner as any} />
        </Suspended>
      );
    case "progress":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyProgressHub initialTab={hubSections?.progress} />
          </Suspended>
        </SectionWrap>
      );
    case "learn":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyLearnHub initialTab={hubSections?.learn} />
          </Suspended>
        </SectionWrap>
      );
    case "community":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyCommunityHub initialTab={hubSections?.community} />
          </Suspended>
        </SectionWrap>
      );
    case "profile":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyProfileHub initialTab={hubSections?.profile} />
          </Suspended>
        </SectionWrap>
      );
    case "diary":
      return (
        <Suspended>
          <LazyHealthDiarySection />
        </Suspended>
      );
    case "pumping":
      return (
        <Suspended fallback={<PumpingPlaceholder />}>
          <LazyPumpingSection />
        </Suspended>
      );
    case "guide":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended fallback={<GuidePlaceholder />}>
            <LazyMensHealthGuide />
          </Suspended>
        </SectionWrap>
      );
    case "routines":
      return checkFeature("customRoutines") ? (
        <Suspended fallback={<RoutinesPlaceholder />}>
          <LazyPERoutineBuilder />
        </Suspended>
      ) : (
        <LockedFeature feature="PE Routine Builder" tier="Premium" />
      );
    case "pe-progress":
      return checkFeature("peProgressPhotos") ? (
        <Suspended fallback={<ProgressPlaceholder />}>
          <LazyPEProgressPhotos />
        </Suspended>
      ) : (
        <LockedFeature feature="PE Progress Photos" tier="Premium" />
      );
    case "positions":
      return checkFeature("positionsGallery") ? (
        <Suspended fallback={<PositionsPlaceholder />}>
          <LazyPositionsGallery />
        </Suspended>
      ) : (
        <LockedFeature feature="Positions Gallery" tier="Premium" />
      );
    case "video-capture":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyVideoCaptureTab />
          </Suspended>
        </SectionWrap>
      );
    case "photo-editor":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyPhotoEditorTab />
          </Suspended>
        </SectionWrap>
      );
    case "partner-sync":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyPartnerSyncTab onNavigateToTab={onNavigateTab} />
          </Suspended>
        </SectionWrap>
      );
    case "date-night-planner":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyDateNightHub initialTab="planner" />
          </Suspended>
        </SectionWrap>
      );
    case "date-night-templates":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyDateNightHub initialTab="templates" />
          </Suspended>
        </SectionWrap>
      );
    case "date-night-history":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyDateNightHub initialTab="history" />
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
            <LazyAIHealthChatbot />
          </Suspended>
        </SectionWrap>
      );
    case "health-monitoring":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyComprehensiveHealthMonitoring />
          </Suspended>
        </SectionWrap>
      );
    case "health-dashboard":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyAdvancedHealthDashboard />
          </Suspended>
        </SectionWrap>
      );
    case "ai-insights":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyAIHealthInsights />
          </Suspended>
        </SectionWrap>
      );
    case "prostate-testicular":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyProstateTesticularHealth />
          </Suspended>
        </SectionWrap>
      );
    case "sexual-wellness":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazySexualWellnessTracking />
          </Suspended>
        </SectionWrap>
      );
    case "pelvic-floor":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyPelvicFloorHub />
          </Suspended>
        </SectionWrap>
      );
    case "sexual-health-education":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazySexualHealthEducation />
          </Suspended>
        </SectionWrap>
      );
    case "education":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended fallback={<EducationPlaceholder />}>
            <LazyEducationCenter />
          </Suspended>
        </SectionWrap>
      );
    case "community-forum":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyCommunityForum />
          </Suspended>
        </SectionWrap>
      );
    case "progress-sharing":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyProgressSharingChallenges />
          </Suspended>
        </SectionWrap>
      );
    case "video-library":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyVideoLibrary />
          </Suspended>
        </SectionWrap>
      );
    case "interactive-learning":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyInteractiveLearning />
          </Suspended>
        </SectionWrap>
      );
    case "habit-tracker":
      return (
        <SectionWrap maxWidth="max-w-6xl">
          <Suspended>
            <LazyHabitTracker />
          </Suspended>
        </SectionWrap>
      );
    case "in-app-messaging":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyInAppMessaging />
          </Suspended>
        </SectionWrap>
      );
    case "live-support":
      return (
        <SectionWrap maxWidth="max-w-4xl">
          <Suspended>
            <LazyLiveSupportChat />
          </Suspended>
        </SectionWrap>
      );
    // Removed: advanced-scanner and ai-scanning cases - now part of unified "scanner" tab
    case "advanced-reporting":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyAdvancedReportingSystem />
          </Suspended>
        </SectionWrap>
      );
    case "enhanced-diary":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyEnhancedDiaryFeatures />
          </Suspended>
        </SectionWrap>
      );
    case "advanced-routines":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyAdvancedRoutineFeatures />
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
            <LazyPremiumContentMarketplace />
          </Suspended>
        </SectionWrap>
      );
    case "subscription-tiers":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazySubscriptionTiers />
          </Suspended>
        </SectionWrap>
      );
    case "premium-addons":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyPremiumAddOns />
          </Suspended>
        </SectionWrap>
      );
    case "marketplace":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyMarketplaceSystem />
          </Suspended>
        </SectionWrap>
      );
    case "provider-portal":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyHealthcareProviderPortal />
          </Suspended>
        </SectionWrap>
      );
    case "ai-enhancement":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyConversationalAIEnhancement />
          </Suspended>
        </SectionWrap>
      );
    case "predictive-modeling":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyPredictiveHealthModeling />
          </Suspended>
        </SectionWrap>
      );
    case "health-integrations":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyHealthAppIntegrations />
          </Suspended>
        </SectionWrap>
      );
    case "api-webhooks":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyAPIWebhooks />
          </Suspended>
        </SectionWrap>
      );
    case "export-import":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyExportImportSystem />
          </Suspended>
        </SectionWrap>
      );
    case "mobile-wearable":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyMobileWearableFeatures />
          </Suspended>
        </SectionWrap>
      );
    case "security-privacy":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazySecurityPrivacyEnhancements />
          </Suspended>
        </SectionWrap>
      );
    case "expert-consultations":
      return (
        <SectionWrap maxWidth="max-w-7xl">
          <Suspended>
            <LazyExpertContentConsultations />
          </Suspended>
        </SectionWrap>
      );
    case "3dviewer":
      return (
        <SectionWrap maxWidth="max-w-4xl">
          <Suspended fallback={<ViewerPlaceholder />}>
            <LazyModel3DViewer />
          </Suspended>
        </SectionWrap>
      );
    case "emergency":
      return (
        <Suspended fallback={<EmergencyPlaceholder />}>
          <LazyEmergencyGuidance />
        </Suspended>
      );
    case "privacy":
      return (
        <SectionWrap maxWidth="max-w-4xl">
          <h1 className="text-3xl font-bold mb-6 text-center">Privacy & Data Control</h1>
          <Suspended>
            <LazyPrivacyDashboard />
          </Suspended>
        </SectionWrap>
      );
    case "activity":
      return (
        <SectionWrap maxWidth="max-w-4xl">
          <h1 className="text-3xl font-bold mb-6 text-center">Activity History</h1>
          <Suspended>
            <LazyAuditTrail />
          </Suspended>
        </SectionWrap>
      );
    case "questionnaire":
      return (
        <Suspended>
          <LazySymptomQuestionnaire />
        </Suspended>
      );
    case "compare":
      return (
        <Suspended fallback={<ProgressPlaceholder />}>
          <LazyProgressPhotos />
        </Suspended>
      );
    case "doctors":
      return (
        <Suspended>
          <LazyPhysicianLocator />
        </Suspended>
      );
    case "settings":
      return (
        <SectionWrap maxWidth="max-w-4xl">
          <h1 className="text-3xl font-bold mb-6 text-center gradient-text">Settings</h1>
          <Suspended>
            <LazySettingsPanel />
          </Suspended>
        </SectionWrap>
      );
    case "/dlc":
      return <DLCUnlock />;
    case "/store":
      return <DLCStorePage />;
    default:
      if (renderAdultTab) {
        const adult = renderAdultTab(activeTab);
        if (adult) return adult;
      }
      return <NotFound />;
  }
}
