export type AdminBroadcastNotificationType = "info" | "warning" | "success" | "error";
export type AdminBroadcastNotificationAudience = "all" | "premium" | "free" | "specific";
export type AdminBroadcastNotificationStatus = "draft" | "scheduled" | "sent" | "cancelled";

export type AdminBroadcastChannels = {
  inApp: boolean;
  push: boolean;
  email: boolean;
};

export type AdminBroadcastNotificationDto = {
  id: string;
  createdBy: string | null;
  title: string;
  message: string;
  type: AdminBroadcastNotificationType;
  audience: AdminBroadcastNotificationAudience;
  audienceUserIds: string[];
  channels: AdminBroadcastChannels;
  status: AdminBroadcastNotificationStatus;
  scheduledForIso: string | null;
  sentAtIso: string | null;
  targetCount: number;
  readCount: number;
  lastError: string | null;
  isDeleted: boolean;
  deletedAtIso: string | null;
  createdAtIso: string;
  updatedAtIso: string;
  metadata?: Record<string, unknown>;
};

export type AdminBroadcastNotificationsStats = {
  totalUsers: number | null;
  totalTokens: number | null;
};

export type AdminBroadcastNotificationUpsertInput = {
  id?: string;
  title: string;
  message: string;
  type: AdminBroadcastNotificationType;
  audience: AdminBroadcastNotificationAudience;
  audienceUserIds?: string[];
  audienceEmails?: string[];
  channels: AdminBroadcastChannels;
  scheduledForIso?: string | null;
};

export type AdminBroadcastNotificationsListResponse = {
  notifications: AdminBroadcastNotificationDto[];
  stats: AdminBroadcastNotificationsStats;
};
