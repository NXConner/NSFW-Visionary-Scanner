import React, { Suspense, useMemo, lazy } from "react";
import {
  BarChart3,
  BookOpen,
  Camera,
  FileText,
  HeartPulse,
  LineChart,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
  Video,
} from "lucide-react";
import { HubTabs, type HubTabConfig } from "./HubTabs";
import { PageSkeleton } from "@/components/ui/skeleton-loader";
import { LockedFeaturePanel } from "@/components/LockedFeaturePanel";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";
import { FeatureGate as DlcFeatureGate } from "@/dlc/components/FeatureGate";

const LazyHealthDiarySection = lazy(() =>
  import("@/components/HealthDiarySection").then(m => ({ default: m.HealthDiarySection })),
);
const LazyEnhancedDiaryFeatures = lazy(() =>
  import("@/components/EnhancedDiaryFeatures").then(m => ({ default: m.EnhancedDiaryFeatures })),
);
const LazyPumpingSection = lazy(() =>
  import("@/components/PumpingSection").then(m => ({ default: m.PumpingSection })),
);
const LazyPERoutineBuilder = lazy(() =>
  import("@/components/PERoutineBuilder").then(m => ({ default: m.PERoutineBuilder })),
);
const LazyAdvancedRoutineFeatures = lazy(() =>
  import("@/components/AdvancedRoutineFeatures").then(m => ({ default: m.AdvancedRoutineFeatures })),
);
const LazyPEProgressPhotos = lazy(() =>
  import("@/components/PEProgressPhotos").then(m => ({ default: m.PEProgressPhotos })),
);
const LazyProgressPhotos = lazy(() =>
  import("@/components/ProgressPhotos").then(m => ({ default: m.ProgressPhotos })),
);
const LazyPhotoEditorTab = lazy(() =>
  import("@/components/photoEditor/PhotoEditorTab").then(m => ({ default: m.PhotoEditorTab })),
);
const LazyVideoCaptureTab = lazy(() =>
  import("@/components/videoCapture/VideoCaptureTab").then(m => ({ default: m.VideoCaptureTab })),
);
const LazyPartnerSyncTab = lazy(() =>
  import("@/components/partnerSync/PartnerSyncTab").then(m => ({ default: m.PartnerSyncTab })),
);
const LazyPositionsGallery = lazy(() =>
  import("@/components/PositionsGallery").then(m => ({ default: m.PositionsGallery })),
);
const LazyAdvancedReportingSystem = lazy(() =>
  import("@/components/AdvancedReportingSystem").then(m => ({ default: m.AdvancedReportingSystem })),
);
const LazyAdvancedHealthDashboard = lazy(() =>
  import("@/components/AdvancedHealthDashboard").then(m => ({ default: m.AdvancedHealthDashboard })),
);
const LazyComprehensiveHealthMonitoring = lazy(() =>
  import("@/components/ComprehensiveHealthMonitoring").then(m => ({
    default: m.ComprehensiveHealthMonitoring,
  })),
);
const LazyProstateTesticularHealth = lazy(() =>
  import("@/components/ProstateTesticularHealth").then(m => ({
    default: m.ProstateTesticularHealth,
  })),
);
const LazySexualWellnessTracking = lazy(() =>
  import("@/components/SexualWellnessTracking").then(m => ({ default: m.SexualWellnessTracking })),
);
const LazyPelvicFloorHub = lazy(() =>
  import("@/components/PelvicFloorHub").then(m => ({ default: m.PelvicFloorHub })),
);
const LazyHabitTracker = lazy(() =>
  import("@/components/HabitTracker").then(m => ({ default: m.HabitTracker })),
);
const LazyPredictiveHealthModeling = lazy(() =>
  import("@/components/PredictiveHealthModeling").then(m => ({
    default: m.PredictiveHealthModeling,
  })),
);
const LazyAIHealthInsights = lazy(() =>
  import("@/components/AIHealthInsights").then(m => ({ default: m.AIHealthInsights })),
);
const LazyNsfwSessionGate = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() => import("@/components/nsfw/NsfwSessionGate").then(m => ({ default: m.NsfwSessionGate })))
  : null;
const LazyNSFWAdvancedFeatures = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() => import("@/components/NSFWAdvancedFeatures").then(m => ({ default: m.NSFWAdvancedFeatures })))
  : null;
const LazyNSFWSexualWellnessAnalytics = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() => import("@/components/NSFWSexualWellnessAnalytics").then(m => ({
      default: m.NSFWSexualWellnessAnalytics,
    })))
  : null;

const LazyWrap = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
);

