export type AnalyticsTimeRange = "7d" | "30d" | "90d" | "1y";

export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalEvents: number;
  totalScans: number;
  averageSessionDuration: number;
  bounceRate: number;
}

export interface AnalyticsTrendPoint {
  date: string;
  users: number;
  scans: number;
  sessions: number;
  events: number;
}

export interface AnalyticsFeatureUsage {
  name: string;
  count: number;
  percentage: number;
}

export interface AnalyticsDeviceUsage {
  device: string;
  count: number;
  percentage: number;
}

export interface AnalyticsErrorMetric {
  type: string;
  count: number;
  lastOccurred: string;
}

export interface AnalyticsRetentionPoint {
  period: string;
  rate: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  trends: AnalyticsTrendPoint[];
  featureUsage: AnalyticsFeatureUsage[];
  deviceBreakdown: AnalyticsDeviceUsage[];
  errorMetrics: AnalyticsErrorMetric[];
  retention: AnalyticsRetentionPoint[];
}

export interface AnalyticsDashboardProps {
  className?: string;
  isAdmin?: boolean;
}

export interface AnalyticsState {
  loading: boolean;
  error?: string;
  data?: AnalyticsData;
}

export interface RawAnalyticsEvent {
  event_name: string | null;
  event_category: string | null;
  event_action: string | null;
  created_at: string;
  user_id: string | null;
  session_id: string | null;
  device_platform: string | null;
}
