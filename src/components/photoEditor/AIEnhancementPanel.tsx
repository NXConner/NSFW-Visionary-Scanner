/**
 * AI Enhancement Panel
 * Style Transfer, Portrait Mode, Object Removal, Color Match
 */

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AIEnhancementState } from "./AIEnhancementPanel.model";
import { defaultAIEnhancement } from "./AIEnhancementPanel.model";
import {
  Wand2,
  Palette,
  User,
  Eraser,
  Pipette,
  Sparkles,
  RefreshCw,
  Loader2,
  Check,
  Image,
  Brush,
} from "lucide-react";

const STYLE_PRESETS = [
  { key: "oilPainting", label: "Oil Paint", icon: <Brush className="w-4 h-4" /> },
  { key: "watercolor", label: "Watercolor", icon: <Palette className="w-4 h-4" /> },
  { key: "sketch", label: "Sketch", icon: <Image className="w-4 h-4" /> },
  { key: "anime", label: "Anime", icon: <Sparkles className="w-4 h-4" /> },
  { key: "impressionist", label: "Impress.", icon: <Wand2 className="w-4 h-4" /> },
];

interface Props {
  state: AIEnhancementState;
  onChange: (state: AIEnhancementState) => void;
  isProcessing?: boolean;
  onApply?: () => void;
}

export function AIEnhancementPanel({ state, onChange, isProcessing, onApply }: Props) {
  const update = <K extends keyof AIEnhancementState>(key: K, value: AIEnhancementState[K]) => {
    onChange({ ...state, [key]: value });
  };

  const reset = () => onChange(defaultAIEnhancement);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          AI Enhancement
        </Label>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={reset} className="h-7 gap-1">
            <RefreshCw className="w-3 h-3" />
          </Button>
          {onApply && (
            <Button size="sm" onClick={onApply} disabled={isProcessing} className="h-7 gap-1">
              {isProcessing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              Apply
            </Button>
          )}
        </div>
      </div>

      {/* Auto Enhance */}
      <Card className="p-3 border-border/50">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Auto Enhance
          </Label>
          <Switch
            checked={state.autoEnhanceEnabled}
            onCheckedChange={v => update("autoEnhanceEnabled", v)}
          />
        </div>
        {state.autoEnhanceEnabled && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[10px]">Strength</span>
              <span className="text-[10px] text-muted-foreground">
                {state.autoEnhanceStrength}%
              </span>
            </div>
            <Slider
              value={[state.autoEnhanceStrength]}
              onValueChange={([v]) => update("autoEnhanceStrength", v)}
              min={10}
              max={100}
              step={5}
            />
          </div>
        )}
      </Card>

      {/* Style Transfer */}
      <Card className="p-3 border-border/50">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Style Transfer
          </Label>
          <Switch
            checked={state.styleTransferEnabled}
            onCheckedChange={v => update("styleTransferEnabled", v)}
          />
        </div>
        {state.styleTransferEnabled && (
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-1">
              {STYLE_PRESETS.map(style => (
                <Button
                  key={style.key}
                  variant={state.styleType === style.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => update("styleType", style.key as AIEnhancementState["styleType"])}
                  className="h-auto py-2 flex-col gap-0.5"
                >
                  {style.icon}
                  <span className="text-[8px]">{style.label}</span>
                </Button>
              ))}
            </div>
            {state.styleType && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[10px]">Intensity</span>
                  <span className="text-[10px] text-muted-foreground">{state.styleIntensity}%</span>
                </div>
                <Slider
                  value={[state.styleIntensity]}
                  onValueChange={([v]) => update("styleIntensity", v)}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Portrait Mode */}
      <Card className="p-3 border-border/50">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs flex items-center gap-2">
            <User className="w-4 h-4" />
            AI Portrait Mode
          </Label>
          <Switch
            checked={state.portraitModeEnabled}
            onCheckedChange={v => update("portraitModeEnabled", v)}
          />
        </div>
        {state.portraitModeEnabled && (
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px]">Background Blur</span>
                <span className="text-[10px] text-muted-foreground">{state.backgroundBlur}%</span>
              </div>
              <Slider
                value={[state.backgroundBlur]}
                onValueChange={([v]) => update("backgroundBlur", v)}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px]">Skin Smoothing</span>
                <span className="text-[10px] text-muted-foreground">{state.skinSmoothing}%</span>
              </div>
              <Slider
                value={[state.skinSmoothing]}
                onValueChange={([v]) => update("skinSmoothing", v)}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px]">Face Lighting</span>
                <span className="text-[10px] text-muted-foreground">{state.faceLighting}</span>
              </div>
              <Slider
                value={[state.faceLighting]}
                onValueChange={([v]) => update("faceLighting", v)}
                min={-50}
                max={50}
                step={5}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Background Controls */}
      <Card className="p-3 border-border/50">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs flex items-center gap-2">
            <Eraser className="w-4 h-4" />
            Background
          </Label>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px]">Remove Background</span>
            <Switch
              checked={state.removeBackground}
              onCheckedChange={v => update("removeBackground", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px]">Blur Background</span>
            <Switch
              checked={state.blurBackground}
              onCheckedChange={v => update("blurBackground", v)}
            />
          </div>
          {state.blurBackground && (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px]">Blur Amount</span>
                <span className="text-[10px] text-muted-foreground">
                  {state.backgroundBlurAmount}%
                </span>
              </div>
              <Slider
                value={[state.backgroundBlurAmount]}
                onValueChange={([v]) => update("backgroundBlurAmount", v)}
                min={10}
                max={100}
                step={5}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Color Match */}
      <Card className="p-3 border-border/50">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs flex items-center gap-2">
            <Pipette className="w-4 h-4" />
            AI Color Match
          </Label>
          <Switch
            checked={state.colorMatchEnabled}
            onCheckedChange={v => update("colorMatchEnabled", v)}
          />
        </div>
        {state.colorMatchEnabled && (
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full h-8 text-xs">
              Select Reference Image
            </Button>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px]">Match Intensity</span>
                <span className="text-[10px] text-muted-foreground">{state.matchIntensity}%</span>
              </div>
              <Slider
                value={[state.matchIntensity]}
                onValueChange={([v]) => update("matchIntensity", v)}
                min={10}
                max={100}
                step={5}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Processing AI enhancement...</span>
        </div>
      )}
    </div>
  );
}
