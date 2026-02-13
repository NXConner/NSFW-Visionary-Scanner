export type VideoCaptureQuality = "720p" | "1080p" | "2k" | "4k";

export type CameraStream = {
  id: string;
  stream: MediaStream;
  deviceId: string;
  label: string;
};
