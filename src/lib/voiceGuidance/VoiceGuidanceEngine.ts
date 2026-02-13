/**
 * Voice Guidance Engine
 * Text-to-speech engine for scanning guidance
 */

import { getPrompt, type VoicePrompt, type PromptPriority } from "./scanningPrompts";
import {
  getSequence,
  getStep,
  getStepText,
  type GuidanceSequence,
  type SequenceStep,
  type SequenceType,
  type SequenceCondition,
} from "./guidanceSequences";
import { logger } from "@/lib/logger";

export type VoiceGuidanceSpeed = "slow" | "normal" | "fast";
export type VoiceGuidanceVoice = "default" | "male" | "female";

export interface VoiceGuidanceSettings {
  enabled: boolean;
  speed: VoiceGuidanceSpeed;
  voice: VoiceGuidanceVoice;
  volume: number; // 0-100
  announceSteps: boolean;
  announceMeasurements: boolean;
  announceErrors: boolean;
  useShortPrompts: boolean;
  soundEffectsEnabled: boolean;
}

export interface SpeechQueueItem {
  id: string;
  text: string;
  priority: PromptPriority;
  interruptible: boolean;
  soundEffect?: string;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface SequenceState {
  sequence: GuidanceSequence;
  currentStepIndex: number;
  currentStep: SequenceStep | null;
  isPaused: boolean;
  isCompleted: boolean;
  retryCount: Map<string, number>;
  startTime: number;
  conditionCheckInterval?: number;
}

export type GuidanceEventType =
  | "speech_start"
  | "speech_end"
  | "speech_error"
  | "sequence_start"
  | "sequence_step"
  | "sequence_pause"
  | "sequence_resume"
  | "sequence_complete"
  | "sequence_cancel"
  | "condition_check"
  | "action_required";

export interface GuidanceEvent {
  type: GuidanceEventType;
  data?: unknown;
}

export type GuidanceListener = (event: GuidanceEvent) => void;
export type ConditionChecker = (condition: SequenceCondition) => Promise<boolean>;

const DEFAULT_SETTINGS: VoiceGuidanceSettings = {
  enabled: true,
  speed: "normal",
  voice: "default",
  volume: 80,
  announceSteps: true,
  announceMeasurements: true,
  announceErrors: true,
  useShortPrompts: false,
  soundEffectsEnabled: true,
};

const SPEED_RATES: Record<VoiceGuidanceSpeed, number> = {
  slow: 0.8,
  normal: 1.0,
  fast: 1.3,
};

/**
 * Voice Guidance Engine Class
 */
export class VoiceGuidanceEngine {
  private settings: VoiceGuidanceSettings;
  private speechSynthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private speechQueue: SpeechQueueItem[] = [];
  private isSpeaking: boolean = false;
  private listeners: Set<GuidanceListener> = new Set();
  private sequenceState: SequenceState | null = null;
  private conditionChecker: ConditionChecker | null = null;
  private audioContext: AudioContext | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor(settings: Partial<VoiceGuidanceSettings> = {}) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.initializeSpeechSynthesis();
  }

