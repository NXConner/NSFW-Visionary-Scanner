import { useCallback, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadVideoInChunks } from "@/lib/mediaUpload/videoChunkUpload";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export type RecorderQuality = "720p" | "1080p" | "2k" | "4k";

type RecorderHandle = {
  stop: () => Promise<Blob | null>;
  stream: MediaStream;
  mimeType: string;
};

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

function createRecorder(stream: MediaStream, withAudio: boolean): RecorderHandle {
  const tracks = stream.getVideoTracks();
  const audioTracks = withAudio ? stream.getAudioTracks() : [];
  const composed = new MediaStream([...tracks, ...audioTracks]);
  const mimeType = pickSupportedMimeType();
  const recorder = new MediaRecorder(composed, { mimeType });
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = e => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  recorder.start(1000);

  return {
    stream: composed,
    mimeType,
    stop: async () =>
      await new Promise(resolve => {
        recorder.onstop = () =>
          resolve(chunks.length ? new Blob(chunks, { type: mimeType }) : null);
        try {
          recorder.stop();
        } catch {
          resolve(chunks.length ? new Blob(chunks, { type: mimeType }) : null);
        }
      }),
  };
}

export function useVideoRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const recordersRef = useRef<RecorderHandle[]>([]);
  const startedAtRef = useRef<number | null>(null);

  const startMultiCameraRecording = useCallback((streams: MediaStream[]) => {
    if (streams.length === 0) return false;
    recordersRef.current = streams.map((s, idx) => createRecorder(s, idx === 0));
    startedAtRef.current = Date.now();
    setIsRecording(true);
    return true;
  }, []);

  const stopMultiCameraRecording = useCallback(async (): Promise<{
    durationSeconds: number;
    blobs: Array<{ cameraIndex: number; blob: Blob; mimeType: string }>;
  }> => {
    const startedAt = startedAtRef.current ?? Date.now();
    const stoppedAt = Date.now();
    const durationSeconds = Math.max(0, Math.round((stoppedAt - startedAt) / 1000));

    const handles = recordersRef.current;
    recordersRef.current = [];
    startedAtRef.current = null;
    setIsRecording(false);

    const stopped = await Promise.all(handles.map(h => h.stop().then(b => ({ h, b }))));
    const blobs = stopped
      .map(({ h, b }, idx) => (b ? { cameraIndex: idx, blob: b, mimeType: h.mimeType } : null))
      .filter((x): x is { cameraIndex: number; blob: Blob; mimeType: string } => Boolean(x));

    return { durationSeconds, blobs };
  }, []);

  const uploadRecordingSet = useCallback(
    async (params: {
      sessionId: string;
      bucket?: string;
      folder?: string; // appended under user namespace
      blobs: Array<{ cameraIndex: number; blob: Blob; mimeType: string }>;
    }): Promise<
      Array<{
        cameraIndex: number;
        bucket: string;
        path: string;
        publicUrl: string;
        sizeBytes: number;
        mimeType: string;
      }>
    > => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        toast.error("Please sign in");
        return [];
      }

      const bucket =
        params.bucket ?? (import.meta as any).env?.VITE_RECORDINGS_BUCKET ?? "recordings";
      const folder = params.folder ?? `recordings/${params.sessionId}`;

      setIsUploading(true);
      setUploadPercent(0);
      try {
        const results: Array<{
          cameraIndex: number;
          path: string;
          publicUrl: string;
          sizeBytes: number;
          mimeType: string;
        }> = [];

        for (let i = 0; i < params.blobs.length; i++) {
          const item = params.blobs[i];
          const filePath = `${user.id}/${folder}/camera-${item.cameraIndex}-${Date.now()}.webm`;
          const up = await uploadVideoInChunks({
            bucket,
            filePath,
            blob: item.blob,
            contentType: item.mimeType || "video/webm",
            onProgress: p => {
              // overall progress: each camera weighted equally
              const perCamera = 100 / Math.max(1, params.blobs.length);
              const base = perCamera * i;
              setUploadPercent(Math.min(100, Math.round(base + (p.percent / 100) * perCamera)));
            },
          });
          if (!up.success || !up.path || !up.publicUrl) {
            toast.error(up.error || "Upload failed");
            return [];
          }
          results.push({
            cameraIndex: item.cameraIndex,
            bucket,
            path: up.path,
            publicUrl: up.publicUrl,
            sizeBytes: item.blob.size,
            mimeType: item.mimeType,
          });
        }

        setUploadPercent(100);
        toast.success("Upload complete");
        return results;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        logger.error("useVideoRecording: upload failed", { error: message });
        toast.error("Upload failed");
        return [];
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadPercent(0), 500);
      }
    },
    [],
  );

  const canStop = useMemo(() => isRecording, [isRecording]);

  return {
    isRecording,
    canStop,
    isUploading,
    uploadPercent,
    startMultiCameraRecording,
    stopMultiCameraRecording,
    uploadRecordingSet,
  };
}
