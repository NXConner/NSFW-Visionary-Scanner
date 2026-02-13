import { ThoughtPingList } from "./thoughtPings/ThoughtPingList";
import { DateNightList } from "./dateNights/DateNightList";
import { PositionSelectionComposer } from "./positions/PositionSelectionComposer";
import { PositionSelectionQueues } from "./positions/PositionSelectionQueues";
import { PositionSelectionMutual } from "./positions/PositionSelectionMutual";
import { PositionSelectionInsights } from "./positions/PositionSelectionInsights";
import { useI18n } from "@/lib/i18n";

const noopAsync = async () => false;

export function PartnerSyncPreviewPanel() {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{t("partnerSync.preview.subtitle")}</div>
      <ThoughtPingList
        pings={[]}
        reactions={{}}
        privateNotes={{}}
        quickReplies={[]}
        currentUserId={null}
        loading={false}
        onMarkRead={noopAsync}
        onRespond={noopAsync}
        onArchive={noopAsync}
        onTogglePin={noopAsync}
        onAddReaction={noopAsync}
        onRemoveReaction={noopAsync}
        onLoadMore={() => undefined}
      />
      <DateNightList
        proposals={[]}
        details={{}}
        currentUserId={null}
        loading={false}
        onRespond={noopAsync}
        onModify={noopAsync}
        onClone={async () => null}
        onAddReflection={noopAsync}
        onLoadMore={() => undefined}
      />
      <PositionSelectionComposer positions={[]} loading={false} onSuggest={noopAsync} />
      <PositionSelectionQueues
        pendingForMe={[]}
        pendingFromMe={[]}
        loading={false}
        onAccept={noopAsync}
        onDecline={noopAsync}
        onTryLater={noopAsync}
        onFavorite={noopAsync}
      />
      <PositionSelectionMutual
        mutualSelections={[]}
        loading={false}
        onMarkTried={noopAsync}
        onSwap={noopAsync}
        availablePositions={[]}
      />
      <PositionSelectionInsights selections={[]} />
    </div>
  );
}
