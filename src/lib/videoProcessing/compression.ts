import { logger } from "@/lib/logger";

function isBrowser(): boolean {
  return typeof document !== "undefined" && typeof window !== "undefined";
}

function clampNumber(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function safeNumber(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function even(n: number): number {
  const x = Math.max(2, Math.round(n));
  return x % 2 === 0 ? x : x - 1;
}

function pickSupportedMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return "video/webm";
}

async function waitForEvent(el: EventTarget, eventName: string, timeoutMs: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let done = false;
    const timer = window.setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, timeoutMs);

    const onOk = () => {
      if (done) return;
      done = true;
      cleanup();
      resolve();
    };
    const onErr = () => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error(`Failed waiting for ${eventName}`));
    };

    function cleanup() {
      window.clearTimeout(timer);
      try {
        el.removeEventListener(eventName, onOk as any);
      } catch {
        // ignore
      }
      try {
        el.removeEventListener("error", onErr as any);
      } catch {
        // ignore
      }
    }

    el.addEventListener(eventName, onOk as any, { once: true } as any);
    el.addEventListener("error", onErr as any, { once: true } as any);
  });
}

async function readVideoMetaFromBlob(blob: Blob): Promise<{
  duration: number;
  width: number;
  height: number;
} | null> {
  if (!isBrowser()) return null;

  let objectUrl = "";
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    (video as any).playsInline = true;

    objectUrl = URL.createObjectURL(blob);
    video.src = objectUrl;
    await waitForEvent(video, "loadedmetadata", 12_000);
    return {
      duration: safeNumber(video.duration, 0),
      width: Math.max(0, Math.round(safeNumber(video.videoWidth, 0))),
      height: Math.max(0, Math.round(safeNumber(video.videoHeight, 0))),
    };
  } catch {
    return null;
  } finally {
    if (objectUrl) {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }
    }
  }
}

async function transcodeViaCanvas(params: {
  blob: Blob;
  width: number;
  height: number;
  fps: number;
  mimeType: string;
  videoBitsPerSecond: number;
  audioBitsPerSecond: number;
}): Promise<Blob | null> {
  if (!isBrowser()) return null;
  if (typeof MediaRecorder === "undefined") return null;

  let objectUrl = "";
  try {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    (video as any).playsInline = true;

    objectUrl = URL.createObjectURL(params.blob);
    video.src = objectUrl;

    await waitForEvent(video, "loadedmetadata", 12_000);
    // Ensure decode readiness
    try {
      await waitForEvent(video, "canplay", 8_000);
    } catch {
      // ignore
    }

    const canvas = document.createElement("canvas");
    canvas.width = params.width;
    canvas.height = params.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const canvasStream = (canvas as any).captureStream?.(params.fps) as MediaStream | undefined;
    if (!canvasStream) return null;

    // Best-effort audio capture from the source video.
    let audioTrack: MediaStreamTrack | null = null;
    try {
      const vs = (video as any).captureStream?.() as MediaStream | undefined;
      audioTrack = (vs?.getAudioTracks?.()?.[0] as MediaStreamTrack | undefined) ?? null;
    } catch {
      audioTrack = null;
    }

    const outTracks: MediaStreamTrack[] = [];
    const vt = canvasStream.getVideoTracks?.()?.[0];
    if (vt) outTracks.push(vt);
    if (audioTrack) outTracks.push(audioTrack);
    const outStream = new MediaStream(outTracks);

    const recorder = new MediaRecorder(outStream, {
      mimeType: params.mimeType,
      videoBitsPerSecond: params.videoBitsPerSecond,
      audioBitsPerSecond: params.audioBitsPerSecond,
    });

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const stopped = new Promise<Blob | null>(resolve => {
      recorder.onstop = () => {
        if (chunks.length === 0) return resolve(null);
        resolve(new Blob(chunks, { type: params.mimeType }));
      };
      recorder.onerror = () => resolve(null);
    });

    // Draw loop
    let drawTimer: number | null = null;
    let stoppedDraw = false;

    const draw = () => {
      if (stoppedDraw) return;
      try {
        ctx.drawImage(video, 0, 0, params.width, params.height);
      } catch {
        // ignore
      }

      const rvfc = (video as any).requestVideoFrameCallback as
        | ((cb: (now: number, meta: unknown) => void) => void)
        | undefined;
      if (typeof rvfc === "function") {
        rvfc(() => draw());
      }
    };

    if (typeof (video as any).requestVideoFrameCallback === "function") {
      (video as any).requestVideoFrameCallback(() => draw());
    } else {
      const intervalMs = Math.max(16, Math.round(1000 / Math.max(10, params.fps)));
      drawTimer = window.setInterval(draw, intervalMs);
    }

    recorder.start(1000);

    // Start playback (muted autoplay permitted for user-generated blobs)
    try {
      await video.play();
    } catch {
      // Some browsers require a user gesture; without it, we cannot transcode.
      try {
        recorder.stop();
      } catch {
        // ignore
      }
      stoppedDraw = true;
      if (drawTimer) window.clearInterval(drawTimer);
      return null;
    }

    await waitForEvent(
      video,
      "ended",
      Math.max(5_000, Math.round(safeNumber(video.duration, 0) * 1000) + 15_000),
    );

    stoppedDraw = true;
    if (drawTimer) window.clearInterval(drawTimer);

    try {
      recorder.stop();
    } catch {
      // ignore
    }

    const out = await stopped;
    return out;
  } catch (error) {
    logger.warn("transcodeViaCanvas failed", { error });
    return null;
  } finally {
    if (objectUrl) {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }
    }
  }
}

