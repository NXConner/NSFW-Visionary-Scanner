import { lazy } from "react";
import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";

// Unified Scanner Page (consolidates all scanner features)
export const LazyUnifiedScannerPage = lazy(() =>
  import("@/components/scanner/UnifiedScannerPage").then(m => ({
    default: m.UnifiedScannerPage,
  })),
);

export const LazyProgressHub = lazy(() =>
  import("@/components/hubs/ProgressHub").then(m => ({ default: m.ProgressHub })),
);
export const LazyLearnHub = lazy(() =>
  import("@/components/hubs/LearnHub").then(m => ({ default: m.LearnHub })),
);
export const LazyCommunityHub = lazy(() =>
  import("@/components/hubs/CommunityHub").then(m => ({ default: m.CommunityHub })),
);
export const LazyProfileHub = lazy(() =>
  import("@/components/hubs/ProfileHub").then(m => ({ default: m.ProfileHub })),
);

// Legacy exports for backwards compatibility (now redirect to unified)
// Import ScannerExperience directly to avoid circular dependency through barrel exports
export const LazyScannerSection = lazy(() =>
  import("@/scanner/ui/ScannerExperience").then(m => ({ default: m.ScannerExperience })),
);
export const LazyCurvatureScannerSection = lazy(() =>
  import("@/components/CurvatureScannerSection").then(m => ({
    default: m.CurvatureScannerSection,
  })),
);
export const LazyHealthDiarySection = lazy(() =>
  import("@/components/HealthDiarySection").then(m => ({ default: m.HealthDiarySection })),
);
export const LazyPumpingSection = lazy(() =>
  import("@/components/PumpingSection").then(m => ({ default: m.PumpingSection })),
);
export const LazyMensHealthGuide = lazy(() => import("@/components/MensHealthGuide"));
export const LazyPelvicFloorHub = lazy(() => import("@/components/PelvicFloorHub"));
export const LazyPERoutineBuilder = lazy(() =>
  import("@/components/PERoutineBuilder").then(m => ({ default: m.PERoutineBuilder })),
);
export const LazyPEProgressPhotos = lazy(() =>
  import("@/components/PEProgressPhotos").then(m => ({ default: m.PEProgressPhotos })),
);
export const LazyPositionsGallery = lazy(() =>
  import("@/components/PositionsGallery").then(m => ({ default: m.PositionsGallery })),
);
export const LazyAIHealthChatbot = lazy(() =>
  import("@/components/AIHealthChatbot").then(m => ({ default: m.AIHealthChatbot })),
);
export const LazyComprehensiveHealthMonitoring = lazy(() =>
  import("@/components/ComprehensiveHealthMonitoring").then(m => ({
    default: m.ComprehensiveHealthMonitoring,
  })),
);
export const LazyAdvancedHealthDashboard = lazy(() =>
  import("@/components/AdvancedHealthDashboard").then(m => ({
    default: m.AdvancedHealthDashboard,
  })),
);
export const LazyAIHealthInsights = lazy(() =>
  import("@/components/AIHealthInsights").then(m => ({ default: m.AIHealthInsights })),
);
export const LazyProstateTesticularHealth = lazy(() =>
  import("@/components/ProstateTesticularHealth").then(m => ({
    default: m.ProstateTesticularHealth,
  })),
);
export const LazySexualWellnessTracking = lazy(() =>
  import("@/components/SexualWellnessTracking").then(m => ({ default: m.SexualWellnessTracking })),
);
export const LazySexualHealthEducation = lazy(() =>
  import("@/components/SexualHealthEducation").then(m => ({ default: m.SexualHealthEducation })),
);
export const LazyEducationCenter = lazy(() =>
  import("@/components/EducationCenter").then(m => ({ default: m.EducationCenter })),
);
export const LazyCommunityForum = lazy(() =>
  import("@/components/CommunityForum").then(m => ({ default: m.CommunityForum })),
);
export const LazyProgressSharingChallenges = lazy(() =>
  import("@/components/ProgressSharingChallenges").then(m => ({
    default: m.ProgressSharingChallenges,
  })),
);
export const LazyVideoLibrary = lazy(() =>
  import("@/components/VideoLibrary").then(m => ({ default: m.VideoLibrary })),
);
export const LazyInteractiveLearning = lazy(() =>
  import("@/components/InteractiveLearning").then(m => ({ default: m.InteractiveLearning })),
);
export const LazyHabitTracker = lazy(() =>
  import("@/components/HabitTracker").then(m => ({ default: m.HabitTracker })),
);
export const LazyInAppMessaging = lazy(() =>
  import("@/components/InAppMessaging").then(m => ({ default: m.InAppMessaging })),
);
export const LazyLiveSupportChat = lazy(() =>
  import("@/components/LiveSupportChat").then(m => ({ default: m.LiveSupportChat })),
);
export const LazyAdvancedScannerFeatures = lazy(() =>
  import("@/components/AdvancedScannerFeatures").then(m => ({
    default: m.AdvancedScannerFeatures,
  })),
);
export const LazyAIEnhancedScanning = lazy(() =>
  import("@/components/AIEnhancedScanning").then(m => ({ default: m.AIEnhancedScanning })),
);
export const LazyAdvancedReportingSystem = lazy(() =>
  import("@/components/AdvancedReportingSystem").then(m => ({
    default: m.AdvancedReportingSystem,
  })),
);
export const LazyEnhancedDiaryFeatures = lazy(() =>
  import("@/components/EnhancedDiaryFeatures").then(m => ({ default: m.EnhancedDiaryFeatures })),
);
export const LazyAdvancedRoutineFeatures = lazy(() =>
  import("@/components/AdvancedRoutineFeatures").then(m => ({
    default: m.AdvancedRoutineFeatures,
  })),
);
export const LazyNSFWVideoContent = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() => import("@/components/nsfwVideoContent").then(m => ({ default: m.NSFWVideoContent })))
  : lazy(() => import("@/pages/NotFound").then(m => ({ default: m.default })));

