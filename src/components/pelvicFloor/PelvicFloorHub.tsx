import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, HeartPulse } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { safeLocalStorage } from "@/lib/storageErrorHandler";

import { PELVIC_FLOOR_ROUTINES } from "@/components/pelvicFloor/data/kegelHubContent";
import {
  BreathTimingMiniChart,
  LiftVsRelaxDiagram,
  PelvicSlingDiagram,
} from "@/components/pelvicFloor/components/PelvicFloorIllustrations";
import {
  BenefitsTab,
  HowToTab,
  MediaTab,
  ProgramTab,
  TroubleshootTab,
} from "@/components/pelvicFloor/tabs";

const STORAGE_KEY_VIDEO_URL = "morphoscan_pelvic_floor_demo_video_url_v1";

export function PelvicFloorHub(): JSX.Element {
  const [videoUrl, setVideoUrl] = useState<string>(
    () => safeLocalStorage.getItem(STORAGE_KEY_VIDEO_URL) ?? "",
  );

  useEffect(() => {
    safeLocalStorage.setItem(STORAGE_KEY_VIDEO_URL, videoUrl);
  }, [videoUrl]);

  const routines = useMemo(() => PELVIC_FLOOR_ROUTINES, []);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs text-primary">
          <HeartPulse className="h-3.5 w-3.5" />
          Pelvic Floor • Kegels • Reverse Kegels
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Kegels & Pelvic Floor Health</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          A practical, safety-first guide to pelvic floor strengthening (Kegels), relaxation
          (reverse Kegels), and balanced programming—plus illustrations and video demos you can add.
        </p>
      </div>

      <Alert className="border-primary/50 bg-primary/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Medical disclaimer</AlertTitle>
        <AlertDescription className="text-sm">
          Educational content only. Stop if you feel pain, numbness, burning, or worsening urinary
          symptoms. If symptoms persist, consider a pelvic floor physical therapist or clinician.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-3 gap-4">
        <PelvicSlingDiagram />
        <LiftVsRelaxDiagram />
        <BreathTimingMiniChart />
      </div>

      <Tabs defaultValue="howto" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1 h-auto p-1">
          <TabsTrigger value="howto" className="text-xs py-2">
            How-to
          </TabsTrigger>
          <TabsTrigger value="benefits" className="text-xs py-2">
            Benefits
          </TabsTrigger>
          <TabsTrigger value="program" className="text-xs py-2">
            Program
          </TabsTrigger>
          <TabsTrigger value="troubleshoot" className="text-xs py-2">
            Troubleshoot
          </TabsTrigger>
          <TabsTrigger value="media" className="text-xs py-2">
            Media
          </TabsTrigger>
        </TabsList>

        <TabsContent value="howto" className="mt-6">
          <HowToTab />
        </TabsContent>
        <TabsContent value="benefits" className="mt-6">
          <BenefitsTab />
        </TabsContent>
        <TabsContent value="program" className="mt-6">
          <ProgramTab routines={routines} />
        </TabsContent>
        <TabsContent value="troubleshoot" className="mt-6">
          <TroubleshootTab />
        </TabsContent>
        <TabsContent value="media" className="mt-6">
          <MediaTab videoUrl={videoUrl} onChangeVideoUrl={setVideoUrl} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
