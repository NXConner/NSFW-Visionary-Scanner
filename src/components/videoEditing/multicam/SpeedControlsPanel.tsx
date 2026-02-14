/**
 * Speed Controls Panel
 * Slow-mo, speed ramp, time-lapse controls
 */

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FastForward, Rewind, Clock, Gauge, RefreshCw } from "lucide-react";
import type { SpeedControlState } from "./SpeedControlsPanel.model";
import { defaultSpeedControl } from "./SpeedControlsPanel.model";

const SPEED_PRESETS = [
  { value: 0.25, label: "0.25x", type: "slow" },
  { value: 0.5, label: "0.5x", type: "slow" },
  { value: 1, label: "1x", type: "normal" },
  { value: 2, label: "2x", type: "fast" },
  { value: 4, label: "4x", type: "fast" },
  { value: 8, label: "8x", type: "fast" },
];

interface Props {
  state: SpeedControlState;
  onChange: (state: SpeedControlState) => void;
}

export function SpeedControlsPanel({ state, onChange }: Props) {
  const update = <K extends keyof SpeedControlState>(key: K, value: SpeedControlState[K]) => {
    onChange({ ...state, [key]: value });
  };

  const reset = () => onChange(defaultSpeedControl);

  const getSpeedLabel = (speed: number) => {
    if (speed < 1) return "Slow Motion";
    if (speed > 1) return "Time-lapse";
    return "Normal";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Gauge className="w-4 h-4" />
          Speed Controls
        </Label>
        <Button variant="ghost" size="sm" onClick={reset} className="gap-1 h-7">
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>

      {/* Speed Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[10px]">Speed</Label>
          <Badge variant="secondary" className="text-[10px]">
            {state.speed}x - {getSpeedLabel(state.speed)}
          </Badge>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {SPEED_PRESETS.map(preset => (
            <Button
              key={preset.value}
              variant={state.speed === preset.value ? "default" : "outline"}
              size="sm"
              onClick={() => update("speed", preset.value)}
              className="h-7 text-[10px] px-1"
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <Slider
          value={[state.speed]}
          onValueChange={([v]) => update("speed", v)}
          min={0.1}
          max={8}
          step={0.05}
        />
      </div>

      {/* Speed Ramp */}
      <div className="space-y-2 p-2 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Speed Ramp
          </Label>
          <Switch
            checked={state.enableSpeedRamp}
            onCheckedChange={v => update("enableSpeedRamp", v)}
          />
        </div>
        {state.enableSpeedRamp && (
          <div className="space-y-2 mt-2">
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-[10px]">Start Speed</Label>
                <span className="text-[10px] text-muted-foreground">{state.rampStartSpeed}x</span>
              </div>
              <Slider
                value={[state.rampStartSpeed]}
                onValueChange={([v]) => update("rampStartSpeed", v)}
                min={0.1}
                max={4}
                step={0.05}
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-[10px]">End Speed</Label>
                <span className="text-[10px] text-muted-foreground">{state.rampEndSpeed}x</span>
              </div>
              <Slider
                value={[state.rampEndSpeed]}
                onValueChange={([v]) => update("rampEndSpeed", v)}
                min={0.1}
                max={4}
                step={0.05}
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-[10px]">Duration</Label>
                <span className="text-[10px] text-muted-foreground">{state.rampDuration}s</span>
              </div>
              <Slider
                value={[state.rampDuration]}
                onValueChange={([v]) => update("rampDuration", v)}
                min={0.5}
                max={10}
                step={0.5}
              />
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] flex items-center gap-1">
            <Rewind className="w-3 h-3" />
            Reverse Playback
          </Label>
          <Switch
            checked={state.reversePlayback}
            onCheckedChange={v => update("reversePlayback", v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-[10px]">Frame Blending</Label>
          <Switch checked={state.frameBlending} onCheckedChange={v => update("frameBlending", v)} />
        </div>
      </div>
    </div>
  );
}
