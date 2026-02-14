/**
 * Presets & Filters Panel
 * Quick presets including B&W, HDR, Vintage, etc.
 */

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Palette, Sun, Moon, Contrast, Camera, Sparkles } from "lucide-react";
import type { PresetFilter, PresetState } from "./PresetsFiltersPanel.model";
import { defaultPresetState } from "./PresetsFiltersPanel.model";

const PRESET_FILTERS: PresetFilter[] = [
  // Basic
  { key: "blackAndWhite", label: "B&W", icon: <Moon className="w-4 h-4" />, category: "basic" },
  { key: "hdr", label: "HDR", icon: <Sun className="w-4 h-4" />, category: "basic" },
  {
    key: "highContrast",
    label: "High Contrast",
    icon: <Contrast className="w-4 h-4" />,
    category: "basic",
  },
  {
    key: "lowContrast",
    label: "Low Contrast",
    icon: <Contrast className="w-4 h-4" />,
    category: "basic",
  },
  // Artistic
  { key: "vintage", label: "Vintage", icon: <Camera className="w-4 h-4" />, category: "artistic" },
  { key: "sepia", label: "Sepia", icon: <Palette className="w-4 h-4" />, category: "artistic" },
  {
    key: "polaroid",
    label: "Polaroid",
    icon: <Camera className="w-4 h-4" />,
    category: "artistic",
  },
  { key: "filmNoir", label: "Film Noir", icon: <Moon className="w-4 h-4" />, category: "artistic" },
  // Mood
  { key: "warm", label: "Warm", icon: <Sun className="w-4 h-4" />, category: "mood" },
  { key: "cool", label: "Cool", icon: <Sparkles className="w-4 h-4" />, category: "mood" },
  { key: "dramatic", label: "Dramatic", icon: <Contrast className="w-4 h-4" />, category: "mood" },
  { key: "fade", label: "Fade", icon: <Palette className="w-4 h-4" />, category: "mood" },
];

interface Props {
  state: PresetState;
  onChange: (state: PresetState) => void;
}

export function PresetsFiltersPanel({ state, onChange }: Props) {
  const selectPreset = (key: string) => {
    onChange({
      ...state,
      activePreset: state.activePreset === key ? null : key,
    });
  };

  const categories = {
    basic: PRESET_FILTERS.filter(f => f.category === "basic"),
    artistic: PRESET_FILTERS.filter(f => f.category === "artistic"),
    mood: PRESET_FILTERS.filter(f => f.category === "mood"),
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Palette className="w-4 h-4" />
        Quick Presets
      </Label>

      {/* Basic */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Basic</Label>
        <div className="grid grid-cols-2 gap-2">
          {categories.basic.map(filter => (
            <Button
              key={filter.key}
              variant={state.activePreset === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => selectPreset(filter.key)}
              className="gap-2"
            >
              {filter.icon}
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Artistic */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Artistic</Label>
        <div className="grid grid-cols-2 gap-2">
          {categories.artistic.map(filter => (
            <Button
              key={filter.key}
              variant={state.activePreset === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => selectPreset(filter.key)}
              className="gap-2"
            >
              {filter.icon}
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Mood</Label>
        <div className="grid grid-cols-2 gap-2">
          {categories.mood.map(filter => (
            <Button
              key={filter.key}
              variant={state.activePreset === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => selectPreset(filter.key)}
              className="gap-2"
            >
              {filter.icon}
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Intensity Slider */}
      {state.activePreset && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex justify-between">
            <Label className="text-xs">Intensity</Label>
            <span className="text-xs text-muted-foreground">{state.intensity}%</span>
          </div>
          <Slider
            value={[state.intensity]}
            onValueChange={([v]) => onChange({ ...state, intensity: v })}
            min={0}
            max={100}
            step={1}
          />
        </div>
      )}
    </div>
  );
}
