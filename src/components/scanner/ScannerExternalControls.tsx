import { Button } from "@/components/ui/button";
import { DistanceIndicator, TiltIndicator } from "@/components/ScannerOverlays";
import { useScannerTelemetry } from "@/components/scanner/telemetry/useScannerTelemetry";
import type { ScannerSettings } from "@/components/scannerOverlays/types";
import { GridMode, ScanMode } from "@/components/scanner/types";
import { Flashlight, Grid3X3, Settings2, Sliders, Target } from "lucide-react";

export function ScannerExternalControls({
  scanMode,
  torchOn,
  onToggleTorch,
  gridMode,
  onCycleGridMode,
  showSettings,
  onToggleSettings,
  onOpenOverlaySettings,
  scannerSettings,
  setScannerSettings,
  brightness,
  isActive,
}: {
  scanMode: ScanMode;
  torchOn: boolean;
  onToggleTorch: () => void;
  gridMode: GridMode;
  onCycleGridMode: () => void;
  showSettings: boolean;
  onToggleSettings: () => void;
  onOpenOverlaySettings: () => void;
  scannerSettings: ScannerSettings;
  setScannerSettings: React.Dispatch<React.SetStateAction<ScannerSettings>>;
  brightness: number;
  isActive: boolean;
}) {
  const { estimatedDistance, tiltX, tiltY, isStabilized } = useScannerTelemetry();
  if (!(scanMode === "camera" || scanMode === "countdown")) return null;

  return (
    <div className="flex flex-col justify-between p-2 bg-secondary/30 border-l border-border/50">
      <div className="flex flex-col gap-1.5">
        <Button
          size="icon"
          variant="glass"
          className="w-10 h-10"
          onClick={onToggleTorch}
          title="Flash"
        >
          <Flashlight className={`w-4 h-4 ${torchOn ? "text-warning" : ""}`} />
        </Button>
        <Button
          size="icon"
          variant={scannerSettings.showPositioningGuide ? "default" : "glass"}
          className="w-10 h-10"
          onClick={() =>
            setScannerSettings(s => ({ ...s, showPositioningGuide: !s.showPositioningGuide }))
          }
          title="Positioning Guide"
        >
          <Target className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant={gridMode !== "none" ? "default" : "glass"}
          className="w-10 h-10"
          onClick={onCycleGridMode}
          title="Grid"
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="glass"
          className="w-10 h-10"
          onClick={onToggleSettings}
          title="Settings"
        >
          <Settings2 className="w-4 h-4" />
        </Button>

        <Button
          size="icon"
          variant="glass"
          className="w-10 h-10 bg-primary/20"
          onClick={onOpenOverlaySettings}
          title="Overlay Settings"
        >
          <Sliders className="w-4 h-4 text-primary" />
        </Button>

        {scannerSettings.showDistanceIndicator && (
          <DistanceIndicator
            estimatedDistance={estimatedDistance}
            optimalMin={12}
            optimalMax={18}
            external
          />
        )}

        {scannerSettings.showQualityIndicators && (
          <div className="p-2 rounded-lg bg-background/90 backdrop-blur-md border border-border/50 shadow-lg">
            <div className="flex flex-col gap-1 items-center">
              <div
                className={`w-3 h-3 rounded-full ${brightness >= 80 && brightness <= 120 ? "bg-success" : "bg-warning"}`}
                title="Lighting"
              />
              <div
                className={`w-3 h-3 rounded-full ${isStabilized ? "bg-success" : "bg-warning"}`}
                title="Stability"
              />
              <div
                className={`w-3 h-3 rounded-full ${isActive ? "bg-success" : "bg-muted"}`}
                title="Focus"
              />
            </div>
            <span className="text-[8px] block text-center mt-1 text-muted-foreground">QUALITY</span>
          </div>
        )}
      </div>

      {scannerSettings.showTiltIndicator && <TiltIndicator tiltX={tiltX} tiltY={tiltY} external />}
    </div>
  );
}
