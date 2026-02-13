import React, { Suspense, useMemo, lazy } from "react";
import {
  AlertTriangle,
  BookOpen,
  Brain,
  GraduationCap,
  Headphones,
  MapPin,
  PlayCircle,
  Shield,
  Stethoscope,
  Video,
} from "lucide-react";
import { HubTabs, type HubTabConfig } from "./HubTabs";
import { PageSkeleton } from "@/components/ui/skeleton-loader";
import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";
import { FeatureGate as DlcFeatureGate } from "@/dlc/components/FeatureGate";

const LazyMensHealthGuide = lazy(() => import("@/components/MensHealthGuide"));
const LazySexualHealthEducation = lazy(() =>
  import("@/components/SexualHealthEducation").then(m => ({ default: m.SexualHealthEducation })),
);
const LazyEducationCenter = lazy(() =>
  import("@/components/EducationCenter").then(m => ({ default: m.EducationCenter })),
);
const LazyEducationalContent = lazy(() =>
  import("@/components/EducationalContent").then(m => ({ default: m.EducationalContent })),
);
const LazyInteractiveLearning = lazy(() =>
  import("@/components/InteractiveLearning").then(m => ({ default: m.InteractiveLearning })),
);
const LazyVideoLibrary = lazy(() =>
  import("@/components/VideoLibrary").then(m => ({ default: m.VideoLibrary })),
);
const LazyAIHealthChatbot = lazy(() =>
  import("@/components/AIHealthChatbot").then(m => ({ default: m.AIHealthChatbot })),
);
const LazyConversationalAIEnhancement = lazy(() =>
  import("@/components/ConversationalAIEnhancement").then(m => ({
    default: m.ConversationalAIEnhancement,
  })),
);
const LazyExpertContentConsultations = lazy(() =>
  import("@/components/ExpertContentConsultations").then(m => ({
    default: m.ExpertContentConsultations,
  })),
);
const LazyEmergencyGuidance = lazy(() =>
  import("@/components/EmergencyGuidance").then(m => ({ default: m.EmergencyGuidance })),
);
const LazySymptomQuestionnaire = lazy(() =>
  import("@/components/SymptomQuestionnaire").then(m => ({ default: m.SymptomQuestionnaire })),
);
const LazyPhysicianLocator = lazy(() =>
  import("@/components/PhysicianLocator").then(m => ({ default: m.PhysicianLocator })),
);
const LazyNsfwSessionGate = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() =>
      import("@/components/nsfw/NsfwSessionGate").then(m => ({ default: m.NsfwSessionGate })),
    )
  : null;
const LazyNSFWVideoContent = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() => import("@/components/NSFWVideoContent").then(m => ({ default: m.NSFWVideoContent })))
  : null;
const LazyNSFWEducationHub = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() => import("@/components/nsfwEducation").then(m => ({ default: m.NsfwEducationHub })))
  : null;

const LazyWrap = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
);

