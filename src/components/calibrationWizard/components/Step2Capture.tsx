import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Focus,
  Crosshair,
  Move,
  RotateCcw,
  Video,
  VideoOff,
  ZoomIn,
  Camera,
  RefreshCw,
} from "lucide-react";

export function Step2Capture({
  titleObjectName,
  capturedImage,
  isCapturing,
  cameraActive,
  cameraError,
  onCapture,
  onRetake,
  onStartCamera,
  internalVideoRef,
}: {
  titleObjectName: string;
  capturedImage: string | null;
  isCapturing: boolean;
  cameraActive: boolean;
  cameraError: string | null;
  onCapture: () => void;
  onRetake: () => void;
  onStartCamera: () => void;
  internalVideoRef: React.RefObject<HTMLVideoElement>;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Position & Capture</h3>
        <p className="text-sm text-muted-foreground">
          Place the {titleObjectName} flat and capture an image
        </p>
      </div>

      <div className="space-y-4">
        {/* Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: Move, text: "Place object flat on surface" },
            { icon: Camera, text: "Hold camera directly above" },
            { icon: ZoomIn, text: "Fill frame with object" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
              <item.icon className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Preview/Capture Area */}
        <div className="relative aspect-video bg-secondary/30 rounded-xl overflow-hidden border-2 border-dashed border-primary/30">
          {/* Video element is ALWAYS rendered so the ref is available for startCamera */}
          <video
            ref={internalVideoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${
              cameraActive && !capturedImage ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />

          {capturedImage ? (
            <div className="relative w-full h-full">
              <img
                src={capturedImage}
                alt="Captured reference"
                className="w-full h-full object-contain"
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={onRetake}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Retake
              </Button>
            </div>
          ) : cameraActive ? (
            <div className="relative w-full h-full">
              {/* Alignment guides */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Crosshair className="w-12 h-12 text-primary/50" />
                </div>
                <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-primary/60" />
                <div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-primary/60" />
                <div className="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-primary/60" />
                <div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-primary/60" />
                <div className="absolute inset-16 border-2 border-dashed border-accent/40 rounded-lg" />
              </div>

              <Badge className="absolute top-2 left-2 bg-success/80">
                <Video className="w-3 h-3 mr-1" />
                LIVE
              </Badge>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <Button onClick={onCapture} disabled={isCapturing} size="lg" className="shadow-lg">
                  <Focus className={`w-5 h-5 mr-2 ${isCapturing ? "animate-pulse" : ""}`} />
                  {isCapturing ? "Capturing..." : "Capture"}
                </Button>
              </div>
            </div>
          ) : cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="p-4 rounded-full bg-destructive/10 mb-4">
                <VideoOff className="w-10 h-10 text-destructive" />
              </div>
              <p className="text-destructive font-medium mb-2">Camera Access Error</p>
              <p className="text-sm text-muted-foreground mb-4">{cameraError}</p>
              <Button onClick={onStartCamera} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Camera
              </Button>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Starting camera...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
