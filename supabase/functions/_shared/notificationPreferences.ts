export type DailySchedule = {
  hour: number;
  minute: number;
};

export type WeeklySchedule = DailySchedule & {
  weekday: number;
};

export type MedicationSchedule = DailySchedule & {
  name: string;
  daysOfWeek: number[];
};

export type NotificationPreferences = {
  enabled: boolean;
  medicationReminders: boolean;
  healthAlerts: boolean;
  scanReminders: boolean;
  weeklyReports: boolean;
  medicationSchedule: MedicationSchedule | null;
  healthSchedule: DailySchedule;
  weeklyReportSchedule: WeeklySchedule;
  timezone: string;
};

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: false,
  medicationReminders: true,
  healthAlerts: true,
  scanReminders: true,
  weeklyReports: false,
  medicationSchedule: null,
  healthSchedule: { hour: 8, minute: 0 },
  weeklyReportSchedule: { weekday: 1, hour: 10, minute: 0 },
  timezone: "UTC",
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const normalizeDaysOfWeek = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [1, 3, 5];
  const days = value
    .map(item => Math.floor(toNumber(item, -1)))
    .filter(day => day >= 0 && day <= 6)
    .filter((day, idx, arr) => arr.indexOf(day) === idx)
    .sort();
  return days.length ? days : [1, 3, 5];
};

const normalizeDailySchedule = (value: unknown, fallback: DailySchedule): DailySchedule => {
  const schedule = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  return {
    hour: clampNumber(toNumber(schedule.hour, fallback.hour), 0, 23),
    minute: clampNumber(toNumber(schedule.minute, fallback.minute), 0, 59),
  };
};

const normalizeWeeklySchedule = (value: unknown, fallback: WeeklySchedule): WeeklySchedule => {
  const schedule = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  return {
    ...normalizeDailySchedule(schedule, fallback),
    weekday: clampNumber(toNumber(schedule.weekday, fallback.weekday), 0, 6),
  };
};

const normalizeMedicationSchedule = (
  value: unknown,
  fallback: MedicationSchedule | null,
): MedicationSchedule | null => {
  if (!value || typeof value !== "object") return fallback;
  const schedule = value as Record<string, unknown>;
  const name = typeof schedule.name === "string" && schedule.name.trim().length > 0
    ? schedule.name.trim()
    : "Medication";
  return {
    name,
    daysOfWeek: normalizeDaysOfWeek(schedule.daysOfWeek),
    ...normalizeDailySchedule(schedule, { hour: 9, minute: 0 }),
  };
};

export const normalizeNotificationPreferences = (
  input?: Record<string, unknown> | null,
): NotificationPreferences => {
  const base = DEFAULT_NOTIFICATION_PREFERENCES;
  const raw = input && typeof input === "object" ? input : {};
  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : base.enabled,
    medicationReminders:
      typeof raw.medicationReminders === "boolean" ? raw.medicationReminders : base.medicationReminders,
    healthAlerts: typeof raw.healthAlerts === "boolean" ? raw.healthAlerts : base.healthAlerts,
    scanReminders: typeof raw.scanReminders === "boolean" ? raw.scanReminders : base.scanReminders,
    weeklyReports: typeof raw.weeklyReports === "boolean" ? raw.weeklyReports : base.weeklyReports,
    medicationSchedule: normalizeMedicationSchedule(raw.medicationSchedule, base.medicationSchedule),
    healthSchedule: normalizeDailySchedule(raw.healthSchedule, base.healthSchedule),
    weeklyReportSchedule: normalizeWeeklySchedule(raw.weeklyReportSchedule, base.weeklyReportSchedule),
    timezone: typeof raw.timezone === "string" && raw.timezone.length > 0 ? raw.timezone : base.timezone,
  };
};

const buildLocalNow = (timezone: string, now: Date): Date => {
  try {
    return new Date(now.toLocaleString("en-US", { timeZone: timezone || "UTC" }));
  } catch {
    return now;
  }
};

const isTimeMatch = (schedule: DailySchedule, localNow: Date): boolean =>
  localNow.getHours() === schedule.hour && localNow.getMinutes() === schedule.minute;

export const isDailyDue = (schedule: DailySchedule, timezone: string, now: Date): boolean => {
  const localNow = buildLocalNow(timezone, now);
  return isTimeMatch(schedule, localNow);
};

export const isWeeklyDue = (schedule: WeeklySchedule, timezone: string, now: Date): boolean => {
  const localNow = buildLocalNow(timezone, now);
  return localNow.getDay() === schedule.weekday && isTimeMatch(schedule, localNow);
};

export const isMedicationDue = (
  schedule: MedicationSchedule,
  timezone: string,
  now: Date,
): boolean => {
  const localNow = buildLocalNow(timezone, now);
  return schedule.daysOfWeek.includes(localNow.getDay()) && isTimeMatch(schedule, localNow);
};
