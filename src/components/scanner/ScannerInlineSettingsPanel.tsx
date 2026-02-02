import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Contrast, SunMedium, Timer, ZoomIn } from "lucide-react";

export function ScannerInlineSettingsPanel({
  zoom,
  setZoom,
  brightness,
  setBrightness,
  contrast,
  setContrast,
  timerDelay,
  setTimerDelay,
}: {
  zoom: number;
  setZoom: (v: number) => void;
  brightness: number;
  setBrightness: (v: number) => void;
  contrast: number;
  setContrast: (v: number) => void;
  timerDelay: number;
  setTimerDelay: (v: number) => void;
}) {
  return (
    <div className="p-4 border-t border-border/50 bg-secondary/20 space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <ZoomIn className="w-3 h-3" /> Zoom
            </span>
            <span className="font-mono">{zoom.toFixed(1)}x</span>
          </div>
          <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={([v]) => setZoom(v)} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <SunMedium className="w-3 h-3" /> Brightness
            </span>
            <span className="font-mono">{brightness}%</span>
          </div>
          <Slider
            value={[brightness]}
            min={50}
            max={150}
            onValueChange={([v]) => setBrightness(v)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <Contrast className="w-3 h-3" /> Contrast
            </span>
            <span className="font-mono">{contrast}%</span>
          </div>
          <Slider value={[contrast]} min={50} max={150} onValueChange={([v]) => setContrast(v)} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <Timer className="w-3 h-3" /> Timer
            </span>
            <span className="font-mono">{timerDelay}s</span>
          </div>
          <div className="flex gap-2">
            {[0, 3, 5, 10].map(t => (
              <Button
                key={t}
                size="sm"
                variant={timerDelay === t ? "default" : "outline"}
                className="flex-1 h-7 text-xs"
                onClick={() => setTimerDelay(t)}
              >
                {t === 0 ? "Off" : `${t}s`}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
