/**
 * Performance Mode Settings Card
 * Provides quick presets for Performance, Balanced, and Visual modes
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Zap, Scale, Sparkles, Cpu, Battery, Eye } from "lucide-react";
import { useSettings } from "@/contexts/settings";
import { toast } from "sonner";

export type PerformanceMode = "performance" | "balanced" | "visual";

interface PerformanceModeConfig {
  id: PerformanceMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  badgeVariant: "default" | "secondary" | "outline";
  settings: {
    uiFxEnabled: boolean;
    uiFxCardsEnabled: boolean;
    uiFxCardTiltEnabled: boolean;
    uiFxButtonsEnabled: boolean;
    uiFxGlowEnabled: boolean;
    uiFxRippleEnabled: boolean;
    uiFxWallpaperMotionEnabled: boolean;
  };
}

const performanceModes: PerformanceModeConfig[] = [
  {
    id: "performance",
    label: "Performance",
    description: "Maximum speed, minimal effects. Best for older devices or battery saving.",
    icon: Zap,
    badge: "Fast",
    badgeVariant: "outline",
    settings: {
      uiFxEnabled: false,
      uiFxCardsEnabled: false,
      uiFxCardTiltEnabled: false,
      uiFxButtonsEnabled: false,
      uiFxGlowEnabled: false,
      uiFxRippleEnabled: false,
      uiFxWallpaperMotionEnabled: false,
    },
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Optimized mix of visuals and performance. Recommended for most devices.",
    icon: Scale,
    badge: "Recommended",
    badgeVariant: "default",
    settings: {
      uiFxEnabled: true,
      uiFxCardsEnabled: true,
      uiFxCardTiltEnabled: false,
      uiFxButtonsEnabled: true,
      uiFxGlowEnabled: true,
      uiFxRippleEnabled: false,
      uiFxWallpaperMotionEnabled: false,
    },
  },
  {
    id: "visual",
    label: "Visual",
    description: "All effects enabled. Best experience on modern, high-performance devices.",
    icon: Sparkles,
    badge: "Premium",
    badgeVariant: "secondary",
    settings: {
      uiFxEnabled: true,
      uiFxCardsEnabled: true,
      uiFxCardTiltEnabled: true,
      uiFxButtonsEnabled: true,
      uiFxGlowEnabled: true,
      uiFxRippleEnabled: true,
      uiFxWallpaperMotionEnabled: true,
    },
  },
];

function getCurrentMode(settings: {
  uiFxEnabled: boolean;
  uiFxCardsEnabled: boolean;
  uiFxCardTiltEnabled: boolean;
  uiFxButtonsEnabled: boolean;
  uiFxGlowEnabled: boolean;
  uiFxRippleEnabled: boolean;
  uiFxWallpaperMotionEnabled: boolean;
}): PerformanceMode {
  // Check if matches Visual mode
  if (
    settings.uiFxEnabled &&
    settings.uiFxCardsEnabled &&
    settings.uiFxCardTiltEnabled &&
    settings.uiFxButtonsEnabled &&
    settings.uiFxGlowEnabled &&
    settings.uiFxRippleEnabled &&
    settings.uiFxWallpaperMotionEnabled
  ) {
    return "visual";
  }

  // Check if matches Performance mode
  if (
    !settings.uiFxEnabled &&
    !settings.uiFxCardsEnabled &&
    !settings.uiFxCardTiltEnabled &&
    !settings.uiFxButtonsEnabled &&
    !settings.uiFxGlowEnabled &&
    !settings.uiFxRippleEnabled &&
    !settings.uiFxWallpaperMotionEnabled
  ) {
    return "performance";
  }

  // Default to Balanced
  return "balanced";
}

export function PerformanceModeCard() {
  const {
    uiFxEnabled,
    uiFxCardsEnabled,
    uiFxCardTiltEnabled,
    uiFxButtonsEnabled,
    uiFxGlowEnabled,
    uiFxRippleEnabled,
    uiFxWallpaperMotionEnabled,
    setUiFxEnabled,
    setUiFxCardsEnabled,
    setUiFxCardTiltEnabled,
    setUiFxButtonsEnabled,
    setUiFxGlowEnabled,
    setUiFxRippleEnabled,
    setUiFxWallpaperMotionEnabled,
  } = useSettings();

  const currentMode = getCurrentMode({
    uiFxEnabled,
    uiFxCardsEnabled,
    uiFxCardTiltEnabled,
    uiFxButtonsEnabled,
    uiFxGlowEnabled,
    uiFxRippleEnabled,
    uiFxWallpaperMotionEnabled,
  });

  const applyMode = (mode: PerformanceMode) => {
    const config = performanceModes.find(m => m.id === mode);
    if (!config) return;

    setUiFxEnabled(config.settings.uiFxEnabled);
    setUiFxCardsEnabled(config.settings.uiFxCardsEnabled);
    setUiFxCardTiltEnabled(config.settings.uiFxCardTiltEnabled);
    setUiFxButtonsEnabled(config.settings.uiFxButtonsEnabled);
    setUiFxGlowEnabled(config.settings.uiFxGlowEnabled);
    setUiFxRippleEnabled(config.settings.uiFxRippleEnabled);
    setUiFxWallpaperMotionEnabled(config.settings.uiFxWallpaperMotionEnabled);

    toast.success(`${config.label} mode applied`);
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary" />
          <CardTitle>Performance Mode</CardTitle>
        </div>
        <CardDescription>
          Choose a preset that balances visual effects with device performance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={currentMode}
          onValueChange={(value: PerformanceMode) => applyMode(value)}
          className="space-y-3"
        >
          {performanceModes.map(mode => {
            const Icon = mode.icon;
            const isSelected = currentMode === mode.id;

            return (
              <label
                key={mode.id}
                htmlFor={`mode-${mode.id}`}
                className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                <RadioGroupItem value={mode.id} id={`mode-${mode.id}`} className="mt-1" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <Label htmlFor={`mode-${mode.id}`} className="font-medium cursor-pointer">
                      {mode.label}
                    </Label>
                    <Badge variant={mode.badgeVariant} className="text-xs">
                      {mode.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{mode.description}</p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  {mode.id === "performance" && (
                    <>
                      <Battery className="w-4 h-4 text-accent" />
                      <span className="text-xs text-accent">Low power</span>
                    </>
                  )}
                  {mode.id === "visual" && (
                    <>
                      <Eye className="w-4 h-4 text-primary" />
                      <span className="text-xs text-primary">High quality</span>
                    </>
                  )}
                </div>
              </label>
            );
          })}
        </RadioGroup>

        <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Use Performance mode if you experience lag or want to save
            battery. Visual mode provides the best experience but may affect performance on older
            devices.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
