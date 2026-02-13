/**
 * Video Capture Tab
 * Multi-camera video recording and sync functionality (Supabase-backed)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Camera, MonitorPlay, RefreshCw, Settings, Trash2, Users, Video } from "lucide-react";
import { logger } from "@/lib/logger";
import { useVideoRecording } from "@/hooks/useVideoRecording";
import {
  createMultiCameraSession,
  getMultiCameraSessions,
  persistMultiCameraRecordingUploads,
  startRecording as markSessionRecording,
  stopRecording as markSessionCompleted,
  updateMultiCameraSessionMetadata,
  type MultiCameraSession,
} from "@/lib/nsfwAdvancedFeatures";
import { VideoCaptureRecordTab } from "./VideoCaptureRecordTab";
import { VideoCaptureSessionsTab } from "./VideoCaptureSessionsTab";
import { VideoCapturePartnerTab } from "./VideoCapturePartnerTab";
import type { CameraStream, VideoCaptureQuality } from "./types";

const LS_DEFAULT_QUALITY = "videoCapture.defaultQuality";
const LS_AUDIO_ENABLED = "videoCapture.audioEnabled";
const MAX_CAMERAS = 4;

function isQuality(v: unknown): v is VideoCaptureQuality {
  return v === "720p" || v === "1080p" || v === "2k" || v === "4k";
}

function safeStorageGet(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function qualityToIdealResolution(quality: VideoCaptureQuality): { width: number; height: number } {
  switch (quality) {
    case "720p":
      return { width: 1280, height: 720 };
    case "1080p":
      return { width: 1920, height: 1080 };
    case "2k":
      return { width: 2560, height: 1440 };
    case "4k":
      return { width: 3840, height: 2160 };
    default:
      return { width: 1920, height: 1080 };
  }
}

export function VideoCaptureTab(): JSX.Element {
  const [activeTab, setActiveTab] = useState<"record" | "sessions" | "partner" | "settings">(
    "record",
  );

  const [sessions, setSessions] = useState<MultiCameraSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [currentSession, setCurrentSession] = useState<MultiCameraSession | null>(null);

  const [sessionName, setSessionName] = useState(() => `Recording ${new Date().toLocaleString()}`);
  const [quality, setQuality] = useState<VideoCaptureQuality>(() => {
    const stored = safeStorageGet(LS_DEFAULT_QUALITY);
    return isQuality(stored) ? stored : "2k";
  });
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    const stored = safeStorageGet(LS_AUDIO_ENABLED);
    return stored === "1" || stored === "true";
  });

  const [cameraStreams, setCameraStreams] = useState<CameraStream[]>([]);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);

  const {
    isRecording,
    isUploading,
    uploadPercent,
    startMultiCameraRecording,
    stopMultiCameraRecording,
    uploadRecordingSet,
  } = useVideoRecording();

  const currentSessionRef = useRef<MultiCameraSession | null>(null);
  useEffect(() => {
    currentSessionRef.current = currentSession;
  }, [currentSession]);

  const recordingCamerasRef = useRef<CameraStream[]>([]);
  const startedUiAtRef = useRef<number | null>(null);
  const uiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recordingTimeSeconds, setRecordingTimeSeconds] = useState(0);
  const startStopBusyRef = useRef(false);

  const clearRecordingTimer = useCallback(() => {
    startedUiAtRef.current = null;
    if (uiTimerRef.current) {
      clearInterval(uiTimerRef.current);
      uiTimerRef.current = null;
    }
    setRecordingTimeSeconds(0);
  }, []);

  const startRecordingTimer = useCallback(() => {
    startedUiAtRef.current = Date.now();
    setRecordingTimeSeconds(0);
    if (uiTimerRef.current) clearInterval(uiTimerRef.current);
    uiTimerRef.current = setInterval(() => {
      const startedAt = startedUiAtRef.current;
      if (!startedAt) return;
      setRecordingTimeSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
  }, []);

  const stopAllCameras = useCallback(() => {
    setCameraStreams(prev => {
      for (const cam of prev) {
        cam.stream.getTracks().forEach(t => t.stop());
      }
      return [];
    });
  }, []);

  const loadDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      setAvailableDevices([]);
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAvailableDevices(devices.filter(d => d.kind === "videoinput"));
    } catch (err) {
      logger.error("VideoCaptureTab: enumerateDevices failed", { error: err });
      setAvailableDevices([]);
    }
  }, []);

  useEffect(() => {
    void loadDevices();
    const md = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!md?.addEventListener) return;
    md.addEventListener("devicechange", loadDevices);
    return () => md.removeEventListener("devicechange", loadDevices);
  }, [loadDevices]);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const list = await getMultiCameraSessions();
      setSessions(list);

      const prevId = currentSessionRef.current?.id ?? null;
      if (prevId) {
        const updated = list.find(s => s.id === prevId) ?? null;
        if (updated) setCurrentSession(updated);
        return;
      }

      if (list[0]) {
        setCurrentSession(list[0]);
        setSessionName(list[0].session_name);
        if (isQuality(list[0].quality)) {
          setQuality(list[0].quality);
          safeStorageSet(LS_DEFAULT_QUALITY, list[0].quality);
        }
      }
    } catch (err) {
      logger.error("VideoCaptureTab: failed to load sessions", { error: err });
      toast.error("Failed to load recording sessions");
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (activeTab === "sessions" || activeTab === "partner") {
      void loadSessions();
    }
  }, [activeTab, loadSessions]);

  const startCamera = useCallback(
    async (deviceId?: string): Promise<CameraStream | null> => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        toast.error("Camera capture is not available in this environment");
        return null;
      }
      if (cameraStreams.length >= MAX_CAMERAS) {
        toast.error(`Maximum cameras connected (${MAX_CAMERAS})`);
        return null;
      }

      const existing = deviceId ? (cameraStreams.find(c => c.deviceId === deviceId) ?? null) : null;
      if (existing) return existing;

      try {
        const { width, height } = qualityToIdealResolution(quality);

        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: 30, max: 60 },
        };
        if (deviceId) videoConstraints.deviceId = { exact: deviceId };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        // Best-effort microphone attachment for camera 1 only; do not block video capture.
        if (audioEnabled && cameraStreams.length === 0 && stream.getAudioTracks().length === 0) {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });
            for (const t of audioStream.getAudioTracks()) stream.addTrack(t);
          } catch (err) {
            logger.warn("VideoCaptureTab: mic permission denied; continuing without audio", {
              error: err,
            });
            toast.message("Microphone not available; recording will be silent.");
          }
        }

        const track = stream.getVideoTracks()[0] ?? null;
        const settings = typeof track?.getSettings === "function" ? track.getSettings() : null;
        const resolvedDeviceId =
          (typeof settings?.deviceId === "string" && settings.deviceId.length > 0
            ? settings.deviceId
            : null) ??
          deviceId ??
          "default";

        const deviceLabel =
          availableDevices.find(d => d.deviceId === resolvedDeviceId)?.label ??
          availableDevices.find(d => d.deviceId === deviceId)?.label ??
          "";
        const label =
          (typeof track?.label === "string" && track.label.trim().length > 0
            ? track.label
            : deviceLabel) || `Camera ${cameraStreams.length + 1}`;

        const id =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `cam-${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const cam: CameraStream = { id, stream, deviceId: resolvedDeviceId, label };
        setCameraStreams(prev => [...prev, cam]);
        toast.success(`Camera "${label}" connected`);
        return cam;
      } catch (err) {
        logger.error("VideoCaptureTab: getUserMedia failed", { error: err });
        toast.error("Failed to access camera. Please check permissions.");
        return null;
      }
    },
    [audioEnabled, availableDevices, cameraStreams, quality],
  );

  const stopCamera = useCallback((cameraId: string) => {
    setCameraStreams(prev => {
      const target = prev.find(c => c.id === cameraId) ?? null;
      if (target) {
        target.stream.getTracks().forEach(t => t.stop());
        toast.success(`Camera "${target.label}" disconnected`);
      }
      return prev.filter(c => c.id !== cameraId);
    });
  }, []);

  const handleSelectSession = useCallback(
    (session: MultiCameraSession) => {
      if (isRecording) {
        toast.message("Stop recording before switching sessions.");
        return;
      }
      setCurrentSession(session);
      setSessionName(session.session_name);
      if (isQuality(session.quality)) {
        setQuality(session.quality);
        safeStorageSet(LS_DEFAULT_QUALITY, session.quality);
      }
    },
    [isRecording],
  );

  const handleAddSession = useCallback((session: MultiCameraSession) => {
    setSessions(prev => (prev.some(s => s.id === session.id) ? prev : [session, ...prev]));
  }, []);

  const handleChangeQuality = useCallback((next: VideoCaptureQuality) => {
    setQuality(next);
    safeStorageSet(LS_DEFAULT_QUALITY, next);
  }, []);

  const handleToggleAudio = useCallback(
    async (next: boolean) => {
      setAudioEnabled(next);
      safeStorageSet(LS_AUDIO_ENABLED, next ? "1" : "0");

      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return;

      if (!next) {
        // Stop and detach all audio tracks from existing streams.
        setCameraStreams(prev => {
          for (const cam of prev) {
            for (const t of cam.stream.getAudioTracks()) {
              try {
                cam.stream.removeTrack(t);
              } catch {
                // ignore
              }
              t.stop();
            }
          }
          return [...prev];
        });
        return;
      }

      // Enable mic on camera 1 best-effort (helps when cameras were connected before toggling).
      const first = cameraStreams[0] ?? null;
      if (!first || first.stream.getAudioTracks().length > 0) return;
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        for (const t of audioStream.getAudioTracks()) first.stream.addTrack(t);
        toast.success("Microphone enabled for recordings");
      } catch (err) {
        logger.warn("VideoCaptureTab: mic permission denied; continuing without audio", {
          error: err,
        });
        toast.message("Microphone not available; recording will be silent.");
      }
    },
    [cameraStreams],
  );

  const handleStartRecording = useCallback(async (): Promise<void> => {
    if (startStopBusyRef.current) return;
    if (isRecording || isUploading) return;

    startStopBusyRef.current = true;
    try {
      let cams = cameraStreams;
      if (cams.length === 0) {
        const cam = await startCamera();
        if (!cam) return;
        cams = [cam];
      }

      const existing = currentSessionRef.current;
      const reusable =
        Boolean(existing) &&
        (existing!.recording_status === "draft" || existing!.recording_status === "paused");

      if (existing?.session_type === "partner_sync" && !reusable) {
        toast.message("Create a new shared session in Partner Sync before recording.");
        setActiveTab("partner");
        return;
      }

      const effectiveName = sessionName.trim() || `Recording ${new Date().toLocaleString()}`;

      let session: MultiCameraSession | null = reusable ? existing! : null;
      if (!session) {
        session = await createMultiCameraSession(effectiveName, "multi_camera", null, quality);
        if (!session) return;
        setCurrentSession(session);
        setSessions(prev => (prev.some(s => s.id === session!.id) ? prev : [session!, ...prev]));
      } else if (effectiveName !== session.session_name || quality !== session.quality) {
        const updated = await updateMultiCameraSessionMetadata(session.id, {
          session_name: effectiveName,
          quality,
        });
        if (updated) {
          session = updated;
          setCurrentSession(updated);
          setSessions(prev => prev.map(s => (s.id === updated.id ? updated : s)));
        }
      }

      const ok = await markSessionRecording(session.id);
      if (!ok) return;

      const camerasForRecording = cams.slice(0, MAX_CAMERAS);
      recordingCamerasRef.current = camerasForRecording;

      const started = startMultiCameraRecording(camerasForRecording.map(c => c.stream));
      if (!started) {
        toast.error("Failed to start recording");
        return;
      }

      startRecordingTimer();
      await loadSessions();
    } finally {
      startStopBusyRef.current = false;
    }
  }, [
    cameraStreams,
    isRecording,
    isUploading,
    loadSessions,
    quality,
    sessionName,
    startCamera,
    startMultiCameraRecording,
    startRecordingTimer,
  ]);

  const handleStopRecording = useCallback(async (): Promise<void> => {
    if (startStopBusyRef.current) return;
    if (!isRecording) return;

    startStopBusyRef.current = true;
    try {
      const session = currentSessionRef.current;
      if (!session) {
        toast.error("No session selected");
        return;
      }

      clearRecordingTimer();
      const { durationSeconds, blobs } = await stopMultiCameraRecording();
      recordingCamerasRef.current = recordingCamerasRef.current.length
        ? recordingCamerasRef.current
        : cameraStreams;

      await markSessionCompleted(session.id, durationSeconds);

      if (blobs.length === 0) {
        toast.error("No video data captured");
        await loadSessions();
        return;
      }

      toast.success("Recording stopped. Uploading…");
      const uploads = await uploadRecordingSet({ sessionId: session.id, blobs });
      if (uploads.length > 0) {
        const cams = recordingCamerasRef.current;
        await persistMultiCameraRecordingUploads({
          session,
          uploads,
          durationSeconds,
          cameraStreams: cams.map(c => c.stream),
          cameraLabels: cams.map(c => c.label),
          cameraDeviceIds: cams.map(c => c.deviceId),
        });
      }

      recordingCamerasRef.current = [];
      await loadSessions();
    } finally {
      startStopBusyRef.current = false;
    }
  }, [
    cameraStreams,
    clearRecordingTimer,
    isRecording,
    loadSessions,
    stopMultiCameraRecording,
    uploadRecordingSet,
  ]);

  useEffect(() => {
    // Warn if the user tries to close while recording.
    if (typeof window === "undefined") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isRecording) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      clearRecordingTimer();
      stopAllCameras();
    };
  }, [clearRecordingTimer, stopAllCameras]);

  const sessionBadges = useMemo(() => {
    if (!currentSession) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{currentSession.session_type.replace("_", " ")}</Badge>
        <Badge variant="secondary">{currentSession.quality}</Badge>
        <Badge variant="outline">{currentSession.recording_status}</Badge>
        {isRecording && <Badge className="bg-destructive">REC</Badge>}
      </div>
    );
  }, [currentSession, isRecording]);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-6 h-6" />
          Video Capture & Recording
        </CardTitle>
        <CardDescription>
          Record multi-camera videos, sync with partner, and manage your recordings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {currentSession ? (
              <>
                Session: <span className="text-foreground">{currentSession.session_name}</span>
              </>
            ) : (
              "No session selected"
            )}
          </div>
          <div className="flex items-center gap-2">
            {sessions.length > 0 && <Badge variant="secondary">{sessions.length} sessions</Badge>}
          </div>
        </div>

        {sessionBadges}

        <Tabs
          value={activeTab}
          onValueChange={v => setActiveTab(v as "record" | "sessions" | "partner" | "settings")}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="record" className="gap-2">
              <Camera className="w-4 h-4" />
              Record
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <MonitorPlay className="w-4 h-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="partner" className="gap-2">
              <Users className="w-4 h-4" />
              Partner Sync
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="record" className="space-y-4 mt-4">
            {isUploading && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Uploading… {uploadPercent}%</div>
                <Progress value={uploadPercent} />
              </div>
            )}

            <VideoCaptureRecordTab
              cameraStreams={cameraStreams}
              availableDevices={availableDevices}
              isRecording={isRecording}
              recordingTimeSeconds={recordingTimeSeconds}
              sessionName={sessionName}
              quality={quality}
              onChangeSessionName={setSessionName}
              onChangeQuality={handleChangeQuality}
              onStartCamera={startCamera}
              onStopCamera={stopCamera}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
            />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4 mt-4">
            <VideoCaptureSessionsTab
              sessions={sessions}
              selectedSessionId={currentSession?.id ?? null}
              loading={loadingSessions}
              onSelectSession={handleSelectSession}
              onRefresh={() => void loadSessions()}
              onRequestRecordTab={() => setActiveTab("record")}
            />
          </TabsContent>

          <TabsContent value="partner" className="space-y-4 mt-4">
            <VideoCapturePartnerTab
              sessions={sessions}
              currentSession={currentSession}
              onAddSession={handleAddSession}
              onSelectSession={handleSelectSession}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border/50 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-medium">Microphone audio</div>
                    <div className="text-sm text-muted-foreground">
                      Include mic audio (camera 1). Recording still works without it.
                    </div>
                  </div>
                  <Switch
                    checked={audioEnabled}
                    onCheckedChange={v => void handleToggleAudio(Boolean(v))}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border/50 p-4 space-y-3">
                <div className="space-y-1">
                  <div className="font-medium">Devices</div>
                  <div className="text-sm text-muted-foreground">
                    {cameraStreams.length} connected • {availableDevices.length} detected
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => void loadDevices()}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh cameras
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive"
                    onClick={stopAllCameras}
                    disabled={cameraStreams.length === 0 || isRecording}
                  >
                    <Trash2 className="w-4 h-4" />
                    Stop all
                  </Button>
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-xs text-muted-foreground">Defaults</Label>
                  <div className="text-sm text-muted-foreground">
                    Quality is remembered automatically:{" "}
                    <span className="text-foreground">{quality}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default VideoCaptureTab;
