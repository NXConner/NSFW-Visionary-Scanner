import React, { useMemo, useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ScannerSection } from "@/components/ScannerSection";
import { HealthDiarySection } from "@/components/HealthDiarySection";
import { PhysicianLocator } from "@/components/PhysicianLocator";
import { ProfileSection } from "@/components/ProfileSection";
import { SymptomQuestionnaire } from "@/components/SymptomQuestionnaire";
import { ProgressPhotos } from "@/components/ProgressPhotos";
import { EducationalContent } from "@/components/EducationalContent";
import { PumpingSection } from "@/components/PumpingSection";
import { Footer } from "@/components/Footer";
import { useGestureNavigation } from "@/hooks/useGestureNavigation";
import { FloatingQuickActions } from "@/components/FloatingQuickActions";
import { EducationCenter } from "@/components/EducationCenter";
import { Model3DViewer } from "@/components/Model3DViewer";
import { EmergencyGuidance } from "@/components/EmergencyGuidance";
import { AuditTrail } from "@/components/AuditTrail";
import { PrivacyDashboard } from "@/components/PrivacyDashboard";
import { MedicalDisclaimer, useDisclaimer } from "@/components/MedicalDisclaimer";
import MensHealthGuide from "@/components/MensHealthGuide";
import { PEProgressPhotos } from "@/components/PEProgressPhotos";
import { PERoutineBuilder } from "@/components/PERoutineBuilder";
import { PositionsGallery } from "@/components/PositionsGallery";
import { AIHealthChatbot } from "@/components/AIHealthChatbot";
import { SmartUpsell } from "@/components/SmartUpsell";
import { TestimonialsDisplay } from "@/components/TestimonialsDisplay";
import { ComprehensiveHealthMonitoring } from "@/components/ComprehensiveHealthMonitoring";
import { AdvancedHealthDashboard } from "@/components/AdvancedHealthDashboard";
import { AIHealthInsights } from "@/components/AIHealthInsights";
import { ProstateTesticularHealth } from "@/components/ProstateTesticularHealth";
import { SexualWellnessTracking } from "@/components/SexualWellnessTracking";
import { SexualHealthEducation } from "@/components/SexualHealthEducation";
import { CommunityForum } from "@/components/CommunityForum";
import { ProgressSharingChallenges } from "@/components/ProgressSharingChallenges";
import { VideoLibrary } from "@/components/VideoLibrary";
import { InteractiveLearning } from "@/components/InteractiveLearning";
import { HabitTracker } from "@/components/HabitTracker";
import { InAppMessaging } from "@/components/InAppMessaging";
import { LiveSupportChat } from "@/components/LiveSupportChat";
import { AdvancedScannerFeatures } from "@/components/AdvancedScannerFeatures";
import { AIEnhancedScanning } from "@/components/AIEnhancedScanning";
import { AdvancedReportingSystem } from "@/components/AdvancedReportingSystem";
import { EnhancedDiaryFeatures } from "@/components/EnhancedDiaryFeatures";
import { AdvancedRoutineFeatures } from "@/components/AdvancedRoutineFeatures";
import { NSFWVideoContent } from "@/components/NSFWVideoContent";
import { NSFWCommunityForum } from "@/components/NSFWCommunityForum";
import { NSFWSexualWellnessAnalytics } from "@/components/NSFWSexualWellnessAnalytics";
import { EnhancedDLCSystem } from "@/components/EnhancedDLCSystem";
import { PremiumContentMarketplace } from "@/components/PremiumContentMarketplace";
import { SubscriptionTiers } from "@/components/SubscriptionTiers";
import { PremiumAddOns } from "@/components/PremiumAddOns";
import { MarketplaceSystem } from "@/components/MarketplaceSystem";
import { HealthcareProviderPortal } from "@/components/HealthcareProviderPortal";
import { ConversationalAIEnhancement } from "@/components/ConversationalAIEnhancement";
import { PredictiveHealthModeling } from "@/components/PredictiveHealthModeling";
import { HealthAppIntegrations } from "@/components/HealthAppIntegrations";
import { APIWebhooks } from "@/components/APIWebhooks";
import { ExportImportSystem } from "@/components/ExportImportSystem";
import { MobileWearableFeatures } from "@/components/MobileWearableFeatures";
import { SecurityPrivacyEnhancements } from "@/components/SecurityPrivacyEnhancements";
import { NSFWAdvancedFeatures } from "@/components/NSFWAdvancedFeatures";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Badge } from "@/components/ui/badge";
import { Shield, Crown, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const tabsOrder = [
  "home",
  "scanner",
  "diary",
  "pumping",
  "guide",
  "routines",
  "pe-progress",
  "positions",
  "ai-chat",
  "health-monitoring",
  "health-dashboard",
  "ai-insights",
  "prostate-testicular",
  "sexual-wellness",
  "sexual-health-education",
  "education",
  "community-forum",
  "progress-sharing",
  "video-library",
  "interactive-learning",
  "habit-tracker",
  "in-app-messaging",
  "live-support",
  "advanced-scanner",
  "ai-scanning",
  "advanced-reporting",
  "enhanced-diary",
  "advanced-routines",
  "nsfw-videos",
  "nsfw-forum",
  "nsfw-wellness-analytics",
  "dlc-system",
  "premium-marketplace",
  "subscription-tiers",
  "premium-addons",
  "marketplace",
  "provider-portal",
  "ai-enhancement",
  "predictive-modeling",
  "health-integrations",
  "api-webhooks",
  "export-import",
  "mobile-wearable",
  "security-privacy",
  "nsfw-advanced",
  "3dviewer",
  "emergency",
  "questionnaire",
  "compare",
  "learn",
  "doctors",
  "privacy",
  "activity",
  "profile",
] as const;

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const { isAdmin, isPro, isLoading: rolesLoading } = useUserRoles();
  const { hasAccepted: disclaimerAccepted, isLoading: disclaimerLoading } = useDisclaimer();
  
  const gestureEnabled = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
    [],
  );

  const changeTab = (nextTab: string) => {
    setActiveTab(nextTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen for navigation events from settings
  React.useEffect(() => {
    const handleNavigateTab = (e: CustomEvent<string>) => {
      changeTab(e.detail);
    };
    window.addEventListener('navigate-tab', handleNavigateTab as EventListener);
    return () => window.removeEventListener('navigate-tab', handleNavigateTab as EventListener);
  }, []);

  const moveTab = (direction: 1 | -1) => {
    const index = tabsOrder.indexOf(activeTab as (typeof tabsOrder)[number]);
    if (index === -1) return;
    const nextIndex = (index + direction + tabsOrder.length) % tabsOrder.length;
    setActiveTab(tabsOrder[nextIndex]);
  };

  const gestureRef = useGestureNavigation<HTMLDivElement>({
    onSwipeLeft: () => moveTab(1),
    onSwipeRight: () => moveTab(-1),
    enabled: gestureEnabled,
    threshold: 60,
  });

  const { hasFeature } = useFeatureAccess();

  const LockedFeature = ({ feature, tier }: { feature: string; tier: string }) => (
    <section className="min-h-screen px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Lock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{feature}</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              This feature requires a {tier} subscription. Upgrade to unlock.
            </p>
            <Badge variant="secondary">Requires {tier}</Badge>
          </CardContent>
        </Card>
      </div>
    </section>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HeroSection onGetStarted={() => setActiveTab("scanner")} />;
      case "scanner":
        return <ScannerSection />;
      case "diary":
        return <HealthDiarySection />;
      case "pumping":
        return <PumpingSection />;
      case "guide":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-6xl">
              <MensHealthGuide />
            </div>
          </section>
        );
      case "routines":
        return hasFeature('customRoutines') ? (
          <PERoutineBuilder />
        ) : (
          <LockedFeature feature="PE Routine Builder" tier="Premium" />
        );
      case "pe-progress":
        return hasFeature('peProgressPhotos') ? (
          <PEProgressPhotos />
        ) : (
          <LockedFeature feature="PE Progress Photos" tier="Premium" />
        );
      case "positions":
        return hasFeature('positionsGallery') ? (
          <PositionsGallery />
        ) : (
          <LockedFeature feature="Positions Gallery" tier="Premium" />
        );
      case "ai-chat":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-2xl">
              <h1 className="text-3xl font-bold mb-6 text-center gradient-text">AI Health Assistant</h1>
              <p className="text-muted-foreground text-center mb-8">
                Get personalized guidance on PE methods, health conditions, and wellness tips.
              </p>
              <AIHealthChatbot />
            </div>
          </section>
        );
      case "health-monitoring":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-6xl">
              <ComprehensiveHealthMonitoring />
            </div>
          </section>
        );
      case "health-dashboard":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-6xl">
              <AdvancedHealthDashboard />
            </div>
          </section>
        );
      case "ai-insights":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-6xl">
              <AIHealthInsights />
            </div>
          </section>
        );
      case "prostate-testicular":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-6xl">
              <ProstateTesticularHealth />
            </div>
          </section>
        );
      case "sexual-wellness":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-6xl">
              <SexualWellnessTracking />
            </div>
          </section>
        );
      case "sexual-health-education":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-6xl">
              <SexualHealthEducation />
            </div>
          </section>
        );
      case "education":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-6xl">
              <EducationCenter />
            </div>
          </section>
        );
      case "community-forum":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-6xl">
              <CommunityForum />
            </div>
          </section>
        );
      case "progress-sharing":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-6xl">
              <ProgressSharingChallenges />
            </div>
          </section>
        );
      case "video-library":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-6xl">
              <VideoLibrary />
            </div>
          </section>
        );
      case "interactive-learning":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-6xl">
              <InteractiveLearning />
            </div>
          </section>
        );
      case "habit-tracker":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-6xl">
              <HabitTracker />
            </div>
          </section>
        );
      case "in-app-messaging":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <InAppMessaging />
            </div>
          </section>
        );
      case "live-support":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-4xl">
              <LiveSupportChat />
            </div>
          </section>
        );
      case "advanced-scanner":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <AdvancedScannerFeatures />
            </div>
          </section>
        );
      case "ai-scanning":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <AIEnhancedScanning />
            </div>
          </section>
        );
      case "advanced-reporting":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <AdvancedReportingSystem />
            </div>
          </section>
        );
      case "enhanced-diary":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <EnhancedDiaryFeatures />
            </div>
          </section>
        );
      case "advanced-routines":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <AdvancedRoutineFeatures />
            </div>
          </section>
        );
      case "nsfw-videos":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <NSFWVideoContent />
            </div>
          </section>
        );
      case "nsfw-forum":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <NSFWCommunityForum />
            </div>
          </section>
        );
      case "nsfw-wellness-analytics":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <NSFWSexualWellnessAnalytics />
            </div>
          </section>
        );
      case "dlc-system":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <EnhancedDLCSystem />
            </div>
          </section>
        );
      case "premium-marketplace":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <PremiumContentMarketplace />
            </div>
          </section>
        );
      case "subscription-tiers":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <SubscriptionTiers />
            </div>
          </section>
        );
      case "premium-addons":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <PremiumAddOns />
            </div>
          </section>
        );
      case "marketplace":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <MarketplaceSystem />
            </div>
          </section>
        );
      case "provider-portal":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <HealthcareProviderPortal />
            </div>
          </section>
        );
      case "ai-enhancement":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <ConversationalAIEnhancement />
            </div>
          </section>
        );
      case "predictive-modeling":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <PredictiveHealthModeling />
            </div>
          </section>
        );
      case "health-integrations":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <HealthAppIntegrations />
            </div>
          </section>
        );
      case "api-webhooks":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <APIWebhooks />
            </div>
          </section>
        );
      case "export-import":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <ExportImportSystem />
            </div>
          </section>
        );
      case "mobile-wearable":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <MobileWearableFeatures />
            </div>
          </section>
        );
      case "security-privacy":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <SecurityPrivacyEnhancements />
            </div>
          </section>
        );
      case "nsfw-advanced":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-7xl">
              <NSFWAdvancedFeatures />
            </div>
          </section>
        );
      case "3dviewer":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-4xl">
              <Model3DViewer 
                measurements={{
                  length: 5.5,
                  circumference: 4.8,
                  curvatureAngle: 15,
                  curvatureDirection: "Dorsal"
                }}
              />
            </div>
          </section>
        );
      case "emergency":
        return <EmergencyGuidance />;
      case "privacy":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-4xl">
              <h1 className="text-3xl font-bold mb-6 text-center">Privacy & Data Control</h1>
              <PrivacyDashboard />
            </div>
          </section>
        );
      case "activity":
        return (
          <section className="min-h-screen px-4 py-20">
            <div className="container mx-auto max-w-4xl">
              <h1 className="text-3xl font-bold mb-6 text-center">Activity History</h1>
              <AuditTrail />
            </div>
          </section>
        );
      case "questionnaire":
        return <SymptomQuestionnaire />;
      case "compare":
        return <ProgressPhotos />;
      case "learn":
        return <EducationalContent />;
      case "doctors":
        return <PhysicianLocator />;
      case "profile":
        return <ProfileSection />;
      default:
        return <HeroSection onGetStarted={() => setActiveTab("scanner")} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header activeTab={activeTab} onTabChange={changeTab} />
      
      {/* First-launch disclaimer modal */}
      {!disclaimerLoading && !disclaimerAccepted && (
        <MedicalDisclaimer mode="modal" showCheckbox />
      )}
      
      {/* Role badges for admin/pro users */}
      {!rolesLoading && (isAdmin || isPro) && (
        <div className="fixed top-20 right-4 z-40 flex flex-col gap-1">
          {isAdmin && (
            <Badge className="bg-destructive/90 text-destructive-foreground gap-1">
              <Shield className="w-3 h-3" />
              Admin
            </Badge>
          )}
          {isPro && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-1">
              <Crown className="w-3 h-3" />
              Pro
            </Badge>
          )}
        </div>
      )}
      
      <main ref={gestureRef} className="pt-16 flex-1">
        {renderContent()}
      </main>
      {activeTab === "home" && <Footer />}
      <FloatingQuickActions onNavigate={changeTab} />
    </div>
  );
};

export default Index;