  /**
   * Initialize speech synthesis
   */
  private initializeSpeechSynthesis(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.speechSynthesis = window.speechSynthesis;

      // Load voices
      const loadVoices = () => {
        this.availableVoices = this.speechSynthesis?.getVoices() || [];
      };

      loadVoices();
      this.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    }
  }

  /**
   * Subscribe to guidance events
   */
  subscribe(listener: GuidanceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: GuidanceEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<VoiceGuidanceSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Get current settings
   */
  getSettings(): VoiceGuidanceSettings {
    return { ...this.settings };
  }

  /**
   * Set condition checker for sequence evaluation
   */
  setConditionChecker(checker: ConditionChecker): void {
    this.conditionChecker = checker;
  }

  /**
   * Get preferred voice based on settings
   */
  private getVoice(): SpeechSynthesisVoice | null {
    if (this.availableVoices.length === 0) return null;

    const { voice } = this.settings;
    const lang = navigator.language || "en-US";

    // Filter voices by language
    const langVoices = this.availableVoices.filter(v => v.lang.startsWith(lang.split("-")[0]));
    const voicePool = langVoices.length > 0 ? langVoices : this.availableVoices;

    if (voice === "default") {
      return voicePool.find(v => v.default) || voicePool[0];
    }

    // Try to find matching voice gender
    const genderKeyword =
      voice === "male"
        ? ["male", "david", "james", "mark"]
        : ["female", "samantha", "zira", "karen"];
    const matchedVoice = voicePool.find(v =>
      genderKeyword.some(k => v.name.toLowerCase().includes(k)),
    );

    return matchedVoice || voicePool[0];
  }

  /**
   * Speak text
   */
  async speak(text: string, options: Partial<SpeechQueueItem> = {}): Promise<void> {
    if (!this.settings.enabled || !this.speechSynthesis) return;

    const item: SpeechQueueItem = {
      id: `speech_${Date.now()}`,
      text,
      priority: "medium",
      interruptible: true,
      ...options,
    };

    // Handle priority queue
    if (item.priority === "critical" || item.priority === "high") {
      // Check if current speech should be interrupted
      if (this.isSpeaking && this.currentUtterance) {
        const currentItem = this.speechQueue[0];
        if (currentItem?.interruptible) {
          this.stop();
        }
      }
      this.speechQueue.unshift(item);
    } else {
      this.speechQueue.push(item);
    }

    if (!this.isSpeaking) {
      this.processQueue();
    }
  }

  /**
   * Speak a prompt by ID
   */
  async speakPrompt(promptId: string, options: Partial<SpeechQueueItem> = {}): Promise<void> {
    const prompt = getPrompt(promptId);
    if (!prompt) {
      logger.warn("[voiceGuidance] prompt not found", { promptId });
      return;
    }

    const text = this.settings.useShortPrompts && prompt.shortText ? prompt.shortText : prompt.text;

    await this.speak(text, {
      priority: prompt.priority,
      interruptible: prompt.interruptible,
      soundEffect: prompt.soundEffect,
      ...options,
    });
  }

  /**
   * Process speech queue
   */
  private async processQueue(): Promise<void> {
    if (this.speechQueue.length === 0 || !this.speechSynthesis) {
      this.isSpeaking = false;
      return;
    }

    this.isSpeaking = true;
    const item = this.speechQueue.shift()!;

    // Play sound effect if enabled
    if (item.soundEffect && this.settings.soundEffectsEnabled) {
      this.playSoundEffect(item.soundEffect);
    }

    return new Promise(resolve => {
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.rate = SPEED_RATES[this.settings.speed];
      utterance.volume = this.settings.volume / 100;
      utterance.pitch = 1;

      const voice = this.getVoice();
      if (voice) utterance.voice = voice;

      utterance.onstart = () => {
        this.emit({ type: "speech_start", data: { text: item.text, id: item.id } });
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        this.emit({ type: "speech_end", data: { text: item.text, id: item.id } });
        item.onComplete?.();
        resolve();
        this.processQueue();
      };

      utterance.onerror = event => {
        this.currentUtterance = null;
        const error = new Error(`Speech error: ${event.error}`);
        this.emit({ type: "speech_error", data: { error, id: item.id } });
        item.onError?.(error);
        resolve();
        this.processQueue();
      };

      this.currentUtterance = utterance;
      this.speechSynthesis!.speak(utterance);
    });
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.speechQueue = [];
    this.isSpeaking = false;
  }

  /**
   * Pause speech
   */
  pause(): void {
    if (this.speechSynthesis && this.isSpeaking) {
      this.speechSynthesis.pause();
    }
  }

  /**
   * Resume speech
   */
  resume(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  isBusy(): boolean {
    return this.isSpeaking;
  }

  /**
   * Play sound effect
   */
  private playSoundEffect(effect: string): void {
    if (!this.settings.soundEffectsEnabled) return;

    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Different sound effects
      switch (effect) {
        case "success_ding":
          oscillator.frequency.value = 880;
          gainNode.gain.value = 0.1;
          oscillator.start();
          oscillator.stop(this.audioContext.currentTime + 0.15);
          break;

        case "countdown_beep":
          oscillator.frequency.value = 440;
          gainNode.gain.value = 0.08;
          oscillator.start();
          oscillator.stop(this.audioContext.currentTime + 0.1);
          break;

        case "error_buzz":
          oscillator.type = "sawtooth";
          oscillator.frequency.value = 200;
          gainNode.gain.value = 0.1;
          oscillator.start();
          oscillator.stop(this.audioContext.currentTime + 0.2);
          break;

        case "success_chime":
        case "success_fanfare":
          oscillator.frequency.value = 660;
          gainNode.gain.value = 0.1;
          oscillator.start();
          setTimeout(() => {
            oscillator.frequency.value = 880;
          }, 100);
          oscillator.stop(this.audioContext.currentTime + 0.3);
          break;

        case "shutter":
          oscillator.type = "square";
          oscillator.frequency.value = 100;
          gainNode.gain.value = 0.05;
          oscillator.start();
          oscillator.stop(this.audioContext.currentTime + 0.05);
          break;

        default:
          oscillator.frequency.value = 440;
          gainNode.gain.value = 0.05;
          oscillator.start();
          oscillator.stop(this.audioContext.currentTime + 0.1);
      }
    } catch (error) {
      logger.warn("[voiceGuidance] failed to play sound effect", { error });
    }
  }

  // ==================== SEQUENCE METHODS ====================

  /**
   * Start a guidance sequence
   */
  async startSequence(type: SequenceType): Promise<void> {
    const sequence = getSequence(type);
    if (!sequence) {
      throw new Error(`Sequence not found: ${type}`);
    }

    // Stop any existing sequence
    this.stopSequence();

    this.sequenceState = {
      sequence,
      currentStepIndex: 0,
      currentStep: sequence.steps[0] || null,
      isPaused: false,
      isCompleted: false,
      retryCount: new Map(),
      startTime: Date.now(),
    };

    this.emit({ type: "sequence_start", data: { sequence: type } });
    await this.executeCurrentStep();
  }

  /**
   * Execute current sequence step
   */
  private async executeCurrentStep(): Promise<void> {
    if (!this.sequenceState || this.sequenceState.isPaused || this.sequenceState.isCompleted) {
      return;
    }

    const { sequence, currentStepIndex } = this.sequenceState;
    const step = sequence.steps[currentStepIndex];

    if (!step) {
      this.completeSequence();
      return;
    }

    this.sequenceState.currentStep = step;
    this.emit({ type: "sequence_step", data: { step, index: currentStepIndex } });

    switch (step.type) {
      case "prompt":
      case "countdown":
      case "feedback":
        await this.executePromptStep(step);
        break;

      case "condition":
        await this.executeConditionStep(step);
        break;

      case "action":
        await this.executeActionStep(step);
        break;

      case "wait":
        await this.executeWaitStep(step);
        break;
    }
  }

  /**
   * Execute a prompt step
   */
  private async executePromptStep(step: SequenceStep): Promise<void> {
    const text = getStepText(step, this.settings.useShortPrompts);

    if (text) {
      if (step.promptId) {
        await this.speakPrompt(step.promptId);
      } else {
        await this.speak(text);
      }
    }

    if (step.duration) {
      await new Promise(resolve => setTimeout(resolve, step.duration));
    }

    this.advanceToStep(step.onSuccess);
  }

  /**
   * Execute a condition step
   */
  private async executeConditionStep(step: SequenceStep): Promise<void> {
    if (!step.condition || !this.conditionChecker) {
      this.advanceToStep(step.onSuccess);
      return;
    }

    const startTime = Date.now();
    const timeout = step.condition.timeout || 10000;

    const checkCondition = async (): Promise<void> => {
      if (!this.sequenceState || this.sequenceState.isPaused || this.sequenceState.isCompleted) {
        return;
      }

      this.emit({ type: "condition_check", data: { condition: step.condition } });

      try {
        const result = await this.conditionChecker!(step.condition!);

        if (result) {
          this.advanceToStep(step.onSuccess);
        } else if (Date.now() - startTime >= timeout) {
          this.advanceToStep(step.onTimeout || step.onFailure);
        } else {
          // Check again after a short delay
          setTimeout(() => checkCondition(), 500);
        }
      } catch (error) {
        this.advanceToStep(step.onFailure);
      }
    };

    await checkCondition();
  }

  /**
   * Execute an action step
   */
  private async executeActionStep(step: SequenceStep): Promise<void> {
    const text = getStepText(step, this.settings.useShortPrompts);
    if (text) {
      await this.speak(text);
    }

    this.emit({ type: "action_required", data: { action: step.metadata?.action, step } });

    // Wait for external action completion
    // The action handler should call advanceSequence() when done
  }

  /**
   * Execute a wait step
   */
  private async executeWaitStep(step: SequenceStep): Promise<void> {
    if (step.duration) {
      await new Promise(resolve => setTimeout(resolve, step.duration));
    }
    this.advanceToStep(step.onSuccess);
  }

  /**
   * Advance to a specific step
   */
  private advanceToStep(stepId?: string): void {
    if (!this.sequenceState) return;

    if (!stepId) {
      // Move to next step
      this.sequenceState.currentStepIndex++;
    } else {
      // Find step by ID
      const index = this.sequenceState.sequence.steps.findIndex(s => s.id === stepId);
      if (index !== -1) {
        this.sequenceState.currentStepIndex = index;
      } else {
        this.sequenceState.currentStepIndex++;
      }
    }

    this.executeCurrentStep();
  }

  /**
   * Manually advance sequence (for action steps)
   */
  advanceSequence(success: boolean = true): void {
    if (!this.sequenceState?.currentStep) return;

    const step = this.sequenceState.currentStep;
    this.advanceToStep(success ? step.onSuccess : step.onFailure);
  }

  /**
   * Pause sequence
   */
  pauseSequence(): void {
    if (this.sequenceState && this.sequenceState.sequence.allowPause) {
      this.sequenceState.isPaused = true;
      this.pause();
      this.emit({ type: "sequence_pause" });
    }
  }

  /**
   * Resume sequence
   */
  resumeSequence(): void {
    if (this.sequenceState && this.sequenceState.isPaused) {
      this.sequenceState.isPaused = false;
      this.resume();
      this.emit({ type: "sequence_resume" });
      this.executeCurrentStep();
    }
  }

  /**
   * Skip to next step (if allowed)
   */
  skipStep(): void {
    if (this.sequenceState && this.sequenceState.sequence.allowSkip) {
      this.stop();
      this.advanceToStep();
    }
  }

  /**
   * Stop/cancel sequence
   */
  stopSequence(): void {
    if (this.sequenceState) {
      this.emit({ type: "sequence_cancel" });
      this.sequenceState = null;
    }
    this.stop();
  }

  /**
   * Complete sequence
   */
  private completeSequence(): void {
    if (this.sequenceState) {
      this.sequenceState.isCompleted = true;
      this.emit({ type: "sequence_complete", data: { sequence: this.sequenceState.sequence.id } });
      this.sequenceState = null;
    }
  }

  /**
   * Get current sequence state
   */
  getSequenceState(): SequenceState | null {
    return this.sequenceState ? { ...this.sequenceState } : null;
  }

  /**
   * Check if sequence is active
   */
  isSequenceActive(): boolean {
    return this.sequenceState !== null && !this.sequenceState.isCompleted;
  }

  /**
   * Dispose engine
   */
  dispose(): void {
    this.stop();
    this.stopSequence();
    this.listeners.clear();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
let engineInstance: VoiceGuidanceEngine | null = null;

export function getVoiceGuidanceEngine(
  settings?: Partial<VoiceGuidanceSettings>,
): VoiceGuidanceEngine {
  if (!engineInstance) {
    engineInstance = new VoiceGuidanceEngine(settings);
  } else if (settings) {
    engineInstance.updateSettings(settings);
  }
  return engineInstance;
}
