import { describe, it, expect } from "vitest";
import { buildAnalyticsData } from "../utils";
import type { RawAnalyticsEvent } from "../types";

const baseEvent = (overrides: Partial<RawAnalyticsEvent>): RawAnalyticsEvent => ({
  event_name: "page_view",
  event_category: "navigation",
  event_action: "page_view",
  created_at: new Date("2026-02-01T10:00:00Z").toISOString(),
  user_id: "user-1",
  session_id: "session-1",
  device_platform: "web",
  ...overrides,
});

describe("buildAnalyticsData", () => {
  it("computes overview counts and trends", () => {
    const events: RawAnalyticsEvent[] = [
      baseEvent({ event_name: "scan_start", event_category: "scanner" }),
      baseEvent({
        event_name: "scan_complete",
        event_category: "scanner",
        created_at: new Date("2026-02-01T10:05:00Z").toISOString(),
      }),
      baseEvent({
        event_name: "user_action",
        event_category: "auth",
        user_id: "user-2",
        session_id: "session-2",
        device_platform: "ios",
      }),
    ];

    const data = buildAnalyticsData({ events, totalUsers: 10, newUsers: 2 });

    expect(data.overview.totalEvents).toBe(3);
    expect(data.overview.totalUsers).toBe(10);
    expect(data.overview.activeUsers).toBe(2);
    expect(data.overview.totalScans).toBe(2);
    expect(data.trends.length).toBeGreaterThan(0);
    expect(data.featureUsage[0]?.count).toBeGreaterThan(0);
  });

  it("captures error metrics and device breakdown", () => {
    const events: RawAnalyticsEvent[] = [
      baseEvent({ event_name: "error_network", event_category: "error" }),
      baseEvent({ event_name: "error_network", event_category: "error" }),
      baseEvent({ event_name: "page_view", device_platform: "android" }),
    ];

    const data = buildAnalyticsData({ events, totalUsers: 1, newUsers: 0 });

    expect(data.errorMetrics[0]?.type).toBe("error_network");
    expect(data.errorMetrics[0]?.count).toBe(2);
    expect(data.deviceBreakdown.some(device => device.device === "android")).toBe(true);
  });
});