export function ProgressHub({ initialTab }: { initialTab?: string }): JSX.Element {
  const { hasFeature } = useFeatureAccess();

  const tabs: HubTabConfig[] = useMemo(() => {
    const base: HubTabConfig[] = [
      {
        id: "diary",
        label: "Diary",
        icon: BookOpen,
        description: "Log entries, measurements, and insights in one place.",
        content: (
          <div className="space-y-8">
            <LazyWrap>
              <LazyHealthDiarySection />
            </LazyWrap>
            {hasFeature("advancedAnalytics") ? (
              <LazyWrap>
                <LazyEnhancedDiaryFeatures />
              </LazyWrap>
            ) : (
              <LockedFeaturePanel feature="Enhanced Diary" tier="Pro" />
            )}
          </div>
        ),
      },
      {
        id: "pumping",
        label: "Pumping",
        icon: TrendingUp,
        description: "Track pumping sessions and recovery metrics.",
        content: (
          <LazyWrap>
            <LazyPumpingSection />
          </LazyWrap>
        ),
      },
      {
        id: "routines",
        label: "Routines",
        icon: LineChart,
        description: "Build and optimize routines with advanced modules.",
        content: (
          <div className="space-y-8">
            {hasFeature("customRoutines") ? (
              <LazyWrap>
                <LazyPERoutineBuilder />
              </LazyWrap>
            ) : (
              <LockedFeaturePanel feature="PE Routine Builder" tier="Premium" />
            )}
            {hasFeature("customRoutines") ? (
              <LazyWrap>
                <LazyAdvancedRoutineFeatures />
              </LazyWrap>
            ) : null}
          </div>
        ),
      },
      {
        id: "photos",
        label: "Photos",
        icon: Camera,
        description: "Progress photos, comparisons, and editing tools.",
        content: (
          <div className="space-y-8">
            {hasFeature("peProgressPhotos") ? (
              <LazyWrap>
                <LazyPEProgressPhotos />
              </LazyWrap>
            ) : (
              <LockedFeaturePanel feature="PE Progress Photos" tier="Premium" />
            )}
            <LazyWrap>
              <LazyProgressPhotos />
            </LazyWrap>
            <LazyWrap>
              <LazyPhotoEditorTab />
            </LazyWrap>
          </div>
        ),
      },
      {
        id: "positions",
        label: "Positions",
        icon: Sparkles,
        description: "Position library with saved favorites and media.",
        content: hasFeature("positionsGallery") ? (
          <LazyWrap>
            <LazyPositionsGallery />
          </LazyWrap>
        ) : (
          <LockedFeaturePanel feature="Positions Gallery" tier="Premium" />
        ),
      },
      {
        id: "video",
        label: "Video",
        icon: Video,
        description: "Capture sessions and sync with partners.",
        content: (
          <div className="space-y-8">
            <LazyWrap>
              <LazyVideoCaptureTab />
            </LazyWrap>
            <LazyWrap>
              <LazyPartnerSyncTab />
            </LazyWrap>
          </div>
        ),
      },
      {
        id: "reports",
        label: "Reports",
        icon: FileText,
        description: "Generate detailed progress and health reports.",
        content: (
          <LazyWrap>
            <LazyAdvancedReportingSystem />
          </LazyWrap>
        ),
      },
      {
        id: "health",
        label: "Health",
        icon: HeartPulse,
        description: "Dashboards, monitoring, and predictive analytics.",
        content: (
          <div className="space-y-8">
            <LazyWrap>
              <LazyAdvancedHealthDashboard />
            </LazyWrap>
            <LazyWrap>
              <LazyComprehensiveHealthMonitoring />
            </LazyWrap>
            <LazyWrap>
              <LazyProstateTesticularHealth />
            </LazyWrap>
            <LazyWrap>
              <LazySexualWellnessTracking />
            </LazyWrap>
            <LazyWrap>
              <LazyPelvicFloorHub />
            </LazyWrap>
            <LazyWrap>
              <LazyHabitTracker />
            </LazyWrap>
            <LazyWrap>
              <LazyPredictiveHealthModeling />
            </LazyWrap>
            <LazyWrap>
              <LazyAIHealthInsights />
            </LazyWrap>
          </div>
        ),
      },
    ];

    if (!BUILD_ALLOW_ADULT_BUNDLE || !LazyNsfwSessionGate || !LazyNSFWAdvancedFeatures || !LazyNSFWSexualWellnessAnalytics) {
      return base;
    }

    return [
      ...base,
      {
        id: "nsfw-analytics",
        label: "NSFW Analytics",
        icon: BarChart3,
        description: "Adult wellness analytics and tracking.",
        content: (
          <LazyWrap>
            <LazyNsfwSessionGate>
              <DlcFeatureGate
                featureId="wellness_analytics"
                fallbackTitle="NSFW Wellness Analytics"
                fallbackDescription="Requires the Wellness Analytics DLC."
              >
                <LazyWrap>
                  <LazyNSFWSexualWellnessAnalytics />
                </LazyWrap>
              </DlcFeatureGate>
            </LazyNsfwSessionGate>
          </LazyWrap>
        ),
      },
      {
        id: "nsfw-advanced",
        label: "NSFW Advanced",
        icon: Stethoscope,
        description: "Advanced adult features and tooling.",
        content: (
          <LazyWrap>
            <LazyNsfwSessionGate>
              <DlcFeatureGate
                featureId="multi_camera"
                fallbackTitle="NSFW Advanced Features"
                fallbackDescription="Requires the Advanced Features Pack."
              >
                <LazyWrap>
                  <LazyNSFWAdvancedFeatures />
                </LazyWrap>
              </DlcFeatureGate>
            </LazyNsfwSessionGate>
          </LazyWrap>
        ),
      },
    ];
  }, [hasFeature]);

  return (
    <HubTabs
      title="Progress"
      description="Track, measure, and optimize your progress."
      tabs={tabs}
      initialTab={initialTab}
    />
  );
}
