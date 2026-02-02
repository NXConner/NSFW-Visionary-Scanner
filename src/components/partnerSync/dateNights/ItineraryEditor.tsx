import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { DATE_NIGHT_SEGMENTS, createItineraryId } from "@/lib/partnerSync";
import type { DateNightItineraryItem, DateNightSegment } from "@/lib/partnerSync";
import { useI18n } from "@/lib/i18n";

const segmentLabel: Record<DateNightSegment, string> = {
  night_out: "Night out",
  dinner: "Dinner",
  night_in: "Night in",
};

type ItineraryEditorProps = {
  items: DateNightItineraryItem[];
  onChange: (items: DateNightItineraryItem[]) => void;
};

export function ItineraryEditor({ items, onChange }: ItineraryEditorProps) {
  const { t } = useI18n();
  const addItem = () => {
    onChange([
      ...items,
      {
        id: createItineraryId(),
        segment: "dinner",
        title: "",
        time: "",
        location: "",
        notes: "",
      },
    ]);
  };

  const updateItem = (id: string, patch: Partial<DateNightItineraryItem>) => {
    onChange(items.map(item => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{t("partnerSync.dates.itinerary")}</Label>
        <Button size="sm" variant="outline" onClick={addItem}>
          <Plus className="w-4 h-4 mr-1" />
          {t("partnerSync.common.addItem")}
        </Button>
      </div>
      <div className="space-y-3">
        {items.map(item => (
          <Card key={item.id} className="border border-border/60">
            <CardContent className="pt-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("partnerSync.dates.segment")}</Label>
                  <Select
                    value={item.segment}
                    onValueChange={value =>
                      updateItem(item.id, { segment: value as DateNightSegment })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_NIGHT_SEGMENTS.map(segment => (
                        <SelectItem key={segment} value={segment}>
                          {segmentLabel[segment]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("partnerSync.dates.time")}</Label>
                  <Input
                    value={item.time}
                    onChange={e => updateItem(item.id, { time: e.target.value })}
                    placeholder="7:00 PM"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("partnerSync.dates.itemTitle")}</Label>
                  <Input
                    value={item.title}
                    onChange={e => updateItem(item.id, { title: e.target.value })}
                    placeholder={t("partnerSync.dates.itemTitlePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("partnerSync.dates.itemLocation")}</Label>
                  <Input
                    value={item.location}
                    onChange={e => updateItem(item.id, { location: e.target.value })}
                    placeholder={t("partnerSync.dates.itemLocationPlaceholder")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("partnerSync.dates.itemNotes")}</Label>
                <Textarea
                  value={item.notes}
                  onChange={e => updateItem(item.id, { notes: e.target.value })}
                  rows={2}
                />
              </div>
              <Button size="sm" variant="ghost" onClick={() => removeItem(item.id)}>
                <Trash2 className="w-4 h-4 mr-1" />
                {t("partnerSync.common.removeItem")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
