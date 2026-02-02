import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
type PartnerSyncConsentBannerProps = {
  needsConsent: boolean;
  partnerNeedsConsent: boolean;
  onAccept: () => Promise<boolean>;
  loading: boolean;
};

export function PartnerSyncConsentBanner({
  needsConsent,
  partnerNeedsConsent,
  onAccept,
  loading,
}: PartnerSyncConsentBannerProps) {
  const { t } = useI18n();
  if (!needsConsent && !partnerNeedsConsent) return null;
  return (
    <Card className="border border-warning/40 bg-warning/5">
      <CardContent className="pt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {needsConsent
            ? t("partnerSync.settings.consentNeeded")
            : t("partnerSync.settings.partnerConsentNeeded")}
        </div>
        <Button onClick={() => void onAccept()} disabled={loading}>
          {t("partnerSync.settings.acceptConsent")}
        </Button>
      </CardContent>
    </Card>
  );
}
