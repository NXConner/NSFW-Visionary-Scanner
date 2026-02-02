/**
 * Analytics Module Types
 */

export interface WellnessEntry {
  id: string;
  date: Date;
  duration?: number; // minutes
  satisfaction: number; // 1-10
  mood: MoodType;
  energy: EnergyLevel;
  connection: number; // 1-10
  notes?: string;
  tags?: string[];
  isPartnerSynced: boolean;
}

export type MoodType =
  | "romantic"
  | "playful"
  | "passionate"
  | "relaxed"
  | "adventurous"
  | "tender"
  | "curious";

export type EnergyLevel = "low" | "medium" | "high";

export interface WellnessStats {
  totalEntries: number;
  averageSatisfaction: number;
  averageConnection: number;
  averageDuration: number;
  frequencyPerWeek: number;
  moodDistribution: Record<MoodType, number>;
  bestDays: string[]; // day names
  trends: WellnessTrend[];
}

export interface WellnessTrend {
  metric: string;
  direction: "up" | "down" | "stable";
  changePercent: number;
  period: "week" | "month" | "quarter";
}

export interface PartnerProfile {
  id: string;
  displayName: string;
  syncEnabled: boolean;
  syncCode?: string;
  connectedAt?: Date;
  lastSyncAt?: Date;
  sharedEntries: number;
}

export interface RelationshipInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  recommendation: string;
  confidence: number; // 0-1
  basedOn: string[];
  createdAt: Date;
}

export type InsightType =
  | "frequency"
  | "satisfaction"
  | "communication"
  | "timing"
  | "mood"
  | "connection";

export interface AnalyticsReport {
  id: string;
  title: string;
  period: ReportPeriod;
  startDate: Date;
  endDate: Date;
  stats: WellnessStats;
  insights: RelationshipInsight[];
  generatedAt: Date;
  isSharedWithPartner: boolean;
}

export type ReportPeriod = "week" | "month" | "quarter" | "year" | "custom";

export interface AnalyticsState {
  entries: WellnessEntry[];
  stats: WellnessStats | null;
  partner: PartnerProfile | null;
  insights: RelationshipInsight[];
  reports: AnalyticsReport[];
  isLoading: boolean;
  error: string | null;
}

export interface DateRange {
  start: Date;
  end: Date;
}
