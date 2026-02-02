import { useDateNights } from "@/lib/partnerSync/useDateNights";
import { useI18n } from "@/lib/i18n";
import { DateNightForm } from "./dateNights/DateNightForm";
import { DateNightList } from "./dateNights/DateNightList";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

type DateNightPlannerProps = {
  partnerId: string | null;
  currentUserId?: string | null;
  consentReady: boolean;
  onNavigateToHub?: () => void;
};

export function DateNightPlanner({ partnerId, currentUserId, consentReady, onNavigateToHub }: DateNightPlannerProps) {
  const { t } = useI18n();
  const {
    proposals,
    details,
    templates,
    loading,
    createPlan,
    saveTemplate,
    respond,
    respondWithModification,
    addReflection,
    clonePlan,
    loadMore,
  } = useDateNights(partnerId);

  if (!partnerId) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("partnerSync.dates.connectHint")}
      </div>
    );
  }
  if (!consentReady) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("partnerSync.settings.consentNeeded")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onNavigateToHub && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onNavigateToHub} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            {t("partnerSync.dates.openFullPlanner")}
          </Button>
        </div>
      )}
      <DateNightForm
        partnerId={partnerId}
        templates={templates}
        loading={loading}
        onSubmit={createPlan}
        onSaveTemplate={saveTemplate}
      />
      <DateNightList
        proposals={proposals}
        details={details}
        currentUserId={currentUserId ?? null}
        loading={loading}
        onRespond={respond}
        onModify={respondWithModification}
        onClone={clonePlan}
        onAddReflection={addReflection}
        onLoadMore={loadMore}
      />
    </div>
  );
}
