/**
 * Color Grading Panel
 * HSL sliders, white balance, split toning, highlights/shadows
 */

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Droplets, Sun, Moon, Palette } from "lucide-react";

export interface ColorGradingState {
  hue: number;
  saturation: number;
  luminance: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  vibrance: number;
  splitToneHighlightsHue: number;
  splitToneShadowsHue: number;
  splitToneBalance: number;
}

export const defaultColorGrading: ColorGradingState = {
  hue: 0,
  saturation: 0,
  luminance: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  vibrance: 0,
  splitToneHighlightsHue: 30,
  splitToneShadowsHue: 220,
  splitToneBalance: 0,
};

interface Props {
  state: ColorGradingState;
  onChange: (state: ColorGradingState) => void;
}

export function ColorGradingPanel({ state, onChange }: Props) {
  const update = <K extends keyof ColorGradingState>(key: K, value: ColorGradingState[K]) => {
    onChange({ ...state, [key]: value });
  };

  const reset = () => onChange(defaultColorGrading);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Color Grading
        </Label>
        <Button variant="ghost" size="sm" onClick={reset} className="gap-1">
          <RefreshCw className="w-3 h-3" />
          Reset
        </Button>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
          <TabsTrigger value="tone" className="text-xs">Tone</TabsTrigger>
          <TabsTrigger value="split" className="text-xs">Split</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-3 mt-3">
          {/* Temperature */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs flex items-center gap-1">
                <Droplets className="w-3 h-3" />
                Temperature
              </Label>
              <span className="text-xs text-muted-foreground">{state.temperature}</span>
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
              <Label className="text-xs">Tint</Label>
              <span className="text-xs text-muted-foreground">{state.tint}</span>
            </div>
            <Slider
              value={[state.tint]}
              onValueChange={([v]) => update("tint", v)}
              min={-100}
              max={100}
              step={1}
            />
          </div>

          {/* Vibrance */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs">Vibrance</Label>
              <span className="text-xs text-muted-foreground">{state.vibrance}</span>
            </div>
            <Slider
              value={[state.vibrance]}
              onValueChange={([v]) => update("vibrance", v)}
              min={-100}
              max={100}
              step={1}
            />
          </div>

          {/* HSL */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs">Hue Shift</Label>
              <span className="text-xs text-muted-foreground">{state.hue}°</span>
            </div>
            <Slider
              value={[state.hue]}
              onValueChange={([v]) => update("hue", v)}
              min={-180}
              max={180}
              step={1}
            />
          </div>
        </TabsContent>

        <TabsContent value="tone" className="space-y-3 mt-3">
          {/* Highlights */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs flex items-center gap-1">
                <Sun className="w-3 h-3" />
                Highlights
              </Label>
              <span className="text-xs text-muted-foreground">{state.highlights}</span>
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
              <Label className="text-xs flex items-center gap-1">
                <Moon className="w-3 h-3" />
                Shadows
              </Label>
              <span className="text-xs text-muted-foreground">{state.shadows}</span>
            </div>
            <Slider
              value={[state.shadows]}
              onValueChange={([v]) => update("shadows", v)}
              min={-100}
              max={100}
              step={1}
            />
          </div>

          {/* Whites */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs">Whites</Label>
              <span className="text-xs text-muted-foreground">{state.whites}</span>
            </div>
            <Slider
              value={[state.whites]}
              onValueChange={([v]) => update("whites", v)}
              min={-100}
              max={100}
              step={1}
            />
          </div>

          {/* Blacks */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs">Blacks</Label>
              <span className="text-xs text-muted-foreground">{state.blacks}</span>
            </div>
            <Slider
              value={[state.blacks]}
              onValueChange={([v]) => update("blacks", v)}
              min={-100}
              max={100}
              step={1}
            />
          </div>
        </TabsContent>

        <TabsContent value="split" className="space-y-3 mt-3">
          {/* Split Tone Highlights */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs">Highlights Hue</Label>
              <span className="text-xs text-muted-foreground">{state.splitToneHighlightsHue}°</span>
            </div>
            <Slider
              value={[state.splitToneHighlightsHue]}
              onValueChange={([v]) => update("splitToneHighlightsHue", v)}
              min={0}
              max={360}
              step={1}
            />
          </div>

          {/* Split Tone Shadows */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs">Shadows Hue</Label>
              <span className="text-xs text-muted-foreground">{state.splitToneShadowsHue}°</span>
            </div>
            <Slider
              value={[state.splitToneShadowsHue]}
              onValueChange={([v]) => update("splitToneShadowsHue", v)}
              min={0}
              max={360}
              step={1}
            />
          </div>

          {/* Balance */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs">Balance</Label>
              <span className="text-xs text-muted-foreground">{state.splitToneBalance}</span>
            </div>
            <Slider
              value={[state.splitToneBalance]}
              onValueChange={([v]) => update("splitToneBalance", v)}
              min={-100}
              max={100}
              step={1}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