export const LazyNSFWCommunityForum = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() =>
      import("@/components/NSFWCommunityForum").then(m => ({ default: m.NSFWCommunityForum })),
    )
  : lazy(() => import("@/pages/NotFound").then(m => ({ default: m.default })));

export const LazyNSFWSexualWellnessAnalytics = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() =>
      import("@/components/NSFWSexualWellnessAnalytics").then(m => ({
        default: m.NSFWSexualWellnessAnalytics,
      })),
    )
  : lazy(() => import("@/pages/NotFound").then(m => ({ default: m.default })));
export const LazyPremiumContentMarketplace = lazy(() =>
  import("@/components/PremiumContentMarketplace").then(m => ({
    default: m.PremiumContentMarketplace,
  })),
);
export const LazySubscriptionTiers = lazy(() =>
  import("@/components/SubscriptionTiers").then(m => ({ default: m.SubscriptionTiers })),
);
export const LazyPremiumAddOns = lazy(() =>
  import("@/components/PremiumAddOns").then(m => ({ default: m.PremiumAddOns })),
);
export const LazyMarketplaceSystem = lazy(() =>
  import("@/components/MarketplaceSystem").then(m => ({ default: m.MarketplaceSystem })),
);
export const LazyHealthcareProviderPortal = lazy(() =>
  import("@/components/HealthcareProviderPortal").then(m => ({
    default: m.HealthcareProviderPortal,
  })),
);
export const LazyConversationalAIEnhancement = lazy(() =>
  import("@/components/ConversationalAIEnhancement").then(m => ({
    default: m.ConversationalAIEnhancement,
  })),
);
export const LazyPredictiveHealthModeling = lazy(() =>
  import("@/components/PredictiveHealthModeling").then(m => ({
    default: m.PredictiveHealthModeling,
  })),
);
export const LazyHealthAppIntegrations = lazy(() =>
  import("@/components/HealthAppIntegrations").then(m => ({ default: m.HealthAppIntegrations })),
);
export const LazyAPIWebhooks = lazy(() =>
  import("@/components/APIWebhooks").then(m => ({ default: m.APIWebhooks })),
);
export const LazyExportImportSystem = lazy(() =>
  import("@/components/ExportImportSystem").then(m => ({ default: m.ExportImportSystem })),
);
export const LazyMobileWearableFeatures = lazy(() =>
  import("@/components/MobileWearableFeatures").then(m => ({ default: m.MobileWearableFeatures })),
);
export const LazySecurityPrivacyEnhancements = lazy(() =>
  import("@/components/SecurityPrivacyEnhancements").then(m => ({
    default: m.SecurityPrivacyEnhancements,
  })),
);
export const LazyNSFWAdvancedFeatures = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() =>
      import("@/components/NSFWAdvancedFeatures").then(m => ({ default: m.NSFWAdvancedFeatures })),
    )
  : lazy(() => import("@/pages/NotFound").then(m => ({ default: m.default })));

