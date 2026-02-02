/**
 * NSFW Community Forum
 * NSFW-specific discussion forums with anonymous posting, Q&A, success stories, and support groups.
 */

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgeVerificationModal } from "@/dlc/components/AgeVerificationModal";
import { Link } from "react-router-dom";
import { Loader2, Lock, MessageSquare, Shield } from "lucide-react";
import { ThreadsTab } from "./tabs/ThreadsTab";
import { ChallengesTab } from "./tabs/ChallengesTab";
import { SupportGroupsTab } from "./tabs/SupportGroupsTab";
import { useDLC, useDLCFeature } from "@/dlc/context/DLCContext";
import { useNsfwPrivacySettings } from "@/lib/nsfwPrivacySettings";
import { NsfwConsentGate } from "@/components/nsfw/NsfwConsentGate";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

type ForumTab = "threads" | "challenges" | "support";

export const NSFWCommunityForum = ({
  initialTab,
}: {
  initialTab?: ForumTab;
} = {}): JSX.Element => {
  const consentEnabled = useFeatureFlag("nsfw_consent_gate", true);
  const [activeTab, setActiveTab] = useState<ForumTab>(initialTab ?? "threads");
  const [showAgeModal, setShowAgeModal] = useState(false);
  const { settings: privacy } = useNsfwPrivacySettings();

  const { isAgeVerified } = useDLC();
  const { isAvailable: hasCommunityDLC, isLoading: dlcLoading } = useDLCFeature("private_forum");

  if (dlcLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAgeVerified || !hasCommunityDLC) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Lock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {!isAgeVerified ? "Age Verification Required" : "Community Add-On Not Available"}
            </h3>
            <p className="text-muted-foreground max-w-md mb-4">
              {!isAgeVerified
                ? "Please verify you are 18+ to access the private community."
                : "This feature requires the Creator & Community add-on (or a bundle that includes it)."}
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
              {!isAgeVerified ? "18+ Required" : "Requires Community"}
            </Badge>
          </CardContent>
        </Card>
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
            <MessageSquare className="w-6 h-6" />
            {privacy.incognitoMode ? "Private Community" : "NSFW Community Forum"}
          </CardTitle>
          <CardDescription>
            Connect with others, share experiences, ask questions, and find support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as ForumTab)}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="threads">Threads</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="threads" className="space-y-4">
              <ThreadsTab isActive={activeTab === "threads"} />
            </TabsContent>

            <TabsContent value="challenges" className="space-y-4">
              <ChallengesTab isActive={activeTab === "challenges"} />
            </TabsContent>

            <TabsContent value="support" className="space-y-4">
              <SupportGroupsTab isActive={activeTab === "support"} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
  return consentEnabled ? (
    <NsfwConsentGate featureIds={["nsfw", "private_forum"]}>{content}</NsfwConsentGate>
  ) : (
    content
  );
};
