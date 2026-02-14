/**
 * NSFW Sexual Wellness Analytics (modular UI)
 *
 * This module focuses on UI composition; persisted data access lives in:
 *   "@/lib/nsfwSexualWellnessAnalytics"
 */

import React, { useCallback, useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NsfwConsentGate } from "@/components/nsfw/NsfwConsentGate";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useNsfwPrivacySettings } from "@/lib/nsfwPrivacySettings";
import {
  getFrequencyTracking,
  getLibidoTracking,
  getSatisfactionTracking,
  getSexualFunctionTracking,
  getWellnessScores,
  type NSFWFrequencyTracking,
  type NSFWLibidoTracking,
  type NSFWSatisfactionTracking,
  type NSFWSexualFunctionTracking,
  type NSFWWellnessScore,
} from "@/lib/nsfwSexualWellnessAnalytics";

import type { WellnessTabKey } from "./types";
import { AnalyticsAccessGate } from "./AnalyticsAccessGate";
import { FunctionTrackingTab } from "./FunctionTrackingTab";
import { LibidoTrackingTab } from "./LibidoTrackingTab";
import { SatisfactionTrackingTab } from "./SatisfactionTrackingTab";
import { FrequencyTrackingTab } from "./FrequencyTrackingTab";
import { WellnessScoreTab } from "./WellnessScoreTab";

export const NSFWSexualWellnessAnalytics = ({
  initialTab,
}: {
  initialTab?: WellnessTabKey | "function" | "libido" | "satisfaction" | "wellness";
} = {}) => {
  const consentEnabled = useFeatureFlag("nsfw_consent_gate", true);

  const content = (
    <AnalyticsAccessGate>
      <AnalyticsBody initialTab={initialTab} />
    </AnalyticsAccessGate>
  );

  return consentEnabled ? (
    <NsfwConsentGate featureIds={["nsfw", "wellness_analytics"]}>{content}</NsfwConsentGate>
  ) : (
    content
  );
};

function AnalyticsBody({ initialTab }: { initialTab?: WellnessTabKey | string }) {
  const { settings: privacy } = useNsfwPrivacySettings();
  const incognito = Boolean(privacy.incognitoMode);

  const [activeTab, setActiveTab] = useState<WellnessTabKey>(() => {
    const v = String(initialTab || "function");
    if (
      v === "function" ||
      v === "libido" ||
      v === "satisfaction" ||
      v === "frequency" ||
      v === "wellness"
    )
      return v;
    return "function";
  });

  const [loading, setLoading] = useState(false);
  const [revealAnalytics, setRevealAnalytics] = useState(false);

  const [functionTracking, setFunctionTracking] = useState<NSFWSexualFunctionTracking[]>([]);
  const [libidoTracking, setLibidoTracking] = useState<NSFWLibidoTracking[]>([]);
  const [satisfactionTracking, setSatisfactionTracking] = useState<NSFWSatisfactionTracking[]>([]);
  const [frequencyTracking, setFrequencyTracking] = useState<NSFWFrequencyTracking[]>([]);
  const [wellnessScores, setWellnessScores] = useState<NSFWWellnessScore[]>([]);

  useEffect(() => {
    setRevealAnalytics(false);
  }, [activeTab, incognito]);

  const loadTabData = useCallback(async (tab: WellnessTabKey) => {
    setLoading(true);
    try {
      switch (tab) {
        case "function":
          setFunctionTracking(await getSexualFunctionTracking());
          break;
        case "libido":
          setLibidoTracking(await getLibidoTracking());
          break;
        case "satisfaction":
          setSatisfactionTracking(await getSatisfactionTracking());
          break;
        case "frequency":
          setFrequencyTracking(await getFrequencyTracking());
          break;
        case "wellness":
          setWellnessScores(await getWellnessScores());
          break;
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  const refreshActive = useCallback(async () => {
    await loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-6 h-6" />
          NSFW Sexual Wellness Analytics
        </CardTitle>
        <CardDescription>
          Comprehensive tracking and analysis of sexual function, libido, satisfaction, frequency,
          and wellness scoring
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {incognito ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/20 p-3">
            <Badge variant="secondary">Incognito</Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRevealAnalytics(true)}
            >
              Reveal charts
            </Button>
          </div>
        ) : null}

        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as WellnessTabKey)}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
            <TabsTrigger value="function">Function</TabsTrigger>
            <TabsTrigger value="libido">Libido</TabsTrigger>
            <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
            <TabsTrigger value="frequency">Frequency</TabsTrigger>
            <TabsTrigger value="wellness">Wellness</TabsTrigger>
          </TabsList>

          <TabsContent value="function" className="space-y-4">
            <FunctionTrackingTab
              functionTracking={functionTracking}
              incognito={incognito}
              revealed={revealAnalytics}
              onReveal={() => setRevealAnalytics(true)}
              onDataAdded={refreshActive}
            />
          </TabsContent>

          <TabsContent value="libido" className="space-y-4">
            <LibidoTrackingTab
              libidoTracking={libidoTracking}
              incognito={incognito}
              revealed={revealAnalytics}
              onReveal={() => setRevealAnalytics(true)}
              onDataAdded={refreshActive}
            />
          </TabsContent>

          <TabsContent value="satisfaction" className="space-y-4">
            <SatisfactionTrackingTab
              satisfactionTracking={satisfactionTracking}
              incognito={incognito}
              revealed={revealAnalytics}
              onReveal={() => setRevealAnalytics(true)}
              onDataAdded={refreshActive}
            />
          </TabsContent>

          <TabsContent value="frequency" className="space-y-4">
            <FrequencyTrackingTab
              frequencyTracking={frequencyTracking}
              incognito={incognito}
              revealed={revealAnalytics}
              onReveal={() => setRevealAnalytics(true)}
              onDataAdded={refreshActive}
            />
          </TabsContent>

          <TabsContent value="wellness" className="space-y-4">
            <WellnessScoreTab
              wellnessScores={wellnessScores}
              incognito={incognito}
              revealed={revealAnalytics}
              onReveal={() => setRevealAnalytics(true)}
              onDataAdded={refreshActive}
            />
          </TabsContent>
        </Tabs>

        {loading ? (
          <p className="text-xs text-muted-foreground">Loading {activeTab} data…</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
