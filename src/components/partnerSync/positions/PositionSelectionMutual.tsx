import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import type { PartnerPositionSelection } from "@/lib/partnerSync";

type PositionSelectionMutualProps = {
  mutualSelections: PartnerPositionSelection[];
  loading: boolean;
  onMarkTried: (id: string, notes?: string, tags?: string[]) => Promise<boolean>;
  onSwap: (selectionId: string, positionId: string) => Promise<boolean>;
  availablePositions: { id: string; name: string }[];
};

export function PositionSelectionMutual({
  mutualSelections,
  loading,
  onMarkTried,
  onSwap,
  availablePositions,
}: PositionSelectionMutualProps) {
  const { t } = useI18n();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<Record<string, string>>({});
  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle>{t("partnerSync.positions.mutualTitle")}</CardTitle>
        <CardDescription>{t("partnerSync.positions.mutualSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {mutualSelections.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t("partnerSync.positions.mutualEmpty")}
          </div>
        ) : (
          mutualSelections.map(item => (
            <Card key={item.id} className="border border-border/60">
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {item.position_name ||
                        item.custom_position_name ||
                        t("partnerSync.positions.customFallback")}
                    </p>
                    {item.partner_note && (
                      <p className="text-xs text-muted-foreground">{item.partner_note}</p>
                    )}
                  </div>
                  <Badge variant="outline">{t("partnerSync.positions.accepted")}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="space-y-2 w-full">
                    <Textarea
                      value={notes[item.id] ?? ""}
                      onChange={e => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                      rows={2}
                      placeholder={t("partnerSync.positions.successNotes")}
                      aria-label={t("partnerSync.positions.successNotes")}
                    />
                    <Input
                      value={tags[item.id] ?? ""}
                      onChange={e => setTags(prev => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder={t("partnerSync.positions.successTags")}
                      aria-label={t("partnerSync.positions.successTags")}
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        void onMarkTried(
                          item.id,
                          notes[item.id],
                          (tags[item.id] ?? "")
                            .split(",")
                            .map(tag => tag.trim())
                            .filter(Boolean),
                        )
                      }
                      disabled={loading}
                    >
                      {t("partnerSync.positions.markTried")}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <label className="sr-only" htmlFor={`swap-${item.id}-input`}>
                      {t("partnerSync.positions.swapPlaceholder")}
                    </label>
                    <Input
                      id={`swap-${item.id}-input`}
                      list={`swap-${item.id}`}
                      aria-label={t("partnerSync.positions.swapPlaceholder")}
                      placeholder={t("partnerSync.positions.swapPlaceholder")}
                      onChange={e => {
                        const selected = availablePositions.find(p => p.name === e.target.value);
                        if (selected) void onSwap(item.id, selected.id);
                      }}
                    />
                    <datalist
                      id={`swap-${item.id}`}
                      aria-label={t("partnerSync.positions.swapPlaceholder")}
                    >
                      {availablePositions.map(pos => (
                        // eslint-disable-next-line jsx-a11y/control-has-associated-label
                        <option key={pos.id} value={pos.name} label={pos.name} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
}
