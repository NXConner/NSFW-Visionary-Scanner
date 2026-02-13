/**
 * Video Adjustments Panel
 * Color adjustments, sharpness, HDR for video
 */

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sun,
  Moon,
  Contrast,
  Palette,
  RefreshCw,
  Sparkles,
  Eye,
} from "lucide-react";

export interface VideoAdjustmentsState {
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
  sharpness: number;
  hdr: boolean;
  hdrIntensity: number;
  blackAndWhite: boolean;
  bwIntensity: number;
}

export const defaultVideoAdjustments: VideoAdjustmentsState = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  sharpness: 0,
  hdr: false,
  hdrIntensity: 50,
  blackAndWhite: false,
  bwIntensity: 100,
};

interface Props {
  state: VideoAdjustmentsState;
  onChange: (state: VideoAdjustmentsState) => void;
}

export function VideoAdjustmentsPanel({ state, onChange }: Props) {
  const update = <K extends keyof VideoAdjustmentsState>(key: K, value: VideoAdjustmentsState[K]) => {
    onChange({ ...state, [key]: value });
  };

  const reset = () => onChange(defaultVideoAdjustments);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Adjustments
        </Label>
        <Button variant="ghost" size="sm" onClick={reset} className="gap-1 h-7">
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>

      <Tabs defaultValue="light" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-8">
          <TabsTrigger value="light" className="text-xs">Light</TabsTrigger>
          <TabsTrigger value="color" className="text-xs">Color</TabsTrigger>
          <TabsTrigger value="effects" className="text-xs">Effects</TabsTrigger>
        </TabsList>

        <TabsContent value="light" className="space-y-2 mt-2">
          {/* Brightness */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-[10px] flex items-center gap-1">
                <Sun className="w-3 h-3" />
                Brightness
              </Label>
              <span className="text-[10px] text-muted-foreground">{state.brightness}</span>
            </div>
            <Slider
              value={[state.brightness]}
              onValueChange={([v]) => update("brightness", v)}
              min={-100}
              max={100}
              step={1}
            />
          </div>

          {/* Contrast */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-[10px] flex items-center gap-1">
                <Contrast className="w-3 h-3" />
                Contrast
              </Label>
              <span className="text-[10px] text-muted-foreground">{state.contrast}</span>
            </div>
            <Slider
              value={[state.contrast]}
              onValueChange={([v]) => update("contrast", v)}
              min={-100}
              max={100}
              step={1}
            />
          </div>

          {/* Highlights */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-[10px]">Highlights</Label>
              <span className="text-[10px] text-muted-foreground">{state.highlights}</span>
            </div>
            <Slider
              value={[state.highlights]}
              onValueChange={([v]) => update("highlights", v)}
              min={-100}
              max={100}
              step={1}
            />
          </div>

          {/* Shadows */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-[10px] flex items-center gap-1">
                <Moon className="w-3 h-3" />
                Shadows
              </Label>
              <span className="text-[10px] text-muted-foreground">{state.shadows}</span>
            </div>
            <Slider
              value={[state.shadows]}
              onValueChange={([v]) => update("shadows", v)}
              min={-100}
              max={100}
              step={1}
            />
          </div>
        </TabsContent>

        <TabsContent value="color" className="space-y-2 mt-2">
          {/* Saturation */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-[10px]">Saturation</Label>
              <span className="text-[10px] text-muted-foreground">{state.saturation}</span>
            </div>
            <Slider
              value={[state.saturation]}
              onValueChange={([v]) => update("saturation", v)}
              min={-100}
              max={100}
              step={1}
            />
          </div>

          {/* Temperature */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-[10px]">Temperature</Label>
              <span className="text-[10px] text-muted-foreground">{state.temperature}</span>
            </div>
            <Slider
              value={[state.temperature]}
              onValueChange={([v]) => update("temperature", v)}
              min={-100}
              max={100}
              step={1}
            />
          </div>

          {/* Tint */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-[10px]">Tint</Label>
              <span className="text-[10px] text-muted-foreground">{state.tint}</span>
            </div>
            <Slider
              value={[state.tint]}
              onValueChange={([v]) => update("tint", v)}
              min={-100}
              max={100}
              step={1}
            />
          </div>
        </TabsContent>

        <TabsContent value="effects" className="space-y-2 mt-2">
          {/* Sharpness */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-[10px] flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Sharpness
              </Label>
              <span className="text-[10px] text-muted-foreground">{state.sharpness}</span>
            </div>
            <Slider
              value={[state.sharpness]}
              onValueChange={([v]) => update("sharpness", v)}
              min={0}
              max={100}
              step={1}
            />
          </div>

          {/* HDR */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] flex items-center gap-1">
                <Eye className="w-3 h-3" />
                HDR Effect
              </Label>
              <Button
                variant={state.hdr ? "default" : "outline"}
                size="sm"
                onClick={() => update("hdr", !state.hdr)}
                className="h-6 text-[10px]"
              >
                {state.hdr ? "On" : "Off"}
              </Button>
            </div>
            {state.hdr && (
              <Slider
                value={[state.hdrIntensity]}
                onValueChange={([v]) => update("hdrIntensity", v)}
                min={0}
                max={100}
                step={1}
              />
            )}
          </div>

          {/* B&W */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] flex items-center gap-1">
                <Moon className="w-3 h-3" />
                Black & White
              </Label>
              <Button
                variant={state.blackAndWhite ? "default" : "outline"}
                size="sm"
                onClick={() => update("blackAndWhite", !state.blackAndWhite)}
                className="h-6 text-[10px]"
              >
                {state.blackAndWhite ? "On" : "Off"}
              </Button>
            </div>
            {state.blackAndWhite && (
              <Slider
                value={[state.bwIntensity]}
                onValueChange={([v]) => update("bwIntensity", v)}
                min={0}
                max={100}
                step={1}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
