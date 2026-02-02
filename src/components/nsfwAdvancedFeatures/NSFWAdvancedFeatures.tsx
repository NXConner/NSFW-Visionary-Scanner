/**
 * NSFW Advanced Features
 * UI component for pornmd.com integration, multi-camera recording, intimate date planning, seductive AI chat, and sex positions
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart } from "lucide-react";
import { PornMDTab } from "./tabs/PornMDTab";
import { RecordingTab } from "./tabs/RecordingTab";
import { StudioTab } from "./tabs/StudioTab";
import { DatesTab } from "./tabs/DatesTab";
import { AIChatTab } from "./tabs/AIChatTab";
import { PositionsTab } from "./tabs/PositionsTab";
import { AgeVerificationModal } from "@/dlc/components/AgeVerificationModal";
import { useDLC, useDLCFeature } from "@/dlc/context/DLCContext";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card as UiCard, CardContent as UiCardContent } from "@/components/ui/card";
import { Loader2, Lock, Shield } from "lucide-react";
import { NsfwConsentGate } from "@/components/nsfw/NsfwConsentGate";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

type TabKey = "pornmd" | "recording" | "studio" | "dates" | "ai-chat" | "positions";

export const NSFWAdvancedFeatures = ({
  initialTab,
}: {
  initialTab?: TabKey;
} = {}): JSX.Element => {
  const consentEnabled = useFeatureFlag("nsfw_consent_gate", true);
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab ?? "pornmd");
  const [showAgeModal, setShowAgeModal] = useState(false);
  const { isAgeVerified } = useDLC();
  // Representative advanced entitlement (present in dlc-advanced, dlc-complete, dlc-subscription).
  const { isAvailable: hasAdvancedDLC, isLoading: dlcLoading } = useDLCFeature("multi_camera");

  if (dlcLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <UiCard className="glass-card border-border/50">
          <UiCardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </UiCardContent>
        </UiCard>
      </div>
    );
  }

  if (!isAgeVerified || !hasAdvancedDLC) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <UiCard className="glass-card border-border/50">
          <UiCardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Lock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {!isAgeVerified ? "Age Verification Required" : "Advanced Add-On Not Available"}
            </h3>
            <p className="text-muted-foreground max-w-md mb-4">
              {!isAgeVerified
                ? "Please verify you are 18+ to access advanced NSFW features."
                : "This feature requires the Advanced Features add-on (or a bundle/subscription that includes it)."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              {!isAgeVerified ? (
                <Button onClick={() => setShowAgeModal(true)} className="gap-2">
                  <Shield className="w-4 h-4" />
                  Verify Age
                </Button>
              ) : (
                <Button asChild className="gap-2">
                  <Link to="/store">
                    <Lock className="w-4 h-4" />
                    Open DLC Store
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
            <Badge variant="secondary" className="mt-3">
              {!isAgeVerified ? "18+ Required" : "Requires Advanced Features"}
            </Badge>
          </UiCardContent>
        </UiCard>
        <AgeVerificationModal
          isOpen={showAgeModal}
          onClose={() => setShowAgeModal(false)}
          onVerified={() => {
            setShowAgeModal(false);
          }}
        />
      </div>
    );
  }

  const content = (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <AgeVerificationModal
        isOpen={showAgeModal}
        onClose={() => setShowAgeModal(false)}
        onVerified={() => {
          setShowAgeModal(false);
        }}
      />
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-6 h-6" />
            NSFW Advanced Features
          </CardTitle>
          <CardDescription>
            PornMD integration, multi-camera recording, intimate date planning, seductive AI chat,
            and sex positions library
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabKey)}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="pornmd">PornMD</TabsTrigger>
              <TabsTrigger value="recording">Recording</TabsTrigger>
              <TabsTrigger value="studio">Studio</TabsTrigger>
              <TabsTrigger value="dates">Intimate Dates</TabsTrigger>
              <TabsTrigger value="ai-chat">AI Chat</TabsTrigger>
              <TabsTrigger value="positions">Positions</TabsTrigger>
            </TabsList>

            <TabsContent value="pornmd" className="space-y-4">
              <PornMDTab isActive={activeTab === "pornmd"} />
            </TabsContent>
            <TabsContent value="recording" className="space-y-4">
              <RecordingTab isActive={activeTab === "recording"} />
            </TabsContent>
            <TabsContent value="studio" className="space-y-4">
              <StudioTab isActive={activeTab === "studio"} />
            </TabsContent>
            <TabsContent value="dates" className="space-y-4">
              <DatesTab isActive={activeTab === "dates"} />
            </TabsContent>
            <TabsContent value="ai-chat" className="space-y-4">
              <AIChatTab isActive={activeTab === "ai-chat"} />
            </TabsContent>
            <TabsContent value="positions" className="space-y-4">
              <PositionsTab isActive={activeTab === "positions"} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
  return consentEnabled ? (
    <NsfwConsentGate featureIds={["nsfw", "multi_camera"]}>{content}</NsfwConsentGate>
  ) : (
    content
  );
};
