import type { DetectedCondition, HealthAlert } from "@/lib/aiEnhancedScanning";

export function parseDetectedConditions(raw: unknown[] | null): DetectedCondition[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(x => x as Partial<DetectedCondition>)
    .filter(x => typeof x.condition === "string" && typeof x.confidence === "number")
    .map(x => ({
      condition: String(x.condition),
      confidence: Number(x.confidence),
      severity: (x.severity ?? "medium") as DetectedCondition["severity"],
      recommendation: typeof x.recommendation === "string" ? x.recommendation : undefined,
    }));
}

export function parseHealthAlerts(raw: unknown[] | null): HealthAlert[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(x => x as Partial<HealthAlert>)
    .filter(x => typeof x.message === "string")
    .map(x => ({ message: String(x.message), severity: x.severity }));
}
