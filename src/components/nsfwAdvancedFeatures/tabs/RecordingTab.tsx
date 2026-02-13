import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import {
  createMultiCameraSession,
  getMultiCameraSessions,
  persistMultiCameraRecordingUploads,
  startRecording,
  stopRecording,
  type MultiCameraSession,
} from "@/lib/nsfwAdvancedFeatures";
import { useVideoRecording } from "@/hooks/useVideoRecording";
import { Play, Square } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PartnerSyncRecordingPanel } from "./PartnerSyncRecordingPanel";

type VideoRefs = Record<number, HTMLVideoElement | null>;

export function RecordingTab({ isActive }: { isActive: boolean }): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<MultiCameraSession[]>([]);
  const [currentSession, setCurrentSession] = useState<MultiCameraSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraStreams, setCameraStreams] = useState<MediaStream[]>([]);
  const {
    startMultiCameraRecording,
    stopMultiCameraRecording,
    uploadRecordingSet,
    isUploading,
    uploadPercent,
  } = useVideoRecording();
  const videoRefs = useRef<VideoRefs>({});
  const startedAtRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getMultiCameraSessions();
      setSessions(list);
      if (!currentSession && list[0]) setCurrentSession(list[0]);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [currentSession]);

  useEffect(() => {
    if (!isActive) return;
    void load();
  }, [isActive, load]);

  const stopAllStreams = useCallback(() => {
    cameraStreams.forEach(stream => stream.getTracks().forEach(t => t.stop()));
    setCameraStreams([]);
  }, [cameraStreams]);

  const attachStreams = useCallback((streams: MediaStream[]) => {
    streams.forEach((stream, idx) => {
      const el = videoRefs.current[idx];
      if (el) el.srcObject = stream;
    });
  }, []);

  const initializeCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      if (videoDevices.length === 0) {
        toast.error("No cameras detected");
        return [];
      }

      const max = Math.min(videoDevices.length, 4);
      const streams: MediaStream[] = [];
      for (let i = 0; i < max; i++) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: videoDevices[i]?.deviceId },
          audio: true,
        });
        streams.push(stream);
      }

      setCameraStreams(streams);
      attachStreams(streams);
      return streams;
    } catch (error) {
      logger.error("Error initializing cameras", { error });
      toast.error("Failed to access cameras");
      return [];
    }
  }, [attachStreams]);

  const effectiveSessionName = useMemo(() => `Recording ${new Date().toLocaleString()}`, []);

  const handleStartRecording = useCallback(async () => {
    setLoading(true);
    try {
      let session = currentSession;
      if (!session) {
        session = await createMultiCameraSession(
          effectiveSessionName,
          "multi_camera",
          null,
          "1080p",
        );
        if (!session) {
          toast.error("Failed to create session");
          return;
        }
        setCurrentSession(session);
        setSessions(prev => [session!, ...prev]);
      }

      const ok = await startRecording(session.id);
      if (!ok) {
        toast.error("Failed to start recording");
        return;
      }
      startedAtRef.current = Date.now();
      setIsRecording(true);
      const streams = await initializeCameras();
      if (streams.length > 0) {
        startMultiCameraRecording(streams);
      }
    } finally {
      setLoading(false);
    }
  }, [currentSession, effectiveSessionName, initializeCameras, startMultiCameraRecording]);

  const handleStopRecording = useCallback(async () => {
    if (!currentSession) return;
    setLoading(true);
    try {
      const { durationSeconds, blobs } = await stopMultiCameraRecording();
      const streamsForMeta = cameraStreams;
      stopAllStreams();
      const duration =
        durationSeconds ??
        (startedAtRef.current
          ? Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000))
          : 0);
      await stopRecording(currentSession.id, duration);
      setIsRecording(false);
      startedAtRef.current = null;
      toast.success("Recording stopped. Uploading…");

      if (blobs.length > 0) {
        const uploads = await uploadRecordingSet({ sessionId: currentSession.id, blobs });
        if (uploads.length > 0) {
          await persistMultiCameraRecordingUploads({
            session: currentSession,
            uploads,
            durationSeconds: duration,
            cameraStreams: streamsForMeta,
          });
        }
      }
      await load();
    } finally {
      setLoading(false);
    }
  }, [
    cameraStreams,
    currentSession,
    load,
    stopAllStreams,
    stopMultiCameraRecording,
    uploadRecordingSet,
  ]);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle>Multi-Camera Recording</CardTitle>
        <CardDescription>
          Record with multiple cameras and create professional content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {currentSession ? (
              <span>
                Session: <span className="text-foreground">{currentSession.session_name}</span>
              </span>
            ) : (
              <span>No session selected</span>
            )}
          </div>
          {sessions.length > 0 && <Badge variant="secondary">{sessions.length} sessions</Badge>}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleStartRecording}
            disabled={isRecording || loading}
            className="flex-1"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Recording
          </Button>
          <Button
            onClick={handleStopRecording}
            disabled={!isRecording || loading || isUploading}
            variant="destructive"
            className="flex-1"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop Recording
          </Button>
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Uploading… {uploadPercent}%</div>
            <Progress value={uploadPercent} />
          </div>
        )}

        <PartnerSyncRecordingPanel
          sessions={sessions}
          currentSession={currentSession}
          onAddSession={session =>
            setSessions(prev => (prev.some(s => s.id === session.id) ? prev : [session, ...prev]))
          }
          onSelectSession={session => setCurrentSession(session)}
        />

        {isRecording && cameraStreams.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {cameraStreams.map((stream, index) => (
              <div
                key={stream.id}
                className="relative aspect-video bg-black rounded overflow-hidden"
              >
                <video
                  ref={el => {
                    videoRefs.current[index] = el;
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  Camera {index + 1}
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  REC
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && <div className="text-sm text-muted-foreground">Working…</div>}
      </CardContent>
    </Card>
  );
}
