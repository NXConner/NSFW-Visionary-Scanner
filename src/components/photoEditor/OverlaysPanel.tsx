/**
 * Overlays & Textures Panel
 * Light leaks, film grain, bokeh, dust/scratch overlays
 */

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Layers, Sun, Film, Sparkles, Circle, RefreshCw } from "lucide-react";

export interface OverlayState {
  filmGrain: number;
  grainSize: "fine" | "medium" | "coarse";
  lightLeak: string | null;
  lightLeakIntensity: number;
  bokeh: number;
  bokehSize: number;
  dustScratches: number;
  textureOverlay: string | null;
  textureOpacity: number;
  chromaAberration: number;
}

export const defaultOverlays: OverlayState = {
  filmGrain: 0,
  grainSize: "fine",
  lightLeak: null,
  lightLeakIntensity: 50,
  bokeh: 0,
  bokehSize: 50,
  dustScratches: 0,
  textureOverlay: null,
  textureOpacity: 30,
  chromaAberration: 0,
};

const LIGHT_LEAK_PRESETS = [
  { key: "warm", label: "Warm", color: "bg-gradient-to-br from-orange-500/50 to-yellow-500/30" },
  { key: "cool", label: "Cool", color: "bg-gradient-to-br from-blue-500/50 to-cyan-500/30" },
  { key: "sunset", label: "Sunset", color: "bg-gradient-to-br from-red-500/50 to-orange-500/30" },
  { key: "neon", label: "Neon", color: "bg-gradient-to-br from-pink-500/50 to-purple-500/30" },
  {
    key: "vintage",
    label: "Vintage",
    color: "bg-gradient-to-br from-amber-600/50 to-yellow-300/30",
  },
];

const TEXTURE_PRESETS = [
  { key: "paper", label: "Paper" },
  { key: "canvas", label: "Canvas" },
  { key: "film", label: "Film" },
  { key: "grunge", label: "Grunge" },
];

interface Props {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}

export function OverlaysPanel({ state, onChange }: Props) {
  const update = <K extends keyof OverlayState>(key: K, value: OverlayState[K]) => {
    onChange({ ...state, [key]: value });
  };

  const reset = () => onChange(defaultOverlays);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Overlays & Textures
        </Label>
        <Button variant="ghost" size="sm" onClick={reset} className="gap-1">
          <RefreshCw className="w-3 h-3" />
          Reset
        </Button>
      </div>

      {/* Film Grain */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs flex items-center gap-1">
            <Film className="w-3 h-3" />
            Film Grain
          </Label>
          <span className="text-xs text-muted-foreground">{state.filmGrain}%</span>
        </div>
        <Slider
          value={[state.filmGrain]}
          onValueChange={([v]) => update("filmGrain", v)}
          min={0}
          max={100}
          step={1}
        />
        {state.filmGrain > 0 && (
          <div className="flex gap-1">
            {(["fine", "medium", "coarse"] as const).map(size => (
              <Button
                key={size}
                variant={state.grainSize === size ? "default" : "outline"}
                size="sm"
                onClick={() => update("grainSize", size)}
                className="flex-1 text-xs capitalize"
              >
                {size}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Light Leaks */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1">
          <Sun className="w-3 h-3" />
          Light Leaks
        </Label>
        <div className="grid grid-cols-5 gap-1">
          {LIGHT_LEAK_PRESETS.map(preset => (
            <button
              key={preset.key}
              onClick={() =>
                update("lightLeak", state.lightLeak === preset.key ? null : preset.key)
              }
              type="button"
              className={`
                aspect-square rounded-md ${preset.color} border-2 transition-all
                ${state.lightLeak === preset.key ? "border-primary scale-105" : "border-transparent hover:border-border"}
              `}
              title={preset.label}
              aria-label={`Light leak ${preset.label}`}
              aria-pressed={state.lightLeak === preset.key}
            />
          ))}
        </div>
        {state.lightLeak && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs">Intensity</Label>
              <span className="text-xs text-muted-foreground">{state.lightLeakIntensity}%</span>
            </div>
            <Slider
              value={[state.lightLeakIntensity]}
              onValueChange={([v]) => update("lightLeakIntensity", v)}
              min={10}
              max={100}
              step={1}
            />
          </div>
        )}
      </div>

      {/* Bokeh */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs flex items-center gap-1">
            <Circle className="w-3 h-3" />
            Bokeh Overlay
          </Label>
          <span className="text-xs text-muted-foreground">{state.bokeh}%</span>
        </div>
        <Slider
          value={[state.bokeh]}
          onValueChange={([v]) => update("bokeh", v)}
          min={0}
          max={100}
          step={1}
        />
        {state.bokeh > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs">Size</Label>
              <span className="text-xs text-muted-foreground">{state.bokehSize}%</span>
            </div>
            <Slider
              value={[state.bokehSize]}
              onValueChange={([v]) => update("bokehSize", v)}
              min={20}
              max={100}
              step={1}
            />
          </div>
        )}
      </div>

      {/* Dust & Scratches */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <Label className="text-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Dust & Scratches
          </Label>
          <span className="text-xs text-muted-foreground">{state.dustScratches}%</span>
        </div>
        <Slider
          value={[state.dustScratches]}
          onValueChange={([v]) => update("dustScratches", v)}
          min={0}
          max={100}
          step={1}
        />
      </div>

      {/* Chromatic Aberration */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <Label className="text-xs">Chromatic Aberration</Label>
          <span className="text-xs text-muted-foreground">{state.chromaAberration}px</span>
        </div>
        <Slider
          value={[state.chromaAberration]}
          onValueChange={([v]) => update("chromaAberration", v)}
          min={0}
          max={10}
          step={0.5}
        />
      </div>

      {/* Texture Overlays */}
      <div className="space-y-2">
        <Label className="text-xs">Texture Overlay</Label>
        <div className="grid grid-cols-4 gap-1">
          {TEXTURE_PRESETS.map(preset => (
            <Button
              key={preset.key}
              variant={state.textureOverlay === preset.key ? "default" : "outline"}
              size="sm"
              onClick={() =>
                update("textureOverlay", state.textureOverlay === preset.key ? null : preset.key)
              }
              className="text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>
        {state.textureOverlay && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs">Opacity</Label>
              <span className="text-xs text-muted-foreground">{state.textureOpacity}%</span>
            </div>
            <Slider
              value={[state.textureOpacity]}
              onValueChange={([v]) => update("textureOpacity", v)}
              min={5}
              max={100}
              step={1}
            />
          </div>
        )}
      </div>
    </div>
  );
}