export function LearnHub({ initialTab }: { initialTab?: string }): JSX.Element {
  const tabs: HubTabConfig[] = useMemo(() => {
    const base: HubTabConfig[] = [
      {
        id: "guides",
        label: "Guides",
        icon: BookOpen,
        description: "Step-by-step PE and men’s health guides.",
        content: (
          <LazyWrap>
            <LazyMensHealthGuide />
          </LazyWrap>
        ),
      },
      {
        id: "courses",
        label: "Courses",
        icon: GraduationCap,
        description: "Interactive learning paths and structured courses.",
        content: (
          <LazyWrap>
            <LazyInteractiveLearning />
          </LazyWrap>
        ),
      },
      {
        id: "videos",
        label: "Videos",
        icon: Video,
        description: "Educational videos and tutorials.",
        content: (
          <LazyWrap>
            <LazyVideoLibrary />
          </LazyWrap>
        ),
      },
      {
        id: "health-education",
        label: "Health Education",
        icon: Shield,
        description: "Sexual health education and clinical guidance.",
        content: (
          <LazyWrap>
            <LazySexualHealthEducation />
          </LazyWrap>
        ),
      },
      {
        id: "health-info",
        label: "Health Info",
        icon: AlertTriangle,
        description: "General health education and references.",
        content: (
          <LazyWrap>
            <LazyEducationCenter />
          </LazyWrap>
        ),
      },
      {
        id: "library",
        label: "Learning Library",
        icon: PlayCircle,
        description: "Supplementary reading and educational modules.",
        content: (
          <LazyWrap>
            <LazyEducationalContent />
          </LazyWrap>
        ),
      },
      {
        id: "ai-chat",
        label: "AI Chat",
        icon: Brain,
        description: "Ask questions and get AI-powered guidance.",
        content: (
          <LazyWrap>
            <LazyAIHealthChatbot />
          </LazyWrap>
        ),
      },
      {
        id: "ai-enhancement",
        label: "AI Enhancements",
        icon: Stethoscope,
        description: "Advanced conversational AI features.",
        content: (
          <LazyWrap>
            <LazyConversationalAIEnhancement />
          </LazyWrap>
        ),
      },
      {
        id: "expert",
        label: "Expert",
        icon: Headphones,
        description: "Expert consultations and curated content.",
        content: (
          <LazyWrap>
            <LazyExpertContentConsultations />
          </LazyWrap>
        ),
      },
      {
        id: "assessment",
        label: "Assessment",
        icon: AlertTriangle,
        description: "Symptom questionnaires and checkups.",
        content: (
          <LazyWrap>
            <LazySymptomQuestionnaire />
          </LazyWrap>
        ),
      },
      {
        id: "doctors",
        label: "Find Doctors",
        icon: MapPin,
        description: "Locate providers and specialist support.",
        content: (
          <LazyWrap>
            <LazyPhysicianLocator />
          </LazyWrap>
        ),
      },
      {
        id: "emergency",
        label: "Emergency",
        icon: AlertTriangle,
        description: "Emergency guidance and warning signs.",
        content: (
          <LazyWrap>
            <LazyEmergencyGuidance />
          </LazyWrap>
        ),
      },
    ];

    if (
      !BUILD_ALLOW_ADULT_BUNDLE ||
      !LazyNsfwSessionGate ||
      !LazyNSFWVideoContent ||
      !LazyNSFWEducationHub
    ) {
      return base;
    }

    return [
      ...base,
      {
        id: "nsfw-videos",
        label: "NSFW Videos",
        icon: Video,
        description: "Adult video library (requires DLC and verification).",
        content: (
          <LazyWrap>
            <LazyNsfwSessionGate>
              <DlcFeatureGate
                featureId="video_library"
                fallbackTitle="NSFW Video Library"
                fallbackDescription="Requires the Video Library DLC."
              >
                <LazyWrap>
                  <LazyNSFWVideoContent />
                </LazyWrap>
              </DlcFeatureGate>
            </LazyNsfwSessionGate>
          </LazyWrap>
        ),
      },
      {
        id: "nsfw-education",
        label: "Intimate Education",
        icon: BookOpen,
        description: "Adult education hub (requires DLC and verification).",
        content: (
          <LazyWrap>
            <LazyNsfwSessionGate>
              <DlcFeatureGate
                featureId="intimate_education"
                fallbackTitle="Intimate Education Hub"
                fallbackDescription="Requires the Intimate Education add-on."
              >
                <LazyWrap>
                  <LazyNSFWEducationHub />
                </LazyWrap>
              </DlcFeatureGate>
            </LazyNsfwSessionGate>
          </LazyWrap>
        ),
      },
    ];
  }, []);

  return (
    <HubTabs
      title="Learn"
      description="Courses, guides, and expert education."
      tabs={tabs}
      initialTab={initialTab}
    />
  );
}
