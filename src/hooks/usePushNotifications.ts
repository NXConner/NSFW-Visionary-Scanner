import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from "@capacitor/push-notifications";
import { LocalNotifications, ScheduleOptions } from "@capacitor/local-notifications";
import { useGenericStorage } from "./useGenericStorage";

interface NotificationSettings {
  enabled: boolean;
  medicationReminders: boolean;
  healthAlerts: boolean;
  scanReminders: boolean;
  weeklyReports: boolean;
}

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

const defaultSettings: NotificationSettings = {
  enabled: false,
  medicationReminders: true,
  healthAlerts: true,
  scanReminders: true,
  weeklyReports: false,
};

export const usePushNotifications = () => {
  const [settings, setSettings] = useGenericStorage<NotificationSettings>(
    "notification_settings",
    defaultSettings,
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

  useEffect(() => {
    const platform = Capacitor.getPlatform();
    setIsSupported(platform === "ios" || platform === "android");
  }, []);

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
    PushNotifications.addListener("registrationError", error => {});

    // On push notification received (app in foreground)
    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification: PushNotificationSchema) => {},
    );

    // On push notification action performed (user tapped)
    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action: ActionPerformed) => {},
    );

    // Local notification action
    LocalNotifications.addListener("localNotificationActionPerformed", action => {});
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
      setSettings({ ...settings, enabled: true });
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
  }, [settings, setSettings]);

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
        setScheduledReminders([...scheduledReminders, ...reminders]);
        return reminders;
      } catch (error) {
        return null;
      }
    },
    [settings, scheduledReminders, setScheduledReminders],
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

        setScheduledReminders([...scheduledReminders, reminder]);
        return reminder;
      } catch (error) {
        return null;
      }
    },
    [settings, scheduledReminders, setScheduledReminders],
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

        setScheduledReminders([...scheduledReminders, reminder]);
        return reminder;
      } catch (error) {
        return null;
      }
    },
    [settings, scheduledReminders, setScheduledReminders],
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
    (newSettings: Partial<NotificationSettings>) => {
      setSettings({ ...settings, ...newSettings });
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