/**
 * Compress video using best-effort browser APIs.
 *
 * Strategy:
 * - If no compression is needed, return original blob.
 * - Otherwise, attempt a single-pass transcode using canvas + MediaRecorder.
 * - If unsupported or ineffective, return original blob.
 */
export async function compressVideo(blob: Blob, targetSize: number): Promise<Blob> {
  const target = Math.floor(safeNumber(targetSize, 0));
  if (!blob || !(blob instanceof Blob)) return blob;
  if (!target || target <= 0) return blob;
  if (blob.size <= target) return blob;

  // Avoid extreme CPU use on very large/long inputs in-browser.
  const meta = await readVideoMetaFromBlob(blob);
  const duration = meta?.duration ?? 0;
  const width = meta?.width ?? 0;
  const height = meta?.height ?? 0;
  if (!duration || duration < 0.5 || !width || !height) return blob;

  const MAX_DURATION_SECONDS = 120;
  if (duration > MAX_DURATION_SECONDS) {
    logger.warn("compressVideo: skipping in-browser transcode (duration too long)", {
      duration,
      originalSize: blob.size,
      targetSize: target,
    });
    return blob;
  }

  const ratio = target / blob.size;
  // If the requested reduction is minimal, skip.
  if (ratio > 0.92) return blob;

  const scale = clampNumber(Math.sqrt(ratio), 0.35, 1);
  const outWidth = even(width * scale);
  const outHeight = even(height * scale);

  const targetVideoBitsPerSecond = Math.round((target * 8) / duration);
  const videoBitsPerSecond = clampNumber(targetVideoBitsPerSecond, 300_000, 12_000_000);
  const audioBitsPerSecond = clampNumber(128_000, 48_000, 256_000);
  const fps = clampNumber(24, 12, 30);

  const mimeType = pickSupportedMimeType();
  const transcoded = await transcodeViaCanvas({
    blob,
    width: outWidth,
    height: outHeight,
    fps,
    mimeType,
    videoBitsPerSecond,
    audioBitsPerSecond,
  });

  if (!transcoded) return blob;
  if (transcoded.size >= blob.size * 0.98) return blob;

  return transcoded;
}

export function isVideoFormatSupported(mimeType: string): boolean {
  if (!isBrowser()) return false;
  const video = document.createElement("video");
  return video.canPlayType(mimeType) !== "";
}

export function getSupportedVideoFormats(): string[] {
  const formats = [
    "video/webm",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/mp4",
    "video/mp4;codecs=avc1",
    "video/ogg",
  ];

  return formats.filter(isVideoFormatSupported);
}
