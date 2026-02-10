/**
 * Guidance Sequences
 * Step-by-step voice guidance sequences for scanning workflow
 */

import type { VoicePrompt, PromptCategory } from './scanningPrompts';
import { getPrompt } from './scanningPrompts';

export type SequenceType = 
  | 'initial_scan'
  | 'quick_scan'
  | 'detailed_scan'
  | 'calibration'
  | 'tutorial'
  | 'measurement_review';

export type SequenceStepType = 
  | 'prompt'
  | 'wait'
  | 'condition'
  | 'action'
  | 'countdown'
  | 'feedback';

export interface SequenceCondition {
  type: 'position' | 'lighting' | 'stability' | 'quality' | 'time' | 'user_action';
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in_range';
  value: number | string | [number, number];
  timeout?: number; // Max time to wait for condition (ms)
}

export interface SequenceStep {
  id: string;
  type: SequenceStepType;
  promptId?: string; // Reference to VoicePrompt
  customText?: string; // Override text
  duration?: number; // Duration in ms
  condition?: SequenceCondition;
  onSuccess?: string; // Next step ID on success
  onFailure?: string; // Next step ID on failure
  onTimeout?: string; // Next step ID on timeout
  retryCount?: number;
  metadata?: Record<string, unknown>;
}

export interface GuidanceSequence {
  id: SequenceType;
  name: string;
  description: string;
  steps: SequenceStep[];
  totalEstimatedDuration: number; // Estimated total duration in ms
  allowSkip: boolean;
  allowPause: boolean;
}

/**
 * Initial Scan Sequence - Full guided scanning experience
 */
export const initialScanSequence: GuidanceSequence = {
  id: 'initial_scan',
  name: 'Guided Scan',
  description: 'Complete guided scanning with step-by-step instructions',
  allowSkip: true,
  allowPause: true,
  totalEstimatedDuration: 45000,
  steps: [
    {
      id: 'welcome',
      type: 'prompt',
      promptId: 'inst_welcome',
      onSuccess: 'prepare',
    },
    {
      id: 'prepare',
      type: 'prompt',
      promptId: 'inst_prepare',
      duration: 2000,
      onSuccess: 'check_lighting',
    },
    {
      id: 'check_lighting',
      type: 'condition',
      condition: {
        type: 'lighting',
        operator: 'in_range',
        value: [0.4, 0.9],
        timeout: 10000,
      },
      onSuccess: 'position_guide',
      onFailure: 'lighting_adjustment',
      onTimeout: 'lighting_timeout',
    },
    {
      id: 'lighting_adjustment',
      type: 'prompt',
      promptId: 'light_too_dark',
      onSuccess: 'check_lighting',
      retryCount: 3,
    },
    {
      id: 'lighting_timeout',
      type: 'prompt',
      customText: 'Proceeding with current lighting conditions',
      onSuccess: 'position_guide',
    },
    {
      id: 'position_guide',
      type: 'prompt',
      promptId: 'inst_position_guide',
      duration: 2000,
      onSuccess: 'check_position',
    },
    {
      id: 'check_position',
      type: 'condition',
      condition: {
        type: 'position',
        operator: 'eq',
        value: 'good',
        timeout: 15000,
      },
      onSuccess: 'check_stability',
      onFailure: 'position_feedback',
      onTimeout: 'position_retry',
    },
    {
      id: 'position_feedback',
      type: 'feedback',
      promptId: 'pos_center',
      onSuccess: 'check_position',
      retryCount: 5,
    },
    {
      id: 'position_retry',
      type: 'prompt',
      customText: 'Let me help you find the right position',
      onSuccess: 'check_position',
    },
    {
      id: 'check_stability',
      type: 'condition',
      condition: {
        type: 'stability',
        operator: 'gte',
        value: 0.8,
        timeout: 5000,
      },
      onSuccess: 'ready_prompt',
      onFailure: 'stability_guidance',
      onTimeout: 'stability_warning',
    },
    {
      id: 'stability_guidance',
      type: 'prompt',
      promptId: 'stab_hold_steady',
      onSuccess: 'check_stability',
    },
    {
      id: 'stability_warning',
      type: 'prompt',
      promptId: 'stab_too_shaky',
      onSuccess: 'check_stability',
      retryCount: 2,
    },
    {
      id: 'ready_prompt',
      type: 'prompt',
      promptId: 'cap_ready',
      duration: 1000,
      onSuccess: 'countdown_3',
    },
    {
      id: 'countdown_3',
      type: 'countdown',
      promptId: 'count_3',
      duration: 1000,
      onSuccess: 'countdown_2',
    },
    {
      id: 'countdown_2',
      type: 'countdown',
      promptId: 'count_2',
      duration: 1000,
      onSuccess: 'countdown_1',
    },
    {
      id: 'countdown_1',
      type: 'countdown',
      promptId: 'count_1',
      duration: 1000,
      onSuccess: 'capture',
    },
    {
      id: 'capture',
      type: 'action',
      promptId: 'cap_capturing',
      metadata: { action: 'capture' },
      onSuccess: 'processing',
    },
    {
      id: 'processing',
      type: 'prompt',
      promptId: 'cap_processing',
      duration: 2000,
      onSuccess: 'complete',
    },
    {
      id: 'complete',
      type: 'prompt',
      promptId: 'success_scan',
    },
  ],
};

/**
 * Quick Scan Sequence - Minimal guidance for experienced users
 */
