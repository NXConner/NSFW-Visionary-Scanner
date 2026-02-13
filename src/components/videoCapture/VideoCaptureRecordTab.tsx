import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Camera, Circle, Plus, Square, Trash2, VideoOff } from "lucide-react";
import type { CameraStream, VideoCaptureQuality } from "./types";

function formatTime(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function VideoCaptureRecordTab(props: {
  cameraStreams: CameraStream[];
  availableDevices: MediaDeviceInfo[];
  isRecording: boolean;
  recordingTimeSeconds: number;
  sessionName: string;
  quality: VideoCaptureQuality;
  onChangeSessionName: (next: string) => void;
  onChangeQuality: (next: VideoCaptureQuality) => void;
  onStartCamera: (deviceId?: string) => Promise<CameraStream | null>;
  onStopCamera: (cameraId: string) => void;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => Promise<void>;
}): JSX.Element {
  const {
    cameraStreams,
    availableDevices,
    isRecording,
    recordingTimeSeconds,
    sessionName,
    quality,
    onChangeSessionName,
    onChangeQuality,
    onStartCamera,
    onStopCamera,
    onStartRecording,
    onStopRecording,
  } = props;

  const [showAddCameraDialog, setShowAddCameraDialog] = useState(false);
  const videoEls = useRef<Map<string, HTMLVideoElement>>(new Map());

  const setVideoRef = useCallback(
    (cameraId: string, el: HTMLVideoElement | null) => {
      if (!el) {
        videoEls.current.delete(cameraId);
        return;
      }
      videoEls.current.set(cameraId, el);
      const camera = cameraStreams.find(c => c.id === cameraId);
      if (camera && el.srcObject !== camera.stream) el.srcObject = camera.stream;
    },
    [cameraStreams],
  );

  useEffect(() => {
    // Re-attach streams on state updates (best-effort).
    for (const camera of cameraStreams) {
      const el = videoEls.current.get(camera.id);
      if (el && el.srcObject !== camera.stream) el.srcObject = camera.stream;
    }
  }, [cameraStreams]);

  const canConnectMore = !isRecording;

  const handleAddCamera = useCallback(
    async (deviceId?: string) => {
      await onStartCamera(deviceId);
      setShowAddCameraDialog(false);
    },
    [onStartCamera],
  );

  const devicesUi = useMemo(() => {
    return availableDevices.map(device => {
      const isConnected = cameraStreams.some(c => c.deviceId === device.deviceId);
      const label = device.label || `Camera ${device.deviceId.slice(0, 8)}`;
      return (
        <Button
          key={device.deviceId}
          variant={isConnected ? "secondary" : "outline"}
          className="w-full justify-start gap-3"
          onClick={() => !isConnected && void handleAddCamera(device.deviceId)}
          disabled={isConnected}
        >
          <Camera className="w-4 h-4" />
          <span className="flex-1 text-left truncate">{label}</span>
          {isConnected && <Badge variant="outline">Connected</Badge>}
        </Button>
      );
    });
  }, [availableDevices, cameraStreams, handleAddCamera]);

  return (
    <>
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
                    onClick={() => onStopCamera(camera.id)}
                    disabled={isRecording}
                    aria-label="Disconnect camera"
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
                  onClick={() => void onStartCamera()}
                  disabled={isRecording}
                >
                  Enable Camera
                </Button>
              </div>
            </div>
          )}

          {isRecording && (
            <div className="text-center py-2">
              <p className="text-2xl font-mono font-bold text-destructive">
                {formatTime(recordingTimeSeconds)}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {!isRecording ? (
              <Button
                onClick={() => void onStartRecording()}
                className="flex-1 gap-2"
                variant="destructive"
              >
                <Circle className="w-4 h-4" />
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={() => void onStopRecording()}
                className="flex-1 gap-2"
                variant="outline"
              >
                <Square className="w-4 h-4" />
                Stop
              </Button>
            )}
          </div>
        </div>

        {/* Recording Settings */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Session Name</Label>
            <Input
              placeholder="Enter session name…"
              value={sessionName}
              onChange={e => onChangeSessionName(e.target.value)}
              disabled={isRecording}
            />
          </div>
          <div className="space-y-2">
            <Label>Video Quality</Label>
            <Select value={quality} onValueChange={v => onChangeQuality(v as VideoCaptureQuality)}>
              <SelectTrigger disabled={isRecording}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="720p">720p HD</SelectItem>
                <SelectItem value="1080p">1080p Full HD</SelectItem>
                <SelectItem value="2k">2K QHD</SelectItem>
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
            disabled={!canConnectMore}
          >
            <Plus className="w-4 h-4" />
            Connect More Cameras
          </Button>
        </div>
      </div>

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
              devicesUi
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCameraDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleAddCamera()} disabled={availableDevices.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Add Default Camera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
