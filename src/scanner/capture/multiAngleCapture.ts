export type MultiAngleId =
  | "front"
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "custom-1"
  | "custom-2";

export interface MultiAngleCapture {
  requiredAngles: MultiAngleId[];
  captured: Partial<Record<MultiAngleId, string>>;
}

export function createDefaultMultiAngleCapture(): MultiAngleCapture {
  return { requiredAngles: ["front", "left", "right"], captured: {} };
}

export function isMultiAngleComplete(s: MultiAngleCapture): boolean {
  return s.requiredAngles.every(a => Boolean(s.captured[a]));
}

export function setCapturedAngle(
  s: MultiAngleCapture,
  angle: MultiAngleId,
  imageDataUrl: string,
): MultiAngleCapture {
  return { ...s, captured: { ...s.captured, [angle]: imageDataUrl } };
}

