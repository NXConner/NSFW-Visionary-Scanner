import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CalibrationWizard } from "@/components/CalibrationWizard";
import type { CurvatureScanSession } from "@/scanner/curvature/types";
import { Camera, History } from "lucide-react";

import { useCurvatureSessions } from "./hooks/useCurvatureSessions";
import { useCurvatureScanFlow } from "./hooks/useCurvatureScanFlow";
import { ScanTab } from "./tabs/ScanTab";
import { HistoryTab } from "./tabs/HistoryTab";

function computeOverallConfidence(dorsal?: number, lateral?: number) {
  const xs = [dorsal, lateral].filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!xs.length) return 0;
  return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
}

export function CurvatureScannerSection() {
  const flow = useCurvatureScanFlow();
  const { sessions, addSession, deleteSession } = useCurvatureSessions();

  const [activeTab, setActiveTab] = React.useState<"scan" | "history">("scan");
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(null);
  const selectedSession = React.useMemo(
    () => sessions.find(s => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  const saveSession = async (force?: boolean) => {
    if (!flow.canSave || !flow.dorsal || !flow.lateral) return;
    if (!force && flow.quality.hardBlocked) {
      toast.error("Quality too low to save", {
        description: "Retake with better lighting and framing, or use Save anyway.",
      });
      return;
    }

    try {
      const overall = computeOverallConfidence(flow.dorsal.confidence, flow.lateral.confidence);
      const session: CurvatureScanSession = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        dorsal: {
          view: "dorsal",
          curvatureAngleDeg: flow.dorsal.angleDeg,
          curvatureDirection: flow.dorsal.curvatureDirection ?? "unknown",
          lengthCm: flow.lengthCm || flow.dorsal.lengthCm || undefined,
          confidence: flow.dorsal.confidence,
        },
        lateral: {
          view: "lateral",
          curvatureAngleDeg: flow.lateral.angleDeg,
          curvatureDirection: flow.lateral.curvatureDirection ?? "unknown",
          lengthCm: flow.lengthCm || flow.lateral.lengthCm || undefined,
          confidence: flow.lateral.confidence,
        },
        estimatedLengthCm: flow.lengthCm || flow.dorsal.lengthCm || flow.lateral.lengthCm || undefined,
        overallConfidence: overall || undefined,
        calibration: flow.calibrationData?.pixelsPerMm
          ? {
              pixelsPerMm: flow.calibrationData.pixelsPerMm,
              source: "reference-object",
              referenceLabel: String(flow.calibrationData.referenceType ?? "reference"),
            }
          : { source: "none" },
        refined: {
          dorsal: Boolean(flow.dorsal.baseAnchorPx),
          lateral: Boolean(flow.lateral.baseAnchorPx),
        },
        warnings: {
          dorsal: flow.dorsal.warnings?.slice(0, 25) ?? [],
          lateral: flow.lateral.warnings?.slice(0, 25) ?? [],
        },
        images: flow.settings.storeAnnotatedImages
          ? {
              dorsalAnnotated: flow.dorsal.annotatedImageDataUrl,
              lateralAnnotated: flow.lateral.annotatedImageDataUrl,
            }
          : undefined,
        interpretation: {
          flipTopViewLeftRight: flow.settings.flipTopViewLeftRight,
          flipSideViewDorsalVentral: flow.settings.flipSideViewDorsalVentral,
        },
      };

      await addSession(session);
      toast.success("Curvature session saved", { description: "Stored locally (encrypted)." });
      setActiveTab("history");
      setSelectedSessionId(session.id);
    } catch {
      toast.error("Failed to save session");
    }
  };

  return (
    <section className="min-h-screen px-4 py-20 relative">
      <canvas ref={flow.canvasRef} className="hidden" />

      <div className="container mx-auto max-w-6xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold gradient-text">Curvature Scan</h1>
          <p className="text-muted-foreground mt-1">Local-only dorsal + lateral capture for Peyronie’s self-assessment.</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Badge variant="outline" className="bg-background/60">
              Privacy: on-device only
            </Badge>
            {flow.calibrationData?.pixelsPerMm ? (
              <Badge variant="outline" className="bg-background/60">
                Calibrated
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-background/60">
                Not calibrated
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as "scan" | "history")}>
          <div className="flex items-center justify-center mb-6">
            <TabsList>
              <TabsTrigger value="scan" className="gap-2">
                <Camera className="w-4 h-4" />
                Scan
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="scan">
            <ScanTab
              videoRef={flow.videoRef}
              isActive={flow.isActive}
              isStarting={flow.isStarting}
              error={flow.error}
              currentPreview={flow.currentPreview}
              refinePicking={flow.refinePicking}
              onApplyBasePick={flow.applyBasePick}
              onCancelRefine={() => flow.setRefinePicking(null)}
              view={flow.view}
              step={flow.step}
              totalSteps={flow.totalSteps}
              processing={flow.processing}
              canGoNext={flow.canGoNext}
              canSave={flow.canSave}
              dorsal={flow.dorsal}
              lateral={flow.lateral}
              lengthCm={flow.lengthCm}
              onSetView={flow.setView}
              onStartCamera={flow.startCamera}
              onCapture={flow.capture}
              onRetake={flow.retake}
              onReset={flow.reset}
              onRefine={flow.refine}
              onOpenCalibration={() => flow.setShowCalibration(true)}
              storeAnnotatedImages={flow.settings.storeAnnotatedImages}
              onToggleStoreAnnotatedImages={flow.settings.setStoreAnnotatedImages}
              flipTopViewLeftRight={flow.settings.flipTopViewLeftRight}
              onToggleFlipTopViewLeftRight={flow.settings.setFlipTopViewLeftRight}
              flipSideViewDorsalVentral={flow.settings.flipSideViewDorsalVentral}
              onToggleFlipSideViewDorsalVentral={flow.settings.setFlipSideViewDorsalVentral}
              hardBlocked={flow.quality.hardBlocked}
              blockers={flow.quality.blockers}
              onSave={() => saveSession(false)}
              onSaveAnyway={() => saveSession(true)}
            />
          </TabsContent>

          <TabsContent value="history">
            <HistoryTab
              sessions={sessions}
              selectedSessionId={selectedSessionId}
              selectedSession={selectedSession}
              onSelect={setSelectedSessionId}
              onDelete={async id => {
                await deleteSession(id);
                if (selectedSessionId === id) setSelectedSessionId(null);
                toast.message("Session deleted");
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      <CalibrationWizard
        isOpen={flow.showCalibration}
        onClose={() => flow.setShowCalibration(false)}
        onCalibrationComplete={data => {
          flow.setCalibrationData(data);
          toast.success("Calibration saved", { description: "Length estimates will use real units." });
        }}
        videoRef={flow.videoRef}
      />
    </section>
  );
}

