import { useThoughtPings, useThoughtPingTemplates, usePartnerPreferences } from "@/lib/partnerSync";
import { ThoughtPingComposer } from "./thoughtPings/ThoughtPingComposer";
import { ThoughtPingList } from "./thoughtPings/ThoughtPingList";
import { ThoughtPingTemplatesPanel } from "./thoughtPings/ThoughtPingTemplatesPanel";
import { useI18n } from "@/lib/i18n";

type ThoughtPingsPanelProps = {
  connectionId: string | null;
  partnerId: string | null;
  consentReady: boolean;
};

export function ThoughtPingsPanel({
  connectionId,
  partnerId,
  consentReady,
}: ThoughtPingsPanelProps) {
  const { t } = useI18n();
  const {
    pings,
    reactions,
    privateNotes,
    loading,
    currentUserId,
    sendPing,
    markRead,
    respond,
    archive,
    togglePin,
    addReaction,
    removeReaction,
    loadMore,
  } = useThoughtPings(connectionId);
  const {
    templates,
    quickReplies,
    createTemplate,
    deleteTemplate,
    createQuickReply,
    deleteQuickReply,
  } = useThoughtPingTemplates();
  const { preferences } = usePartnerPreferences();

  if (!partnerId) {
    return (
      <div className="text-sm text-muted-foreground">{t("partnerSync.pings.connectHint")}</div>
    );
  }
  if (!consentReady) {
    return (
      <div className="text-sm text-muted-foreground">{t("partnerSync.settings.consentNeeded")}</div>
    );
  }

  return (
    <div className="space-y-4">
      <ThoughtPingComposer
        partnerId={partnerId}
        loading={loading}
        templates={templates}
        allowMedia={preferences?.allow_media ?? true}
        allowScheduled={preferences?.allow_scheduled_pings ?? true}
        onSend={sendPing}
        onSaveTemplate={createTemplate}
      />
      <ThoughtPingList
        pings={pings}
        reactions={reactions}
        privateNotes={privateNotes}
        quickReplies={quickReplies}
        currentUserId={currentUserId}
        loading={loading}
        onMarkRead={markRead}
        onRespond={respond}
        onArchive={archive}
        onTogglePin={togglePin}
        onAddReaction={addReaction}
        onRemoveReaction={removeReaction}
        onLoadMore={loadMore}
      />
      <ThoughtPingTemplatesPanel
        templates={templates}
        quickReplies={quickReplies}
        onCreateTemplate={createTemplate}
        onDeleteTemplate={deleteTemplate}
        onCreateQuickReply={createQuickReply}
        onDeleteQuickReply={deleteQuickReply}
      />
    </div>
  );
}
