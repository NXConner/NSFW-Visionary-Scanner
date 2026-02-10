/**
 * Scanning Prompts Library
 * Predefined voice prompts for scanning guidance
 */

export type PromptCategory = 
  | 'positioning'
  | 'lighting'
  | 'stability'
  | 'capture'
  | 'success'
  | 'error'
  | 'instruction'
  | 'countdown'
  | 'feedback';

export type PromptPriority = 'low' | 'medium' | 'high' | 'critical';

export interface VoicePrompt {
  id: string;
  category: PromptCategory;
  text: string;
  shortText?: string; // Abbreviated version
  ssml?: string; // SSML markup for enhanced speech
  duration?: number; // Estimated duration in ms
  priority: PromptPriority;
  interruptible: boolean;
  soundEffect?: string; // Associated sound effect
}

// Positioning prompts
export const positioningPrompts: VoicePrompt[] = [
  {
    id: 'pos_center',
    category: 'positioning',
    text: 'Center the subject in the frame',
    shortText: 'Center',
    priority: 'medium',
    interruptible: true,
  },
  {
    id: 'pos_move_closer',
    category: 'positioning',
    text: 'Move a bit closer to the camera',
    shortText: 'Closer',
    priority: 'medium',
    interruptible: true,
  },
  {
    id: 'pos_move_back',
    category: 'positioning',
    text: 'Move back slightly for better framing',
    shortText: 'Back',
    priority: 'medium',
    interruptible: true,
  },
  {
    id: 'pos_left',
    category: 'positioning',
    text: 'Move slightly to the left',
    shortText: 'Left',
    priority: 'medium',
    interruptible: true,
  },
  {
    id: 'pos_right',
    category: 'positioning',
    text: 'Move slightly to the right',
    shortText: 'Right',
    priority: 'medium',
    interruptible: true,
  },
  {
    id: 'pos_up',
    category: 'positioning',
    text: 'Adjust angle upward',
    shortText: 'Up',
    priority: 'medium',
    interruptible: true,
  },
  {
    id: 'pos_down',
    category: 'positioning',
    text: 'Adjust angle downward',
    shortText: 'Down',
    priority: 'medium',
    interruptible: true,
  },
  {
    id: 'pos_tilt_fix',
    category: 'positioning',
    text: 'Straighten the camera angle',
    shortText: 'Straighten',
    priority: 'medium',
    interruptible: true,
  },
  {
    id: 'pos_perfect',
    category: 'positioning',
    text: 'Position is perfect',
    shortText: 'Perfect',
    priority: 'high',
    interruptible: false,
    soundEffect: 'success_ding',
  },
];

// Lighting prompts
export const lightingPrompts: VoicePrompt[] = [
  {
    id: 'light_too_dark',
    category: 'lighting',
    text: 'The lighting is too dim. Try moving to a brighter area',
    shortText: 'More light needed',
    priority: 'high',
    interruptible: true,
  },
  {
    id: 'light_too_bright',
    category: 'lighting',
    text: 'Too much light. Try reducing direct light or move to shade',
    shortText: 'Too bright',
    priority: 'high',
    interruptible: true,
  },
  {
    id: 'light_uneven',
    category: 'lighting',
    text: 'Lighting is uneven. Try to distribute light more evenly',
    shortText: 'Uneven lighting',
    priority: 'medium',
    interruptible: true,
  },
  {
    id: 'light_good',
    category: 'lighting',
    text: 'Lighting conditions are good',
    shortText: 'Good light',
    priority: 'low',
    interruptible: true,
  },
  {
    id: 'light_shadow',
    category: 'lighting',
    text: 'There are shadows in the frame. Adjust your position',
    shortText: 'Shadows detected',
    priority: 'medium',
    interruptible: true,
  },
];

// Stability prompts
export const stabilityPrompts: VoicePrompt[] = [
  {
    id: 'stab_hold_steady',
    category: 'stability',
    text: 'Hold the camera steady',
    shortText: 'Hold steady',
    priority: 'high',
    interruptible: false,
  },
  {
    id: 'stab_too_shaky',
    category: 'stability',
    text: 'Too much movement. Try bracing against a surface',
    shortText: 'Too shaky',
    priority: 'high',
    interruptible: true,
  },
  {
    id: 'stab_stabilizing',
    category: 'stability',
    text: 'Stabilizing. Keep holding',
    shortText: 'Stabilizing',
    priority: 'medium',
    interruptible: true,
  },
  {
    id: 'stab_stable',
    category: 'stability',
    text: 'Camera is stable',
    shortText: 'Stable',
    priority: 'low',
    interruptible: true,
    soundEffect: 'subtle_click',
  },
];

// Capture prompts
export const capturePrompts: VoicePrompt[] = [
  {
    id: 'cap_ready',
    category: 'capture',
    text: 'Ready to capture. Hold steady',
    shortText: 'Ready',
    priority: 'high',
    interruptible: false,
    soundEffect: 'ready_beep',
  },
  {
    id: 'cap_capturing',
    category: 'capture',
    text: 'Capturing now',
    shortText: 'Capturing',
    priority: 'critical',
    interruptible: false,
    soundEffect: 'shutter',
  },
  {
    id: 'cap_processing',
    category: 'capture',
    text: 'Processing image',
    shortText: 'Processing',
    priority: 'medium',
    interruptible: true,
  },
  {
    id: 'cap_complete',
    category: 'capture',
    text: 'Capture complete',
    shortText: 'Done',
    priority: 'high',
    interruptible: false,
    soundEffect: 'success_chime',
  },
];

