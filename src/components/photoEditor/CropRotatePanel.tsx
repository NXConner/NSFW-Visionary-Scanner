/**
 * Crop & Rotate Panel
 * Free crop, aspect ratio presets, rotation, flip
 */

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Crop,
  FlipHorizontal,
  FlipVertical,
  RectangleHorizontal,
  RotateCcw,
  RotateCw,
  Square,
  Smartphone,
  Monitor,
} from "lucide-react";

export interface CropRotateState {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  aspectRatio: string | null; // "free" | "1:1" | "4:3" | "16:9" | "9:16" | "3:2"
  cropRect: { x: number; y: number; w: number; h: number } | null;
}

const ASPECT_PRESETS = [
  { key: "free", label: "Free", icon: <Crop className="w-4 h-4" /> },
  { key: "1:1", label: "1:1", icon: <Square className="w-4 h-4" /> },
  { key: "4:3", label: "4:3", icon: <RectangleHorizontal className="w-4 h-4" /> },
  { key: "16:9", label: "16:9", icon: <Monitor className="w-4 h-4" /> },
  { key: "9:16", label: "9:16", icon: <Smartphone className="w-4 h-4" /> },
  { key: "3:2", label: "3:2", icon: <RectangleHorizontal className="w-4 h-4" /> },
];

interface Props {
  state: CropRotateState;
  onChange: (state: CropRotateState) => void;
}

export function CropRotatePanel({ state, onChange }: Props) {
  const handleRotate = (delta: number) => {
    onChange({ ...state, rotation: (state.rotation + delta + 360) % 360 });
  };

  const handleFineTune = (value: number[]) => {
    onChange({ ...state, rotation: value[0] });
  };

  const toggleFlipH = () => onChange({ ...state, flipH: !state.flipH });
  const toggleFlipV = () => onChange({ ...state, flipV: !state.flipV });

  const setAspect = (key: string) => {
    onChange({ ...state, aspectRatio: key === state.aspectRatio ? null : key });
  };

  return (
    <div className="space-y-4">
      {/* Rotation Controls */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm">
          <RotateCw className="w-4 h-4" />
          Rotation
        </Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleRotate(-90)}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Slider
            value={[state.rotation]}
            onValueChange={handleFineTune}
            min={0}
            max={360}
            step={1}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleRotate(90)}
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground text-center">
          {state.rotation}°
        </div>
      </div>

      {/* Flip Controls */}
      <div className="space-y-2">
        <Label className="text-sm">Flip</Label>
        <div className="flex gap-2">
          <Button
            variant={state.flipH ? "default" : "outline"}
            size="sm"
            onClick={toggleFlipH}
            className="flex-1 gap-2"
          >
            <FlipHorizontal className="w-4 h-4" />
            Horizontal
          </Button>
          <Button
            variant={state.flipV ? "default" : "outline"}
            size="sm"
            onClick={toggleFlipV}
            className="flex-1 gap-2"
          >
            <FlipVertical className="w-4 h-4" />
            Vertical
          </Button>
        </div>
      </div>

      {/* Aspect Ratio Presets */}
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-2">
          <Crop className="w-4 h-4" />
          Aspect Ratio
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_PRESETS.map(preset => (
            <Button
              key={preset.key}
              variant={state.aspectRatio === preset.key ? "default" : "outline"}
              size="sm"
              onClick={() => setAspect(preset.key)}
              className="gap-1"
            >
              {preset.icon}
              <span className="text-xs">{preset.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
