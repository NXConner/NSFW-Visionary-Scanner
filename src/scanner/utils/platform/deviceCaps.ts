export interface DeviceCapabilities {
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
  hasCreateImageBitmap: boolean;
  hasOffscreenCanvas: boolean;
}

export function getDeviceCapabilities(): DeviceCapabilities {
  return {
    hasMediaDevices: typeof navigator !== "undefined" && !!navigator.mediaDevices,
    hasGetUserMedia:
      typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function",
    hasCreateImageBitmap: typeof createImageBitmap === "function",
    hasOffscreenCanvas: typeof OffscreenCanvas !== "undefined",
  };
}