export const quickScanSequence: GuidanceSequence = {
  id: 'quick_scan',
  name: 'Quick Scan',
  description: 'Fast scanning with minimal prompts',
  allowSkip: true,
  allowPause: false,
  totalEstimatedDuration: 8000,
  steps: [
    {
      id: 'ready_check',
      type: 'condition',
      condition: {
        type: 'quality',
        operator: 'gte',
        value: 0.7,
        timeout: 5000,
      },
      onSuccess: 'ready',
      onFailure: 'quality_warning',
    },
    {
      id: 'quality_warning',
      type: 'prompt',
      customText: 'Adjust position for better quality',
      onSuccess: 'ready_check',
    },
    {
      id: 'ready',
      type: 'prompt',
      promptId: 'cap_ready',
      duration: 500,
      onSuccess: 'capture',
    },
    {
      id: 'capture',
      type: 'action',
      promptId: 'cap_capturing',
      metadata: { action: 'capture' },
      onSuccess: 'complete',
    },
    {
      id: 'complete',
      type: 'prompt',
      promptId: 'cap_complete',
    },
  ],
};

/**
 * Tutorial Sequence - Comprehensive learning experience
 */
export const tutorialSequence: GuidanceSequence = {
  id: 'tutorial',
  name: 'Tutorial',
  description: 'Learn how to use the scanner with detailed guidance',
  allowSkip: true,
  allowPause: true,
  totalEstimatedDuration: 120000,
  steps: [
    {
      id: 'intro',
      type: 'prompt',
      customText: 'Welcome to the scanner tutorial. I will teach you how to capture accurate measurements.',
      duration: 3000,
      onSuccess: 'explain_lighting',
    },
    {
      id: 'explain_lighting',
      type: 'prompt',
      customText: 'First, let\'s talk about lighting. Good lighting is essential for accurate scans.',
      duration: 3000,
      onSuccess: 'lighting_demo',
    },
    {
      id: 'lighting_demo',
      type: 'prompt',
      customText: 'The indicator at the top shows your current lighting level. Green means good lighting.',
      duration: 3000,
      onSuccess: 'explain_position',
    },
    {
      id: 'explain_position',
      type: 'prompt',
      customText: 'Next, positioning. Keep the subject centered in the guide frame.',
      duration: 3000,
      onSuccess: 'position_demo',
    },
    {
      id: 'position_demo',
      type: 'prompt',
      customText: 'The green overlay shows the ideal position. Match it as closely as possible.',
      duration: 3000,
      onSuccess: 'explain_stability',
    },
    {
      id: 'explain_stability',
      type: 'prompt',
      customText: 'Finally, stability. Hold the camera steady for the best results.',
      duration: 3000,
      onSuccess: 'stability_demo',
    },
    {
      id: 'stability_demo',
      type: 'prompt',
      customText: 'Try bracing your arms against your body or a surface for extra stability.',
      duration: 3000,
      onSuccess: 'practice_prompt',
    },
    {
      id: 'practice_prompt',
      type: 'prompt',
      customText: 'Great! Now let\'s practice with a real scan. Follow my guidance.',
      duration: 2000,
      onSuccess: 'practice_scan',
    },
    {
      id: 'practice_scan',
      type: 'action',
      metadata: { action: 'start_guided_scan' },
      onSuccess: 'tutorial_complete',
    },
    {
      id: 'tutorial_complete',
      type: 'prompt',
      customText: 'Excellent work! You\'re now ready to use the scanner on your own.',
    },
  ],
};

/**
 * Calibration Sequence
 */
export const calibrationSequence: GuidanceSequence = {
  id: 'calibration',
  name: 'Calibration',
  description: 'Calibrate the scanner for accurate measurements',
  allowSkip: false,
  allowPause: true,
  totalEstimatedDuration: 30000,
  steps: [
    {
      id: 'cal_intro',
      type: 'prompt',
      customText: 'Let\'s calibrate your scanner. Please have a reference object ready.',
      duration: 2000,
      onSuccess: 'cal_reference',
    },
    {
      id: 'cal_reference',
      type: 'prompt',
      customText: 'Place the calibration reference in the frame.',
      duration: 2000,
      onSuccess: 'cal_detect',
    },
    {
      id: 'cal_detect',
      type: 'condition',
      condition: {
        type: 'user_action',
        operator: 'eq',
        value: 'reference_detected',
        timeout: 20000,
      },
      onSuccess: 'cal_capture',
      onFailure: 'cal_retry',
    },
    {
      id: 'cal_retry',
      type: 'prompt',
      customText: 'Reference not detected. Please try again.',
      onSuccess: 'cal_detect',
    },
    {
      id: 'cal_capture',
      type: 'action',
      customText: 'Capturing calibration reference',
      metadata: { action: 'calibrate' },
      onSuccess: 'cal_complete',
    },
    {
      id: 'cal_complete',
      type: 'prompt',
      customText: 'Calibration complete. Scanner is now ready for accurate measurements.',
    },
  ],
};

// All sequences
export const allSequences: Map<SequenceType, GuidanceSequence> = new Map([
  ['initial_scan', initialScanSequence],
  ['quick_scan', quickScanSequence],
  ['tutorial', tutorialSequence],
  ['calibration', calibrationSequence],
]);

/**
 * Get sequence by type
 */
export function getSequence(type: SequenceType): GuidanceSequence | undefined {
  return allSequences.get(type);
}

/**
 * Get step from sequence
 */
export function getStep(sequence: GuidanceSequence, stepId: string): SequenceStep | undefined {
  return sequence.steps.find(s => s.id === stepId);
}

/**
 * Get text for step (resolves prompt references)
 */
export function getStepText(step: SequenceStep, useShort: boolean = false): string {
  if (step.customText) return step.customText;
  if (step.promptId) {
    const prompt = getPrompt(step.promptId);
    if (prompt) {
      return useShort && prompt.shortText ? prompt.shortText : prompt.text;
    }
  }
  return '';
}
