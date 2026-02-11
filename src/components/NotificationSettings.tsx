import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, BellOff, Pill, Activity, Calendar, FileText, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatTime } from "@/lib/notificationPreferences";

export const NotificationSettings = () => {
  const {
    settings,
    updateSettings,
    isSupported,
    permissionStatus,
    scheduledReminders,
    enableNotifications,
    disableNotifications,
    scheduleMedicationReminder,
    scheduleHealthTrackingReminder,
    scheduleWeeklyReport,
    cancelReminder,
    cancelAllReminders,
  } = usePushNotifications();

  const [medicationName, setMedicationName] = useState("");
  const [medicationTime, setMedicationTime] = useState("09:00");
  const [healthTime, setHealthTime] = useState("08:00");
  const [medicationDays, setMedicationDays] = useState<number[]>([1, 3, 5]);
  const [weeklyDay, setWeeklyDay] = useState<number>(1);
  const [weeklyTime, setWeeklyTime] = useState("10:00");
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    if (settings.medicationSchedule?.name) {
      setMedicationName(settings.medicationSchedule.name);
    }
    if (settings.medicationSchedule) {
      setMedicationTime(formatTime(settings.medicationSchedule));
      setMedicationDays(settings.medicationSchedule.daysOfWeek ?? [1, 3, 5]);
    }
    if (settings.healthSchedule) {
      setHealthTime(formatTime(settings.healthSchedule));
    }
    if (settings.weeklyReportSchedule) {
      setWeeklyDay(settings.weeklyReportSchedule.weekday);
      setWeeklyTime(formatTime(settings.weeklyReportSchedule));
    }
  }, [settings.healthSchedule, settings.medicationSchedule, settings.weeklyReportSchedule]);

  const handleEnableNotifications = async () => {
    const success = await enableNotifications();
    if (success) {
      toast.success("Notifications enabled!");
    } else {
      toast.error("Failed to enable notifications. Please check your device settings.");
    }
  };

  const handleDisableNotifications = async () => {
    await disableNotifications();
    toast.info("Notifications disabled");
  };

  const handleAddMedicationReminder = async () => {
    if (!medicationName.trim()) {
      toast.error("Please enter a medication name");
      return;
    }

    const [hour, minute] = medicationTime.split(":").map(Number);
    const result = await scheduleMedicationReminder(medicationName, hour, minute, medicationDays);

    if (result) {
      toast.success(`Reminder set for ${medicationName} at ${medicationTime}`);
    } else {
      toast.error("Failed to set reminder");
    }
  };

  const handleAddHealthReminder = async () => {
    const [hour, minute] = healthTime.split(":").map(Number);
    const result = await scheduleHealthTrackingReminder(hour, minute);

    if (result) {
      toast.success(`Health tracking reminder set for ${healthTime}`);
    } else {
      toast.error("Failed to set reminder");
    }
  };

  const handleAddWeeklyReport = async () => {
    const [hour, minute] = weeklyTime.split(":").map(Number);
    const result = await scheduleWeeklyReport(weeklyDay, hour, minute);

    if (result) {
      toast.success("Weekly report reminder scheduled");
    } else {
      toast.error("Failed to set reminder");
    }
  };

  const handleCancelReminder = async (id: number) => {
    const success = await cancelReminder(id);
    if (success) {
      toast.success("Reminder cancelled");
    }
  };

  const handleCancelAll = async () => {
    const success = await cancelAllReminders();
    if (success) {
      toast.success("All reminders cancelled");
    }
  };

  if (!isSupported) {
    return (
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <BellOff className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-semibold">Push Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Push notifications are only available on mobile devices (iOS/Android).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-3">
            {settings.enabled ? (
              <Bell className="w-5 h-5 text-primary" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">Enable Notifications</p>
              <p className="text-sm text-muted-foreground">
                {permissionStatus === "granted" ? "Permissions granted" : "Requires permission"}
              </p>
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={checked => {
              if (checked) {
                handleEnableNotifications();
              } else {
                handleDisableNotifications();
              }
            }}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Notification Type Toggles */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Notification Types</h4>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-primary" />
                  <span>Medication Reminders</span>
                </div>
                <Switch
                  checked={settings.medicationReminders}
                  onCheckedChange={checked => updateSettings({ medicationReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span>Health Alerts</span>
                </div>
                <Switch
                  checked={settings.healthAlerts}
                  onCheckedChange={checked => updateSettings({ healthAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Scan Reminders</span>
                </div>
                <Switch
                  checked={settings.scanReminders}
                  onCheckedChange={checked => updateSettings({ scanReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Weekly Reports</span>
                </div>
                <Switch
                  checked={settings.weeklyReports}
                  onCheckedChange={checked => updateSettings({ weeklyReports: checked })}
                />
              </div>
            </div>

            {/* Add Medication Reminder */}
            {settings.medicationReminders && (
              <div className="p-4 rounded-lg border border-border/50 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Pill className="w-4 h-4" />
                  Add Medication Reminder
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="medication-name">Medication</Label>
                    <Input
                      id="medication-name"
                      placeholder="e.g., Vitamin D"
                      value={medicationName}
                      onChange={e => setMedicationName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="medication-time">Time</Label>
                    <Input
                      id="medication-time"
                      type="time"
                      value={medicationTime}
                      onChange={e => setMedicationTime(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Days of Week</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dayNames.map((day, index) => {
                      const selected = medicationDays.includes(index);
                      return (
                        <Button
                          key={day}
                          type="button"
                          variant={selected ? "default" : "outline"}
                          size="sm"
                          className="w-12"
                          onClick={() => {
                            const next = selected
                              ? medicationDays.filter(d => d !== index)
                              : [...medicationDays, index].sort();
                            setMedicationDays(next);
                          }}
                        >
                          {day}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <Button onClick={handleAddMedicationReminder} className="w-full">
                  Add Reminder
                </Button>
              </div>
            )}

            {/* Add Health Tracking Reminder */}
            {settings.scanReminders && (
              <div className="p-4 rounded-lg border border-border/50 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Daily Health Tracking Reminder
                </h4>
                <div>
                  <Label htmlFor="health-time">Reminder Time</Label>
                  <Input
                    id="health-time"
                    type="time"
                    value={healthTime}
                    onChange={e => setHealthTime(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddHealthReminder} className="w-full">
                  Set Daily Reminder
                </Button>
              </div>
            )}

            {/* Weekly Report */}
            {settings.weeklyReports && (
              <div className="p-4 rounded-lg border border-border/50 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Weekly Health Report
                </h4>
                <p className="text-sm text-muted-foreground">Schedule a weekly summary reminder.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="weekly-day">Day</Label>
                    <select
                      id="weekly-day"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={weeklyDay}
                      onChange={e => setWeeklyDay(Number(e.target.value))}
                    >
                      {dayNames.map((day, index) => (
                        <option key={day} value={index}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="weekly-time">Time</Label>
                    <Input
                      id="weekly-time"
                      type="time"
                      value={weeklyTime}
                      onChange={e => setWeeklyTime(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleAddWeeklyReport} className="w-full">
                  Save Weekly Schedule
                </Button>
              </div>
            )}

            {/* Scheduled Reminders */}
            {scheduledReminders.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Scheduled Reminders ({scheduledReminders.length})
                  </h4>
                  <Button variant="ghost" size="sm" onClick={handleCancelAll}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                </div>

                <div className="space-y-2">
                  {scheduledReminders.map(reminder => (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{reminder.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {reminder.schedule.hour.toString().padStart(2, "0")}:
                            {reminder.schedule.minute.toString().padStart(2, "0")}
                            {reminder.schedule.weekday && ` (Day ${reminder.schedule.weekday})`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {reminder.type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelReminder(reminder.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
