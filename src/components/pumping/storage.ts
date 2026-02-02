import type { PumpingSession } from "@/components/pumping/types";

export const PUMPING_KEY = "morphoscan_pumping_sessions";

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";

const asNumber = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const asString = (v: unknown): string | null => (typeof v === "string" ? v : null);

export function loadPumpingSessions(): PumpingSession[] {
  try {
    const saved = window.localStorage.getItem(PUMPING_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as unknown;
    if (!Array.isArray(parsed)) return [];

    const result: PumpingSession[] = [];
    for (const item of parsed) {
      if (!isRecord(item)) continue;
      const id = asString(item.id);
      const date = asString(item.date);
      const duration = asNumber(item.duration);
      const pressure = asNumber(item.pressure);
      const lengthBefore = asNumber(item.lengthBefore);
      const lengthAfter = asNumber(item.lengthAfter);
      const girthBefore = asNumber(item.girthBefore);
      const girthAfter = asNumber(item.girthAfter);
      const notes = asString(item.notes) ?? "";
      if (!id || !date) continue;
      if (
        duration === null ||
        pressure === null ||
        lengthBefore === null ||
        lengthAfter === null ||
        girthBefore === null ||
        girthAfter === null
      ) {
        continue;
      }
      result.push({
        id,
        date,
        duration,
        pressure,
        lengthBefore,
        lengthAfter,
        girthBefore,
        girthAfter,
        notes,
      });
    }
    return result;
  } catch {
    return [];
  }
}

export function savePumpingSessions(sessions: PumpingSession[]) {
  window.localStorage.setItem(PUMPING_KEY, JSON.stringify(sessions));
}
