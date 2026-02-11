/**
 * useVoiceGuidance Hook
 * React hook for voice guidance control
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  VoiceGuidanceEngine,
  getVoiceGuidanceEngine,
  type VoiceGuidanceSettings,
  type SequenceState,
  type GuidanceEvent,
  type SequenceCondition,
  type SequenceType,
} from "@/lib/voiceGuidance";
import { useSettings } from "@/contexts/settings";

export interface UseVoiceGuidanceOptions {
  autoInitialize?: boolean;
  conditionChecker?: (condition: SequenceCondition) => Promise<boolean>;
  onSpeechStart?: (text: string) => void;
  onSpeechEnd?: (text: string) => void;
  onSequenceComplete?: (sequenceId: string) => void;
  onActionRequired?: (action: string, step: unknown) => void;
}

export interface UseVoiceGuidanceReturn {
  // State
  isEnabled: boolean;
  isSpeaking: boolean;
  isSequenceActive: boolean;
  sequenceState: SequenceState | null;
  settings: VoiceGuidanceSettings;

  // Controls
  speak: (text: string) => Promise<void>;
  speakPrompt: (promptId: string) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;

  // Sequence controls
  startSequence: (type: SequenceType) => Promise<void>;
  pauseSequence: () => void;
  resumeSequence: () => void;
  skipStep: () => void;
  stopSequence: () => void;
  advanceSequence: (success?: boolean) => void;

  // Settings
  updateSettings: (settings: Partial<VoiceGuidanceSettings>) => void;
  toggleEnabled: () => void;
  setVolume: (volume: number) => void;
  setSpeed: (speed: VoiceGuidanceSettings["speed"]) => void;
  setVoice: (voice: VoiceGuidanceSettings["voice"]) => void;
}

export function useVoiceGuidance(options: UseVoiceGuidanceOptions = {}): UseVoiceGuidanceReturn {
  const {
    autoInitialize = true,
    conditionChecker,
    onSpeechStart,
    onSpeechEnd,
    onSequenceComplete,
    onActionRequired,
  } = options;

  const { settings: appSettings, updateVoiceGuidance } = useSettings();

  const engineRef = useRef<VoiceGuidanceEngine | null>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSequenceActive, setIsSequenceActive] = useState(false);
  const [sequenceState, setSequenceState] = useState<SequenceState | null>(null);
  const [localSettings, setLocalSettings] = useState<VoiceGuidanceSettings>(() => ({
    enabled: appSettings.voiceGuidance?.enabled ?? true,
    speed: appSettings.voiceGuidance?.speed ?? "normal",
    voice: appSettings.voiceGuidance?.voice ?? "default",
    volume: appSettings.voiceGuidance?.volume ?? 80,
    announceSteps: appSettings.voiceGuidance?.announceSteps ?? true,
    announceMeasurements: appSettings.voiceGuidance?.announceMeasurements ?? true,
    announceErrors: appSettings.voiceGuidance?.announceErrors ?? true,
    useShortPrompts: false,
    soundEffectsEnabled: true,
  }));

  // Initialize engine
  useEffect(() => {
    if (autoInitialize) {
      engineRef.current = getVoiceGuidanceEngine(localSettings);

      if (conditionChecker) {
        engineRef.current.setConditionChecker(conditionChecker);
      }

      // Subscribe to events
      const unsubscribe = engineRef.current.subscribe((event: GuidanceEvent) => {
        switch (event.type) {
          case "speech_start":
            setIsSpeaking(true);
            onSpeechStart?.((event.data as { text: string }).text);
            break;

          case "speech_end":
            setIsSpeaking(false);
            onSpeechEnd?.((event.data as { text: string }).text);
            break;

          case "sequence_start":
            setIsSequenceActive(true);
            break;

          case "sequence_step":
            setSequenceState(engineRef.current?.getSequenceState() || null);
            break;

          case "sequence_complete":
            setIsSequenceActive(false);
            setSequenceState(null);
            onSequenceComplete?.((event.data as { sequence: string }).sequence);
            break;

          case "sequence_cancel":
            setIsSequenceActive(false);
            setSequenceState(null);
            break;

          case "action_required": {
            const actionData = event.data as {
              action: string;
              step: unknown;
            };
            onActionRequired?.(actionData.action, actionData.step);
            break;
          }

          case "sequence_pause":
          case "sequence_resume":
            setSequenceState(engineRef.current?.getSequenceState() || null);
            break;
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [
    autoInitialize,
    conditionChecker,
    onSpeechStart,
    onSpeechEnd,
    onSequenceComplete,
    onActionRequired,
  ]);

  // Sync settings with app settings
  useEffect(() => {
    if (appSettings.voiceGuidance && engineRef.current) {
      const newSettings: Partial<VoiceGuidanceSettings> = {
        enabled: appSettings.voiceGuidance.enabled,
        speed: appSettings.voiceGuidance.speed,
        voice: appSettings.voiceGuidance.voice,
        volume: appSettings.voiceGuidance.volume,
        announceSteps: appSettings.voiceGuidance.announceSteps,
        announceMeasurements: appSettings.voiceGuidance.announceMeasurements,
        announceErrors: appSettings.voiceGuidance.announceErrors,
      };
      engineRef.current.updateSettings(newSettings);
      setLocalSettings(prev => ({ ...prev, ...newSettings }));
    }
  }, [appSettings.voiceGuidance]);

  // Update condition checker when it changes
  useEffect(() => {
    if (engineRef.current && conditionChecker) {
      engineRef.current.setConditionChecker(conditionChecker);
    }
  }, [conditionChecker]);

  const speak = useCallback(async (text: string) => {
    await engineRef.current?.speak(text);
  }, []);

  const speakPrompt = useCallback(async (promptId: string) => {
    await engineRef.current?.speakPrompt(promptId);
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  const pause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  const startSequence = useCallback(async (type: SequenceType) => {
    await engineRef.current?.startSequence(type);
  }, []);

  const pauseSequence = useCallback(() => {
    engineRef.current?.pauseSequence();
  }, []);

  const resumeSequence = useCallback(() => {
    engineRef.current?.resumeSequence();
  }, []);

  const skipStep = useCallback(() => {
    engineRef.current?.skipStep();
  }, []);

  const stopSequence = useCallback(() => {
    engineRef.current?.stopSequence();
  }, []);

  const advanceSequence = useCallback((success: boolean = true) => {
    engineRef.current?.advanceSequence(success);
  }, []);

  const updateSettings = useCallback(
    (settings: Partial<VoiceGuidanceSettings>) => {
      engineRef.current?.updateSettings(settings);
      setLocalSettings(prev => ({ ...prev, ...settings }));

      // Persist to app settings
      updateVoiceGuidance({
        enabled: settings.enabled,
        speed: settings.speed,
        voice: settings.voice,
        volume: settings.volume,
        announceSteps: settings.announceSteps,
        announceMeasurements: settings.announceMeasurements,
        announceErrors: settings.announceErrors,
      });
    },
    [updateVoiceGuidance],
  );

  const toggleEnabled = useCallback(() => {
    const newEnabled = !localSettings.enabled;
    updateSettings({ enabled: newEnabled });
    if (!newEnabled) {
      stop();
      stopSequence();
    }
  }, [localSettings.enabled, updateSettings, stop, stopSequence]);

  const setVolume = useCallback(
    (volume: number) => {
      updateSettings({ volume: Math.max(0, Math.min(100, volume)) });
    },
    [updateSettings],
  );

  const setSpeed = useCallback(
    (speed: VoiceGuidanceSettings["speed"]) => {
      updateSettings({ speed });
    },
    [updateSettings],
  );

  const setVoice = useCallback(
    (voice: VoiceGuidanceSettings["voice"]) => {
      updateSettings({ voice });
    },
    [updateSettings],
  );

  return {
    // State
    isEnabled: localSettings.enabled,
    isSpeaking,
    isSequenceActive,
    sequenceState,
    settings: localSettings,

    // Controls
    speak,
    speakPrompt,
    stop,
    pause,
    resume,

    // Sequence controls
    startSequence,
    pauseSequence,
    resumeSequence,
    skipStep,
    stopSequence,
    advanceSequence,

    // Settings
    updateSettings,
    toggleEnabled,
    setVolume,
    setSpeed,
    setVoice,
  };
}

export default useVoiceGuidance;
