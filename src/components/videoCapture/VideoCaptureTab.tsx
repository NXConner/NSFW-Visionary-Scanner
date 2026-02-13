/**
 * Video Capture Tab
 * Multi-camera video recording and sync functionality
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Camera, MonitorPlay, Settings, Users, Video } from "lucide-react";
import { getPartnerUserId, usePartnerConnection } from "@/lib/partnerSync";
import { logger } from "@/lib/logger";
import {
  createMultiCameraSession,
  getMultiCameraSessions,
  startRecording,
  stopRecording,
  type MultiCameraSession,
} from "@/lib/nsfwAdvancedFeatures";
import type { CameraStream } from "./types";
import { formatSessionMeta, formatTime } from "./utils";
import { PartnerTab, RecordTab, SessionsTab, SettingsTab } from "./tabs";
import { AcceptInviteDialog, AddCameraDialog, InvitePartnerDialog } from "./dialogs";

export function VideoCaptureTab(): JSX.Element {
  const [activeTab, setActiveTab] = useState("record");
  const [isRecording, setIsRecording] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [quality, setQuality] = useState<MultiCameraSession["quality"]>("1080p");
  const [cameraStreams, setCameraStreams] = useState<CameraStream[]>([]);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [sessions, setSessions] = useState<MultiCameraSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showAddCameraDialog, setShowAddCameraDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showAcceptInviteDialog, setShowAcceptInviteDialog] = useState(false);
  const [partnerIdInput, setPartnerIdInput] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [inviteDays, setInviteDays] = useState("7");
  const [recordingTime, setRecordingTime] = useState(0);

  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    activeConnection,
    pendingIncoming,
    pendingOutgoing,
    loading: partnerLoading,
    lastInviteCode,
    currentUserId,
    sendInvite,
    acceptInviteByCode,
    acceptConnection,
    declineConnection,
    disconnect,
  } = usePartnerConnection();

  const loadDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      setAvailableDevices(videoDevices);
    } catch (err) {
      logger.error("Failed to enumerate devices", { error: err });
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const data = await getMultiCameraSessions();
      setSessions(data);
      setActiveSessionId(prev => prev ?? data[0]?.id ?? null);
    } catch {
      toast.error("Failed to load recording sessions");
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    void loadDevices();
    navigator.mediaDevices.addEventListener("devicechange", loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
    };
  }, [loadDevices]);

  useEffect(() => {
    if (activeTab !== "sessions") return;
    void loadSessions();
  }, [activeTab, loadSessions]);

  const startCamera = useCallback(
    async (deviceId?: string) => {
      try {
        const constraints: MediaStreamConstraints = {
          video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "user" },
          audio: false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();

        const newCamera: CameraStream = {
          id: crypto.randomUUID(),
          stream,
          deviceId: settings.deviceId || deviceId || "default",
          label: track.label || `Camera ${cameraStreams.length + 1}`,
        };

        setCameraStreams(prev => [...prev, newCamera]);
        toast.success(`Camera "${newCamera.label}" connected`);
        return newCamera;
      } catch (err) {
        logger.error("Failed to start camera", { error: err });
        toast.error("Failed to access camera. Please check permissions.");
        return null;
      }
    },
    [cameraStreams.length],
  );

  const stopCamera = useCallback((cameraId: string) => {
    setCameraStreams(prev => {
      const camera = prev.find(c => c.id === cameraId);
      if (camera) {
        camera.stream.getTracks().forEach(track => track.stop());
        toast.success(`Camera "${camera.label}" disconnected`);
      }
      return prev.filter(c => c.id !== cameraId);
    });
  }, []);

  const stopAllCameras = useCallback(() => {
    cameraStreams.forEach(camera => {
      camera.stream.getTracks().forEach(track => track.stop());
    });
    setCameraStreams([]);
  }, [cameraStreams]);

  const setVideoRef = useCallback(
    (cameraId: string, el: HTMLVideoElement | null) => {
      if (el) {
        videoRefs.current.set(cameraId, el);
        const camera = cameraStreams.find(c => c.id === cameraId);
        if (camera && el.srcObject !== camera.stream) {
          el.srcObject = camera.stream;
        }
      } else {
        videoRefs.current.delete(cameraId);
      }
    },
    [cameraStreams],
  );

  const handleStartRecording = useCallback(async () => {
    if (cameraStreams.length === 0) {
      const camera = await startCamera();
      if (!camera) return;
    }

    let sessionId = activeSessionId;
    if (!sessionId) {
      const resolvedName =
        sessionName.trim() ||
        `Recording ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      const partnerId = getPartnerUserId(activeConnection, currentUserId);
      const sessionType = partnerId
        ? "partner_sync"
        : cameraStreams.length > 1
          ? "multi_camera"
          : "solo";

      const created = await createMultiCameraSession(resolvedName, sessionType, partnerId, quality);
      if (!created) return;
      sessionId = created.id;
      setActiveSessionId(created.id);
      setSessionName(created.session_name);
      await loadSessions();
    }

    const started = await startRecording(sessionId);
    if (!started) return;

    setIsRecording(true);
    setRecordingTime(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  }, [
    activeConnection,
    activeSessionId,
    cameraStreams.length,
    currentUserId,
    loadSessions,
    quality,
    sessionName,
    startCamera,
  ]);

  const handleStopRecording = useCallback(async () => {
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (activeSessionId) {
      await stopRecording(activeSessionId, recordingTime);
      await loadSessions();
    }
    toast.success(`Recording saved (${formatTime(recordingTime)})`);
  }, [activeSessionId, loadSessions, recordingTime]);

  const handleAddCamera = useCallback(
    async (deviceId?: string) => {
      await startCamera(deviceId);
      setShowAddCameraDialog(false);
    },
    [startCamera],
  );

  const handleSendInvite = useCallback(async () => {
    const days = Number(inviteDays) || 7;
    const result = await sendInvite({ partnerId: partnerIdInput, expiresInDays: days });
    if (result) {
      setPartnerIdInput("");
      setShowInviteDialog(false);
    }
  }, [inviteDays, partnerIdInput, sendInvite]);

  const handleAcceptInvite = useCallback(async () => {
    const result = await acceptInviteByCode(inviteCodeInput);
    if (result) {
      setInviteCodeInput("");
      setShowAcceptInviteDialog(false);
    }
  }, [acceptInviteByCode, inviteCodeInput]);

  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Invite code copied!");
    } catch {
      toast.error("Failed to copy");
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAllCameras();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [stopAllCameras]);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-6 h-6" />
          Video Capture &amp; Recording
        </CardTitle>
        <CardDescription>
          Record multi-camera videos, sync with partner, and manage your recordings
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
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

          <TabsContent value="record">
            <RecordTab
              cameraStreams={cameraStreams}
              availableDevicesCount={availableDevices.length}
              isRecording={isRecording}
              recordingTime={recordingTime}
              formatTime={formatTime}
              setVideoRef={setVideoRef}
              onStartCamera={startCamera}
              onStopCamera={stopCamera}
              onStartRecording={() => void handleStartRecording()}
              onStopRecording={() => void handleStopRecording()}
              sessionName={sessionName}
              onSessionNameChange={setSessionName}
              quality={quality}
              onQualityChange={setQuality}
              onOpenAddCameraDialog={() => setShowAddCameraDialog(true)}
            />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4 mt-4">
            <SessionsTab
              loadingSessions={loadingSessions}
              sessions={sessions}
              formatSessionMeta={formatSessionMeta}
              onStartRecording={() => setActiveTab("record")}
            />
          </TabsContent>

          <TabsContent value="partner">
            <PartnerTab
              activeConnection={activeConnection}
              pendingIncoming={pendingIncoming}
              pendingOutgoing={pendingOutgoing}
              partnerLoading={partnerLoading}
              onDisconnect={id => void disconnect(id)}
              onAcceptConnection={id => void acceptConnection(id)}
              onDeclineConnection={id => void declineConnection(id)}
              onOpenInviteDialog={() => setShowInviteDialog(true)}
              onOpenAcceptInviteDialog={() => setShowAcceptInviteDialog(true)}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </CardContent>

      <AddCameraDialog
        open={showAddCameraDialog}
        onOpenChange={setShowAddCameraDialog}
        availableDevices={availableDevices}
        cameraStreams={cameraStreams}
        onAddCamera={deviceId => void handleAddCamera(deviceId)}
      />

      <InvitePartnerDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        partnerLoading={partnerLoading}
        currentUserId={currentUserId}
        partnerIdInput={partnerIdInput}
        onPartnerIdInputChange={setPartnerIdInput}
        inviteDays={inviteDays}
        onInviteDaysChange={setInviteDays}
        lastInviteCode={lastInviteCode}
        onCopyCode={code => void handleCopyCode(code)}
        onSendInvite={() => void handleSendInvite()}
      />

      <AcceptInviteDialog
        open={showAcceptInviteDialog}
        onOpenChange={setShowAcceptInviteDialog}
        partnerLoading={partnerLoading}
        inviteCodeInput={inviteCodeInput}
        onInviteCodeInputChange={setInviteCodeInput}
        onAcceptInvite={() => void handleAcceptInvite()}
      />
    </Card>
  );
}

export default VideoCaptureTab;
