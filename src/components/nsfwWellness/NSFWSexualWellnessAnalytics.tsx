import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { hasNSFWContent, isSFW } from "@/lib/featureFlags";
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

import { FunctionTab } from "./tabs/FunctionTab";
import { LibidoTab } from "./tabs/LibidoTab";
import { SatisfactionTab } from "./tabs/SatisfactionTab";
import { FrequencyTab } from "./tabs/FrequencyTab";
import { WellnessTab } from "./tabs/WellnessTab";

export type NSFWSexualWellnessAnalyticsTab =
  | "function"
  | "libido"
  | "satisfaction"
  | "frequency"
  | "wellness";

const DEFAULT_WINDOW_DAYS = 180;

function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.max(1, days));
  return d.toISOString().slice(0, 10);
}

export function NSFWSexualWellnessAnalytics({
  initialTab,
}: {
  initialTab?: NSFWSexualWellnessAnalyticsTab;
}): JSX.Element {
  const [activeTab, setActiveTab] = useState<NSFWSexualWellnessAnalyticsTab>(
    initialTab ?? "function",
  );
  const [isCheckingNsfw, setIsCheckingNsfw] = useState(true);
  const [nsfwAvailable, setNsfwAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  const [functionTracking, setFunctionTracking] = useState<NSFWSexualFunctionTracking[]>([]);
  const [libidoTracking, setLibidoTracking] = useState<NSFWLibidoTracking[]>([]);
  const [satisfactionTracking, setSatisfactionTracking] = useState<NSFWSatisfactionTracking[]>([]);
  const [frequencyTracking, setFrequencyTracking] = useState<NSFWFrequencyTracking[]>([]);
  const [wellnessScores, setWellnessScores] = useState<NSFWWellnessScore[]>([]);

  const windowStart = useMemo(() => isoDateDaysAgo(DEFAULT_WINDOW_DAYS), []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [f, l, s, fr, w] = await Promise.all([
        getSexualFunctionTracking(windowStart, undefined),
        getLibidoTracking(windowStart, undefined),
        getSatisfactionTracking(windowStart, undefined),
        getFrequencyTracking(windowStart, undefined),
        getWellnessScores(),
      ]);

      setFunctionTracking(f);
      setLibidoTracking(l);
      setSatisfactionTracking(s);
      setFrequencyTracking(fr);
      setWellnessScores(w);
    } catch {
      toast.error("Failed to load wellness analytics");
    } finally {
      setLoading(false);
    }
  }, [windowStart]);

  useEffect(() => {
    setActiveTab(initialTab ?? "function");
  }, [initialTab]);

  useEffect(() => {
    const check = async () => {
      setIsCheckingNsfw(true);
      const available = await hasNSFWContent();
      setNsfwAvailable(available);
      setIsCheckingNsfw(false);
    };
    void check();
  }, []);

  useEffect(() => {
    if (!nsfwAvailable) return;
    void loadAll();
  }, [loadAll, nsfwAvailable]);

  if (isCheckingNsfw) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSFW() || !nsfwAvailable) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Lock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Wellness Analytics Unavailable</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              This section requires NSFW surfaces to be enabled for your build and account.
            </p>
            <Badge variant="secondary">NSFW surfaces disabled</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>Sexual Wellness Analytics</CardTitle>
          <CardDescription>
            Track function, libido, satisfaction, activity frequency, and calculate a wellness
            score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={v => setActiveTab(v as NSFWSexualWellnessAnalyticsTab)}
          >
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
              <TabsTrigger value="function">Function</TabsTrigger>
              <TabsTrigger value="libido">Libido</TabsTrigger>
              <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
              <TabsTrigger value="frequency">Frequency</TabsTrigger>
              <TabsTrigger value="wellness">Score</TabsTrigger>
            </TabsList>

            <TabsContent value="function" className="space-y-6">
              <FunctionTab data={functionTracking} loading={loading} onRefresh={loadAll} />
            </TabsContent>

            <TabsContent value="libido" className="space-y-6">
              <LibidoTab data={libidoTracking} loading={loading} onRefresh={loadAll} />
            </TabsContent>

            <TabsContent value="satisfaction" className="space-y-6">
              <SatisfactionTab data={satisfactionTracking} loading={loading} onRefresh={loadAll} />
            </TabsContent>

            <TabsContent value="frequency" className="space-y-6">
              <FrequencyTab data={frequencyTracking} loading={loading} onRefresh={loadAll} />
            </TabsContent>

            <TabsContent value="wellness" className="space-y-6">
              <WellnessTab
                functionData={functionTracking}
                libidoData={libidoTracking}
                satisfactionData={satisfactionTracking}
                frequencyData={frequencyTracking}
                wellnessScores={wellnessScores}
                loading={loading}
                onRefresh={loadAll}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
