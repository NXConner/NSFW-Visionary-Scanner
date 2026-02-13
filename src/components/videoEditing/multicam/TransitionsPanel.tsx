/**
 * Transitions Panel
 * Crossfade, wipe, zoom, glitch transitions
 */

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Zap, ZoomIn, Layers, Square, MoveRight } from "lucide-react";

export interface TransitionConfig {
  type: "cut" | "crossfade" | "dipToBlack" | "wipe" | "zoom" | "glitch" | "slide";
  duration: number; // ms
  direction?: "left" | "right" | "up" | "down";
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut";
}

export const defaultTransition: TransitionConfig = {
  type: "cut",
  duration: 500,
  direction: "right",
  easing: "easeInOut",
};

const TRANSITION_TYPES = [
  { key: "cut", label: "Cut", icon: <Square className="w-4 h-4" />, desc: "Instant switch" },
  {
    key: "crossfade",
    label: "Crossfade",
    icon: <Layers className="w-4 h-4" />,
    desc: "Smooth blend",
  },
  {
    key: "dipToBlack",
    label: "Dip to Black",
    icon: <Square className="w-4 h-4" />,
    desc: "Fade through black",
  },
  {
    key: "wipe",
    label: "Wipe",
    icon: <MoveRight className="w-4 h-4" />,
    desc: "Directional reveal",
  },
  { key: "zoom", label: "Zoom", icon: <ZoomIn className="w-4 h-4" />, desc: "Zoom transition" },
  { key: "glitch", label: "Glitch", icon: <Zap className="w-4 h-4" />, desc: "Digital distortion" },
  {
    key: "slide",
    label: "Slide",
    icon: <ArrowRightLeft className="w-4 h-4" />,
    desc: "Slide in/out",
  },
];

const DURATION_PRESETS = [
  { value: 250, label: "0.25s" },
  { value: 500, label: "0.5s" },
  { value: 1000, label: "1s" },
  { value: 2000, label: "2s" },
];

interface Props {
  transition: TransitionConfig;
  onChange: (config: TransitionConfig) => void;
}

export function TransitionsPanel({ transition, onChange }: Props) {
  const update = <K extends keyof TransitionConfig>(key: K, value: TransitionConfig[K]) => {
    onChange({ ...transition, [key]: value });
  };

  const showDirectionControl = ["wipe", "slide"].includes(transition.type);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        <ArrowRightLeft className="w-4 h-4" />
        Transitions
      </Label>

      {/* Transition Types */}
      <div className="grid grid-cols-2 gap-1.5">
        {TRANSITION_TYPES.map(t => (
          <Button
            key={t.key}
            variant={transition.type === t.key ? "default" : "outline"}
            size="sm"
            onClick={() => update("type", t.key as TransitionConfig["type"])}
            className="h-auto py-2 flex-col gap-0.5"
          >
            {t.icon}
            <span className="text-[10px]">{t.label}</span>
          </Button>
        ))}
      </div>

      {/* Duration */}
      {transition.type !== "cut" && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-[10px]">Duration</Label>
            <span className="text-[10px] text-muted-foreground">{transition.duration}ms</span>
          </div>
          <div className="flex gap-1">
            {DURATION_PRESETS.map(p => (
              <Button
                key={p.value}
                variant={transition.duration === p.value ? "default" : "outline"}
                size="sm"
                onClick={() => update("duration", p.value)}
                className="flex-1 h-7 text-[10px]"
              >
                {p.label}
              </Button>
            ))}
          </div>
          <Slider
            value={[transition.duration]}
            onValueChange={([v]) => update("duration", v)}
            min={100}
            max={3000}
            step={50}
          />
        </div>
      )}

      {/* Direction */}
      {showDirectionControl && (
        <div className="space-y-2">
          <Label className="text-[10px]">Direction</Label>
          <div className="grid grid-cols-4 gap-1">
            {(["left", "right", "up", "down"] as const).map(dir => (
              <Button
                key={dir}
                variant={transition.direction === dir ? "default" : "outline"}
                size="sm"
                onClick={() => update("direction", dir)}
                className="h-7 text-[10px] capitalize"
              >
                {dir}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Easing */}
      {transition.type !== "cut" && (
        <div className="space-y-2">
          <Label className="text-[10px]">Easing</Label>
          <div className="grid grid-cols-4 gap-1">
            {(["linear", "easeIn", "easeOut", "easeInOut"] as const).map(ease => (
              <Button
                key={ease}
                variant={transition.easing === ease ? "default" : "outline"}
                size="sm"
                onClick={() => update("easing", ease)}
                className="h-7 text-[10px]"
              >
                {ease === "easeInOut" ? "InOut" : ease.replace("ease", "")}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Preview Badge */}
      <div className="flex justify-center pt-2">
        <Badge variant="secondary" className="text-[10px]">
          {TRANSITION_TYPES.find(t => t.key === transition.type)?.desc}
        </Badge>
      </div>
    </div>
  );
}
