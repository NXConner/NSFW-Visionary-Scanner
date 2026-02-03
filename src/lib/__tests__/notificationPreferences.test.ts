import { describe, expect, it } from "vitest";
import {
  formatTime,
  normalizeNotificationPreferences,
  parseTime,
} from "@/lib/notificationPreferences";

describe("notificationPreferences helpers", () => {
  it("formats time values with padding", () => {
    expect(formatTime({ hour: 5, minute: 3 })).toBe("05:03");
  });

  it("parses time strings safely", () => {
    expect(parseTime("18:45", { hour: 8, minute: 0 })).toEqual({ hour: 18, minute: 45 });
    expect(parseTime("invalid", { hour: 8, minute: 0 })).toEqual({ hour: 8, minute: 0 });
  });

  it("normalizes preferences with defaults", () => {
    const prefs = normalizeNotificationPreferences({
      enabled: true,
      weeklyReportSchedule: { weekday: 9, hour: 10, minute: 0 },
      medicationSchedule: { name: "Test", hour: 9, minute: 30, daysOfWeek: [7, -1, 1] },
    });

    expect(prefs.enabled).toBe(true);
    expect(prefs.weeklyReportSchedule.weekday).toBeGreaterThanOrEqual(0);
    expect(prefs.weeklyReportSchedule.weekday).toBeLessThanOrEqual(6);
    expect(prefs.medicationSchedule?.daysOfWeek).toEqual([1]);
  });
});
