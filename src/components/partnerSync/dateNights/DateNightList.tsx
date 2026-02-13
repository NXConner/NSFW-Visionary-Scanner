import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { buildGoogleCalendarUrl, buildIcsDataUrl, formatDate, formatTime } from "@/lib/partnerSync";
import type {
  DateNightPlanDetails,
  DateNightPlanInput,
  DateNightReminderItem,
} from "@/lib/partnerSync";
import type { IntimateDateProposal, ProposalModifications } from "@/lib/nsfwAdvancedFeatures";
import { CalendarCheck, CheckCircle2, Copy, X } from "lucide-react";

type DateNightListProps = {
  proposals: IntimateDateProposal[];
  details: Record<string, DateNightPlanDetails>;
  currentUserId: string | null;
  loading: boolean;
  onRespond: (proposalId: string, response: "accepted" | "declined") => Promise<boolean>;
  onModify: (proposalId: string, modifications: ProposalModifications) => Promise<boolean>;
  onClone: (proposal: IntimateDateProposal) => Promise<string | null>;
  onAddReflection: (proposalId: string, rating: number, notes: string) => Promise<boolean>;
  onLoadMore: () => void;
};

export function DateNightList({
  proposals,
  details,
  currentUserId,
  loading,
  onRespond,
  onModify,
  onClone,
  onAddReflection,
  onLoadMore,
}: DateNightListProps) {
  const { t, language } = useI18n();
  const [modifications, setModifications] = useState<Record<string, ProposalModifications>>({});
  const [reflections, setReflections] = useState<Record<string, { rating: string; notes: string }>>(
    {},
  );

  const list = useMemo(() => proposals, [proposals]);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle>{t("partnerSync.dates.recentTitle")}</CardTitle>
        <CardDescription>{t("partnerSync.dates.recentSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {list.length === 0 ? (
          <div className="text-sm text-muted-foreground">{t("partnerSync.dates.empty")}</div>
        ) : (
          list.map(proposal => {
            const isCreator = proposal.creator_id === currentUserId;
            const canViewAddress =
              !proposal.is_location_private || isCreator || proposal.proposal_status === "accepted";
            const itinerary = (details[proposal.id]?.itinerary ??
              []) as DateNightPlanInput["itinerary"];
            const reminderItems = (details[proposal.id]?.reminders ??
              []) as DateNightReminderItem[];
            const checklistItems = details[proposal.id]?.checklist ?? [];
            const packingItems = details[proposal.id]?.packingList ?? [];
            const aftercareItems = details[proposal.id]?.aftercare ?? [];
            return (
              <Card key={proposal.id} className="border border-border/60">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{proposal.proposal_title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(proposal.proposed_date, language)} •{" "}
                        {formatTime(proposal.proposed_time, language)}
                      </div>
                    </div>
                    <Badge variant="secondary">{proposal.proposal_status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {proposal.location_name || t("partnerSync.dates.locationTbd")}
                    {proposal.location_address && canViewAddress
                      ? ` • ${proposal.location_address}`
                      : ""}
                  </div>
                  {proposal.text_message && (
                    <div className="text-sm text-muted-foreground">{proposal.text_message}</div>
                  )}
                  {itinerary.length > 0 && (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {itinerary.map(item => (
                        <div key={item.id}>
                          {item.time} • {item.title} • {item.location}
                        </div>
                      ))}
                    </div>
                  )}
                  {(checklistItems.length > 0 ||
                    packingItems.length > 0 ||
                    aftercareItems.length > 0) && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {checklistItems.length > 0 && (
                        <div>
                          {t("partnerSync.dates.checklist")}:{" "}
                          {checklistItems
                            .slice(0, 4)
                            .map(item => item.item)
                            .join(", ")}
                        </div>
                      )}
                      {packingItems.length > 0 && (
                        <div>
                          {t("partnerSync.dates.packing")}:{" "}
                          {packingItems
                            .slice(0, 4)
                            .map(item => item.item)
                            .join(", ")}
                        </div>
                      )}
                      {aftercareItems.length > 0 && (
                        <div>
                          {t("partnerSync.dates.aftercare")}:{" "}
                          {aftercareItems
                            .slice(0, 4)
                            .map(item => item.item)
                            .join(", ")}
                        </div>
                      )}
                    </div>
                  )}
                  {reminderItems.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {t("partnerSync.dates.reminders")}{" "}
                      {reminderItems.map(r => `${r.reminderType}:${r.remindAt}`).join(", ")}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => void onRespond(proposal.id, "accepted")}
                      disabled={loading}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {t("partnerSync.dates.accept")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void onRespond(proposal.id, "declined")}
                      disabled={loading}
                    >
                      <X className="w-4 h-4 mr-1" />
                      {t("partnerSync.dates.decline")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void onClone(proposal)}
                      disabled={loading}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      {t("partnerSync.dates.clone")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(buildGoogleCalendarUrl(proposal), "_blank")}
                    >
                      <CalendarCheck className="w-4 h-4 mr-1" />
                      {t("partnerSync.dates.addCalendar")}
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <a
                        href={buildIcsDataUrl(proposal)}
                        download={`${proposal.proposal_title}.ics`}
                      >
                        {t("partnerSync.dates.downloadIcs")}
                      </a>
                    </Button>
                  </div>

                  {!isCreator && (
                    <div className="space-y-2">
                      <Label>{t("partnerSync.dates.modifyTitle")}</Label>
                      <div className="grid gap-2 md:grid-cols-2">
                        <Input
                          type="date"
                          value={modifications[proposal.id]?.date ?? ""}
                          onChange={e =>
                            setModifications(prev => ({
                              ...prev,
                              [proposal.id]: { ...prev[proposal.id], date: e.target.value },
                            }))
                          }
                        />
                        <Input
                          type="time"
                          value={modifications[proposal.id]?.time ?? ""}
                          onChange={e =>
                            setModifications(prev => ({
                              ...prev,
                              [proposal.id]: { ...prev[proposal.id], time: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <Textarea
                        value={modifications[proposal.id]?.suggestions ?? ""}
                        onChange={e =>
                          setModifications(prev => ({
                            ...prev,
                            [proposal.id]: { ...prev[proposal.id], suggestions: e.target.value },
                          }))
                        }
                        placeholder={t("partnerSync.dates.modifyPlaceholder")}
                        rows={2}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void onModify(proposal.id, modifications[proposal.id] || {})}
                        disabled={loading}
                      >
                        {t("partnerSync.dates.submitChanges")}
                      </Button>
                    </div>
                  )}

                  {proposal.proposal_status === "accepted" && (
                    <div className="space-y-2">
                      <Label>{t("partnerSync.dates.reflectionTitle")}</Label>
                      <div className="grid gap-2 md:grid-cols-2">
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={reflections[proposal.id]?.rating ?? ""}
                          onChange={e =>
                            setReflections(prev => ({
                              ...prev,
                              [proposal.id]: { ...prev[proposal.id], rating: e.target.value },
                            }))
                          }
                          aria-label={t("partnerSync.dates.reflectionTitle")}
                        />
                        <Input
                          value={reflections[proposal.id]?.notes ?? ""}
                          onChange={e =>
                            setReflections(prev => ({
                              ...prev,
                              [proposal.id]: { ...prev[proposal.id], notes: e.target.value },
                            }))
                          }
                          placeholder={t("partnerSync.dates.reflectionNotes")}
                          aria-label={t("partnerSync.dates.reflectionNotes")}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void onAddReflection(
                            proposal.id,
                            Number(reflections[proposal.id]?.rating ?? 0),
                            reflections[proposal.id]?.notes ?? "",
                          )
                        }
                        disabled={
                          loading ||
                          Number(reflections[proposal.id]?.rating ?? 0) < 1 ||
                          Number(reflections[proposal.id]?.rating ?? 0) > 5
                        }
                      >
                        {t("partnerSync.dates.saveReflection")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
        {proposals.length >= 10 && (
          <Button variant="outline" className="w-full" onClick={onLoadMore} disabled={loading}>
            {t("partnerSync.dates.loadMore")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
