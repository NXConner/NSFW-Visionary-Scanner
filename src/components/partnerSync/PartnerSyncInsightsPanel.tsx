import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { usePartnerEvents, formatDateTime } from "@/lib/partnerSync";

type PartnerSyncInsightsPanelProps = {
  connectionId: string | null;
};

function averageLatency(events: Array<{ metadata: Record<string, unknown> | null }>) {
  const values = events
    .map(event => Number(event.metadata?.latency_ms ?? 0))
    .filter(val => Number.isFinite(val) && val > 0);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function PartnerSyncInsightsPanel({ connectionId }: PartnerSyncInsightsPanelProps) {
  const { t, language } = useI18n();
  const { events, loading, loadMore } = usePartnerEvents(connectionId);

  const thoughtResponses = useMemo(
    () => events.filter(event => event.event_type === "thought_ping_responded"),
    [events],
  );
  const selectionResponses = useMemo(
    () =>
      events.filter(event =>
        [
          "position_selection_accepted",
          "position_selection_declined",
          "position_selection_tried",
        ].includes(event.event_type),
      ),
    [events],
  );
  const dateResponses = useMemo(
    () => events.filter(event => event.event_type.startsWith("date_plan_")),
    [events],
  );

  return (
    <div className="space-y-4">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>{t("partnerSync.insights.title")}</CardTitle>
          <CardDescription>{t("partnerSync.insights.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge variant="secondary">
            {t("partnerSync.insights.pingLatency")}: {averageLatency(thoughtResponses)} ms
          </Badge>
          <Badge variant="secondary">
            {t("partnerSync.insights.selectionLatency")}: {averageLatency(selectionResponses)} ms
          </Badge>
          <Badge variant="secondary">
            {t("partnerSync.insights.dateLatency")}: {averageLatency(dateResponses)} ms
          </Badge>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>{t("partnerSync.insights.eventsTitle")}</CardTitle>
          <CardDescription>{t("partnerSync.insights.eventsSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {events.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {t("partnerSync.insights.eventsEmpty")}
            </div>
          ) : (
            events.map(event => (
              <div key={event.id} className="text-sm text-muted-foreground">
                {event.event_type} • {formatDateTime(event.created_at, language)}
              </div>
            ))
          )}
          {events.length >= 20 && (
            <button
              type="button"
              className="text-sm text-primary"
              onClick={loadMore}
              disabled={loading}
            >
              {t("partnerSync.insights.loadMore")}
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
