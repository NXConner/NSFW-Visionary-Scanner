import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Camera, Circle, Play, Plus, Square, Trash2, VideoOff } from "lucide-react";
import type { MultiCameraSession } from "@/lib/nsfwAdvancedFeatures";
import type { CameraStream } from "../types";

export function RecordTab(props: {
  cameraStreams: CameraStream[];
  availableDevicesCount: number;
  isRecording: boolean;
  recordingTime: number;
  formatTime: (seconds: number) => string;
  setVideoRef: (cameraId: string, el: HTMLVideoElement | null) => void;
  onStartCamera: (deviceId?: string) => Promise<unknown> | void;
  onStopCamera: (cameraId: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  sessionName: string;
  onSessionNameChange: (value: string) => void;
  quality: MultiCameraSession["quality"];
  onQualityChange: (value: MultiCameraSession["quality"]) => void;
  onOpenAddCameraDialog: () => void;
}): JSX.Element {
  const {
    cameraStreams,
    availableDevicesCount,
    isRecording,
    recordingTime,
    formatTime,
    setVideoRef,
    onStartCamera,
    onStopCamera,
    onStartRecording,
    onStopRecording,
    sessionName,
    onSessionNameChange,
    quality,
    onQualityChange,
    onOpenAddCameraDialog,
  } = props;

  return (
    <div className="space-y-4 mt-4">
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
                    {isRecording ? (
                      <Badge className="bg-destructive animate-pulse text-xs">
                        <Circle className="w-2 h-2 mr-1 fill-current" /> REC
                      </Badge>
                    ) : null}
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => onStopCamera(camera.id)}
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
                  onClick={() => void onStartCamera()}
                >
                  Enable Camera
                </Button>
              </div>
            </div>
          )}

          {isRecording ? (
            <div className="text-center py-2">
              <p className="text-2xl font-mono font-bold text-destructive">
                {formatTime(recordingTime)}
              </p>
            </div>
          ) : null}

          <div className="flex gap-2">
            {!isRecording ? (
              <Button onClick={onStartRecording} className="flex-1 gap-2" variant="destructive">
                <Circle className="w-4 h-4" />
                Start Recording
              </Button>
            ) : (
              <>
                <Button onClick={onStopRecording} className="flex-1 gap-2" variant="outline">
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
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Session Name</Label>
                <Input
                  placeholder="Enter session name..."
                  value={sessionName}
                  onChange={e => onSessionNameChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Video Quality</Label>
                <Select
                  value={quality}
                  onValueChange={v => onQualityChange(v as MultiCameraSession["quality"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720p">720p HD</SelectItem>
                    <SelectItem value="1080p">1080p Full HD</SelectItem>
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
                    {availableDevicesCount} available
                  </Badge>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={onOpenAddCameraDialog}
                disabled={isRecording}
              >
                <Plus className="w-4 h-4" />
                Connect More Cameras
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted/50">
                <Camera className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Tip</p>
                <p className="text-sm text-muted-foreground">
                  Connect additional cameras (or partner sync) before recording for the best
                  multi-angle results.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
