import { useCallback, useRef, useState } from "react";
import { logger } from "@/lib/logger";

type VoiceRecordingResult = {
  blob: Blob | null;
  durationSeconds: number;
  mimeType: string;
};

function pickSupportedAudioMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return "audio/webm";
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef<number | null>(null);

  const start = useCallback(async () => {
    setError(null);
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickSupportedAudioMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(500);
      recorderRef.current = recorder;
      streamRef.current = stream;
      startedAtRef.current = Date.now();
      setDurationSeconds(0);
      setIsRecording(true);
    } catch (err) {
      logger.error("useVoiceRecorder start failed", { error: err });
      setError("Microphone access failed.");
      setIsRecording(false);
    }
  }, [isRecording]);

  const stop = useCallback(async (): Promise<VoiceRecordingResult> => {
    if (!recorderRef.current) {
      return { blob: null, durationSeconds: 0, mimeType: "audio/webm" };
    }
    const recorder = recorderRef.current;
    const startedAt = startedAtRef.current ?? Date.now();
    const mimeType = recorder.mimeType || "audio/webm";
    return await new Promise(resolve => {
      recorder.onstop = () => {
        const duration = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
        setDurationSeconds(duration);
        setIsRecording(false);
        startedAtRef.current = null;
        recorderRef.current = null;
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        const blob =
          chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: mimeType }) : null;
        chunksRef.current = [];
        resolve({ blob, durationSeconds: duration, mimeType });
      };
      try {
        recorder.stop();
      } catch (err) {
        logger.error("useVoiceRecorder stop failed", { error: err });
        resolve({ blob: null, durationSeconds: 0, mimeType });
      }
    });
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setDurationSeconds(0);
  }, []);

  return {
    isRecording,
    durationSeconds,
    error,
    start,
    stop,
    reset,
  };
}
