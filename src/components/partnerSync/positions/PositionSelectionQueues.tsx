import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import type { PartnerPositionSelection } from "@/lib/partnerSync";

type PositionSelectionQueuesProps = {
  pendingForMe: PartnerPositionSelection[];
  pendingFromMe: PartnerPositionSelection[];
  loading: boolean;
  onAccept: (id: string, note?: string) => Promise<boolean>;
  onDecline: (id: string, note?: string) => Promise<boolean>;
  onTryLater: (id: string, value: boolean) => Promise<boolean>;
  onFavorite: (id: string, value: boolean) => Promise<boolean>;
};

export function PositionSelectionQueues({
  pendingForMe,
  pendingFromMe,
  loading,
  onAccept,
  onDecline,
  onTryLater,
  onFavorite,
}: PositionSelectionQueuesProps) {
  const { t } = useI18n();
  const [notes, setNotes] = useState<Record<string, string>>({});

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>{t("partnerSync.positions.pendingForYou")}</CardTitle>
          <CardDescription>{t("partnerSync.positions.pendingForYouHint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingForMe.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {t("partnerSync.positions.pendingEmpty")}
            </div>
          ) : (
            pendingForMe.map(item => (
              <Card key={item.id} className="border border-border/60">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {item.position_name ||
                          item.custom_position_name ||
                          t("partnerSync.positions.customFallback")}
                      </p>
                      {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
                    </div>
                    <Badge variant="secondary">{item.selection_status}</Badge>
                  </div>
                  <Input
                    value={notes[item.id] ?? ""}
                    onChange={e => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder={t("partnerSync.positions.replyNote")}
                    aria-label={t("partnerSync.positions.replyNote")}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => void onAccept(item.id, notes[item.id])}
                      disabled={loading}
                    >
                      {t("partnerSync.positions.accept")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void onDecline(item.id, notes[item.id])}
                      disabled={loading}
                    >
                      {t("partnerSync.positions.decline")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void onTryLater(item.id, true)}
                      disabled={loading}
                    >
                      {t("partnerSync.positions.tryLater")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void onFavorite(item.id, true)}
                      disabled={loading}
                    >
                      {t("partnerSync.positions.favoriteTogether")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>{t("partnerSync.positions.pendingFromYou")}</CardTitle>
          <CardDescription>{t("partnerSync.positions.pendingFromYouHint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingFromMe.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {t("partnerSync.positions.pendingEmpty")}
            </div>
          ) : (
            pendingFromMe.map(item => (
              <Card key={item.id} className="border border-border/60">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {item.position_name ||
                          item.custom_position_name ||
                          t("partnerSync.positions.customFallback")}
                      </p>
                      {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
                    </div>
                    <Badge variant="secondary">{t("partnerSync.positions.pending")}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
