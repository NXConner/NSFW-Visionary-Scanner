import { describe, it, expect } from "vitest";
import { calculateDailyStreak } from "@/lib/partnerSync";

describe("calculateDailyStreak", () => {
  it("returns zero for empty list", () => {
    expect(calculateDailyStreak([])).toEqual({ current: 0, longest: 0 });
  });

  it("calculates current and longest streak", () => {
    const dates = ["2026-01-01T10:00:00Z", "2026-01-02T10:00:00Z", "2026-01-04T10:00:00Z"];
    const result = calculateDailyStreak(dates);
    expect(result.longest).toBeGreaterThanOrEqual(2);
  });
});
