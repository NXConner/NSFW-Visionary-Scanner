// Haptic feedback utility using Vibration API

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 30],
  warning: [30, 30, 30],
  error: [50, 100, 50, 100, 50],
  selection: 5,
};

export const triggerHaptic = (pattern: HapticPattern = 'light'): boolean => {
  // Check if haptics are enabled in settings
  const settings = localStorage.getItem('morphoscan_settings');
  if (settings) {
    try {
      const parsed = JSON.parse(settings);
      if (parsed.hapticEnabled === false) return false;
    } catch {
      // Continue with haptics if settings can't be parsed
    }
  }

  // Check if Vibration API is supported
  if (!('vibrate' in navigator)) {
    return false;
  }

  try {
    navigator.vibrate(patterns[pattern]);
    return true;
  } catch {
    return false;
  }
};

// Convenience functions
export const hapticLight = () => triggerHaptic('light');
export const hapticMedium = () => triggerHaptic('medium');
export const hapticHeavy = () => triggerHaptic('heavy');
export const hapticSuccess = () => triggerHaptic('success');
export const hapticWarning = () => triggerHaptic('warning');
export const hapticError = () => triggerHaptic('error');
export const hapticSelection = () => triggerHaptic('selection');
