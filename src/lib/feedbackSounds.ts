export type FeedbackSoundName = "focus_lock" | "object_detected" | "capture" | "error";

export interface PlaySoundOptions {
  volume?: number; // 0..1
  force?: boolean; // attempt even if autoplay restrictions may block
}

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

async function ensureRunning(ctx: AudioContext, force?: boolean): Promise<boolean> {
  if (ctx.state === "running") return true;
  if (!force) return false;
  try {
    await ctx.resume();
    return (ctx.state as string) === "running";
  } catch {
    return false;
  }
}

function envelope(
  gain: GainNode,
  now: number,
  attackMs: number,
  decayMs: number,
  sustain: number,
  releaseMs: number,
) {
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(1, now + attackMs / 1000);
  gain.gain.linearRampToValueAtTime(Math.max(0.0001, sustain), now + (attackMs + decayMs) / 1000);
  gain.gain.linearRampToValueAtTime(0.0001, now + (attackMs + decayMs + releaseMs) / 1000);
}

function beep(
  ctx: AudioContext,
  freqHz: number,
  durationMs: number,
  volume: number,
  type: OscillatorType = "sine",
) {
  if (!masterGain) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freqHz;

  gain.gain.value = 0.0001;
  gain.connect(masterGain);
  masterGain.gain.value = 1;

  const now = ctx.currentTime;
  envelope(gain, now, 6, 30, volume, Math.max(30, durationMs - 36));

  osc.connect(gain);
  osc.start(now);
  osc.stop(now + durationMs / 1000);
}

function click(ctx: AudioContext, volume: number) {
  if (!masterGain) return;
  // Short noise burst + high click
  const now = ctx.currentTime;

  const bufferSize = Math.floor(ctx.sampleRate * 0.03);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  gain.connect(masterGain);

  envelope(gain, now, 2, 10, Math.max(0.0001, volume * 0.8), 20);

  source.connect(gain);
  source.start(now);

  // Add a crisp click
  beep(ctx, 2200, 30, Math.max(0.0001, volume * 0.5), "square");
}

export async function playFeedbackSound(
  name: FeedbackSoundName,
  options: PlaySoundOptions = {},
): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;
  const ok = await ensureRunning(ctx, options.force);
  if (!ok) return false;

  const volume = Math.max(0, Math.min(1, options.volume ?? 0.6));

  switch (name) {
    case "focus_lock":
      beep(ctx, 880, 70, volume, "sine");
      beep(ctx, 1320, 60, volume * 0.7, "sine");
      break;
    case "object_detected":
      beep(ctx, 740, 55, volume * 0.8, "triangle");
      break;
    case "capture":
      click(ctx, volume);
      break;
    case "error":
      beep(ctx, 180, 120, volume, "square");
      beep(ctx, 140, 160, volume * 0.8, "square");
      break;
  }

  return true;
}

export function canPlayFeedbackSounds(): boolean {
  return (
    typeof window !== "undefined" &&
    !!(
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext
    )
  );
}
