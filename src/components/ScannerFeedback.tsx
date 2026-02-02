import { useState, useEffect, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Circle,
  Sun,
  Camera,
  Ruler,
  Move,
  Target,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Hand,
  Lightbulb,
  Timer,
  Eye,
  Volume2,
  VolumeX,
  Info,
} from "lucide-react";

type ScanPhase = "preparation" | "positioning" | "alignment" | "capture" | "complete";

interface QualityIndicator {
  label: string;
  value: number;
  status: "good" | "warning" | "poor";
  icon: React.ReactNode;
}

interface ScannerFeedbackProps {
  isActive: boolean;
  isStabilized: boolean;
  scanMode: string;
  onCapture?: () => void;
  brightness?: number;
}

export const ScannerFeedback = ({
  isActive,
  isStabilized,
  scanMode,
  onCapture,
  brightness = 100,
}: ScannerFeedbackProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [qualityScore, setQualityScore] = useState(0);

  const preparationSteps = useMemo(
    () => [
      {
        id: "lighting",
        title: "Check Lighting",
        description: "Ensure bright, even lighting without harsh shadows",
        icon: <Sun className="w-5 h-5" />,
        tip: "Natural daylight or diffused lamp works best",
      },
      {
        id: "position",
        title: "Position Device",
        description: "Hold device 12-18 inches away, perpendicular to subject",
        icon: <Camera className="w-5 h-5" />,
        tip: "Use a tripod or stable surface for best results",
      },
      {
        id: "reference",
        title: "Add Reference",
        description: "Place a ruler or card of known size in frame",
        icon: <Ruler className="w-5 h-5" />,
        tip: "Credit card = 85.6mm × 53.98mm for scale",
      },
      {
        id: "align",
        title: "Align Subject",
        description: "Center within the frame guides",
        icon: <Target className="w-5 h-5" />,
        tip: "Use grid overlay for precise alignment",
      },
      {
        id: "steady",
        title: "Hold Steady",
        description: "Keep device still until capture completes",
        icon: <Hand className="w-5 h-5" />,
        tip: "Use timer delay for hands-free capture",
      },
    ],
    [],
  );

  // Calculate quality indicators
  const qualityIndicators: QualityIndicator[] = useMemo(
    () => [
      {
        label: "Lighting",
        value: brightness >= 80 && brightness <= 120 ? 100 : brightness < 80 ? 60 : 70,
        status:
          brightness >= 80 && brightness <= 120 ? "good" : brightness < 60 ? "poor" : "warning",
        icon: <Sun className="w-3 h-3" />,
      },
      {
        label: "Stability",
        value: isStabilized ? 100 : 40,
        status: isStabilized ? "good" : "warning",
        icon: <Hand className="w-3 h-3" />,
      },
      {
        label: "Focus",
        value: isActive ? 85 : 0,
        status: isActive ? "good" : "poor",
        icon: <Eye className="w-3 h-3" />,
      },
    ],
    [brightness, isStabilized, isActive],
  );

  useEffect(() => {
    const avgQuality =
      qualityIndicators.reduce((sum, q) => sum + q.value, 0) / qualityIndicators.length;
    setQualityScore(Math.round(avgQuality));
  }, [qualityIndicators]);

  // Voice guidance (browser speech synthesis)
  const speak = useCallback(
    (text: string) => {
      if (audioEnabled && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      }
    },
    [audioEnabled],
  );

  useEffect(() => {
    if (audioEnabled && scanMode === "camera") {
      speak(preparationSteps[currentStep]?.description || "");
    }
  }, [audioEnabled, scanMode, currentStep, preparationSteps, speak]);

  const nextStep = () => {
    if (currentStep < preparationSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isActive && scanMode === "idle") return null;

  return (
    <>
      {/* Step-by-Step Guide Overlay */}
      {showGuide && scanMode === "camera" && (
        <div className="absolute bottom-28 left-2 right-2 z-20 animate-fade-in">
          <Card className="bg-background/95 backdrop-blur-lg border-primary/20 shadow-lg">
            <CardContent className="p-4">
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                  {preparationSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                        index < currentStep
                          ? "bg-success text-success-foreground"
                          : index === currentStep
                            ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index < currentStep ? <CheckCircle2 className="w-3 h-3" /> : index + 1}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                  >
                    {audioEnabled ? (
                      <Volume2 className="w-4 h-4 text-primary" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setShowGuide(false)}
                  >
                    Hide
                  </Button>
                </div>
              </div>

              {/* Current Step Content */}
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  {preparationSteps[currentStep].icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">
                    Step {currentStep + 1}: {preparationSteps[currentStep].title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {preparationSteps[currentStep].description}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-primary/80">
                    <Lightbulb className="w-3 h-3" />
                    <span>{preparationSteps[currentStep].tip}</span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="h-8"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>

                {currentStep === preparationSteps.length - 1 ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onCapture}
                    disabled={!isStabilized}
                    className="h-8"
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    Capture Now
                  </Button>
                ) : (
                  <Button variant="default" size="sm" onClick={nextStep} className="h-8">
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Collapsed Guide Toggle */}
      {!showGuide && scanMode === "camera" && (
        <Button
          variant="outline"
          size="sm"
          className="absolute bottom-28 left-2 z-20 h-7 text-xs"
          onClick={() => setShowGuide(true)}
        >
          <Info className="w-3 h-3 mr-1" />
          Guide
        </Button>
      )}
    </>
  );
};

// Positioning Overlay Component
export const PositioningOverlay = ({ scanType }: { scanType: "3d" | "2d" }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Body outline guide */}
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Center guide area - simplified */}
        <rect
          x="30"
          y="20"
          width="40"
          height="60"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="0.5"
          strokeDasharray="3 3"
          opacity="0.3"
        />

        {/* Center crosshair - simplified */}
        <circle
          cx="50"
          cy="50"
          r="2"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="0.3"
          opacity="0.5"
        />
        <line
          x1="50"
          y1="47"
          x2="50"
          y2="53"
          stroke="hsl(var(--primary))"
          strokeWidth="0.3"
          opacity="0.5"
        />
        <line
          x1="47"
          y1="50"
          x2="53"
          y2="50"
          stroke="hsl(var(--primary))"
          strokeWidth="0.3"
          opacity="0.5"
        />

        {/* Corner focus brackets - minimal */}
        <g stroke="hsl(var(--primary))" strokeWidth="0.6" fill="none" opacity="0.6">
          <path d="M32 22 L32 27 M32 22 L37 22" />
          <path d="M68 22 L68 27 M68 22 L63 22" />
          <path d="M32 78 L32 73 M32 78 L37 78" />
          <path d="M68 78 L68 73 M68 78 L63 78" />
        </g>
      </svg>
    </div>
  );
};

// Angle Measurement Overlay
export const AngleMeasurementOverlay = ({ angle = 0 }: { angle: number }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Protractor arc */}
        <g transform="translate(50, 70)">
          {/* Base line */}
          <line
            x1="-30"
            y1="0"
            x2="30"
            y2="0"
            stroke="hsl(var(--accent))"
            strokeWidth="0.5"
            opacity="0.5"
          />

          {/* Degree markers */}
          {[0, 15, 30, 45, 60, 75, 90].map(deg => {
            const rad = (deg * Math.PI) / 180;
            const x = -Math.cos(rad) * 25;
            const y = -Math.sin(rad) * 25;
            const textX = -Math.cos(rad) * 32;
            const textY = -Math.sin(rad) * 32;
            return (
              <g key={deg}>
                <line
                  x1="0"
                  y1="0"
                  x2={x}
                  y2={y}
                  stroke="hsl(var(--primary))"
                  strokeWidth="0.3"
                  opacity={deg === angle ? 1 : 0.3}
                />
                <text
                  x={textX}
                  y={textY}
                  fontSize="3"
                  fill="hsl(var(--primary))"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  opacity={0.6}
                >
                  {deg}°
                </text>
              </g>
            );
          })}

          {/* Current angle indicator */}
          {angle > 0 && (
            <g>
              <line
                x1="0"
                y1="0"
                x2={-Math.cos((angle * Math.PI) / 180) * 28}
                y2={-Math.sin((angle * Math.PI) / 180) * 28}
                stroke="hsl(var(--accent))"
                strokeWidth="1"
              />
              <circle
                cx={-Math.cos((angle * Math.PI) / 180) * 28}
                cy={-Math.sin((angle * Math.PI) / 180) * 28}
                r="2"
                fill="hsl(var(--accent))"
              />
            </g>
          )}
        </g>

        {/* Angle display */}
        <text
          x="50"
          y="95"
          fontSize="4"
          fill="hsl(var(--primary))"
          textAnchor="middle"
          fontWeight="bold"
        >
          {angle}° CURVATURE
        </text>
      </svg>
    </div>
  );
};

// Real-time Guidance Messages
export const GuidanceMessage = ({
  message,
  type = "info",
}: {
  message: string;
  type?: "info" | "success" | "warning" | "error";
}) => {
  const colors = {
    info: "bg-primary/10 border-primary/30 text-primary",
    success: "bg-success/10 border-success/30 text-success",
    warning: "bg-warning/10 border-warning/30 text-warning",
    error: "bg-destructive/10 border-destructive/30 text-destructive",
  };

  const icons = {
    info: <Info className="w-3 h-3" />,
    success: <CheckCircle2 className="w-3 h-3" />,
    warning: <AlertTriangle className="w-3 h-3" />,
    error: <AlertTriangle className="w-3 h-3" />,
  };

  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-md z-20 animate-fade-in">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md ${colors[type]}`}
      >
        {icons[type]}
        <span className="text-xs font-medium">{message}</span>
      </div>
    </div>
  );
};
