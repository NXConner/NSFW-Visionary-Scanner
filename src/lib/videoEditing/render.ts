import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { uploadVideo } from "@/lib/mediaUpload";
import { logger } from "@/lib/logger";
import type {
  CameraSource,
  CameraSwitchEvent,
  MaskKeyframe,
  MaskShape,
  MaskTrack,
  TimelineSpec,
  TransitionType,
} from "./types";

export type RenderProgress = {
  phase: "loading" | "rendering" | "uploading";
  progress: number;
};

const DEFAULT_FPS = 30;
const FADE_OVERLAY_ALPHA = 0.65;

function pickRecorderMimeType(): string {
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

function sortSwitches(switches: CameraSwitchEvent[]): CameraSwitchEvent[] {
  return [...switches].sort((a, b) => a.atSeconds - b.atSeconds);
}

function selectCameraState(
  switches: CameraSwitchEvent[],
  t: number,
  fallbackIndex: number,
): {
  activeIndex: number;
  prevIndex: number;
  transition: TransitionType;
  progress: number;
} {
  if (!switches.length) {
    return { activeIndex: fallbackIndex, prevIndex: fallbackIndex, transition: "cut", progress: 1 };
  }
  const initial: CameraSwitchEvent = {
    id: "initial",
    cameraIndex: fallbackIndex,
    atSeconds: 0,
    transition: "cut",
    transitionDurationMs: 0,
  };
  let prev: CameraSwitchEvent = initial;
  let current: CameraSwitchEvent = initial;
  for (const s of switches) {
    if (s.atSeconds <= t) {
      prev = current;
      current = s;
    } else {
      break;
    }
  }
  const durationMs = Number(current.transitionDurationMs ?? 0);
  if (current.transition !== "cut" && durationMs > 0 && t < current.atSeconds + durationMs / 1000) {
    const elapsed = Math.max(0, t - current.atSeconds);
    const progress = Math.min(1, elapsed / (durationMs / 1000));
    return {
      activeIndex: current.cameraIndex,
      prevIndex: prev.cameraIndex,
      transition: current.transition,
      progress,
    };
  }
  return {
    activeIndex: current.cameraIndex,
    prevIndex: current.cameraIndex,
    transition: "cut",
    progress: 1,
  };
}

function interp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateShape(a: MaskShape, b: MaskShape, t: number): MaskShape {
  if (a.kind === "rect" && b.kind === "rect") {
    return {
      kind: "rect",
      xPct: interp(a.xPct, b.xPct, t),
      yPct: interp(a.yPct, b.yPct, t),
      wPct: interp(a.wPct, b.wPct, t),
      hPct: interp(a.hPct, b.hPct, t),
      radiusPct: interp(a.radiusPct ?? 0, b.radiusPct ?? 0, t),
    };
  }
  if (a.kind === "polygon" && b.kind === "polygon" && a.points.length === b.points.length) {
    return {
      kind: "polygon",
      points: a.points.map((pt, idx) => ({
        xPct: interp(pt.xPct, b.points[idx]!.xPct, t),
        yPct: interp(pt.yPct, b.points[idx]!.yPct, t),
      })),
    };
  }
  return t < 0.5 ? a : b;
}

function getMaskKeyframe(track: MaskTrack, t: number): MaskKeyframe | null {
  const frames = [...track.keyframes].sort((a, b) => a.atSeconds - b.atSeconds);
  if (!frames.length) return null;
  if (t <= frames[0]!.atSeconds) return frames[0]!;
  if (t >= frames[frames.length - 1]!.atSeconds) return frames[frames.length - 1]!;

  let prev = frames[0]!;
  for (let i = 1; i < frames.length; i++) {
    const next = frames[i]!;
    if (t <= next.atSeconds) {
      const span = Math.max(0.001, next.atSeconds - prev.atSeconds);
      const pct = Math.min(1, Math.max(0, (t - prev.atSeconds) / span));
      return { ...next, shape: interpolateShape(prev.shape, next.shape, pct) };
    }
    prev = next;
  }
  return frames[frames.length - 1]!;
}

function drawShape(ctx: CanvasRenderingContext2D, shape: MaskShape, w: number, h: number) {
  ctx.beginPath();
  if (shape.kind === "rect") {
    const x = (shape.xPct / 100) * w;
    const y = (shape.yPct / 100) * h;
    const rw = (shape.wPct / 100) * w;
    const rh = (shape.hPct / 100) * h;
    const r = Math.max(0, (shape.radiusPct ?? 0) / 100) * Math.min(rw, rh);
    if (r > 0) {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + rw, y, x + rw, y + rh, r);
      ctx.arcTo(x + rw, y + rh, x, y + rh, r);
      ctx.arcTo(x, y + rh, x, y, r);
      ctx.arcTo(x, y, x + rw, y, r);
      ctx.closePath();
    } else {
      ctx.rect(x, y, rw, rh);
    }
    return;
  }
  if (shape.points.length > 0) {
    const first = shape.points[0]!;
    ctx.moveTo((first.xPct / 100) * w, (first.yPct / 100) * h);
    for (let i = 1; i < shape.points.length; i++) {
      const pt = shape.points[i]!;
      ctx.lineTo((pt.xPct / 100) * w, (pt.yPct / 100) * h);
    }
    ctx.closePath();
  }
}

