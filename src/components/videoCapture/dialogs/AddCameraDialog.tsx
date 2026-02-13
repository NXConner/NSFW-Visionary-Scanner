import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Plus } from "lucide-react";
import type { CameraStream } from "../types";

export function AddCameraDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableDevices: MediaDeviceInfo[];
  cameraStreams: CameraStream[];
  onAddCamera: (deviceId?: string) => void;
}): JSX.Element {
  const { open, onOpenChange, availableDevices, cameraStreams, onAddCamera } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  onClick={() => !isConnected && onAddCamera(device.deviceId)}
                  disabled={isConnected}
                >
                  <Camera className="w-4 h-4" />
                  <span className="flex-1 text-left truncate">
                    {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                  </span>
                  {isConnected ? <Badge variant="outline">Connected</Badge> : null}
                </Button>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onAddCamera()} disabled={availableDevices.length === 0}>
            <Plus className="w-4 h-4 mr-2" />
            Add Default Camera
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
