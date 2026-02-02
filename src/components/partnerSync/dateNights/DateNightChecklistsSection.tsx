import { ListEditor } from "./ListEditor";
import { useI18n } from "@/lib/i18n";

type DateNightChecklistsSectionProps = {
  checklistItems: Array<{ id: string; value: string }>;
  packingItems: Array<{ id: string; value: string }>;
  aftercareItems: Array<{ id: string; value: string }>;
  onChecklistChange: (items: Array<{ id: string; value: string }>) => void;
  onPackingChange: (items: Array<{ id: string; value: string }>) => void;
  onAftercareChange: (items: Array<{ id: string; value: string }>) => void;
};

export function DateNightChecklistsSection({
  checklistItems,
  packingItems,
  aftercareItems,
  onChecklistChange,
  onPackingChange,
  onAftercareChange,
}: DateNightChecklistsSectionProps) {
  const { t } = useI18n();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ListEditor
        label={t("partnerSync.dates.checklist")}
        placeholder={t("partnerSync.dates.checklistPlaceholder")}
        items={checklistItems}
        onChange={onChecklistChange}
      />
      <ListEditor
        label={t("partnerSync.dates.packing")}
        placeholder={t("partnerSync.dates.packingPlaceholder")}
        items={packingItems}
        onChange={onPackingChange}
      />
      <ListEditor
        label={t("partnerSync.dates.aftercare")}
        placeholder={t("partnerSync.dates.aftercarePlaceholder")}
        items={aftercareItems}
        onChange={onAftercareChange}
      />
    </div>
  );
}
