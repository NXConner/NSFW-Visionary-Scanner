import React, { useMemo, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timer, Target, TrendingUp, Shield } from "lucide-react";
import { format } from "date-fns";

import { useVisualContent } from "@/hooks/useVisualContent";
import { VISUAL_CONTENT_CATEGORIES } from "@/lib/visualContentManager";

import {
  pumpingRoutines,
  pumpingSafetyTips,
  pumpingStopSignsLeft,
  pumpingStopSignsRight,
} from "@/components/pumping/data";
import { loadPumpingSessions, savePumpingSessions } from "@/components/pumping/storage";
import type { PumpingChartPoint, PumpingSession } from "@/components/pumping/types";
import {
  LogSessionTab,
  ProgressTab,
  PumpingHeader,
  RoutineVisualGuideDialog,
  RoutinesTab,
  SafetyTab,
} from "@/components/pumping/components";

type PumpingTab = "tracker" | "progress" | "routines" | "safety";

const buildChartData = (sessions: PumpingSession[]): PumpingChartPoint[] =>
  sessions
    .slice(0, 30)
    .reverse()
    .map(s => ({
      date: format(new Date(s.date), "MMM d"),
      lengthGain: s.lengthAfter - s.lengthBefore,
      girthGain: s.girthAfter - s.girthBefore,
      length: s.lengthAfter,
      girth: s.girthAfter,
    }));

export const PumpingSection = () => {
  const [activeTab, setActiveTab] = useState<PumpingTab>("tracker");
  const [showRoutineVisual, setShowRoutineVisual] = useState<string | null>(null);
  const [sessions, setSessions] = useState<PumpingSession[]>(() => {
    if (typeof window === "undefined") return [];
    return loadPumpingSessions();
  });

  // Load visual content for pumping equipment and techniques
  const { content: pumpingVisuals } = useVisualContent({
    categories: [
      VISUAL_CONTENT_CATEGORIES.EQUIPMENT,
      VISUAL_CONTENT_CATEGORIES.TECHNIQUES,
      VISUAL_CONTENT_CATEGORIES.SAFETY,
    ],
    autoLoad: true,
    autoInvert: true,
  });

  const chartData = useMemo(() => buildChartData(sessions), [sessions]);

  const persist = (next: PumpingSession[]) => {
    savePumpingSessions(next);
    setSessions(next);
  };

  const addSession = (session: PumpingSession) => persist([session, ...sessions]);
  const deleteSession = (id: string) => persist(sessions.filter(s => s.id !== id));

  return (
    <section className="min-h-screen px-4 py-20">
      <div className="container mx-auto max-w-6xl">
        <PumpingHeader />

        <Tabs
          value={activeTab}
          onValueChange={v => setActiveTab(v as PumpingTab)}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-4 w-full max-w-lg mx-auto">
            <TabsTrigger value="tracker" className="gap-2">
              <Timer className="w-4 h-4" />
              <span className="hidden sm:inline">Log</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="routines" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Routines</span>
            </TabsTrigger>
            <TabsTrigger value="safety" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Safety</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracker" className="space-y-6">
            <LogSessionTab
              sessions={sessions}
              onAddSession={addSession}
              onDeleteSession={deleteSession}
            />
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <ProgressTab chartData={chartData} />
          </TabsContent>

          <TabsContent value="routines" className="space-y-6">
            <RoutinesTab routines={pumpingRoutines} onOpenVisualGuide={setShowRoutineVisual} />
          </TabsContent>

          <TabsContent value="safety" className="space-y-6">
            <SafetyTab
              safetyTips={pumpingSafetyTips}
              stopSignsLeft={pumpingStopSignsLeft}
              stopSignsRight={pumpingStopSignsRight}
            />
          </TabsContent>
        </Tabs>

        <RoutineVisualGuideDialog
          routineName={showRoutineVisual}
          routines={pumpingRoutines}
          pumpingVisuals={pumpingVisuals}
          onClose={() => setShowRoutineVisual(null)}
        />
      </div>
    </section>
  );
};

export default PumpingSection;
