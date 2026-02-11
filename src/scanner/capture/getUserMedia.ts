export async function startGetUserMediaCamera(
  constraints: MediaStreamConstraints = {
    video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  },
): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("getUserMedia is not available in this environment");
  }
  return await navigator.mediaDevices.getUserMedia(constraints);
}