function applyMasks(
  ctx: CanvasRenderingContext2D,
  masks: MaskTrack[],
  t: number,
  w: number,
  h: number,
) {
  for (const track of masks) {
    const keyframe = getMaskKeyframe(track, t);
    if (!keyframe) continue;
    const strength = Math.min(1, Math.max(0, keyframe.strength ?? 1));
    ctx.save();
    if (track.mode === "include") {
      ctx.fillStyle = `rgba(0,0,0,${FADE_OVERLAY_ALPHA * strength})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "destination-out";
      drawShape(ctx, keyframe.shape, w, h);
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(0,0,0,${FADE_OVERLAY_ALPHA * strength})`;
      drawShape(ctx, keyframe.shape, w, h);
      ctx.fill();
    }
    ctx.restore();
  }
}

async function loadVideo(url: string): Promise<HTMLVideoElement> {
  return await new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.crossOrigin = "anonymous";
    v.preload = "auto";
    v.muted = true;
    v.src = url;
    v.onloadedmetadata = () => resolve(v);
    v.onerror = () => reject(new Error("Failed to load video"));
  });
}

export async function renderMulticamTimeline(params: {
  timeline: TimelineSpec;
  fps?: number;
  onProgress?: (p: RenderProgress) => void;
}): Promise<{ blob: Blob; mimeType: string; durationSeconds: number }> {
  const { timeline, fps = DEFAULT_FPS } = params;
  const sources = timeline.sources || [];
  if (!sources.length) throw new Error("No video sources available");

  params.onProgress?.({ phase: "loading", progress: 0 });
  const videos = await Promise.all(sources.map(s => loadVideo(s.videoUrl)));
  params.onProgress?.({ phase: "loading", progress: 100 });

  const width = Math.max(...videos.map(v => v.videoWidth || 0), 640);
  const height = Math.max(...videos.map(v => v.videoHeight || 0), 360);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");

  const stream = canvas.captureStream(fps);
  const audioCtx = new AudioContext();
  const dest = audioCtx.createMediaStreamDestination();
  const gains = videos.map(v => {
    const source = audioCtx.createMediaElementSource(v);
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    source.connect(gain).connect(dest);
    return gain;
  });
  const outputStream = new MediaStream([
    ...stream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const mimeType = pickRecorderMimeType();
  const recorder = new MediaRecorder(outputStream, { mimeType });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = e => e.data && e.data.size > 0 && chunks.push(e.data);

  const duration = Math.max(0, Number(timeline.durationSeconds || 0));
  const switches = sortSwitches(timeline.cameraSwitches || []);
  const sourceByIndex = new Map<
    number,
    { video: HTMLVideoElement; gain: GainNode; src: CameraSource }
  >();
  sources.forEach((src, idx) => {
    sourceByIndex.set(src.cameraIndex, { video: videos[idx]!, gain: gains[idx]!, src });
  });

  await audioCtx.resume();
  for (const [idx, entry] of sourceByIndex) {
    const offset = Math.max(0, Number(entry.src.syncOffsetSeconds ?? 0));
    entry.video.currentTime = offset;
    entry.video.playbackRate = 1;
    entry.video.muted = true;
    try {
      await entry.video.play();
    } catch {
      logger.warn("renderMulticamTimeline: autoplay blocked", { cameraIndex: idx });
    }
  }

  recorder.start(1000);

  const startAt = performance.now();
  await new Promise<void>(resolve => {
    const tick = () => {
      const elapsed = (performance.now() - startAt) / 1000;
      const t = Math.min(duration, elapsed);
      const { activeIndex, prevIndex, transition, progress } = selectCameraState(
        switches,
        t,
        sources[0]!.cameraIndex,
      );

      const active = sourceByIndex.get(activeIndex);
      const prev = sourceByIndex.get(prevIndex);
      const transitionProgress = transition === "cut" ? 1 : progress;

      ctx.clearRect(0, 0, width, height);

      if (transition === "crossfade" && prev && active && prev !== active) {
        ctx.globalAlpha = 1 - transitionProgress;
        ctx.drawImage(prev.video, 0, 0, width, height);
        ctx.globalAlpha = transitionProgress;
        ctx.drawImage(active.video, 0, 0, width, height);
        ctx.globalAlpha = 1;
      } else if (transition === "dip_to_black" && prev && active && prev !== active) {
        if (transitionProgress < 0.5) {
          ctx.drawImage(prev.video, 0, 0, width, height);
          ctx.fillStyle = `rgba(0,0,0,${transitionProgress / 0.5})`;
          ctx.fillRect(0, 0, width, height);
        } else {
          ctx.drawImage(active.video, 0, 0, width, height);
          ctx.fillStyle = `rgba(0,0,0,${(1 - transitionProgress) / 0.5})`;
          ctx.fillRect(0, 0, width, height);
        }
      } else if (active) {
        ctx.drawImage(active.video, 0, 0, width, height);
      }

      applyMasks(ctx, timeline.masks || [], t, width, height);

      gains.forEach(g => (g.gain.value = 0));
      if (active && active.gain) active.gain.gain.value = 1;
      if (transition === "crossfade" && prev && prev.gain && active && prev !== active) {
        prev.gain.gain.value = 1 - transitionProgress;
        active.gain.gain.value = transitionProgress;
      }
      if (transition === "dip_to_black" && prev && prev.gain && active && prev !== active) {
        const fade =
          transitionProgress < 0.5 ? 1 - transitionProgress / 0.5 : transitionProgress / 0.5;
        prev.gain.gain.value = 1 - fade;
        active.gain.gain.value = fade;
      }

      params.onProgress?.({
        phase: "rendering",
        progress: duration ? Math.min(100, (t / duration) * 100) : 100,
      });

      if (t >= duration) {
        recorder.stop();
        gains.forEach(g => (g.gain.value = 0));
        sourceByIndex.forEach(e => e.video.pause());
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await audioCtx.close();

  const blob = new Blob(chunks, { type: mimeType });
  return { blob, mimeType, durationSeconds: duration };
}

export async function renderAndUploadEdit(params: {
  recordingId: string;
  editName?: string;
  timeline: TimelineSpec;
  onProgress?: (p: RenderProgress) => void;
}): Promise<{
  ok: boolean;
  editId?: string;
  editedUrl?: string;
  editedPath?: string;
  error?: string;
}> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Please sign in" };

  const { data: editRow, error: insertError } = await fromExtended("video_edits")
    .insert({
      recording_id: params.recordingId,
      user_id: auth.user.id,
      edit_name: params.editName ?? null,
      edit_type: "camera_switch",
      edit_config: params.timeline,
      camera_switches: params.timeline.cameraSwitches,
      masking_data: { masks: params.timeline.masks },
      transitions: {
        default: "cut",
        switches: params.timeline.cameraSwitches.map(s => ({
          atSeconds: s.atSeconds,
          transition: s.transition,
          durationMs: s.transitionDurationMs ?? 0,
        })),
      },
      edit_status: "processing",
    })
    .select("id")
    .single();

  if (insertError || !editRow?.id) {
    return { ok: false, error: insertError?.message || "Failed to create edit record" };
  }

  const editId = String(editRow.id);

  try {
    const rendered = await renderMulticamTimeline({
      timeline: params.timeline,
      onProgress: params.onProgress,
    });

    params.onProgress?.({ phase: "uploading", progress: 0 });
    const file = new File([rendered.blob], `edit-${editId}.webm`, { type: rendered.mimeType });
    const upload = await uploadVideo(file, {
      bucket: "recordings",
      folder: `video-edits/${params.recordingId}`,
      maxSize: 2 * 1024 * 1024 * 1024,
    });
    if (!upload?.path) throw new Error("Upload failed");

    await fromExtended("video_edits")
      .update({
        edited_video_url: upload.publicUrl ?? null,
        edited_video_storage_path: upload.path,
        edit_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", editId);

    params.onProgress?.({ phase: "uploading", progress: 100 });

    return { ok: true, editId, editedUrl: upload.publicUrl, editedPath: upload.path };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Render failed";
    logger.error("renderAndUploadEdit failed", { error: message });
    await fromExtended("video_edits")
      .update({ edit_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", editId);
    return { ok: false, error: message };
  }
}
