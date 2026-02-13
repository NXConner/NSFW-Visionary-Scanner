export type VideoQuality = "720p" | "1080p" | "2k" | "4k";

export interface VideoRecordingOptions {
  quality?: VideoQuality;
  frameRate?: number;
  audio?: boolean;
  onProgress?: (progress: number) => void;
}

export interface VideoRecording {
  id: string;
  blob: Blob;
  duration: number;
  startTime: number;
  endTime: number;
}

export interface MultiCameraOptions {
  cameras: MediaStream[];
  syncMode: "master" | "independent";
  layout: "grid" | "pip" | "sidebyside";
  onCameraError?: (cameraIndex: number, error: Error) => void;
}

export interface WebRTCConfig {
  iceServers?: RTCIceServer[];
  signalingUrl?: string;
  roomId?: string;
}

export interface VideoChunk {
  id: string;
  index: number;
  blob: Blob;
  timestamp: number;
  duration: number;
}
