/**
 * ScannerCaptureScreen
 * Main scanner capture screen with AR measurement overlay integration
 */

import * as React from "react";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScannerExperience } from "@/scanner/ui/ScannerExperience";
import { ARMeasurementOverlay } from "@/scanner/overlays/ar";
import { useARMeasurement } from "@/hooks/useARMeasurement";
import { useSettings } from "@/contexts/settings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Eye,
  EyeOff,
  Settings2,
  Target,
  Crosshair,
  Ruler,
  Activity,
  Volume2,
  VolumeX,
  Vibrate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AROverlaySensitivity } from "@/contexts/settings/types";

export function ScannerCaptureScreen(): React.ReactElement {
  // AR overlay state
  const [arEnabled, setArEnabled] = useState(true);
  const [showARControls, setShowARControls] = useState(false);

  // Settings from context
  const settingsContext = useSettings();
  const arSettings = settingsContext?.arOverlay;
  const setARSettings = settingsContext?.setAROverlay;

  // AR measurement hook
  const arMeasurement = useARMeasurement({
    onCaptureReady: () => {
      // Trigger haptic feedback when capture ready
      if (arSettings?.hapticFeedback && navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
    },
    onQualityChange: quality => {
      // Could log quality changes for analytics
    },
  });

  // Handle AR setting changes
  const handleSettingChange = useCallback(
    (key: keyof typeof arSettings, value: boolean | AROverlaySensitivity) => {
      if (setARSettings && arSettings) {
        setARSettings({ ...arSettings, [key]: value });
      }
    },
    [setARSettings, arSettings],
  );

  // Toggle AR overlay
  const toggleAR = useCallback(() => {
    setArEnabled(prev => !prev);
    if (!arEnabled) {
      arMeasurement.start();
    } else {
      arMeasurement.stop();
    }
  }, [arEnabled, arMeasurement]);

  return (
    <div className="relative h-full w-full">
      {/* Main Scanner Experience */}
      <ScannerExperience />

      {/* AR Overlay Controls - Floating Button */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2">
        {/* Quick Toggle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2"
        >
          <Popover open={showARControls} onOpenChange={setShowARControls}>
            <PopoverTrigger asChild>
              <Button
                variant={arEnabled ? "default" : "secondary"}
                size="icon"
                className={cn("h-12 w-12 rounded-full shadow-lg", arEnabled && "bg-primary")}
                onClick={e => {
                  if (e.detail === 2) {
                    // Double click opens settings
                    setShowARControls(true);
                  } else {
                    toggleAR();
                  }
                }}
              >
                {arEnabled ? <Target className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </Button>
            </PopoverTrigger>

            <PopoverContent side="left" align="end" className="w-72 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">AR Measurement</h4>
                  <Badge variant={arEnabled ? "default" : "secondary"}>
                    {arEnabled ? "Active" : "Off"}
                  </Badge>
                </div>

                {/* Quick Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ar-guides" className="flex items-center gap-2">
                      <Ruler className="h-4 w-4" />
                      Guides
                    </Label>
                    <Switch
                      id="ar-guides"
                      checked={arSettings?.showGuides ?? true}
                      onCheckedChange={v => handleSettingChange("showGuides", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="ar-points" className="flex items-center gap-2">
                      <Crosshair className="h-4 w-4" />
                      Detection Points
                    </Label>
                    <Switch
                      id="ar-points"
                      checked={arSettings?.showDetectionPoints ?? true}
                      onCheckedChange={v => handleSettingChange("showDetectionPoints", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="ar-quality" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Quality Indicator
                    </Label>
                    <Switch
                      id="ar-quality"
                      checked={arSettings?.showQualityIndicator ?? true}
                      onCheckedChange={v => handleSettingChange("showQualityIndicator", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="ar-prompts" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Positioning Prompts
                    </Label>
                    <Switch
                      id="ar-prompts"
                      checked={arSettings?.showPositioningPrompts ?? true}
                      onCheckedChange={v => handleSettingChange("showPositioningPrompts", v)}
                    />
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <Label className="text-xs text-muted-foreground mb-2 block">Sensitivity</Label>
                    <div className="flex gap-2">
                      {(["low", "medium", "high"] as const).map(level => (
                        <Button
                          key={level}
                          variant={arSettings?.sensitivity === level ? "default" : "outline"}
                          size="sm"
                          className="flex-1 capitalize"
                          onClick={() => handleSettingChange("sensitivity", level)}
                        >
                          {level}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-3">
                    <Label htmlFor="ar-haptic" className="flex items-center gap-2">
                      <Vibrate className="h-4 w-4" />
                      Haptic Feedback
                    </Label>
                    <Switch
                      id="ar-haptic"
                      checked={arSettings?.hapticFeedback ?? true}
                      onCheckedChange={v => handleSettingChange("hapticFeedback", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="ar-sound" className="flex items-center gap-2">
                      {arSettings?.soundFeedback ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4" />
                      )}
                      Sound Feedback
                    </Label>
                    <Switch
                      id="ar-sound"
                      checked={arSettings?.soundFeedback ?? false}
                      onCheckedChange={v => handleSettingChange("soundFeedback", v)}
                    />
                  </div>
                </div>

                {/* Full Settings Link */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full" size="sm">
                      <Settings2 className="h-4 w-4 mr-2" />
                      Advanced Settings
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <SheetHeader>
                      <SheetTitle>AR Overlay Settings</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      {/* Full settings panel would go here */}
                      <p className="text-sm text-muted-foreground">
                        Configure detailed AR measurement overlay settings in the main Settings
                        page.
                      </p>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </PopoverContent>
          </Popover>
        </motion.div>

        {/* Status Badge */}
        <AnimatePresence>
          {arEnabled && arMeasurement.captureReady && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Badge className="bg-green-500 text-white animate-pulse">Ready to capture</Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AR Overlay Demo (positioned for demonstration) */}
      {arEnabled && (
        <div className="fixed top-20 left-4 z-40 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-black/20 rounded-lg overflow-hidden backdrop-blur-sm"
          >
            <ARMeasurementOverlay
              enabled={arEnabled}
              width={200}
              height={280}
              arMeasurement={arMeasurement}
              className="opacity-90"
            />
            <div className="absolute bottom-2 left-2 text-xs text-white/70">AR Preview</div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default ScannerCaptureScreen;
