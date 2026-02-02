import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import {
  DATE_NIGHT_AFTERCARE_PRESETS,
  DATE_NIGHT_CHECKLIST_PRESETS,
  DATE_NIGHT_PACKING_PRESETS,
  createItineraryId,
} from "@/lib/partnerSync";
import type {
  DateNightChecklistItem,
  DateNightPlanInput,
  DateNightReminderItem,
  DateNightTemplate,
} from "@/lib/partnerSync";
import { ItineraryEditor } from "./ItineraryEditor";
import { DateNightBasicsSection } from "./DateNightBasicsSection";
import { DateNightChecklistsSection } from "./DateNightChecklistsSection";
import { DateNightRemindersSection } from "./DateNightRemindersSection";
import { DateNightNotesSection } from "./DateNightNotesSection";
import { DateNightMediaSection } from "./DateNightMediaSection";

type DateNightFormProps = {
  partnerId: string | null;
  templates: DateNightTemplate[];
  loading: boolean;
  onSubmit: (input: DateNightPlanInput) => Promise<string | null>;
  onSaveTemplate: (input: DateNightPlanInput, templateName: string) => Promise<boolean>;
};

const emptyPlan = (partnerId: string | null): DateNightPlanInput => ({
  partnerId: partnerId ?? "",
  title: "",
  date: "",
  time: "",
  locationName: "",
  locationAddress: "",
  locationType: "home",
  isLocationPrivate: true,
  durationMinutes: null,
  theme: "",
  distractionTags: [],
  segments: [],
  itinerary: [],
  positions: [],
  message: "",
  specialRequests: "",
  voiceMessageUrl: "",
  voiceMessageDurationSeconds: null,
  images: [],
  gifs: [],
  videos: [],
  emojis: [],
  links: [],
  budget: null,
  travelMinutes: null,
  checklist: [],
  packingList: [],
  aftercare: [],
  reminders: [],
});

function toChecklist(items: Array<{ id: string; value: string }>, category: "prep" | "aftercare") {
  return items.map(item => ({
    id: item.id,
    item: item.value,
    category,
    isRequired: true,
  }));
}

function toEditable(items: DateNightChecklistItem[]) {
  return items.map(item => ({ id: item.id, value: item.item }));
}

