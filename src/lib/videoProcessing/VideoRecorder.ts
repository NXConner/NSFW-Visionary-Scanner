import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { QUALITY_PRESETS } from "./constants";
import type { VideoChunk, VideoRecording, VideoRecordingOptions } from "./types";

/**
 * Enhanced video recorder with chunking and error recovery.
 *
 * Note: For multi-camera and partner sync recording, prefer using `useVideoRecording` and
 * the `nsfwAdvancedFeatures` session persistence helpers (DB-backed).
 */
export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream;
  private options: VideoRecordingOptions;
  private startTime: number = 0;
  private chunkInterval: number;
  private onChunk?: (chunk: VideoChunk) => void;
  private chunkIndex: number = 0;
  private isRecording: boolean = false;
  private isPaused: boolean = false;

  constructor(
    stream: MediaStream,
    options: VideoRecordingOptions = {},
    onChunk?: (chunk: VideoChunk) => void,
  ) {
    this.stream = stream;
    this.options = options;
    this.onChunk = onChunk;
    this.chunkInterval = 5000; // 5s chunks
  }

  private getConstraints(): MediaRecorderOptions {
    const quality = this.options.quality ?? "1080p";
    const preset = QUALITY_PRESETS[quality];

    const codecs = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];

    let mimeType = codecs[0]!;
    for (const codec of codecs) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(codec)) {
        mimeType = codec;
        break;
      }
    }

    return {
      mimeType,
      videoBitsPerSecond: preset.bitrate,
    };
  }

  async start(): Promise<void> {
    if (this.isRecording) return;

    try {
      const constraints = this.getConstraints();
      this.mediaRecorder = new MediaRecorder(this.stream, constraints);
      this.chunks = [];
      this.chunkIndex = 0;
      this.startTime = Date.now();
      this.isRecording = true;
      this.isPaused = false;

      this.mediaRecorder.ondataavailable = event => {
        if (!event.data || event.data.size <= 0) return;
        this.chunks.push(event.data);

        if (this.onChunk) {
          const chunk: VideoChunk = {
            id: `chunk-${this.chunkIndex}`,
            index: this.chunkIndex,
            blob: event.data,
            timestamp: Date.now(),
            duration: this.chunkInterval,
          };
          this.onChunk(chunk);
          this.chunkIndex++;
        }

        // Report progress (callers interpret meaning; historically this was chunk count)
        this.options.onProgress?.(this.chunks.length);
      };

      this.mediaRecorder.onerror = (event: any) => {
        logger.error("VideoRecorder: MediaRecorder error", { error: event?.error });
        this.handleRecordingError(event?.error instanceof Error ? event.error : new Error("Error"));
      };

      this.mediaRecorder.start(this.chunkInterval);
      logger.info("VideoRecorder: recording started", { quality: this.options.quality });
    } catch (error) {
      this.isRecording = false;
      logger.error("VideoRecorder: failed to start recording", { error });
      throw error;
    }
  }

  pause(): void {
    if (this.mediaRecorder?.state === "recording") {
      this.mediaRecorder.pause();
      this.isPaused = true;
      logger.info("VideoRecorder: recording paused");
    }
  }

  resume(): void {
    if (this.mediaRecorder?.state === "paused") {
      this.mediaRecorder.resume();
      this.isPaused = false;
      logger.info("VideoRecorder: recording resumed");
    }
  }

  async stop(): Promise<VideoRecording | null> {
    if (!this.mediaRecorder || !this.isRecording) return null;

    return await new Promise(resolve => {
      this.mediaRecorder!.onstop = () => {
        const endTime = Date.now();
        const duration = (endTime - this.startTime) / 1000;
        const blob = new Blob(this.chunks, {
          type: this.mediaRecorder!.mimeType || "video/webm",
        });

        this.isRecording = false;
        this.isPaused = false;

        const recording: VideoRecording = {
          id: `recording-${Date.now()}`,
          blob,
          duration,
          startTime: this.startTime,
          endTime,
        };

        logger.info("VideoRecorder: recording stopped", { duration, size: blob.size });
        resolve(recording);
      };

      try {
        this.mediaRecorder!.stop();
      } catch {
        resolve(null);
      }
    });
  }

  private handleRecordingError(error: Error): void {
    logger.error("VideoRecorder: recording error occurred", { error });
    toast.error("Recording error. Attempting to recover...");

    try {
      if (this.mediaRecorder?.state === "recording") {
        this.mediaRecorder.stop();
      }

      // Auto-restart after brief delay.
      setTimeout(() => {
        if (this.isRecording) void this.start();
      }, 1000);
    } catch (recoveryError) {
      logger.error("VideoRecorder: recovery failed", { error: recoveryError });
    }
  }

  getState(): "inactive" | "recording" | "paused" {
    return this.mediaRecorder?.state || "inactive";
  }

  getDuration(): number {
    if (!this.isRecording) return 0;
    return (Date.now() - this.startTime) / 1000;
  }
}
