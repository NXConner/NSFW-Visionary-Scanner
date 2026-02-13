import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Ghost,
  Grid3X3,
  Hand,
  Layers,
  Move,
  RotateCcw,
  Ruler,
  Settings2,
  Smartphone,
  Target,
  Volume2,
  X,
  Zap,
  Focus,
  BrainCircuit,
  Sparkles,
  Crosshair,
  EyeOff,
  Waypoints,
  FileText,
} from "lucide-react";
import { isLovablePolicyBuild } from "@/lib/featureFlags";
import type { CalibrationData } from "@/components/calibrationWizard/types";
import type { ElementType } from "react";
import {
  booleanScannerSettingKeys,
  defaultScannerSettings,
  type BooleanScannerSettingKey,
  type ScannerSettings,
} from "./types";

interface SettingsPanelProps {
  settings: ScannerSettings;
  onSettingsChange: (settings: ScannerSettings) => void;
  onClose: () => void;
  calibration?: {
    isCalibrated: boolean;
    summary?: string | null;
    qualityPercent?: number | null;
    skewPercent?: number | null;
    data?: CalibrationData | null;
    onVerify?: () => void;
    onRecalibrate?: () => void;
  };
}

export const ScannerSettingsPanel = ({
  settings,
  onSettingsChange,
  onClose,
  calibration,
}: SettingsPanelProps) => {
  const updateBooleanSetting = (key: BooleanScannerSettingKey, value: boolean) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const settingsGroups: Array<{
    title: string;
    items: Array<{
      key: BooleanScannerSettingKey;
      label: string;
      desc: string;
      icon: ElementType;
      disabled?: boolean;
    }>;
  }> = [
    {
      title: "AI Detection & Tracking",
      items: [
        {
          key: "showObjectDetection",
          label: "Object Detection",
          desc: "Auto-detect & track subject",
          icon: Target,
        },
        {
          key: "showMeasurementGuides",
          label: "Measurement Guides",
          desc: "Rulers along detection edges",
          icon: Ruler,
        },
        {
          key: "showEdgeDetection",
          label: "Edge Detection",
          desc: "Highlight detected edges",
          icon: Layers,
        },
        {
          key: "enableRealDetection",
          label: "Real AI Detection",
          desc: "Use COCO-SSD (lazy-loaded)",
          icon: BrainCircuit,
        },
        {
          key: "enableCloudAiAnalysis",
          label: "Cloud AI Analysis (opt-in)",
          desc: isLovablePolicyBuild()
            ? "Unavailable in this build."
            : "Uploads a scan image for AI insights.",
          icon: Sparkles,
          disabled: isLovablePolicyBuild(),
        },
        {
          key: "showDetectionConfidence",
          label: "Confidence Visualization",
          desc: "Color + ring by confidence",
          icon: Sparkles,
        },
        {
          key: "enableTracking",
          label: "Object Tracking",
          desc: "Maintain IDs across frames",
          icon: Target,
        },
        {
          key: "enableAutoTracking",
          label: "Tap-to-Track",
          desc: "Tap object to auto-focus & follow",
          icon: Crosshair,
        },
        {
          key: "autoTrackingFocusEnabled",
          label: "Auto-Focus Follows",
          desc: "Focus follows tracked object",
          icon: Focus,
        },
        {
          key: "enableMasking",
          label: "Object Masking",
          desc: "Blur/dim non-tracked objects",
          icon: EyeOff,
        },
        {
          key: "showMotionTrails",
          label: "Motion Trails",
          desc: "Show path history",
          icon: Layers,
        },
        { key: "showObjectIds", label: "Object IDs", desc: "Label tracked objects", icon: Target },
      ],
    },
    {
      title: "Focus Controls",
      items: [
        {
          key: "tapToFocusEnabled",
          label: "Tap-to-Focus",
          desc: "Tap preview to focus",
          icon: Focus,
        },
        {
          key: "showFocusIndicator",
          label: "Focus Indicator",
          desc: "Show focus state overlay",
          icon: Focus,
        },
      ],
    },
    {
      title: "Visual Guides",
      items: [
        {
          key: "showPositioningGuide",
          label: "Positioning Guide",
          desc: "Center alignment frame",
          icon: Target,
        },
        { key: "showGrid", label: "Measurement Grid", desc: "Overlay grid pattern", icon: Grid3X3 },
        {
          key: "showVirtualRuler",
          label: "Virtual Ruler",
          desc: "Measurement scale overlay",
          icon: Ruler,
        },
        {
          key: "showGhostOverlay",
          label: "Ghost Overlay",
          desc: "Show previous scan position",
          icon: Ghost,
        },
      ],
    },
    {
      title: "Quality Feedback",
      items: [
        {
          key: "showQualityIndicators",
          label: "Quality Indicators",
          desc: "Lighting, stability, focus",
          icon: CheckCircle2,
        },
        {
          key: "showDistanceIndicator",
          label: "Distance Indicator",
          desc: "Optimal distance guide",
          icon: Move,
        },
        {
          key: "showTiltIndicator",
          label: "Tilt Indicator",
          desc: "Device orientation level",
          icon: Smartphone,
        },
        {
          key: "showStatusBar",
          label: "Status Bar",
          desc: "Show focus/detection/quality bar",
          icon: CheckCircle2,
        },
        {
          key: "showMLIndicator",
          label: "AI Indicator",
          desc: "AI badge + FPS",
          icon: BrainCircuit,
        },
      ],
    },
    {
      title: "Curvature Detection",
      items: [
        {
          key: "showLandmarkCurvature",
          label: "4-Point Curvature",
          desc: "Clinical landmark detection (PMC10150132)",
          icon: Waypoints,
        },
        {
          key: "showCurvatureClinicalNote",
          label: "Clinical Notes",
          desc: "Show interpretation guidance",
          icon: FileText,
        },
      ],
    },
    {
      title: "Assistance",
      items: [
        {
          key: "showStepGuide",
          label: "Step-by-Step Guide",
          desc: "Preparation walkthrough",
          icon: CheckCircle2,
        },
        {
          key: "autoCapture",
          label: "Auto-Capture",
          desc: "Capture when conditions optimal",
          icon: Zap,
        },
        {
          key: "voiceGuidance",
          label: "Voice Guidance",
          desc: "Audio instructions",
          icon: Volume2,
        },
        { key: "hapticFeedback", label: "Haptic Feedback", desc: "Vibration feedback", icon: Hand },
        {
          key: "enableCaptureFlash",
          label: "Capture Flash",
          desc: "Flash + confirmation badge",
          icon: Zap,
        },
        {
          key: "enableSoundFeedback",
          label: "Sound Feedback",
          desc: "Beep/blip/click cues",
          icon: Volume2,
        },
      ],
    },
  ];

  const setAllBooleans = (value: boolean) => {
    const next: ScannerSettings = { ...settings };
    for (const key of booleanScannerSettingKeys) next[key] = value;
    onSettingsChange(next);
  };

  return (
    <Card className="absolute inset-4 z-50 bg-background/98 backdrop-blur-xl border-primary/20 shadow-2xl overflow-auto animate-scale-in">
      <CardHeader className="pb-2 sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            Scanner Settings
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close scanner settings"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {calibration ? (
          <div className="space-y-3 p-4 rounded-xl bg-secondary/20 border border-border/50">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">Calibration</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {calibration.isCalibrated
                    ? "Used for accurate real-world measurements."
                    : "Not calibrated yet — length estimates will be limited."}
                </div>
                {calibration.summary ? (
                  <div className="text-xs text-muted-foreground mt-1">{calibration.summary}</div>
                ) : null}
                {typeof calibration.qualityPercent === "number" ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    Quality: {Math.round(calibration.qualityPercent)}%
                    {typeof calibration.skewPercent === "number"
                      ? ` · Skew: ${Math.round(calibration.skewPercent)}%`
                      : ""}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {calibration.isCalibrated && calibration.onVerify ? (
                  <Button variant="outline" size="sm" onClick={calibration.onVerify}>
                    Verify
                  </Button>
                ) : null}
                {calibration.onRecalibrate ? (
                  <Button
                    variant={calibration.isCalibrated ? "outline" : "default"}
                    size="sm"
                    onClick={calibration.onRecalibrate}
                  >
                    {calibration.isCalibrated ? "Recalibrate" : "Calibrate"}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {settingsGroups.map(group => (
          <div key={group.title} className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {group.title}
            </h4>
            <div className="space-y-2">
              {group.items.map(item => {
                const Icon = item.icon;
                const isEnabled = settings[item.key];
                return (
                  <div
                    key={String(item.key)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isEnabled
                        ? "bg-primary/5 border-primary/20"
                        : "bg-secondary/30 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isEnabled
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      disabled={Boolean(item.disabled)}
                      onCheckedChange={checked => updateBooleanSetting(item.key, checked)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {settings.autoCapture && (
          <div className="space-y-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Auto-Capture Delay</span>
              <span className="text-sm font-mono text-primary">{settings.autoCaptureDelay}s</span>
            </div>
            <Slider
              value={[settings.autoCaptureDelay]}
              min={1}
              max={5}
              step={1}
              onValueChange={([v]) => onSettingsChange({ ...settings, autoCaptureDelay: v })}
            />
          </div>
        )}

        <div className="space-y-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Focus Mode</span>
            <span className="text-xs font-mono text-muted-foreground">{settings.focusMode}</span>
          </div>
          <Tabs
            value={settings.focusMode}
            onValueChange={v =>
              onSettingsChange({ ...settings, focusMode: v as ScannerSettings["focusMode"] })
            }
          >
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="auto">Auto</TabsTrigger>
              <TabsTrigger value="continuous">Cont.</TabsTrigger>
              <TabsTrigger value="single-shot">Single</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>
          </Tabs>

          {settings.focusMode === "manual" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Focus Distance</span>
                <span className="text-xs font-mono text-primary">
                  {Math.round(settings.focusDistance * 100)}%
                </span>
              </div>
              <Slider
                value={[settings.focusDistance]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={([v]) => onSettingsChange({ ...settings, focusDistance: v })}
              />
            </div>
          )}
        </div>

        {settings.enableRealDetection && (
          <div className="space-y-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI Detection Threshold</span>
              <span className="text-sm font-mono text-primary">
                {Math.round(settings.detectionThreshold * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.detectionThreshold]}
              min={0.3}
              max={0.95}
              step={0.01}
              onValueChange={([v]) => onSettingsChange({ ...settings, detectionThreshold: v })}
            />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Max Objects</span>
              <span className="text-sm font-mono text-primary">{settings.maxDetectedObjects}</span>
            </div>
            <Slider
              value={[settings.maxDetectedObjects]}
              min={1}
              max={12}
              step={1}
              onValueChange={([v]) => onSettingsChange({ ...settings, maxDetectedObjects: v })}
            />
          </div>
        )}

        {settings.enableMasking && (
          <div className="space-y-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Masking Mode</span>
              <span className="text-xs font-mono text-muted-foreground">{settings.maskingMode}</span>
            </div>
            <Tabs
              value={settings.maskingMode}
              onValueChange={v =>
                onSettingsChange({ ...settings, maskingMode: v as ScannerSettings["maskingMode"] })
              }
            >
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="blur">Blur</TabsTrigger>
                <TabsTrigger value="darken">Darken</TabsTrigger>
                <TabsTrigger value="pixelate">Pixelate</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Mask Intensity</span>
                <span className="text-xs font-mono text-primary">
                  {settings.maskIntensity}%
                </span>
              </div>
              <Slider
                value={[settings.maskIntensity]}
                min={10}
                max={100}
                step={5}
                onValueChange={([v]) => onSettingsChange({ ...settings, maskIntensity: v })}
              />
            </div>
          </div>
        )}

        {settings.enableSoundFeedback && (
          <div className="space-y-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sound Volume</span>
              <span className="text-sm font-mono text-primary">
                {Math.round(settings.soundVolume * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.soundVolume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={([v]) => onSettingsChange({ ...settings, soundVolume: v })}
            />
          </div>
        )}

        <Separator />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onSettingsChange(defaultScannerSettings)}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Defaults
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setAllBooleans(false)}
          >
            Disable All
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => setAllBooleans(true)}
          >
            Enable All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
