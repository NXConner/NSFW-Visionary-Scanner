export interface DailySchedule {
  hour: number;
  minute: number;
}

export interface WeeklySchedule extends DailySchedule {
  weekday: number; // 0 (Sun) - 6 (Sat)
}

export interface MedicationSchedule extends DailySchedule {
  name: string;
  daysOfWeek: number[];
}

export interface NotificationPreferences {
  enabled: boolean;
  medicationReminders: boolean;
  healthAlerts: boolean;
  scanReminders: boolean;
  weeklyReports: boolean;
  medicationSchedule: MedicationSchedule | null;
  healthSchedule: DailySchedule;
  weeklyReportSchedule: WeeklySchedule;
  timezone: string;
}

const DEFAULT_HEALTH_SCHEDULE: DailySchedule = {
  hour: 8,
  minute: 0,
};

const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  weekday: 1,
  hour: 10,
  minute: 0,
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: false,
  medicationReminders: true,
  healthAlerts: true,
  scanReminders: true,
  weeklyReports: false,
  medicationSchedule: null,
  healthSchedule: DEFAULT_HEALTH_SCHEDULE,
  weeklyReportSchedule: DEFAULT_WEEKLY_SCHEDULE,
  timezone: getLocalTimezone(),
};

export function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function formatTime({ hour, minute }: DailySchedule): string {
  const h = Math.max(0, Math.min(23, Math.floor(hour)));
  const m = Math.max(0, Math.min(59, Math.floor(minute)));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseTime(value: string, fallback: DailySchedule): DailySchedule {
  if (!value) return fallback;
  const [rawH, rawM] = value.split(":");
  const hour = Number.parseInt(rawH ?? "", 10);
  const minute = Number.parseInt(rawM ?? "", 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return fallback;
  return {
    hour: Math.max(0, Math.min(23, hour)),
    minute: Math.max(0, Math.min(59, minute)),
  };
}

export function normalizeNotificationPreferences(
  input?: Partial<NotificationPreferences> | null,
): NotificationPreferences {
  const base = DEFAULT_NOTIFICATION_PREFERENCES;
  const next: NotificationPreferences = {
    ...base,
    ...input,
    healthSchedule: {
      ...base.healthSchedule,
      ...(input?.healthSchedule ?? {}),
    },
    weeklyReportSchedule: {
      ...base.weeklyReportSchedule,
      ...(input?.weeklyReportSchedule ?? {}),
    },
    medicationSchedule: input?.medicationSchedule ?? base.medicationSchedule,
    timezone: input?.timezone || base.timezone,
  };

  if (next.weeklyReportSchedule.weekday < 0 || next.weeklyReportSchedule.weekday > 6) {
    next.weeklyReportSchedule.weekday = base.weeklyReportSchedule.weekday;
  }

  if (next.medicationSchedule?.daysOfWeek?.length) {
    const days = next.medicationSchedule.daysOfWeek
      .map(d => Math.floor(d))
      .filter(d => d >= 0 && d <= 6)
      .filter((d, idx, arr) => arr.indexOf(d) === idx)
      .sort();
    next.medicationSchedule.daysOfWeek = days.length ? days : [1, 3, 5];
  }

  return next;
}
