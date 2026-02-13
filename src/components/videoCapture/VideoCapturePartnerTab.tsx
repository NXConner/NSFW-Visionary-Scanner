import { useMemo } from "react";
import { PartnerConnectionCard } from "@/components/partnerSync/PartnerConnectionCard";
import { PartnerSyncRecordingPanel } from "@/components/nsfwAdvancedFeatures/tabs/PartnerSyncRecordingPanel";
import { usePartnerConnection } from "@/lib/partnerSync";
import { usePartnerPermissions } from "@/lib/partnerSync/usePartnerPermissions";
import type { MultiCameraSession } from "@/lib/nsfwAdvancedFeatures";

export function VideoCapturePartnerTab(props: {
  sessions: MultiCameraSession[];
  currentSession: MultiCameraSession | null;
  onAddSession: (session: MultiCameraSession) => void;
  onSelectSession: (session: MultiCameraSession) => void;
}): JSX.Element {
  const { sessions, currentSession, onAddSession, onSelectSession } = props;

  const partner = usePartnerConnection();
  const connectionId = partner.activeConnection?.id ?? null;
  const perms = usePartnerPermissions(connectionId);

  const combinedLoading = useMemo(
    () => partner.loading || perms.loading,
    [partner.loading, perms.loading],
  );

  return (
    <div className="space-y-4">
      <PartnerConnectionCard
        connection={partner.activeConnection}
        currentUserId={partner.currentUserId}
        pendingIncoming={partner.pendingIncoming}
        pendingOutgoing={partner.pendingOutgoing}
        lastInviteCode={partner.lastInviteCode}
        loading={combinedLoading}
        permissions={perms.permissions}
        onInvite={partner.sendInvite}
        onAcceptInvite={partner.acceptInviteByCode}
        onAcceptConnection={partner.acceptConnection}
        onDeclineConnection={partner.declineConnection}
        onDisconnect={partner.disconnect}
        onTogglePermission={perms.updatePermission}
      />

      <PartnerSyncRecordingPanel
        sessions={sessions}
        currentSession={currentSession}
        onAddSession={onAddSession}
        onSelectSession={onSelectSession}
      />
    </div>
  );
}
