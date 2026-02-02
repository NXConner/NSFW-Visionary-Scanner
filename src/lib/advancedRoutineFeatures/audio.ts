import { getRoutinePreferences } from "./preferences";

const audioContext =
  typeof window !== "undefined"
    ? new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
        window.AudioContext
      )()
    : null;

export function playBeep(frequency: number = 800, duration: number = 200): void {
  if (!audioContext) return;

  const prefs = getRoutinePreferences();
  if (!prefs.audioEnabled) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gainNode.gain.value = prefs.audioCueVolume;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch {
    // Audio might not be available (permissions, etc.)
  }
}

export function playStartCue(): void {
  playBeep(880, 300);
}

export function playRestCue(): void {
  playBeep(440, 200);
}

export function playEndCue(): void {
  playBeep(660, 150);
  setTimeout(() => playBeep(880, 150), 200);
  setTimeout(() => playBeep(1100, 300), 400);
}

export function playCountdownBeep(): void {
  playBeep(1000, 100);
}
