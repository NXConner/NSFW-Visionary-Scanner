import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { calculateDailyStreak } from "@/lib/partnerSync";
import type { PartnerPositionSelection } from "@/lib/partnerSync";

type PositionSelectionInsightsProps = {
  selections: PartnerPositionSelection[];
};

export function PositionSelectionInsights({ selections }: PositionSelectionInsightsProps) {
  const { t } = useI18n();
  const triedDates = selections
    .map(s => s.tried_at)
    .filter((date): date is string => Boolean(date));
  const { current, longest } = calculateDailyStreak(triedDates);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle>{t("partnerSync.positions.insightsTitle")}</CardTitle>
        <CardDescription>{t("partnerSync.positions.insightsSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Badge variant="secondary">
          {t("partnerSync.positions.currentStreak")}: {current}
        </Badge>
        <Badge variant="outline">
          {t("partnerSync.positions.longestStreak")}: {longest}
        </Badge>
      </CardContent>
    </Card>
  );
}
