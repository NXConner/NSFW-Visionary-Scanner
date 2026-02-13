import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { VideoRecorder } from "./VideoRecorder";
import type { VideoRecording, VideoRecordingOptions } from "./types";

/**
 * Record video from MediaStream (legacy function for backward compatibility).
 *
 * Historically this function returned `null` and required callers to use `VideoRecorder` directly.
 * We keep that behavior to avoid implying a blocking "record until done" flow without a stop signal.
 *
 * Prefer:
 * - `new VideoRecorder(stream, options)` (manual lifecycle)
 * - `useVideoRecording()` for multi-camera capture flows
 */
export async function recordVideo(
  stream: MediaStream,
  options: VideoRecordingOptions = {},
): Promise<VideoRecording | null> {
  try {
    const recorder = new VideoRecorder(stream, options);
    await recorder.start();

    toast.message("Recording started. Use VideoRecorder.stop() to finish.");
    return null;
  } catch (error) {
    logger.error("recordVideo failed", { error });
    toast.error("Failed to start recording");
    return null;
  }
}

export function stopRecording(recorder: MediaRecorder): void {
  if (recorder.state === "recording") {
    recorder.stop();
  }
}
