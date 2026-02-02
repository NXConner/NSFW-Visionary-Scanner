import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/contexts/SettingsContext";
import { triggerHaptic } from "@/lib/haptics";
import { Bell, Clock } from "lucide-react";

export function RemindersSettingsCard() {
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    reminderTime,
    setReminderTime,
    reminderDays,
    setReminderDays,
  } = useSettings();

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const toggleDay = (day: number) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter(d => d !== day));
    } else {
      setReminderDays([...reminderDays, day].sort());
    }
    triggerHaptic("selection");
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Measurement Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Enable Reminders</Label>
            <p className="text-sm text-muted-foreground">Get notified to log measurements</p>
          </div>
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={v => {
              setNotificationsEnabled(v);
              triggerHaptic("selection");
            }}
          />
        </div>

        {notificationsEnabled && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Reminder Time
                </Label>
              </div>
              <Input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="w-32"
              />
            </div>

            <div>
              <Label className="text-base mb-3 block">Reminder Days</Label>
              <div className="flex gap-2 flex-wrap">
                {dayNames.map((day, index) => (
                  <Button
                    key={day}
                    variant={reminderDays.includes(index) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(index)}
                    className="w-12"
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
