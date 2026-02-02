export const feedbackKinds = [
  "bug",
  "glitch",
  "error",
  "feature_request",
  "expansion_request",
  "wishlist",
  "general",
  "praise",
] as const;

export type FeedbackKind = (typeof feedbackKinds)[number];

export const feedbackSentiments = ["love", "like", "neutral", "dislike", "hate"] as const;
export type FeedbackSentiment = (typeof feedbackSentiments)[number];

export const feedbackSeverity = ["low", "medium", "high", "critical"] as const;
export type FeedbackSeverity = (typeof feedbackSeverity)[number];

export const feedbackFrequency = ["once", "sometimes", "often", "always"] as const;
export type FeedbackFrequency = (typeof feedbackFrequency)[number];

export interface FeedbackEnvironment {
  userAgent?: string;
  platform?: string;
  language?: string;
  timeZone?: string;
  url?: string;
  referrer?: string;
  screen?: { width: number; height: number; dpr: number };
  viewport?: { width: number; height: number };
  connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean };
  app?: { version?: string; build?: string; env?: string };
}

export interface FeedbackAttachmentRef {
  name: string;
  type?: string;
  size?: number;
}

export interface FeedbackDraft {
  kind: FeedbackKind;
  title: string;
  description: string;
  rating?: number; // 0..10 (NPS-style)
  sentiment?: FeedbackSentiment;
  severity?: FeedbackSeverity; // for bugs/glitches/errors
  frequency?: FeedbackFrequency; // for bugs/glitches/errors
  stepsToReproduce?: string;
  expected?: string;
  actual?: string;
  tags?: string[];
  allowContact?: boolean;
  contactEmail?: string;
  includeDiagnostics?: boolean;
  includeRecentAudit?: boolean;
  attachments?: FeedbackAttachmentRef[];
}

export type FeedbackStatus =
  | "new"
  | "triaged"
  | "in_progress"
  | "resolved"
  | "won't_fix"
  | "duplicate";

export interface FeedbackRow {
  id: string;
  user_id: string;
  created_at: string;
  updated_at?: string | null;
  kind: FeedbackKind;
  title: string;
  description: string;
  rating?: number | null;
  sentiment?: FeedbackSentiment | null;
  severity?: FeedbackSeverity | null;
  frequency?: FeedbackFrequency | null;
  steps_to_reproduce?: string | null;
  expected?: string | null;
  actual?: string | null;
  tags?: string[] | null;
  allow_contact?: boolean | null;
  contact_email?: string | null;
  environment?: Record<string, unknown> | null;
  attachments?: FeedbackAttachmentRef[] | null;
  status?: FeedbackStatus | null;
  admin_response?: string | null;
}
