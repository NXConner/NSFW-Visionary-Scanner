/**
 * Voice Guidance Controls
 * UI toggle and settings for voice guidance
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  Square,
  Settings,
  Mic,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useVoiceGuidance } from "@/hooks/useVoiceGuidance";
import type { VoiceGuidanceSettings } from "@/lib/voiceGuidance";

export interface VoiceGuidanceControlsProps {
  className?: string;
  compact?: boolean;
  showSequenceControls?: boolean;
  onStartGuidedScan?: () => void;
}

const speedOptions: { value: VoiceGuidanceSettings["speed"]; label: string }[] = [
  { value: "slow", label: "Slow" },
  { value: "normal", label: "Normal" },
  { value: "fast", label: "Fast" },
];

const voiceOptions: { value: VoiceGuidanceSettings["voice"]; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export function VoiceGuidanceControls({
  className,
  compact = false,
  showSequenceControls = true,
  onStartGuidedScan,
}: VoiceGuidanceControlsProps) {
  const {
    isEnabled,
    isSpeaking,
    isSequenceActive,
    sequenceState,
    settings,
    toggleEnabled,
    setVolume,
    setSpeed,
    setVoice,
    updateSettings,
    startSequence,
    pauseSequence,
    resumeSequence,
    skipStep,
    stopSequence,
    speakPrompt,
  } = useVoiceGuidance();

  const [showSettings, setShowSettings] = useState(false);

  const handleToggle = () => {
    toggleEnabled();
  };

  const handleTestVoice = () => {
    speakPrompt("inst_welcome");
  };

  const handleStartGuidedScan = async () => {
    await startSequence("initial_scan");
    onStartGuidedScan?.();
  };

  const handleStartQuickScan = async () => {
    await startSequence("quick_scan");
  };

  const handleStartTutorial = async () => {
    await startSequence("tutorial");
  };

  // Compact mode - just a toggle button with popover
  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={isEnabled ? "default" : "ghost"}
            size="icon"
            className={cn("relative", isSpeaking && "animate-pulse", className)}
          >
            {isEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {isSequenceActive && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Voice Guidance</Label>
              <Switch checked={isEnabled} onCheckedChange={handleToggle} />
            </div>

            {isEnabled && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Volume</Label>
                  <div className="flex items-center gap-2">
                    <VolumeX className="h-3 w-3 text-muted-foreground" />
                    <Slider
                      value={[settings.volume]}
                      onValueChange={([val]) => setVolume(val)}
                      min={0}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <Volume2 className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleTestVoice}
                  disabled={isSpeaking}
                >
                  <Mic className="h-3 w-3 mr-2" />
                  Test Voice
                </Button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Full mode with all controls
  return (
    <div className={cn("bg-background rounded-lg border p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isEnabled ? (
            <Volume2 className="h-5 w-5 text-primary" />
          ) : (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          )}
          <h3 className="font-semibold">Voice Guidance</h3>
          {isSpeaking && (
            <Badge variant="secondary" className="animate-pulse">
              Speaking...
            </Badge>
          )}
        </div>
        <Switch checked={isEnabled} onCheckedChange={handleToggle} />
      </div>

      <AnimatePresence>
        {isEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Volume Control */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <Label className="text-sm">Volume</Label>
                <span className="text-sm text-muted-foreground">{settings.volume}%</span>
              </div>
              <div className="flex items-center gap-2">
                <VolumeX className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[settings.volume]}
                  onValueChange={([val]) => setVolume(val)}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Speed and Voice */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-sm">Speed</Label>
                <Select
                  value={settings.speed}
                  onValueChange={val => setSpeed(val as VoiceGuidanceSettings["speed"])}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {speedOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Voice</Label>
                <Select
                  value={settings.voice}
                  onValueChange={val => setVoice(val as VoiceGuidanceSettings["voice"])}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Announcement Settings */}
            <div className="space-y-3 mb-4 border rounded-md p-3">
              <Label className="text-sm font-medium">Announcements</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Steps</Label>
                  <Switch
                    checked={settings.announceSteps}
                    onCheckedChange={val => updateSettings({ announceSteps: val })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Measurements</Label>
                  <Switch
                    checked={settings.announceMeasurements}
                    onCheckedChange={val => updateSettings({ announceMeasurements: val })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Errors</Label>
                  <Switch
                    checked={settings.announceErrors}
                    onCheckedChange={val => updateSettings({ announceErrors: val })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Sound Effects</Label>
                  <Switch
                    checked={settings.soundEffectsEnabled}
                    onCheckedChange={val => updateSettings({ soundEffectsEnabled: val })}
                  />
                </div>
              </div>
            </div>

            {/* Sequence Controls */}
            {showSequenceControls && (
              <div className="space-y-3">
                {!isSequenceActive ? (
                  // Start options
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="default" size="sm" onClick={handleStartGuidedScan}>
                      <Play className="h-3 w-3 mr-1" />
                      Guided Scan
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleStartQuickScan}>
                      Quick Scan
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleStartTutorial}
                      className="col-span-2"
                    >
                      Start Tutorial
                    </Button>
                  </div>
                ) : (
                  // Active sequence controls
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-normal">
                        {sequenceState?.sequence.name || "Active"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Step {(sequenceState?.currentStepIndex || 0) + 1} of{" "}
                        {sequenceState?.sequence.steps.length || 0}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${
                            (((sequenceState?.currentStepIndex || 0) + 1) /
                              (sequenceState?.sequence.steps.length || 1)) *
                            100
                          }%`,
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    {/* Current step text */}
                    {sequenceState?.currentStep && (
                      <div className="text-sm text-muted-foreground italic">
                        &ldquo;
                        {sequenceState.currentStep.customText || sequenceState.currentStep.promptId}
                        &rdquo;
                      </div>
                    )}

                    {/* Control buttons */}
                    <div className="flex items-center gap-2">
                      {sequenceState?.isPaused ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resumeSequence}
                          className="flex-1"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Resume
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={pauseSequence}
                          className="flex-1"
                          disabled={!sequenceState?.sequence.allowPause}
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={skipStep}
                        disabled={!sequenceState?.sequence.allowSkip}
                        title="Skip step"
                      >
                        <SkipForward className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={stopSequence}
                        title="Stop guidance"
                      >
                        <Square className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Test button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-4"
              onClick={handleTestVoice}
              disabled={isSpeaking}
            >
              <Mic className="h-3 w-3 mr-2" />
              Test Voice
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default VoiceGuidanceControls;
