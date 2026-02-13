import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { VideoRecorder } from "./VideoRecorder";
import type { MultiCameraOptions, VideoChunk, VideoRecording } from "./types";

/**
 * Multi-camera recorder for synchronized multi-angle recording.
 *
 * Note: The primary app flow uses `useVideoRecording` + DB-backed sessions in
 * `src/lib/nsfwAdvancedFeatures/*`. This class is kept for advanced/experimental use cases.
 */
export class MultiCameraRecorder {
  private recorders: VideoRecorder[] = [];
  private cameras: MediaStream[];
  private options: MultiCameraOptions;
  private masterRecorder: VideoRecorder | null = null;
  private isRecording: boolean = false;

  constructor(options: MultiCameraOptions) {
    this.cameras = options.cameras;
    this.options = options;
  }

  async start(): Promise<void> {
    if (this.isRecording) return;

    try {
      this.recorders = [];

      for (let i = 0; i < this.cameras.length; i++) {
        const recorder = new VideoRecorder(
          this.cameras[i]!,
          { quality: "1080p", audio: i === 0 },
          chunk => this.handleChunk(i, chunk),
        );
        this.recorders.push(recorder);
      }

      await Promise.all(this.recorders.map(r => r.start()));

      this.masterRecorder = this.recorders[0] ?? null;
      this.isRecording = true;

      logger.info("MultiCameraRecorder: started", {
        cameras: this.cameras.length,
        layout: this.options.layout,
      });
    } catch (error) {
      logger.error("MultiCameraRecorder: failed to start", { error });
      throw error;
    }
  }

  private handleChunk(cameraIndex: number, chunk: VideoChunk): void {
    logger.debug("MultiCameraRecorder: chunk received", { cameraIndex, chunkId: chunk.id });
    // Could upload chunks here for real-time backup.
  }

  pause(): void {
    this.recorders.forEach(r => r.pause());
  }

  resume(): void {
    this.recorders.forEach(r => r.resume());
  }

  async stop(): Promise<VideoRecording[]> {
    if (!this.isRecording) return [];
    const recordings = await Promise.all(this.recorders.map(r => r.stop()));
    this.isRecording = false;
    return recordings.filter((r): r is VideoRecording => r !== null);
  }

  /**
   * Merge multiple camera recordings into a composite video.
   *
   * Uses the `merge-video-chunks` Edge Function when available; falls back to returning the
   * first recording on failure.
   */
  async mergeRecordings(recordings: VideoRecording[]): Promise<VideoRecording | null> {
    if (recordings.length === 0) return null;
    if (recordings.length === 1) return recordings[0]!;

    try {
      const { data, error } = await supabase.functions.invoke("merge-video-chunks", {
        body: {
          recordings: recordings.map(r => ({ id: r.id, duration: r.duration })),
          layout: this.options.layout,
        },
      });
      if (error) throw error;
      return (data as any)?.recording ?? recordings[0]!;
    } catch (error) {
      logger.error("MultiCameraRecorder: failed to merge recordings", { error });
      return recordings[0]!;
    }
  }

  getState(): "inactive" | "recording" | "paused" {
    return this.masterRecorder?.getState() || "inactive";
  }
}
