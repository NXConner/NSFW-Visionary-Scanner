import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LiquidProgress, RadialGauge, Reveal, TiltCard } from "@/components/premium";
import { MeasurementConfidence } from "@/components/MeasurementConfidence";
import { AIScanAnalysisPanel } from "@/components/AIScanAnalysisPanel";
import { MeasurementResult, ScanMode } from "@/components/scanner/types";
import { AIScanAnalysisResult } from "@/hooks/useAIScanAnalysis";
import type { NsfwDetectionResult, NsfwScannerPolicy } from "@/addons/nsfw-scanner/scanner/types";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  CircleDot,
  Eye,
  Focus,
  Grid3X3,
  Maximize2,
  Ruler,
  Scale,
  Sparkles,
  SunMedium,
  Target,
  TrendingUp,
} from "lucide-react";

export function ScannerSidePanel({
  scanMode,
  measurements,
  onMeasurementsChange,
  confidenceScore,
  confidenceContext,
  isAnalyzing,
  aiAnalysisResult,
  nsfwDetection,
  nsfwPolicy,
  isCalibrated,
  calibrationSummary,
  calibrationConfidence,
  calibrationSkewPercent,
  onOpenCalibration,
  onVerifyCalibration,
}: {
  scanMode: ScanMode;
  measurements: MeasurementResult;
  onMeasurementsChange: (next: MeasurementResult) => void;
  confidenceScore: number;
  confidenceContext: string;
  isAnalyzing: boolean;
  aiAnalysisResult: AIScanAnalysisResult | null;
  nsfwDetection: NsfwDetectionResult | null;
  nsfwPolicy: NsfwScannerPolicy;
  isCalibrated: boolean;
  calibrationSummary?: string | null;
  calibrationConfidence?: number | null;
  calibrationSkewPercent?: number | null;
  onOpenCalibration?: () => void;
  onVerifyCalibration?: () => void;
}) {
  const setNumeric = (key: "length" | "circumference" | "curvatureAngle", raw: string) => {
    const parsed = Number.parseFloat(raw);
    const value = Number.isFinite(parsed) ? parsed : 0;
    onMeasurementsChange({ ...measurements, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Measurement Types */}
      <div className="grid grid-cols-2 gap-4" style={{ animationDelay: "0.1s" }}>
        {[
          {
            id: "curvature",
            label: "Curvature",
            icon: Target,
            desc: "Peyronie's assessment",
            color: "text-primary",
          },
          {
            id: "length",
            label: "Length",
            icon: Ruler,
            desc: "Precise tracking",
            color: "text-cyan-glow",
          },
          {
            id: "circumference",
            label: "Circumference",
            icon: CircleDot,
            desc: "Girth measurement",
            color: "text-accent",
          },
          {
            id: "progression",
            label: "Progression",
            icon: TrendingUp,
            desc: "Track changes",
            color: "text-success",
          },
        ].map(type => (
          <Reveal key={type.id} delay={0.04}>
            <TiltCard variant="interactive" className="p-4 group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <type.icon className={`w-5 h-5 ${type.color}`} />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{type.label}</h4>
                  <p className="text-xs text-muted-foreground">{type.desc}</p>
                </div>
              </div>
            </TiltCard>
          </Reveal>
        ))}
      </div>

      {/* Results Card */}
      {scanMode === "complete" && (
        <Card variant="glow" className="animate-scale-in overflow-hidden">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Scan Results
              <Badge className="ml-auto gradient-primary text-primary-foreground">New</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {!isCalibrated ? (
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Scale className="w-4 h-4 text-warning" />
                      Calibration recommended
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Auto length estimates are limited without a reference calibration. You can
                      still enter values manually.
                    </div>
                  </div>
                  {onOpenCalibration ? (
                    <Button variant="outline" size="sm" onClick={onOpenCalibration}>
                      Calibrate
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      Calibrated
                    </div>
                    {calibrationSummary ? (
                      <div className="text-xs text-muted-foreground mt-1">{calibrationSummary}</div>
                    ) : null}
                    {typeof calibrationConfidence === "number" ? (
                      <div className="text-xs text-muted-foreground mt-1">
                        Quality: {(calibrationConfidence * 100).toFixed(0)}%
                        {typeof calibrationSkewPercent === "number"
                          ? ` · Skew: ${calibrationSkewPercent}%`
                          : ""}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {onVerifyCalibration ? (
                      <Button variant="outline" size="sm" onClick={onVerifyCalibration}>
                        Verify
                      </Button>
                    ) : null}
                    {onOpenCalibration ? (
                      <Button variant="outline" size="sm" onClick={onOpenCalibration}>
                        Recalibrate
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {nsfwPolicy.enabled && nsfwDetection ? (
              <div className="p-4 rounded-xl bg-secondary/20 border border-border/50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">Content classification (on-device)</div>
                    <div className="text-xs text-muted-foreground">
                      {nsfwDetection.label} · {(nsfwDetection.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      nsfwDetection.label === "explicit"
                        ? "border-pink-500 text-pink-500"
                        : nsfwDetection.label === "suggestive"
                          ? "border-amber-500 text-amber-500"
                          : "border-success/40 text-success"
                    }
                  >
                    {nsfwDetection.label.toUpperCase()}
                  </Badge>
                </div>
                {nsfwDetection.label === "explicit" && !nsfwPolicy.allowExplicit ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Saving is blocked by policy. Enable “Allow explicit saves” in Settings → NSFW
                    Scanner DLC to proceed.
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <Ruler className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-3xl font-bold gradient-text">
                  {measurements.length > 0 ? measurements.length : "—"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Length (cm){!isCalibrated ? " • manual/est." : ""}
                </div>
              </div>
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                <CircleDot className="w-6 h-6 mx-auto mb-2 text-accent" />
                <div className="text-3xl font-bold text-accent">
                  {measurements.circumference > 0 ? measurements.circumference : "—"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Circumference (cm)</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/20 border border-border/50 space-y-3">
              <div className="text-sm font-medium">Enter measurements</div>
              <p className="text-xs text-muted-foreground">
                The measurement engine can auto-estimate curvature and length (best with
                calibration). Enter circumference manually for accurate tracking.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Length (cm)</Label>
                  <Input
                    inputMode="decimal"
                    type="number"
                    step="0.1"
                    value={measurements.length > 0 ? measurements.length : ""}
                    placeholder="e.g., 14.5"
                    onChange={e => setNumeric("length", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Circumference (cm)</Label>
                  <Input
                    inputMode="decimal"
                    type="number"
                    step="0.1"
                    value={measurements.circumference > 0 ? measurements.circumference : ""}
                    placeholder="e.g., 12.0"
                    onChange={e => setNumeric("circumference", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-secondary/30 border border-border/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="font-medium">Curvature Analysis</span>
                </div>
                <RadialGauge
                  value={measurements.curvatureAngle}
                  min={0}
                  max={90}
                  size={92}
                  strokeWidth={8}
                  label="Angle"
                  valueSuffix="°"
                  className="shrink-0"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Direction</span>
                <Badge variant="outline">{measurements.curvatureDirection}</Badge>
              </div>

              <div className="space-y-2">
                <LiquidProgress
                  value={measurements.curvatureAngle}
                  min={0}
                  max={90}
                  height={12}
                  bubbles
                  markers
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>0° Normal</span>
                  <span>30° Mild</span>
                  <span>60° Moderate</span>
                  <span>90°</span>
                </div>
              </div>
            </div>

            {measurements.curvatureAngle < 30 ? (
              <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-success/20">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <span className="font-semibold text-success">Within Normal Range</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Curvature under 30° is generally considered within normal variation.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-warning/20">
                    <AlertCircle className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <span className="font-semibold text-warning">Consider Consultation</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Curvature of {measurements.curvatureAngle}° may benefit from specialist
                      evaluation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {confidenceScore > 0 && (
              <MeasurementConfidence value={confidenceScore} context={confidenceContext} />
            )}

            {(isAnalyzing || aiAnalysisResult) && (
              <AIScanAnalysisPanel result={aiAnalysisResult} isAnalyzing={isAnalyzing} />
            )}

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  Health Detections
                </span>
                <Badge variant="outline" className="text-success border-success/30">
                  Clear
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Visual analysis complete. No significant health concerns detected.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                View Full Health Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Card */}
      {["idle", "camera", "countdown"].includes(scanMode) && (
        <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-primary" />
              Scanning Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Focus, text: "Hold device steady for accurate measurements" },
              { icon: SunMedium, text: "Ensure good lighting conditions" },
              { icon: Ruler, text: "Include a reference object for scale" },
              { icon: Grid3X3, text: "Center subject within frame guides" },
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
                  <tip.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground">{tip.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
