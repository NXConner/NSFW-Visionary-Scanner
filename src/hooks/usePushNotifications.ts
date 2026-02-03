import { useState, useEffect, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from "@capacitor/push-notifications";
import { LocalNotifications, ScheduleOptions } from "@capacitor/local-notifications";
import { useGenericStorage } from "./useGenericStorage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferences,
  getLocalTimezone,
  normalizeNotificationPreferences,
} from "@/lib/notificationPreferences";

interface ScheduledReminder {
  id: number;
  title: string;
  body: string;
  schedule: {
    hour: number;
    minute: number;
    repeats: boolean;
    weekday?: number;
  };
  type: "medication" | "scan" | "health" | "report";
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useGenericStorage<NotificationPreferences>(
    "notification_settings",
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [scheduledReminders, setScheduledReminders] = useGenericStorage<ScheduledReminder[]>(
    "scheduled_reminders",
    [],
  );
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "prompt">(
    "prompt",
  );
  const cloudLoadedRef = useRef<string | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const platform = Capacitor.getPlatform();
    setIsSupported(platform === "ios" || platform === "android");
  }, []);

  useEffect(() => {
    if (!settings.timezone) {
      setSettings({ ...settings, timezone: getLocalTimezone() });
    }
  }, [settings, setSettings]);

  useEffect(() => {
    if (!user?.id) {
      cloudLoadedRef.current = null;
      return;
    }

    if (cloudLoadedRef.current === user.id) return;
    cloudLoadedRef.current = user.id;

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("user_preferences" as any)
          .select("notification_preferences")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if ((data as any)?.notification_preferences) {
          setSettings(
            normalizeNotificationPreferences(
              (data as any).notification_preferences as Partial<NotificationPreferences>,
            ),
          );
        }
      } catch (error) {
        logger.warn("Failed to load notification preferences", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        cloudLoadedRef.current = null;
      }
    };

    void load();
  }, [setSettings, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    const syncPreferences = () => {
      const promise = Promise.resolve(
        supabase.from("user_preferences" as any).upsert(
          {
            user_id: user.id,
            notification_preferences: settings,
          },
          { onConflict: "user_id" },
        ),
      );
      promise.then(
        ({ error }) => {
          if (error) {
            logger.warn("Failed to sync notification preferences", { error: error.message });
          }
        },
        error => {
          logger.warn("Failed to sync notification preferences", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
        },
      );
    };

    syncTimeoutRef.current = setTimeout(() => {
      syncPreferences();
    }, 800);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [settings, user?.id]);

  const requestPermissions = useCallback(async () => {
    if (!isSupported) {
      return false;
    }

    try {
      // Request push notification permissions
      const pushResult = await PushNotifications.requestPermissions();

      // Request local notification permissions
      const localResult = await LocalNotifications.requestPermissions();

      if (pushResult.receive === "granted" && localResult.display === "granted") {
        setPermissionStatus("granted");
        await PushNotifications.register();
        return true;
      } else {
        setPermissionStatus("denied");
        return false;
      }
    } catch (error) {
      logger.warn("Push notification permissions failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }, [isSupported]);

  const setupPushListeners = useCallback(() => {
    if (!isSupported) return;

    // On registration success
    PushNotifications.addListener("registration", async (token: Token) => {
      setPushToken(token.value);

      // Register token with backend
      const { registerDeviceToken, getPlatform } = await import("@/lib/pushNotifications");
      const platform = getPlatform();
      await registerDeviceToken({
        token: token.value,
        platform,
        deviceName: Capacitor.getPlatform(),
        appVersion: import.meta.env.VITE_APP_VERSION || import.meta.env.MODE,
      });
    });

    // On registration error
    PushNotifications.addListener("registrationError", error => {
      logger.warn("Push registration error", { error });
    });

    // On push notification received (app in foreground)
    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification: PushNotificationSchema) => {
        logger.info("Push notification received", {
          title: notification.title,
          data: notification.data,
        });
      },
    );

    // On push notification action performed (user tapped)
    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action: ActionPerformed) => {
        logger.info("Push notification action performed", {
          actionId: action.actionId,
          data: action.notification?.data,
        });
      },
    );

    // Local notification action
    LocalNotifications.addListener("localNotificationActionPerformed", action => {
      logger.info("Local notification action performed", {
        actionId: action.actionId,
        data: action.notification?.extra,
      });
    });
  }, [isSupported]);

  useEffect(() => {
    if (isSupported && settings.enabled) {
      setupPushListeners();
    }

    return () => {
      if (isSupported) {
        PushNotifications.removeAllListeners();
        LocalNotifications.removeAllListeners();
      }
    };
  }, [isSupported, settings.enabled, setupPushListeners]);

  const enableNotifications = useCallback(async () => {
    const granted = await requestPermissions();
    if (granted) {
      setSettings({
        ...settings,
        enabled: true,
        timezone: settings.timezone || getLocalTimezone(),
      });
      setupPushListeners();
    }
    return granted;
  }, [requestPermissions, settings, setSettings, setupPushListeners]);

  const disableNotifications = useCallback(async () => {
    setSettings({ ...settings, enabled: false });
    // Cancel all scheduled notifications
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
    if (pushToken) {
      const { removeDeviceToken } = await import("@/lib/pushNotifications");
      await removeDeviceToken(pushToken);
    }
  }, [pushToken, settings, setSettings]);

  const scheduleMedicationReminder = useCallback(
    async (medicationName: string, hour: number, minute: number, daysOfWeek?: number[]) => {
      if (!settings.medicationReminders || !settings.enabled) return null;

      const baseId = Date.now();
      const reminders: ScheduledReminder[] = [];

      if (daysOfWeek && daysOfWeek.length > 0) {
        // Schedule for specific days
        for (let i = 0; i < daysOfWeek.length; i++) {
          const reminder: ScheduledReminder = {
            id: baseId + i,
            title: "💊 Medication Reminder",
            body: `Time to take your ${medicationName}`,
            schedule: {
              hour,
              minute,
              repeats: true,
              weekday: daysOfWeek[i],
            },
            type: "medication",
          };
          reminders.push(reminder);
        }
      } else {
        // Daily reminder
        const reminder: ScheduledReminder = {
          id: baseId,
          title: "💊 Medication Reminder",
          body: `Time to take your ${medicationName}`,
          schedule: {
            hour,
            minute,
            repeats: true,
          },
          type: "medication",
        };
        reminders.push(reminder);
      }

      try {
        const scheduleOptions: ScheduleOptions = {
          notifications: reminders.map(r => ({
            id: r.id,
            title: r.title,
            body: r.body,
            schedule: {
              on: {
                hour: r.schedule.hour,
                minute: r.schedule.minute,
                ...(r.schedule.weekday && { weekday: r.schedule.weekday }),
              },
              repeats: r.schedule.repeats,
            },
            sound: "default",
            smallIcon: "ic_stat_icon",
            largeIcon: "ic_launcher",
          })),
        };

        await LocalNotifications.schedule(scheduleOptions);
        setSettings({
          ...settings,
          medicationSchedule: {
            name: medicationName,
            hour,
            minute,
            daysOfWeek: (daysOfWeek && daysOfWeek.length > 0 ? daysOfWeek : [1, 3, 5]).slice(),
          },
        });
        setScheduledReminders([...scheduledReminders, ...reminders]);
        return reminders;
      } catch (error) {
        return null;
      }
    },
    [settings, scheduledReminders, setScheduledReminders, setSettings],
  );

  const scheduleHealthTrackingReminder = useCallback(
    async (hour: number = 9, minute: number = 0) => {
      if (!settings.scanReminders || !settings.enabled) return null;

      const reminder: ScheduledReminder = {
        id: Date.now(),
        title: "📊 Health Check Reminder",
        body: "Time for your daily health tracking. Log your measurements!",
        schedule: {
          hour,
          minute,
          repeats: true,
        },
        type: "scan",
      };

      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: reminder.id,
              title: reminder.title,
              body: reminder.body,
              schedule: {
                on: { hour, minute },
                repeats: true,
              },
              sound: "default",
              smallIcon: "ic_stat_icon",
              largeIcon: "ic_launcher",
            },
          ],
        });

        setSettings({
          ...settings,
          healthSchedule: { hour, minute },
        });
        setScheduledReminders([...scheduledReminders, reminder]);
        return reminder;
      } catch (error) {
        return null;
      }
    },
    [settings, scheduledReminders, setScheduledReminders, setSettings],
  );

  const scheduleWeeklyReport = useCallback(
    async (
      dayOfWeek: number = 1, // Monday
      hour: number = 10,
      minute: number = 0,
    ) => {
      if (!settings.weeklyReports || !settings.enabled) return null;

      const reminder: ScheduledReminder = {
        id: Date.now(),
        title: "📈 Weekly Health Report",
        body: "Your weekly health summary is ready. Check your progress!",
        schedule: {
          hour,
          minute,
          repeats: true,
          weekday: dayOfWeek,
        },
        type: "report",
      };

      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: reminder.id,
              title: reminder.title,
              body: reminder.body,
              schedule: {
                on: { weekday: dayOfWeek, hour, minute },
                repeats: true,
              },
              sound: "default",
              smallIcon: "ic_stat_icon",
              largeIcon: "ic_launcher",
            },
          ],
        });

        setSettings({
          ...settings,
          weeklyReportSchedule: { weekday: dayOfWeek, hour, minute },
        });
        setScheduledReminders([...scheduledReminders, reminder]);
        return reminder;
      } catch (error) {
        return null;
      }
    },
    [settings, scheduledReminders, setScheduledReminders, setSettings],
  );

  const sendImmediateNotification = useCallback(
    async (
      title: string,
      body: string,
      type: "medication" | "health" | "scan" | "report" = "health",
    ) => {
      if (!settings.enabled) return false;

      // Check type-specific settings
      if (type === "medication" && !settings.medicationReminders) return false;
      if (type === "health" && !settings.healthAlerts) return false;
      if (type === "scan" && !settings.scanReminders) return false;
      if (type === "report" && !settings.weeklyReports) return false;

      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now(),
              title,
              body,
              schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
              sound: "default",
              smallIcon: "ic_stat_icon",
              largeIcon: "ic_launcher",
            },
          ],
        });
        return true;
      } catch (error) {
        return false;
      }
    },
    [settings],
  );

  const cancelReminder = useCallback(
    async (reminderId: number) => {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: reminderId }] });
        setScheduledReminders(scheduledReminders.filter(r => r.id !== reminderId));
        return true;
      } catch (error) {
        return false;
      }
    },
    [scheduledReminders, setScheduledReminders],
  );

  const cancelAllReminders = useCallback(async () => {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
      setScheduledReminders([]);
      return true;
    } catch (error) {
      return false;
    }
  }, [setScheduledReminders]);

  const updateSettings = useCallback(
    (newSettings: Partial<NotificationPreferences>) => {
      setSettings(normalizeNotificationPreferences({ ...settings, ...newSettings }));
    },
    [settings, setSettings],
  );

  return {
    settings,
    updateSettings,
    isSupported,
    permissionStatus,
    pushToken,
    scheduledReminders,
    enableNotifications,
    disableNotifications,
    scheduleMedicationReminder,
    scheduleHealthTrackingReminder,
    scheduleWeeklyReport,
    sendImmediateNotification,
    cancelReminder,
    cancelAllReminders,
  };
};