// Countdown prompts
export const countdownPrompts: VoicePrompt[] = [
  {
    id: 'count_3',
    category: 'countdown',
    text: 'Three',
    priority: 'critical',
    interruptible: false,
    soundEffect: 'countdown_beep',
  },
  {
    id: 'count_2',
    category: 'countdown',
    text: 'Two',
    priority: 'critical',
    interruptible: false,
    soundEffect: 'countdown_beep',
  },
  {
    id: 'count_1',
    category: 'countdown',
    text: 'One',
    priority: 'critical',
    interruptible: false,
    soundEffect: 'countdown_beep',
  },
];

// Success prompts
export const successPrompts: VoicePrompt[] = [
  {
    id: 'success_scan',
    category: 'success',
    text: 'Scan completed successfully',
    shortText: 'Success',
    priority: 'high',
    interruptible: false,
    soundEffect: 'success_fanfare',
  },
  {
    id: 'success_quality',
    category: 'success',
    text: 'Excellent image quality',
    shortText: 'Excellent',
    priority: 'medium',
    interruptible: true,
  },
  {
    id: 'success_saved',
    category: 'success',
    text: 'Measurement saved',
    shortText: 'Saved',
    priority: 'medium',
    interruptible: true,
    soundEffect: 'save_confirm',
  },
];

// Error prompts
export const errorPrompts: VoicePrompt[] = [
  {
    id: 'error_no_subject',
    category: 'error',
    text: 'Subject not detected. Please reposition',
    shortText: 'Not detected',
    priority: 'high',
    interruptible: false,
    soundEffect: 'error_buzz',
  },
  {
    id: 'error_blur',
    category: 'error',
    text: 'Image is blurry. Please try again',
    shortText: 'Blurry',
    priority: 'high',
    interruptible: false,
    soundEffect: 'error_buzz',
  },
  {
    id: 'error_out_of_frame',
    category: 'error',
    text: 'Subject is out of frame',
    shortText: 'Out of frame',
    priority: 'high',
    interruptible: false,
  },
  {
    id: 'error_retry',
    category: 'error',
    text: 'Capture failed. Let\'s try again',
    shortText: 'Retry',
    priority: 'high',
    interruptible: false,
    soundEffect: 'retry_prompt',
  },
];

// Instruction prompts
export const instructionPrompts: VoicePrompt[] = [
  {
    id: 'inst_welcome',
    category: 'instruction',
    text: 'Welcome to the scanner. I will guide you through the process',
    priority: 'medium',
    interruptible: true,
  },
  {
    id: 'inst_prepare',
    category: 'instruction',
    text: 'Please prepare for scanning. Make sure you have good lighting',
    priority: 'medium',
    interruptible: true,
  },
  {
    id: 'inst_position_guide',
    category: 'instruction',
    text: 'Position the camera approximately 12 inches away from the subject',
    priority: 'medium',
    interruptible: true,
  },
  {
    id: 'inst_hold_button',
    category: 'instruction',
    text: 'Press and hold the capture button when ready',
    priority: 'medium',
    interruptible: true,
  },
  {
    id: 'inst_review',
    category: 'instruction',
    text: 'Review your scan and tap save if satisfied',
    priority: 'medium',
    interruptible: true,
  },
];

// Feedback prompts
export const feedbackPrompts: VoicePrompt[] = [
  {
    id: 'fb_good_progress',
    category: 'feedback',
    text: 'Good progress. Keep going',
    shortText: 'Good',
    priority: 'low',
    interruptible: true,
  },
  {
    id: 'fb_almost_there',
    category: 'feedback',
    text: 'Almost there',
    priority: 'medium',
    interruptible: true,
  },
  {
    id: 'fb_adjustment_needed',
    category: 'feedback',
    text: 'Small adjustment needed',
    priority: 'medium',
    interruptible: true,
  },
];

// Combined prompts map for quick access
export const allPrompts: Map<string, VoicePrompt> = new Map([
  ...positioningPrompts,
  ...lightingPrompts,
  ...stabilityPrompts,
  ...capturePrompts,
  ...countdownPrompts,
  ...successPrompts,
  ...errorPrompts,
  ...instructionPrompts,
  ...feedbackPrompts,
].map(prompt => [prompt.id, prompt]));

/**
 * Get prompt by ID
 */
export function getPrompt(id: string): VoicePrompt | undefined {
  return allPrompts.get(id);
}

/**
 * Get prompts by category
 */
export function getPromptsByCategory(category: PromptCategory): VoicePrompt[] {
  return Array.from(allPrompts.values()).filter(p => p.category === category);
}

/**
 * Get random prompt from category
 */
export function getRandomPrompt(category: PromptCategory): VoicePrompt | undefined {
  const prompts = getPromptsByCategory(category);
  if (prompts.length === 0) return undefined;
  return prompts[Math.floor(Math.random() * prompts.length)];
}
