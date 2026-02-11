/**
 * Video Capture Tab
 * Multi-camera video recording and sync functionality
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  Check,
  Circle,
  Copy,
  Edit,
  Link2,
  MonitorPlay,
  Play,
  Plus,
  Send,
  Settings,
  Square,
  Trash2,
  UserPlus,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { usePartnerConnection } from "@/lib/partnerSync";
import { logger } from "@/lib/logger";

interface RecordingSession {
  id: string;
  name: string;
  status: "idle" | "recording" | "paused" | "completed";
  cameras: number;
  duration?: string;
  createdAt: string;
}

interface CameraStream {
  id: string;
  stream: MediaStream;
  deviceId: string;
  label: string;
}

// Mock sessions for display
const mockSessions: RecordingSession[] = [
  {
    id: "1",
    name: "Progress Recording - Week 12",
    status: "completed",
    cameras: 2,
    duration: "05:32",
    createdAt: "2 hours ago",
  },
  {
    id: "2",
    name: "Routine Documentation",
    status: "completed",
    cameras: 1,
    duration: "12:45",
    createdAt: "Yesterday",
  },
];

export function VideoCaptureTab() {
  const [activeTab, setActiveTab] = useState("record");
  const [isRecording, setIsRecording] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [quality, setQuality] = useState("2k");
  const [cameraStreams, setCameraStreams] = useState<CameraStream[]>([]);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [showAddCameraDialog, setShowAddCameraDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showAcceptInviteDialog, setShowAcceptInviteDialog] = useState(false);
  const [partnerIdInput, setPartnerIdInput] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [inviteDays, setInviteDays] = useState("7");
  const [recordingTime, setRecordingTime] = useState(0);

  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Partner connection hook
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

  // Load available camera devices
  const loadDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      setAvailableDevices(videoDevices);
    } catch (err) {
      logger.error("Failed to enumerate devices", { error: err });
    }
  }, []);

  useEffect(() => {
    void loadDevices();
    navigator.mediaDevices.addEventListener("devicechange", loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
    };
  }, [loadDevices]);

  // Format recording time
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start camera stream
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

  // Stop a camera stream
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

  // Stop all cameras
  const stopAllCameras = useCallback(() => {
    cameraStreams.forEach(camera => {
      camera.stream.getTracks().forEach(track => track.stop());
    });
    setCameraStreams([]);
  }, [cameraStreams]);

  // Attach stream to video element
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

  // Handle recording
  const handleStartRecording = useCallback(async () => {
    if (cameraStreams.length === 0) {
      const camera = await startCamera();
      if (!camera) return;
    }
    setIsRecording(true);
    setRecordingTime(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    toast.success("Recording started");
  }, [cameraStreams.length, startCamera]);

  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    toast.success(`Recording saved (${formatTime(recordingTime)})`);
  }, [recordingTime]);

  // Add camera dialog
  const handleAddCamera = useCallback(
    async (deviceId?: string) => {
      await startCamera(deviceId);
      setShowAddCameraDialog(false);
    },
    [startCamera],
  );

  // Partner invite
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllCameras();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [stopAllCameras]);

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

          <TabsContent value="record" className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Camera Preview */}
              <div className="space-y-4">
                {cameraStreams.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {cameraStreams.map((camera, idx) => (
                      <div key={camera.id} className="relative">
                        <div className="aspect-video bg-muted/30 rounded-lg overflow-hidden border-2 border-primary/30">
                          <video
                            ref={el => setVideoRef(camera.id, el)}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-2 left-2 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Camera {idx + 1}
                          </Badge>
                          {isRecording && (
                            <Badge className="bg-destructive animate-pulse text-xs">
                              <Circle className="w-2 h-2 mr-1 fill-current" /> REC
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => stopCamera(camera.id)}
                          disabled={isRecording}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video bg-muted/30 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                    <div className="text-center">
                      <VideoOff className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No cameras connected</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => startCamera()}
                      >
                        Enable Camera
                      </Button>
                    </div>
                  </div>
                )}

                {isRecording && (
                  <div className="text-center py-2">
                    <p className="text-2xl font-mono font-bold text-destructive">
                      {formatTime(recordingTime)}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {!isRecording ? (
                    <Button
                      onClick={handleStartRecording}
                      className="flex-1 gap-2"
                      variant="destructive"
                    >
                      <Circle className="w-4 h-4" />
                      Start Recording
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleStopRecording}
                        className="flex-1 gap-2"
                        variant="outline"
                      >
                        <Square className="w-4 h-4" />
                        Stop
                      </Button>
                      <Button variant="outline" className="gap-2" disabled>
                        <Play className="w-4 h-4" />
                        Pause
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Recording Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Session Name</Label>
                  <Input
                    placeholder="Enter session name..."
                    value={sessionName}
                    onChange={e => setSessionName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Video Quality</Label>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p HD</SelectItem>
                      <SelectItem value="1080p">1080p Full HD</SelectItem>
                      <SelectItem value="2k">2K QHD (Default)</SelectItem>
                      <SelectItem value="4k">4K Ultra HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Connected Cameras</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      {cameraStreams.length} camera{cameraStreams.length !== 1 ? "s" : ""} active
                    </Badge>
                    <Badge variant="secondary" className="text-sm">
                      {availableDevices.length} available
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowAddCameraDialog(true)}
                  disabled={isRecording}
                >
                  <Plus className="w-4 h-4" />
                  Connect More Cameras
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4 mt-4">
            {mockSessions.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No recording sessions yet</p>
                <Button className="mt-4" onClick={() => setActiveTab("record")}>
                  Start Recording
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {mockSessions.map(session => (
                  <Card key={session.id} className="hover:bg-muted/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-muted/50">
                          <Video className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{session.name}</span>
                            <Badge variant="secondary">{session.cameras} camera(s)</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {session.duration} • {session.createdAt}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="gap-1">
                            <Play className="w-3 h-3" />
                            Play
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="partner" className="space-y-4 mt-4">
            {activeConnection ? (
              <Card className="border-success/30 bg-success/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-success/10">
                      <Check className="w-6 h-6 text-success" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Partner Connected</span>
                        <Badge className="bg-success">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ready to sync recording sessions
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void disconnect(activeConnection.id)}
                      className="gap-1 text-destructive"
                      disabled={partnerLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Partner Sync Recording</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                      Sync your recording session with a partner's device for multi-angle captures
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        className="gap-2"
                        onClick={() => setShowInviteDialog(true)}
                        disabled={partnerLoading}
                      >
                        <Plus className="w-4 h-4" />
                        Invite Partner
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowAcceptInviteDialog(true)}
                        disabled={partnerLoading}
                      >
                        Enter Invite Code
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending invites */}
            {(pendingIncoming.length > 0 || pendingOutgoing.length > 0) && (
              <div className="space-y-3">
                <h3 className="font-medium">Pending Invites</h3>
                {pendingIncoming.map(invite => (
                  <Card key={invite.id} className="border-primary/30">
                    <CardContent className="pt-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">Incoming Invite</p>
                        <p className="text-xs text-muted-foreground">From: {invite.user_id}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => void acceptConnection(invite.id)}
                          disabled={partnerLoading}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void declineConnection(invite.id)}
                          disabled={partnerLoading}
                        >
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pendingOutgoing.map(invite => (
                  <Card key={invite.id} className="border-border/60">
                    <CardContent className="pt-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">Outgoing Invite</p>
                        <p className="text-xs text-muted-foreground">To: {invite.partner_id}</p>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Default Quality</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Set the default recording quality
                  </p>
                  <Select defaultValue="1080p">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p HD</SelectItem>
                      <SelectItem value="1080p">1080p Full HD</SelectItem>
                      <SelectItem value="4k">4K Ultra HD</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Storage Location</h4>
                  <p className="text-sm text-muted-foreground mb-3">Where recordings are saved</p>
                  <Select defaultValue="cloud">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cloud">Cloud Storage</SelectItem>
                      <SelectItem value="local">Local Device</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Add Camera Dialog */}
      <Dialog open={showAddCameraDialog} onOpenChange={setShowAddCameraDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Connect Camera
            </DialogTitle>
            <DialogDescription>Select a camera to add to your recording session</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {availableDevices.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No cameras detected. Please connect a camera and try again.
              </p>
            ) : (
              availableDevices.map(device => {
                const isConnected = cameraStreams.some(c => c.deviceId === device.deviceId);
                return (
                  <Button
                    key={device.deviceId}
                    variant={isConnected ? "secondary" : "outline"}
                    className="w-full justify-start gap-3"
                    onClick={() => !isConnected && handleAddCamera(device.deviceId)}
                    disabled={isConnected}
                  >
                    <Camera className="w-4 h-4" />
                    <span className="flex-1 text-left truncate">
                      {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                    </span>
                    {isConnected && <Badge variant="outline">Connected</Badge>}
                  </Button>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCameraDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleAddCamera()} disabled={availableDevices.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Add Default Camera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Partner Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Invite Partner
            </DialogTitle>
            <DialogDescription>
              Send an invite to sync recording sessions with your partner
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Your User ID</Label>
              <div className="flex gap-2">
                <Input value={currentUserId || ""} readOnly className="font-mono text-xs" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => currentUserId && handleCopyCode(currentUserId)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Share this with your partner</p>
            </div>
            <div className="space-y-2">
              <Label>Partner's User ID</Label>
              <Input
                value={partnerIdInput}
                onChange={e => setPartnerIdInput(e.target.value)}
                placeholder="Enter partner's user ID"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Invite Valid For</Label>
              <Select value={inviteDays} onValueChange={setInviteDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {lastInviteCode && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                <p className="text-sm font-medium mb-2">Invite Code Created!</p>
                <div className="flex gap-2">
                  <Input value={lastInviteCode} readOnly className="font-mono" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyCode(lastInviteCode)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendInvite} disabled={partnerLoading || !partnerIdInput.trim()}>
              <Link2 className="w-4 h-4 mr-2" />
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Invite Dialog */}
      <Dialog open={showAcceptInviteDialog} onOpenChange={setShowAcceptInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Accept Invite
            </DialogTitle>
            <DialogDescription>
              Enter the invite code from your partner to connect
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Invite Code</Label>
              <Input
                value={inviteCodeInput}
                onChange={e => setInviteCodeInput(e.target.value)}
                placeholder="PSC-XXXXXXX"
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptInviteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAcceptInvite}
              disabled={partnerLoading || !inviteCodeInput.trim()}
            >
              <Check className="w-4 h-4 mr-2" />
              Accept Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default VideoCaptureTab;
