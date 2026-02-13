import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { uploadFile } from "@/lib/mediaUpload";

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

function pickJpegQuality(): number {
  return 0.82;
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

async function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return await new Promise(resolve => {
    canvas.toBlob(b => resolve(b), "image/jpeg", quality);
  });
}

function computeThumbSize(params: { width: number; height: number; maxWidth: number }): {
  width: number;
  height: number;
} {
  const w = Math.max(1, Math.round(params.width));
  const h = Math.max(1, Math.round(params.height));
  const scale = Math.min(1, params.maxWidth / w);
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));
  return { width: tw, height: th };
}

/**
 * Create a thumbnail for a local video blob/file.
 *
 * Behavior:
 * - If signed in, uploads the thumbnail via `uploadFile` and returns a public URL (or storage path).
 * - If not signed in, returns a `blob:` URL for local preview purposes.
 */
export async function createVideoThumbnail(
  videoFile: File | Blob,
  time: number = 0,
): Promise<string | null> {
  if (!isBrowser()) return null;

  const blob = videoFile;
  if (!blob.size) return null;

  let objectUrl = "";
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    (video as any).playsInline = true;

    objectUrl = URL.createObjectURL(blob);
    video.src = objectUrl;

    await waitForEvent(video, "loadedmetadata", 12_000);

    const duration = safeNumber(video.duration, 0);
    const at = duration > 0 ? clampNumber(safeNumber(time, 0), 0, Math.max(0, duration - 0.05)) : 0;

    // Ensure we can decode at least one frame for drawImage.
    // Some browsers require `canplay` before seeking works reliably.
    try {
      await waitForEvent(video, "canplay", 8_000);
    } catch {
      // ignore; seek may still work
    }

    try {
      video.currentTime = at;
    } catch {
      // If seeking fails, fall back to 0.
      try {
        video.currentTime = 0;
      } catch {
        // ignore
      }
    }

    await waitForEvent(video, "seeked", 10_000);

    const w = Math.max(1, Math.round(video.videoWidth));
    const h = Math.max(1, Math.round(video.videoHeight));
    const { width: tw, height: th } = computeThumbSize({ width: w, height: h, maxWidth: 640 });

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, tw, th);

    const jpeg = await canvasToJpegBlob(canvas, pickJpegQuality());
    if (!jpeg) return null;

    // Prefer uploading when authenticated.
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return URL.createObjectURL(jpeg);
    }

    const fileName = `video-thumbnail-${Date.now()}.jpg`;
    const file = new File([jpeg], fileName, { type: "image/jpeg" });
    const uploaded = await uploadFile(file, {
      folder: "videos/thumbnails",
      compress: false,
      allowedTypes: ["image/jpeg"],
      maxSize: 2 * 1024 * 1024,
    });

    return uploaded?.publicUrl ?? uploaded?.path ?? null;
  } catch (error) {
    logger.warn("createVideoThumbnail failed", { error });
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

export async function getVideoDuration(videoFile: File | Blob): Promise<number> {
  if (!isBrowser()) return 0;

  let objectUrl = "";
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;
    await waitForEvent(video, "loadedmetadata", 10_000);
    return safeNumber(video.duration, 0);
  } catch {
    return 0;
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

export async function extractVideoFrames(
  videoFile: File | Blob,
  frameCount: number = 10,
): Promise<string[]> {
  if (!isBrowser()) return [];
  const count = Math.max(1, Math.min(60, Math.floor(safeNumber(frameCount, 10))));

  let objectUrl = "";
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    (video as any).playsInline = true;

    objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;
    await waitForEvent(video, "loadedmetadata", 12_000);

    const w = Math.max(1, Math.round(video.videoWidth));
    const h = Math.max(1, Math.round(video.videoHeight));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];

    const duration = safeNumber(video.duration, 0);
    if (!duration) return [];

    const frames: string[] = [];
    const interval = duration / count;

    for (let i = 0; i < count; i++) {
      const at = clampNumber(i * interval, 0, Math.max(0, duration - 0.05));
      try {
        video.currentTime = at;
      } catch {
        // ignore
      }
      await waitForEvent(video, "seeked", 10_000);
      ctx.drawImage(video, 0, 0, w, h);
      frames.push(canvas.toDataURL("image/jpeg", 0.8));
    }

    return frames;
  } catch (error) {
    logger.warn("extractVideoFrames failed", { error });
    return [];
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