export function DateNightForm({
  partnerId,
  templates,
  loading,
  onSubmit,
  onSaveTemplate,
}: DateNightFormProps) {
  const { t } = useI18n();
  const [plan, setPlan] = useState<DateNightPlanInput>(() => emptyPlan(partnerId));
  const [error, setError] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [checklistItems, setChecklistItems] = useState<Array<{ id: string; value: string }>>(
    DATE_NIGHT_CHECKLIST_PRESETS.map((item, index) => ({ id: `preset-${index}`, value: item as string })),
  );
  const [packingItems, setPackingItems] = useState<Array<{ id: string; value: string }>>(
    DATE_NIGHT_PACKING_PRESETS.map((item, index) => ({ id: `preset-pack-${index}`, value: item as string })),
  );
  const [aftercareItems, setAftercareItems] = useState<Array<{ id: string; value: string }>>(
    DATE_NIGHT_AFTERCARE_PRESETS.map((item, index) => ({ id: `preset-after-${index}`, value: item as string })),
  );
  const [reminders, setReminders] = useState<DateNightReminderItem[]>([]);

  const templateOptions = useMemo(() => templates, [templates]);

  useEffect(() => {
    setPlan(prev => ({ ...prev, partnerId: partnerId ?? "" }));
  }, [partnerId]);

  const applyTemplate = (templateId: string) => {
    const template = templateOptions.find(tpl => tpl.id === templateId);
    if (!template) return;
    const activities = (template.default_activities ?? {}) as Record<string, unknown>;
    const checklist = Array.isArray(activities.checklist) ? activities.checklist : null;
    const packingList = Array.isArray(activities.packing_list) ? activities.packing_list : null;
    const aftercare = Array.isArray(activities.aftercare) ? activities.aftercare : null;
    const reminders = Array.isArray(activities.reminders) ? activities.reminders : null;
    const distractions = Array.isArray(activities.distractions) ? activities.distractions : null;
    const positions = Array.isArray(template.default_positions)
      ? template.default_positions
      : Array.isArray(activities.positions)
        ? activities.positions
        : null;
    const budget =
      typeof activities.budget === "number" || activities.budget === null
        ? (activities.budget as number | null)
        : undefined;
    const travelMinutes =
      typeof activities.travel_minutes === "number" || activities.travel_minutes === null
        ? (activities.travel_minutes as number | null)
        : undefined;
    setPlan(prev => ({
      ...prev,
      title: template.template_name,
      durationMinutes: template.default_duration_minutes ?? prev.durationMinutes,
      locationType: template.default_location_type ?? prev.locationType,
      theme: (activities.theme as DateNightPlanInput["theme"]) ?? prev.theme,
      segments: (activities.segments as DateNightPlanInput["segments"]) ?? prev.segments,
      itinerary: ((activities.itinerary as DateNightPlanInput["itinerary"]) ?? []).map(item => ({
        ...item,
        id: item.id || createItineraryId(),
      })),
      message: template.default_message ?? prev.message,
      positions: positions ? positions.map(p => String(p)) : prev.positions,
      distractionTags: distractions ? distractions.map(d => String(d)) : prev.distractionTags,
      budget: typeof budget !== "undefined" ? budget : prev.budget,
      travelMinutes: typeof travelMinutes !== "undefined" ? travelMinutes : prev.travelMinutes,
    }));
    if (checklist) {
      setChecklistItems(
        checklist.map((item, index) => ({
          id: `tpl-check-${index}-${createItineraryId()}`,
          value: String(item),
        })),
      );
    }
    if (packingList) {
      setPackingItems(
        packingList.map((item, index) => ({
          id: `tpl-pack-${index}-${createItineraryId()}`,
          value: String(item),
        })),
      );
    }
    if (aftercare) {
      setAftercareItems(
        aftercare.map((item, index) => ({
          id: `tpl-after-${index}-${createItineraryId()}`,
          value: String(item),
        })),
      );
    }
    if (reminders) {
      setReminders(
        reminders.map((item, index) => ({
          id: `tpl-rem-${index}-${createItineraryId()}`,
          reminderType: String((item as any)?.reminderType || "custom") as DateNightReminderItem["reminderType"],
          remindAt: String((item as any)?.remindAt || ""),
          notes: String((item as any)?.notes || ""),
        })),
      );
    }
  };

  const updatePlan = (patch: Partial<DateNightPlanInput>) =>
    setPlan(prev => ({
      ...prev,
      ...patch,
    }));

  const handleSubmit = async () => {
    setError(null);
    if (!partnerId) {
      setError(t("partnerSync.error.connectFirst"));
      return;
    }
    if (!plan.title.trim() || !plan.date || !plan.time) {
      setError(t("partnerSync.dates.errorRequired"));
      return;
    }
    const input: DateNightPlanInput = {
      ...plan,
      partnerId,
      checklist: toChecklist(checklistItems, "prep"),
      packingList: packingItems.map(item => ({ id: item.id, item: item.value })),
      aftercare: toChecklist(aftercareItems, "aftercare"),
      reminders,
    };
    const ok = await onSubmit(input);
    if (ok) {
      setPlan(emptyPlan(partnerId));
      setChecklistItems(
        DATE_NIGHT_CHECKLIST_PRESETS.map((item, index) => ({ id: `preset-${index}`, value: item as string })),
      );
      setPackingItems(
        DATE_NIGHT_PACKING_PRESETS.map((item, index) => ({ id: `preset-pack-${index}`, value: item as string })),
      );
      setAftercareItems(
        DATE_NIGHT_AFTERCARE_PRESETS.map((item, index) => ({ id: `preset-after-${index}`, value: item as string })),
      );
      setReminders([]);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setError(t("partnerSync.dates.templateNameRequired"));
      return;
    }
    await onSaveTemplate(
      {
        ...plan,
        partnerId: partnerId ?? "",
        checklist: toChecklist(checklistItems, "prep"),
        packingList: packingItems.map(item => ({ id: item.id, item: item.value })),
        aftercare: toChecklist(aftercareItems, "aftercare"),
        reminders,
      },
      templateName.trim(),
    );
    setTemplateName("");
  };

  const addReminder = () => {
    setReminders(prev => [
      ...prev,
      {
        id: createItineraryId(),
        reminderType: "custom",
        remindAt: "",
        notes: "",
      },
    ]);
  };

  const updateReminder = (id: string, patch: Partial<DateNightReminderItem>) => {
    setReminders(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeReminder = (id: string) => {
    setReminders(prev => prev.filter(item => item.id !== id));
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle>{t("partnerSync.dates.title")}</CardTitle>
        <CardDescription>{t("partnerSync.dates.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DateNightBasicsSection
          plan={plan}
          templates={templateOptions}
          onApplyTemplate={applyTemplate}
          onUpdate={updatePlan}
        />

        <ItineraryEditor items={plan.itinerary} onChange={items => updatePlan({ itinerary: items })} />

        <DateNightChecklistsSection
          checklistItems={checklistItems}
          packingItems={packingItems}
          aftercareItems={aftercareItems}
          onChecklistChange={setChecklistItems}
          onPackingChange={setPackingItems}
          onAftercareChange={setAftercareItems}
        />

        <DateNightRemindersSection
          reminders={reminders}
          onAdd={addReminder}
          onUpdate={updateReminder}
          onRemove={removeReminder}
        />

        <DateNightNotesSection plan={plan} onUpdate={updatePlan} />
        <DateNightMediaSection plan={plan} onUpdate={updatePlan} />

        {error && <div className="text-sm text-destructive">{error}</div>}

        <div className="flex flex-wrap gap-2">
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
            {t("partnerSync.dates.send")}
          </Button>
          <Input
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            placeholder={t("partnerSync.dates.templateNamePlaceholder")}
            aria-label={t("partnerSync.dates.templateNamePlaceholder")}
          />
          <Button variant="outline" onClick={handleSaveTemplate} disabled={loading}>
            {t("partnerSync.dates.saveTemplate")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
