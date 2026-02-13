/**
 * Video Capture Tab
 * Multi-camera video recording and sync functionality (Supabase-backed)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, MonitorPlay, RefreshCw, Settings, Trash2, Users, Video } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import type { MultiCameraSession } from "@/lib/nsfwAdvancedFeatures";
import type { VideoCaptureQuality } from "./types";
import { VideoCapturePartnerTab } from "./VideoCapturePartnerTab";
import { VideoCaptureRecordTab } from "./VideoCaptureRecordTab";
import { VideoCaptureSessionsTab } from "./VideoCaptureSessionsTab";
import {
  useVideoCaptureDevices,
  useVideoCapturePreferences,
  useVideoCaptureRecording,
  useVideoCaptureSessions,
} from "./hooks";

const MAX_CAMERAS = 4;

export function VideoCaptureTab(): JSX.Element {
  const [activeTab, setActiveTab] = useState<"record" | "sessions" | "partner" | "settings">(
    "record",
  );
  const [sessionName, setSessionName] = useState(() => `Recording ${new Date().toLocaleString()}`);

  const { quality, setQuality, audioEnabled, setAudioEnabled } = useVideoCapturePreferences();
  const sessions = useVideoCaptureSessions();
  const devices = useVideoCaptureDevices({ quality, audioEnabled, maxCameras: MAX_CAMERAS });

  const recording = useVideoCaptureRecording({
    cameraStreams: devices.cameraStreams,
    startCamera: devices.startCamera,
    maxCameras: MAX_CAMERAS,
    currentSession: sessions.currentSession,
    setCurrentSession: sessions.setCurrentSession,
    addSession: sessions.addSession,
    refreshSessions: sessions.refreshSessions,
    draftSessionName: sessionName,
    quality,
    onRequestPartnerTab: () => setActiveTab("partner"),
  });

  // Apply current-session defaults once (first load).
  const didInitFromSessionRef = useRef(false);
  useEffect(() => {
    if (didInitFromSessionRef.current) return;
    if (!sessions.currentSession) return;
    didInitFromSessionRef.current = true;
    setSessionName(sessions.currentSession.session_name);
    setQuality(sessions.currentSession.quality as VideoCaptureQuality);
  }, [sessions.currentSession, setQuality]);

  useEffect(() => {
    if (activeTab === "sessions" || activeTab === "partner") {
      void sessions.refreshSessions();
    }
  }, [activeTab, sessions.refreshSessions]);

  const handleSelectSession = useCallback(
    (session: MultiCameraSession) => {
      if (recording.isRecording) {
        toast.message("Stop recording before switching sessions.");
        return;
      }
      sessions.setCurrentSession(session);
      setSessionName(session.session_name);
      setQuality(session.quality as VideoCaptureQuality);
    },
    [recording.isRecording, sessions, setQuality],
  );

  const handleToggleAudio = useCallback(
    (next: boolean) => {
      setAudioEnabled(next);
      void devices.syncAudioEnabledToStreams(next);
    },
    [devices, setAudioEnabled],
  );

  const sessionBadges = useMemo(() => {
    const s = sessions.currentSession;
    if (!s) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{s.session_type.replace("_", " ")}</Badge>
        <Badge variant="secondary">{s.quality}</Badge>
        <Badge variant="outline">{s.recording_status}</Badge>
        {recording.isRecording && <Badge className="bg-destructive">REC</Badge>}
      </div>
    );
  }, [recording.isRecording, sessions.currentSession]);

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
            {sessions.currentSession ? (
              <>
                Session:{" "}
                <span className="text-foreground">{sessions.currentSession.session_name}</span>
              </>
            ) : (
              "No session selected"
            )}
          </div>
          <div className="flex items-center gap-2">
            {sessions.sessions.length > 0 && (
              <Badge variant="secondary">{sessions.sessions.length} sessions</Badge>
            )}
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
            {recording.isUploading && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Uploading… {recording.uploadPercent}%
                </div>
                <Progress value={recording.uploadPercent} />
              </div>
            )}

            <VideoCaptureRecordTab
              cameraStreams={devices.cameraStreams}
              availableDevices={devices.availableDevices}
              isRecording={recording.isRecording}
              recordingTimeSeconds={recording.recordingTimeSeconds}
              sessionName={sessionName}
              quality={quality}
              onChangeSessionName={setSessionName}
              onChangeQuality={setQuality}
              onStartCamera={devices.startCamera}
              onStopCamera={devices.stopCamera}
              onStartRecording={recording.startRecording}
              onStopRecording={recording.stopRecording}
            />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4 mt-4">
            <VideoCaptureSessionsTab
              sessions={sessions.sessions}
              selectedSessionId={sessions.currentSession?.id ?? null}
              loading={sessions.loadingSessions}
              onSelectSession={handleSelectSession}
              onRefresh={() => void sessions.refreshSessions()}
              onRequestRecordTab={() => setActiveTab("record")}
            />
          </TabsContent>

          <TabsContent value="partner" className="space-y-4 mt-4">
            <VideoCapturePartnerTab
              sessions={sessions.sessions}
              currentSession={sessions.currentSession}
              onAddSession={sessions.addSession}
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
                    onCheckedChange={v => handleToggleAudio(Boolean(v))}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border/50 p-4 space-y-3">
                <div className="space-y-1">
                  <div className="font-medium">Devices</div>
                  <div className="text-sm text-muted-foreground">
                    {devices.cameraStreams.length} connected • {devices.availableDevices.length}{" "}
                    detected
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => void devices.refreshDevices()}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh cameras
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive"
                    onClick={devices.stopAllCameras}
                    disabled={devices.cameraStreams.length === 0 || recording.isRecording}
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
