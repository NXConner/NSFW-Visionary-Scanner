/**
 * Blur & Focus Panel
 * Gaussian blur, radial/tilt-shift blur, sharpen, vignette
 */

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Circle, Focus, Sparkles, Eye, RefreshCw } from "lucide-react";

export interface BlurFocusState {
  blur: number;
  blurType: "gaussian" | "radial" | "tiltShift";
  radialCenterX: number;
  radialCenterY: number;
  radialRadius: number;
  tiltShiftPosition: number;
  tiltShiftFeather: number;
  sharpen: number;
  clarity: number;
  vignette: number;
  vignetteFeather: number;
  dehaze: number;
}

export const defaultBlurFocus: BlurFocusState = {
  blur: 0,
  blurType: "gaussian",
  radialCenterX: 50,
  radialCenterY: 50,
  radialRadius: 50,
  tiltShiftPosition: 50,
  tiltShiftFeather: 30,
  sharpen: 0,
  clarity: 0,
  vignette: 0,
  vignetteFeather: 50,
  dehaze: 0,
};

interface Props {
  state: BlurFocusState;
  onChange: (state: BlurFocusState) => void;
}

export function BlurFocusPanel({ state, onChange }: Props) {
  const update = <K extends keyof BlurFocusState>(key: K, value: BlurFocusState[K]) => {
    onChange({ ...state, [key]: value });
  };

  const reset = () => onChange(defaultBlurFocus);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Focus className="w-4 h-4" />
          Blur & Focus
        </Label>
        <Button variant="ghost" size="sm" onClick={reset} className="gap-1">
          <RefreshCw className="w-3 h-3" />
          Reset
        </Button>
      </div>

      {/* Blur Type Selection */}
      <div className="space-y-2">
        <Label className="text-xs">Blur Type</Label>
        <div className="flex gap-2">
          {(["gaussian", "radial", "tiltShift"] as const).map(type => (
            <Button
              key={type}
              variant={state.blurType === type ? "default" : "outline"}
              size="sm"
              onClick={() => update("blurType", type)}
              className="flex-1 text-xs"
            >
              {type === "gaussian" && "Gaussian"}
              {type === "radial" && "Radial"}
              {type === "tiltShift" && "Tilt-Shift"}
            </Button>
          ))}
        </div>
      </div>

      {/* Blur Amount */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <Label className="text-xs flex items-center gap-1">
            <Circle className="w-3 h-3" />
            Blur Amount
          </Label>
          <span className="text-xs text-muted-foreground">{state.blur}px</span>
        </div>
        <Slider
          value={[state.blur]}
          onValueChange={([v]) => update("blur", v)}
          min={0}
          max={50}
          step={1}
        />
      </div>

      {/* Radial Blur Options */}
      {state.blurType === "radial" && state.blur > 0 && (
        <div className="space-y-2 p-2 bg-muted/30 rounded-lg">
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs">Center X</Label>
              <span className="text-xs text-muted-foreground">{state.radialCenterX}%</span>
            </div>
            <Slider
              value={[state.radialCenterX]}
              onValueChange={([v]) => update("radialCenterX", v)}
              min={0}
              max={100}
              step={1}
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs">Center Y</Label>
              <span className="text-xs text-muted-foreground">{state.radialCenterY}%</span>
            </div>
            <Slider
              value={[state.radialCenterY]}
              onValueChange={([v]) => update("radialCenterY", v)}
              min={0}
              max={100}
              step={1}
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs">Radius</Label>
              <span className="text-xs text-muted-foreground">{state.radialRadius}%</span>
            </div>
            <Slider
              value={[state.radialRadius]}
              onValueChange={([v]) => update("radialRadius", v)}
              min={10}
              max={100}
              step={1}
            />
          </div>
        </div>
      )}

      {/* Tilt-Shift Options */}
      {state.blurType === "tiltShift" && state.blur > 0 && (
        <div className="space-y-2 p-2 bg-muted/30 rounded-lg">
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs">Position</Label>
              <span className="text-xs text-muted-foreground">{state.tiltShiftPosition}%</span>
            </div>
            <Slider
              value={[state.tiltShiftPosition]}
              onValueChange={([v]) => update("tiltShiftPosition", v)}
              min={0}
              max={100}
              step={1}
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs">Feather</Label>
              <span className="text-xs text-muted-foreground">{state.tiltShiftFeather}%</span>
            </div>
            <Slider
              value={[state.tiltShiftFeather]}
              onValueChange={([v]) => update("tiltShiftFeather", v)}
              min={5}
              max={50}
              step={1}
            />
          </div>
        </div>
      )}

      {/* Sharpen */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <Label className="text-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Sharpen
          </Label>
          <span className="text-xs text-muted-foreground">{state.sharpen}</span>
        </div>
        <Slider
          value={[state.sharpen]}
          onValueChange={([v]) => update("sharpen", v)}
          min={0}
          max={100}
          step={1}
        />
      </div>

      {/* Clarity */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <Label className="text-xs flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Clarity
          </Label>
          <span className="text-xs text-muted-foreground">{state.clarity}</span>
        </div>
        <Slider
          value={[state.clarity]}
          onValueChange={([v]) => update("clarity", v)}
          min={-100}
          max={100}
          step={1}
        />
      </div>

      {/* Dehaze */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <Label className="text-xs">Dehaze</Label>
          <span className="text-xs text-muted-foreground">{state.dehaze}</span>
        </div>
        <Slider
          value={[state.dehaze]}
          onValueChange={([v]) => update("dehaze", v)}
          min={-100}
          max={100}
          step={1}
        />
      </div>

      {/* Vignette */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <Label className="text-xs">Vignette</Label>
          <span className="text-xs text-muted-foreground">{state.vignette}</span>
        </div>
        <Slider
          value={[state.vignette]}
          onValueChange={([v]) => update("vignette", v)}
          min={-100}
          max={100}
          step={1}
        />
      </div>
    </div>
  );
}
