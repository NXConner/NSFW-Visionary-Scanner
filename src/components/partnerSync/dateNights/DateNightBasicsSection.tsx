import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useI18n } from "@/lib/i18n";
import { DATE_NIGHT_DISTRACTIONS, DATE_NIGHT_SEGMENTS, INTIMACY_THEMES } from "@/lib/partnerSync";
import type { DateNightPlanInput, DateNightTemplate } from "@/lib/partnerSync";

type DateNightBasicsSectionProps = {
  plan: DateNightPlanInput;
  templates: DateNightTemplate[];
  onApplyTemplate: (templateId: string) => void;
  onUpdate: (patch: Partial<DateNightPlanInput>) => void;
};

export function DateNightBasicsSection({
  plan,
  templates,
  onApplyTemplate,
  onUpdate,
}: DateNightBasicsSectionProps) {
  const { t } = useI18n();

  return (
    <Card className="border border-border/60">
      <CardContent className="pt-4 space-y-4">
        {templates.length > 0 && (
          <div className="space-y-2">
            <Label>{t("partnerSync.dates.templates")}</Label>
            <Select onValueChange={onApplyTemplate}>
              <SelectTrigger>
                <SelectValue placeholder={t("partnerSync.dates.templatesPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.template_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("partnerSync.dates.titleLabel")}</Label>
            <Input
              value={plan.title}
              onChange={e => onUpdate({ title: e.target.value })}
              placeholder={t("partnerSync.dates.titlePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.dates.theme")}</Label>
            <Select value={plan.theme} onValueChange={value => onUpdate({ theme: value as DateNightPlanInput["theme"] })}>
              <SelectTrigger>
                <SelectValue placeholder={t("partnerSync.dates.themePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {INTIMACY_THEMES.map(theme => (
                  <SelectItem key={theme} value={theme}>
                    {theme}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.dates.date")}</Label>
            <Input
              type="date"
              value={plan.date}
              onChange={e => onUpdate({ date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.dates.time")}</Label>
            <Input
              type="time"
              value={plan.time}
              onChange={e => onUpdate({ time: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.dates.location")}</Label>
            <Input
              value={plan.locationName}
              onChange={e => onUpdate({ locationName: e.target.value })}
              placeholder={t("partnerSync.dates.locationPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.dates.address")}</Label>
            <Input
              value={plan.locationAddress}
              onChange={e => onUpdate({ locationAddress: e.target.value })}
              placeholder={t("partnerSync.dates.addressPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.dates.locationType")}</Label>
            <Select
              value={plan.locationType}
              onValueChange={value =>
                onUpdate({ locationType: value as DateNightPlanInput["locationType"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">{t("partnerSync.dates.locationHome")}</SelectItem>
                <SelectItem value="hotel">{t("partnerSync.dates.locationHotel")}</SelectItem>
                <SelectItem value="outdoor">{t("partnerSync.dates.locationOutdoor")}</SelectItem>
                <SelectItem value="other">{t("partnerSync.dates.locationOther")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.dates.duration")}</Label>
            <Input
              type="number"
              min={15}
              value={plan.durationMinutes ?? ""}
              onChange={e =>
                onUpdate({
                  durationMinutes: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.dates.budget")}</Label>
            <Input
              type="number"
              min={0}
              value={plan.budget ?? ""}
              onChange={e =>
                onUpdate({
                  budget: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.dates.travel")}</Label>
            <Input
              type="number"
              min={0}
              value={plan.travelMinutes ?? ""}
              onChange={e =>
                onUpdate({
                  travelMinutes: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Switch
              checked={plan.isLocationPrivate}
              onCheckedChange={value => onUpdate({ isLocationPrivate: value })}
            />
            <div>
              <Label className="text-sm">{t("partnerSync.dates.privateLocation")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("partnerSync.dates.privateLocationHint")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("partnerSync.dates.segments")}</Label>
          <ToggleGroup
            type="multiple"
            value={plan.segments}
            onValueChange={value => onUpdate({ segments: value as DateNightPlanInput["segments"] })}
            className="flex flex-wrap justify-start"
            aria-label={t("partnerSync.dates.segments")}
          >
            {DATE_NIGHT_SEGMENTS.map(segment => (
              <ToggleGroupItem key={segment} value={segment} size="sm">
                {segment.replace("_", " ")}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <Label>{t("partnerSync.dates.distractions")}</Label>
          <div className="flex flex-wrap gap-2">
            {DATE_NIGHT_DISTRACTIONS.map(distraction => (
              <Button
                key={distraction}
                size="sm"
                variant={plan.distractionTags.includes(distraction) ? "default" : "outline"}
                onClick={() =>
                  onUpdate({
                    distractionTags: plan.distractionTags.includes(distraction)
                      ? plan.distractionTags.filter(tag => tag !== distraction)
                      : [...plan.distractionTags, distraction],
                  })
                }
              >
                {distraction}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
