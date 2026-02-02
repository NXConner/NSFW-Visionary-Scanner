import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const RECOMMENDATION_KEYS = {
  thoughtPings: [
    "partnerSync.recommendations.pings.1",
    "partnerSync.recommendations.pings.2",
    "partnerSync.recommendations.pings.3",
    "partnerSync.recommendations.pings.4",
    "partnerSync.recommendations.pings.5",
    "partnerSync.recommendations.pings.6",
  ],
  dateNights: [
    "partnerSync.recommendations.dates.1",
    "partnerSync.recommendations.dates.2",
    "partnerSync.recommendations.dates.3",
    "partnerSync.recommendations.dates.4",
    "partnerSync.recommendations.dates.5",
    "partnerSync.recommendations.dates.6",
  ],
  positions: [
    "partnerSync.recommendations.positions.1",
    "partnerSync.recommendations.positions.2",
    "partnerSync.recommendations.positions.3",
    "partnerSync.recommendations.positions.4",
    "partnerSync.recommendations.positions.5",
    "partnerSync.recommendations.positions.6",
  ],
  safety: [
    "partnerSync.recommendations.safety.1",
    "partnerSync.recommendations.safety.2",
    "partnerSync.recommendations.safety.3",
    "partnerSync.recommendations.safety.4",
  ],
};

export function PartnerSyncRecommendations() {
  const { t } = useI18n();
  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          {t("partnerSync.recommendations.title")}
        </CardTitle>
        <CardDescription>{t("partnerSync.recommendations.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{t("partnerSync.recommendations.pingsTitle")}</Badge>
          </div>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {RECOMMENDATION_KEYS.thoughtPings.map(key => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </section>
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{t("partnerSync.recommendations.datesTitle")}</Badge>
          </div>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {RECOMMENDATION_KEYS.dateNights.map(key => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </section>
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{t("partnerSync.recommendations.positionsTitle")}</Badge>
          </div>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {RECOMMENDATION_KEYS.positions.map(key => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </section>
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{t("partnerSync.recommendations.safetyTitle")}</Badge>
          </div>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {RECOMMENDATION_KEYS.safety.map(key => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}
