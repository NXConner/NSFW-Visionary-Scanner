import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { fromExtended } from "@/lib/supabaseExtensions";
import { usePartnerConsent, usePartnerPreferences, usePartnerRetention } from "@/lib/partnerSync";

type PartnerSyncSettingsPanelProps = {
  connectionId: string | null;
};

export function PartnerSyncSettingsPanel({ connectionId }: PartnerSyncSettingsPanelProps) {
  const { t } = useI18n();
  const { preferences, updatePreferences, loading: prefsLoading } = usePartnerPreferences();
  const {
    policy,
    updatePolicy,
    applyRetention,
    loading: retentionLoading,
  } = usePartnerRetention(connectionId);
  const {
    needsConsent,
    partnerNeedsConsent,
    acceptConsent,
    revokeConsent,
    loading: consentLoading,
  } = usePartnerConsent(connectionId);
  const [panicConfirm, setPanicConfirm] = useState("");

  const handlePanicDelete = async () => {
    if (!connectionId) return;
    if (panicConfirm !== "DELETE") return;
    // Delete all partner sync data for this connection
    await fromExtended("partner_thought_pings").delete().eq("connection_id", connectionId);
    await fromExtended("partner_position_selections").delete().eq("connection_id", connectionId);
    await fromExtended("partner_connections").delete().eq("id", connectionId);
    setPanicConfirm("");
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>{t("partnerSync.settings.consentTitle")}</CardTitle>
          <CardDescription>{t("partnerSync.settings.consentSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {needsConsent
              ? t("partnerSync.settings.consentNeeded")
              : t("partnerSync.settings.consentRecorded")}
          </div>
          <div className="text-sm text-muted-foreground">
            {partnerNeedsConsent
              ? t("partnerSync.settings.partnerConsentNeeded")
              : t("partnerSync.settings.partnerConsentRecorded")}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void acceptConsent()} disabled={consentLoading}>
              {t("partnerSync.settings.acceptConsent")}
            </Button>
            <Button
              variant="outline"
              onClick={() => void revokeConsent()}
              disabled={consentLoading}
            >
              {t("partnerSync.settings.revokeConsent")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>{t("partnerSync.settings.preferencesTitle")}</CardTitle>
          <CardDescription>{t("partnerSync.settings.preferencesSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={preferences?.quiet_hours_enabled ?? false}
              onCheckedChange={value => void updatePreferences({ quiet_hours_enabled: value })}
            />
            <div>
              <Label className="text-sm">{t("partnerSync.settings.quietHours")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("partnerSync.settings.quietHoursHint")}
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t("partnerSync.settings.quietStart")}</Label>
              <Input
                type="time"
                value={preferences?.quiet_hours_start ?? "22:00"}
                onChange={e => void updatePreferences({ quiet_hours_start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("partnerSync.settings.quietEnd")}</Label>
              <Input
                type="time"
                value={preferences?.quiet_hours_end ?? "07:00"}
                onChange={e => void updatePreferences({ quiet_hours_end: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("partnerSync.settings.timezone")}</Label>
              <Input
                value={preferences?.timezone ?? "UTC"}
                onChange={e => void updatePreferences({ timezone: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("partnerSync.settings.rateLimit")}</Label>
              <Input
                type="number"
                min={1}
                value={preferences?.rate_limit_per_hour ?? 12}
                onChange={e =>
                  void updatePreferences({ rate_limit_per_hour: Number(e.target.value) || 12 })
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={preferences?.allow_push_notifications ?? true}
                onCheckedChange={value =>
                  void updatePreferences({ allow_push_notifications: value })
                }
              />
              <Label>{t("partnerSync.settings.pushNotifications")}</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={preferences?.allow_scheduled_pings ?? true}
                onCheckedChange={value => void updatePreferences({ allow_scheduled_pings: value })}
              />
              <Label>{t("partnerSync.settings.scheduledPings")}</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={preferences?.allow_media ?? true}
                onCheckedChange={value => void updatePreferences({ allow_media: value })}
              />
              <Label>{t("partnerSync.settings.mediaAttachments")}</Label>
            </div>
          </div>
          {prefsLoading && (
            <div className="text-xs text-muted-foreground">{t("common.loading")}</div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>{t("partnerSync.settings.retentionTitle")}</CardTitle>
          <CardDescription>{t("partnerSync.settings.retentionSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("partnerSync.settings.retentionPings")}</Label>
              <Input
                type="number"
                min={0}
                value={policy?.retention_days_pings ?? 180}
                onChange={e =>
                  void updatePolicy({ retention_days_pings: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("partnerSync.settings.retentionSelections")}</Label>
              <Input
                type="number"
                min={0}
                value={policy?.retention_days_selections ?? 365}
                onChange={e =>
                  void updatePolicy({ retention_days_selections: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("partnerSync.settings.retentionPlans")}</Label>
              <Input
                type="number"
                min={0}
                value={policy?.retention_days_plans ?? 365}
                onChange={e =>
                  void updatePolicy({ retention_days_plans: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("partnerSync.settings.retentionEvents")}</Label>
              <Input
                type="number"
                min={0}
                value={policy?.retention_days_events ?? 365}
                onChange={e =>
                  void updatePolicy({ retention_days_events: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => void applyRetention()}
            disabled={retentionLoading || !connectionId}
          >
            {t("partnerSync.settings.applyRetention")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>{t("partnerSync.settings.panicTitle")}</CardTitle>
          <CardDescription>{t("partnerSync.settings.panicSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>{t("partnerSync.settings.panicConfirm")}</Label>
          <Input value={panicConfirm} onChange={e => setPanicConfirm(e.target.value)} />
          <Button
            variant="destructive"
            onClick={handlePanicDelete}
            disabled={panicConfirm !== "DELETE" || !connectionId}
          >
            {t("partnerSync.settings.panicAction")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
