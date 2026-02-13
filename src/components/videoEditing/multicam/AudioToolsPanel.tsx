/**
 * Audio Tools Panel
 * Volume control, fade in/out, mute, background music
 */

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Volume2, VolumeX, Music, Mic, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import type { AudioState } from "./AudioToolsPanel.model";
import { defaultAudioState } from "./AudioToolsPanel.model";

interface Props {
  state: AudioState;
  onChange: (state: AudioState) => void;
}

export function AudioToolsPanel({ state, onChange }: Props) {
  const update = <K extends keyof AudioState>(key: K, value: AudioState[K]) => {
    onChange({ ...state, [key]: value });
  };

  const reset = () => onChange(defaultAudioState);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          Audio
        </Label>
        <Button variant="ghost" size="sm" onClick={reset} className="gap-1 h-7">
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>

      {/* Main Volume */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] flex items-center gap-1">
            {state.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            Master Volume
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{state.volume}%</span>
            <Button
              variant={state.muted ? "destructive" : "outline"}
              size="sm"
              onClick={() => update("muted", !state.muted)}
              className="h-6 w-6 p-0"
            >
              {state.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </Button>
          </div>
        </div>
        <Slider
          value={[state.volume]}
          onValueChange={([v]) => update("volume", v)}
          min={0}
          max={150}
          step={1}
          disabled={state.muted}
        />
      </div>

      {/* Fade In/Out */}
      <div className="space-y-2 p-2 bg-muted/30 rounded-lg">
        <Label className="text-[10px]">Fades</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-[10px] flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Fade In
              </Label>
              <span className="text-[10px] text-muted-foreground">{state.fadeInDuration}s</span>
            </div>
            <Slider
              value={[state.fadeInDuration]}
              onValueChange={([v]) => update("fadeInDuration", v)}
              min={0}
              max={5}
              step={0.1}
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-[10px] flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                Fade Out
              </Label>
              <span className="text-[10px] text-muted-foreground">{state.fadeOutDuration}s</span>
            </div>
            <Slider
              value={[state.fadeOutDuration]}
              onValueChange={([v]) => update("fadeOutDuration", v)}
              min={0}
              max={5}
              step={0.1}
            />
          </div>
        </div>
      </div>

      {/* Background Music */}
      <div className="space-y-2 p-2 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] flex items-center gap-1">
            <Music className="w-3 h-3" />
            Background Music
          </Label>
          <Switch
            checked={state.enableBackgroundMusic}
            onCheckedChange={v => update("enableBackgroundMusic", v)}
          />
        </div>
        {state.enableBackgroundMusic && (
          <>
            <Slider
              value={[state.backgroundMusicVolume]}
              onValueChange={([v]) => update("backgroundMusicVolume", v)}
              min={0}
              max={100}
              step={1}
            />
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">Auto-Duck</Label>
              <Switch checked={state.ducking} onCheckedChange={v => update("ducking", v)} />
            </div>
            {state.ducking && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-[10px]">Duck Amount</Label>
                  <span className="text-[10px] text-muted-foreground">{state.duckingAmount}%</span>
                </div>
                <Slider
                  value={[state.duckingAmount]}
                  onValueChange={([v]) => update("duckingAmount", v)}
                  min={20}
                  max={100}
                  step={5}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Voice Over */}
      <div className="space-y-2 p-2 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] flex items-center gap-1">
            <Mic className="w-3 h-3" />
            Voice Over
          </Label>
          <Switch
            checked={state.enableVoiceOver}
            onCheckedChange={v => update("enableVoiceOver", v)}
          />
        </div>
        {state.enableVoiceOver && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-[10px]">Volume</Label>
              <span className="text-[10px] text-muted-foreground">{state.voiceOverVolume}%</span>
            </div>
            <Slider
              value={[state.voiceOverVolume]}
              onValueChange={([v]) => update("voiceOverVolume", v)}
              min={0}
              max={150}
              step={1}
            />
          </div>
        )}
      </div>

      {/* Processing */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[10px]">Normalize Audio</Label>
          <Switch checked={state.normalize} onCheckedChange={v => update("normalize", v)} />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <Label className="text-[10px]">Noise Reduction</Label>
            <span className="text-[10px] text-muted-foreground">{state.denoiseLevel}%</span>
          </div>
          <Slider
            value={[state.denoiseLevel]}
            onValueChange={([v]) => update("denoiseLevel", v)}
            min={0}
            max={100}
            step={5}
          />
        </div>
      </div>
    </div>
  );
}
