export function vibrate(pattern: number | number[] = 200): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Vibration might not be available
  }
}
