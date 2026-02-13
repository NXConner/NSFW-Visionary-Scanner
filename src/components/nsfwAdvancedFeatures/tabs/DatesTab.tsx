import { DateNightPlanner } from "@/components/partnerSync/DateNightPlanner";
import { PartnerConnectionCard } from "@/components/partnerSync/PartnerConnectionCard";
import { PartnerSyncConsentBanner } from "@/components/partnerSync/PartnerSyncConsentBanner";
import {
  usePartnerConnection,
  usePartnerConsent,
  usePartnerPermissions,
} from "@/lib/partnerSync";

export function DatesTab({ isActive: _isActive }: { isActive: boolean }): JSX.Element {
  const {
    activeConnection,
    currentUserId,
    pendingIncoming,
    pendingOutgoing,
    loading,
    lastInviteCode,
    sendInvite,
    acceptInviteByCode,
    acceptConnection,
    declineConnection,
    disconnect,
  } = usePartnerConnection();

  const connectionId = activeConnection?.id ?? null;
  const partnerId =
    activeConnection && currentUserId
      ? activeConnection.user_id === currentUserId
        ? activeConnection.partner_id
        : activeConnection.user_id
      : null;

  const { permissions, updatePermission } = usePartnerPermissions(connectionId);
  const { needsConsent, partnerNeedsConsent, acceptConsent, loading: consentLoading } =
    usePartnerConsent(connectionId);
  const consentReady = !needsConsent && !partnerNeedsConsent;

  return (
    <div className="space-y-4">
      <PartnerConnectionCard
        connection={activeConnection}
        currentUserId={currentUserId}
        pendingIncoming={pendingIncoming}
        pendingOutgoing={pendingOutgoing}
        lastInviteCode={lastInviteCode}
        loading={loading}
        permissions={permissions}
        onInvite={sendInvite}
        onAcceptInvite={acceptInviteByCode}
        onAcceptConnection={acceptConnection}
        onDeclineConnection={declineConnection}
        onDisconnect={disconnect}
        onTogglePermission={updatePermission}
      />

      <PartnerSyncConsentBanner
        needsConsent={needsConsent}
        partnerNeedsConsent={partnerNeedsConsent}
        onAccept={acceptConsent}
        loading={consentLoading}
      />

      <DateNightPlanner
        partnerId={partnerId}
        currentUserId={currentUserId ?? null}
        consentReady={consentReady}
      />
    </div>
  );
}
