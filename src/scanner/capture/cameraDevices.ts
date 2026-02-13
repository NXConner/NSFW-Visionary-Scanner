export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
  kind: "videoinput";
}

export async function listCameraDevices(): Promise<CameraDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter(d => d.kind === "videoinput")
    .map(d => ({
      deviceId: d.deviceId,
      label: d.label || "Camera",
      kind: "videoinput" as const,
    }));
}

