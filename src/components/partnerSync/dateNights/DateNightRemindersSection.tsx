import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DATE_NIGHT_REMINDER_TYPES } from "@/lib/partnerSync";
import { useI18n } from "@/lib/i18n";
import type { DateNightReminderItem } from "@/lib/partnerSync";

type DateNightRemindersSectionProps = {
  reminders: DateNightReminderItem[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<DateNightReminderItem>) => void;
  onRemove: (id: string) => void;
};

export function DateNightRemindersSection({
  reminders,
  onAdd,
  onUpdate,
  onRemove,
}: DateNightRemindersSectionProps) {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <Label>{t("partnerSync.dates.reminders")}</Label>
      <div className="space-y-2">
        {reminders.map(reminder => (
          <div key={reminder.id} className="grid gap-2 md:grid-cols-3">
            <Select
              value={reminder.reminderType}
              onValueChange={value =>
                onUpdate(reminder.id, {
                  reminderType: value as DateNightReminderItem["reminderType"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_NIGHT_REMINDER_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="datetime-local"
              value={reminder.remindAt}
              onChange={e => onUpdate(reminder.id, { remindAt: e.target.value })}
              aria-label={t("partnerSync.dates.reminders")}
            />
            <Input
              value={reminder.notes}
              onChange={e => onUpdate(reminder.id, { notes: e.target.value })}
              placeholder={t("partnerSync.dates.reminderNotes")}
              aria-label={t("partnerSync.dates.reminderNotes")}
            />
            <Button variant="ghost" onClick={() => onRemove(reminder.id)}>
              {t("partnerSync.common.remove")}
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={onAdd}>
          {t("partnerSync.dates.addReminder")}
        </Button>
      </div>
    </div>
  );
}
