import { usePositionSelections } from "@/lib/partnerSync/usePositionSelections";
import { useI18n } from "@/lib/i18n";
import { PositionSelectionComposer } from "./positions/PositionSelectionComposer";
import { PositionSelectionQueues } from "./positions/PositionSelectionQueues";
import { PositionSelectionMutual } from "./positions/PositionSelectionMutual";
import { PositionSelectionInsights } from "./positions/PositionSelectionInsights";

type PositionSelectionPanelProps = {
  connectionId: string | null;
  partnerId: string | null;
  consentReady: boolean;
};

export function PositionSelectionPanel({
  connectionId,
  partnerId,
  consentReady,
}: PositionSelectionPanelProps) {
  const { t } = useI18n();
  const {
    positions,
    selections,
    pendingForMe,
    pendingFromMe,
    mutualSelections,
    loading,
    suggest,
    updateSelection,
    markTried,
    proposeSwap,
    setTryLater,
    setFavoriteTogether,
  } = usePositionSelections(connectionId, partnerId);

  if (!partnerId) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("partnerSync.positions.connectHint")}
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
      <PositionSelectionComposer positions={positions} loading={loading} onSuggest={suggest} />
      <PositionSelectionQueues
        pendingForMe={pendingForMe}
        pendingFromMe={pendingFromMe}
        loading={loading}
        onAccept={(id, note) => updateSelection(id, { status: "accepted", partnerNote: note })}
        onDecline={(id, note) => updateSelection(id, { status: "declined", partnerNote: note })}
        onTryLater={setTryLater}
        onFavorite={setFavoriteTogether}
      />
      <PositionSelectionMutual
        mutualSelections={mutualSelections}
        loading={loading}
        onMarkTried={markTried}
        onSwap={proposeSwap}
        availablePositions={positions.map(p => ({ id: p.id, name: p.position_name }))}
      />
      <PositionSelectionInsights selections={selections} />
    </div>
  );
}