export const LazyNSFWCockWorshipingEducation = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() =>
      import("@/components/nsfwEducation/cockWorshiping").then(m => ({
        default: m.CockWorshipingEducation,
      })),
    )
  : lazy(() => import("@/pages/NotFound").then(m => ({ default: m.default })));

export const LazyNSFWEducationHub = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() =>
      import("@/components/nsfwEducation").then(m => ({
        default: m.NsfwEducationHub,
      })),
    )
  : lazy(() => import("@/pages/NotFound").then(m => ({ default: m.default })));

export const LazyBondageBdsmEducation = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() =>
      import("@/components/nsfwEducation/bondageBdsm").then(m => ({
        default: m.BondageBdsmEducation,
      })),
    )
  : lazy(() => import("@/pages/NotFound").then(m => ({ default: m.default })));

export const LazyTantricEducation = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() =>
      import("@/components/nsfwEducation/tantric").then(m => ({
        default: m.TantricEducation,
      })),
    )
  : lazy(() => import("@/pages/NotFound").then(m => ({ default: m.default })));

export const LazyKamaSutraEducation = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() =>
      import("@/components/nsfwEducation/kamaSutra").then(m => ({
        default: m.KamaSutraEducation,
      })),
    )
  : lazy(() => import("@/pages/NotFound").then(m => ({ default: m.default })));

export const LazySubmissiveEducation = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() =>
      import("@/components/nsfwEducation/submissive").then(m => ({
        default: m.SubmissiveEducation,
      })),
    )
  : lazy(() => import("@/pages/NotFound").then(m => ({ default: m.default })));
export const LazyExpertContentConsultations = lazy(() =>
  import("@/components/ExpertContentConsultations").then(m => ({
    default: m.ExpertContentConsultations,
  })),
);
export const LazyModel3DViewer = lazy(() =>
  import("@/components/Model3DViewer").then(m => ({ default: m.Model3DViewer })),
);
export const LazyEmergencyGuidance = lazy(() =>
  import("@/components/EmergencyGuidance").then(m => ({ default: m.EmergencyGuidance })),
);
export const LazySymptomQuestionnaire = lazy(() =>
  import("@/components/SymptomQuestionnaire").then(m => ({ default: m.SymptomQuestionnaire })),
);
export const LazyProgressPhotos = lazy(() =>
  import("@/components/ProgressPhotos").then(m => ({ default: m.ProgressPhotos })),
);
export const LazyEducationalContent = lazy(() =>
  import("@/components/EducationalContent").then(m => ({ default: m.EducationalContent })),
);
export const LazyPhysicianLocator = lazy(() =>
  import("@/components/PhysicianLocator").then(m => ({ default: m.PhysicianLocator })),
);
export const LazyPrivacyDashboard = lazy(() =>
  import("@/components/PrivacyDashboard").then(m => ({ default: m.PrivacyDashboard })),
);
export const LazyAuditTrail = lazy(() =>
  import("@/components/AuditTrail").then(m => ({ default: m.AuditTrail })),
);
export const LazyProfileSection = lazy(() =>
  import("@/components/ProfileSection").then(m => ({ default: m.ProfileSection })),
);
export const LazySettingsPanel = lazy(() =>
  import("@/components/SettingsPanel").then(m => ({ default: m.SettingsPanel })),
);

// New tabs: Video Capture, Photo Editor, Partner Sync
export const LazyVideoCaptureTab = lazy(() =>
  import("@/components/videoCapture/VideoCaptureTab").then(m => ({ default: m.VideoCaptureTab })),
);
export const LazyPhotoEditorTab = lazy(() =>
  import("@/components/photoEditor/PhotoEditorTab").then(m => ({ default: m.PhotoEditorTab })),
);
export const LazyPartnerSyncTab = lazy(() =>
  import("@/components/partnerSync/PartnerSyncTab").then(m => ({ default: m.PartnerSyncTab })),
);
export const LazyDateNightHub = lazy(() =>
  import("@/components/partnerSync/DateNightHub").then(m => ({ default: m.DateNightHub })),
);
