import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import type { DateNightPlanInput } from "@/lib/partnerSync";

type DateNightNotesSectionProps = {
  plan: DateNightPlanInput;
  onUpdate: (patch: Partial<DateNightPlanInput>) => void;
};

export function DateNightNotesSection({ plan, onUpdate }: DateNightNotesSectionProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("partnerSync.dates.positions")}</Label>
        <Input
          value={plan.positions.join(", ")}
          onChange={e =>
            onUpdate({
              positions: e.target.value
                .split(",")
                .map(v => v.trim())
                .filter(Boolean),
            })
          }
          placeholder={t("partnerSync.dates.positionsPlaceholder")}
          aria-label={t("partnerSync.dates.positions")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("partnerSync.dates.message")}</Label>
        <Textarea
          value={plan.message}
          onChange={e => onUpdate({ message: e.target.value })}
          placeholder={t("partnerSync.dates.messagePlaceholder")}
          rows={3}
          aria-label={t("partnerSync.dates.message")}
        />
      </div>
      <div className="space-y-2">
        <Label>{t("partnerSync.dates.specialRequests")}</Label>
        <Textarea
          value={plan.specialRequests}
          onChange={e => onUpdate({ specialRequests: e.target.value })}
          placeholder={t("partnerSync.dates.specialRequestsPlaceholder")}
          rows={2}
          aria-label={t("partnerSync.dates.specialRequests")}
        />
      </div>
    </div>
  );
}
