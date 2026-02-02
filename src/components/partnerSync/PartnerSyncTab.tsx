/**
 * Partner Sync Tab
 * Partner synchronization for shared progress, thought pings, date nights, and positions
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LockedFeature } from "@/dlc/components/LockedFeature";
import { useDLCFeature } from "@/dlc/context/DLCContext";
import {
  usePartnerConnection,
  usePartnerConsent,
  usePartnerPermissions,
} from "@/lib/partnerSync";
import { useI18n } from "@/lib/i18n";
import { PartnerConnectionCard } from "./PartnerConnectionCard";
import { ThoughtPingsPanel } from "./ThoughtPingsPanel";
import { DateNightPlanner } from "./DateNightPlanner";
import { PositionSelectionPanel } from "./PositionSelectionPanel";
import { PartnerSyncRecommendations } from "./PartnerSyncRecommendations";
import { PartnerSyncSettingsPanel } from "./PartnerSyncSettingsPanel";
import { PartnerSyncInsightsPanel } from "./PartnerSyncInsightsPanel";
import { PartnerSyncConsentBanner } from "./PartnerSyncConsentBanner";
import { PartnerSyncPreviewPanel } from "./PartnerSyncPreviewPanel";

type PartnerSyncTabProps = {
  onNavigateToTab?: (tabId: string) => void;
};

export function PartnerSyncTab({ onNavigateToTab }: PartnerSyncTabProps = {}) {
  const { t } = useI18n();
  const { isAvailable, isLoading } = useDLCFeature("partner_sync");
  const [activeTab, setActiveTab] = useState("thoughts");
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        {t("partnerSync.loading")}
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <LockedFeature
        featureId="partner_sync"
        title={t("partnerSync.lockedTitle")}
        description={t("partnerSync.lockedDescription")}
      />
    );
  }

  return (
    <div className="space-y-6">
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="thoughts">{t("partnerSync.tabs.thoughts")}</TabsTrigger>
          <TabsTrigger value="dates">{t("partnerSync.tabs.dates")}</TabsTrigger>
          <TabsTrigger value="positions">{t("partnerSync.tabs.positions")}</TabsTrigger>
          <TabsTrigger value="settings">{t("partnerSync.tabs.settings")}</TabsTrigger>
          <TabsTrigger value="insights">{t("partnerSync.tabs.insights")}</TabsTrigger>
          <TabsTrigger value="recommendations">{t("partnerSync.tabs.recommendations")}</TabsTrigger>
          <TabsTrigger value="preview">{t("partnerSync.tabs.preview")}</TabsTrigger>
        </TabsList>
        <TabsContent value="thoughts" className="space-y-4">
          <ThoughtPingsPanel
            connectionId={connectionId}
            partnerId={partnerId}
            consentReady={consentReady}
          />
        </TabsContent>
        <TabsContent value="dates" className="space-y-4">
          <DateNightPlanner
            partnerId={partnerId}
            currentUserId={currentUserId}
            consentReady={consentReady}
            onNavigateToHub={onNavigateToTab ? () => onNavigateToTab("date-night-planner") : undefined}
          />
        </TabsContent>
        <TabsContent value="positions" className="space-y-4">
          <PositionSelectionPanel
            connectionId={connectionId}
            partnerId={partnerId}
            consentReady={consentReady}
          />
        </TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <PartnerSyncSettingsPanel connectionId={connectionId} />
        </TabsContent>
        <TabsContent value="insights" className="space-y-4">
          <PartnerSyncInsightsPanel connectionId={connectionId} />
        </TabsContent>
        <TabsContent value="recommendations" className="space-y-4">
          <PartnerSyncRecommendations />
        </TabsContent>
        <TabsContent value="preview" className="space-y-4">
          <PartnerSyncPreviewPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PartnerSyncTab;
