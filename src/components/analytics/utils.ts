import type {
  AnalyticsData,
  AnalyticsDeviceUsage,
  AnalyticsErrorMetric,
  AnalyticsFeatureUsage,
  AnalyticsRetentionPoint,
  AnalyticsTrendPoint,
  RawAnalyticsEvent,
} from "./types";

export function parseDateKey(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toISOString().split("T")[0] ?? "unknown";
}

function toNumber(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

export function buildAnalyticsData(params: {
  events: RawAnalyticsEvent[];
  totalUsers: number;
  newUsers: number;
}): AnalyticsData {
  const { events, totalUsers, newUsers } = params;
  const totalEvents = events.length;

  const activeUserIds = new Set<string>();
  const sessionMap = new Map<string, { min: number; max: number; count: number }>();
  const featureMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  const errorMap = new Map<string, { count: number; last: number }>();
  const trendMap = new Map<string, { users: Set<string>; sessions: Set<string>; scans: number; events: number }>();

  for (const evt of events) {
    const eventName = evt.event_name || "unknown";
    const eventCategory = evt.event_category || "";
    const eventAction = evt.event_action || "";
    const createdAt = new Date(evt.created_at).getTime();

    if (evt.user_id) activeUserIds.add(evt.user_id);
    if (evt.session_id) {
      const existing = sessionMap.get(evt.session_id) ?? { min: createdAt, max: createdAt, count: 0 };
      existing.min = Math.min(existing.min, createdAt);
      existing.max = Math.max(existing.max, createdAt);
      existing.count += 1;
      sessionMap.set(evt.session_id, existing);
    }

    featureMap.set(eventName, (featureMap.get(eventName) ?? 0) + 1);

    const device = evt.device_platform?.trim() || "unknown";
    deviceMap.set(device, (deviceMap.get(device) ?? 0) + 1);

    const isError =
      eventName.toLowerCase().includes("error") ||
      eventCategory.toLowerCase().includes("error") ||
      eventAction.toLowerCase().includes("error");
    if (isError) {
      const key = eventName || "error";
      const current = errorMap.get(key) ?? { count: 0, last: 0 };
      current.count += 1;
      current.last = Math.max(current.last, createdAt);
      errorMap.set(key, current);
    }

    const dayKey = parseDateKey(evt.created_at);
    const trend = trendMap.get(dayKey) ?? {
      users: new Set<string>(),
      sessions: new Set<string>(),
      scans: 0,
      events: 0,
    };
    if (evt.user_id) trend.users.add(evt.user_id);
    if (evt.session_id) trend.sessions.add(evt.session_id);
    if (eventName.toLowerCase().includes("scan") || eventCategory === "scanner") {
      trend.scans += 1;
    }
    trend.events += 1;
    trendMap.set(dayKey, trend);
  }

  const featureUsage: AnalyticsFeatureUsage[] = Array.from(featureMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalEvents > 0 ? Math.round((count / totalEvents) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const deviceBreakdown: AnalyticsDeviceUsage[] = Array.from(deviceMap.entries())
    .map(([device, count]) => ({
      device,
      count,
      percentage: totalEvents > 0 ? Math.round((count / totalEvents) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const trends: AnalyticsTrendPoint[] = Array.from(trendMap.entries())
    .map(([date, data]) => ({
      date,
      users: data.users.size,
      sessions: data.sessions.size,
      scans: data.scans,
      events: data.events,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const errorMetrics: AnalyticsErrorMetric[] = Array.from(errorMap.entries())
    .map(([type, data]) => ({
      type,
      count: data.count,
      lastOccurred: data.last ? new Date(data.last).toISOString() : "unknown",
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const totalSessions = sessionMap.size;
  const sessionDurations = Array.from(sessionMap.values()).map(entry =>
    Math.max(0, entry.max - entry.min),
  );
  const averageSessionDurationMs =
    sessionDurations.length > 0
      ? sessionDurations.reduce((sum, value) => sum + value, 0) / sessionDurations.length
      : 0;
  const bounceRate =
    totalSessions > 0
      ? Math.round(
          (Array.from(sessionMap.values()).filter(session => session.count <= 1).length / totalSessions) *
            1000,
        ) / 10
      : 0;

  const retention: AnalyticsRetentionPoint[] = buildRetentionPoints(events, totalUsers);

  return {
    overview: {
      totalUsers: toNumber(totalUsers),
      activeUsers: activeUserIds.size,
      newUsers: toNumber(newUsers),
      totalEvents,
      totalScans: events.filter(evt => (evt.event_name || "").toLowerCase().includes("scan")).length,
      averageSessionDuration: Math.round(averageSessionDurationMs / 1000),
      bounceRate,
    },
    trends,
    featureUsage,
    deviceBreakdown,
    errorMetrics,
    retention,
  };
}

function buildRetentionPoints(
  events: RawAnalyticsEvent[],
  totalUsers: number,
): AnalyticsRetentionPoint[] {
  const now = Date.now();
  const periods = [
    { label: "7 days", days: 7 },
    { label: "30 days", days: 30 },
    { label: "90 days", days: 90 },
  ];

  return periods.map(period => {
    const cutoff = now - period.days * 24 * 60 * 60 * 1000;
    const activeUsers = new Set<string>();
    for (const evt of events) {
      const ts = new Date(evt.created_at).getTime();
      if (ts >= cutoff && evt.user_id) activeUsers.add(evt.user_id);
    }
    const rate =
      totalUsers > 0 ? Math.round((activeUsers.size / totalUsers) * 1000) / 10 : 0;
    return { period: period.label, rate };
  });
}
