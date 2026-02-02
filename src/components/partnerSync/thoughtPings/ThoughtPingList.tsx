import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { QUICK_REPLY_PRESETS, THOUGHT_PING_REACTIONS } from "@/lib/partnerSync";
import type { PartnerThoughtPing, QuickReplyTemplate } from "@/lib/partnerSync";
import { formatDateTime } from "@/lib/partnerSync";
import { Bookmark, CheckCircle2, Inbox, Reply, Trash2 } from "lucide-react";

type ThoughtPingListProps = {
  pings: PartnerThoughtPing[];
  reactions: Record<string, Record<string, number>>;
  privateNotes: Record<string, string>;
  quickReplies: QuickReplyTemplate[];
  currentUserId: string | null;
  loading: boolean;
  onMarkRead: (pingId: string) => Promise<boolean>;
  onRespond: (pingId: string, response: string, quickReply?: string) => Promise<boolean>;
  onArchive: (pingId: string) => Promise<boolean>;
  onTogglePin: (pingId: string, pinned: boolean) => Promise<boolean>;
  onAddReaction: (pingId: string, emoji: string) => Promise<boolean>;
  onRemoveReaction: (pingId: string, emoji: string) => Promise<boolean>;
  onLoadMore: () => void;
};

export function ThoughtPingList({
  pings,
  reactions,
  privateNotes,
  quickReplies,
  currentUserId,
  loading,
  onMarkRead,
  onRespond,
  onArchive,
  onTogglePin,
  onAddReaction,
  onRemoveReaction,
  onLoadMore,
}: ThoughtPingListProps) {
  const { t, language } = useI18n();
  const [responses, setResponses] = useState<Record<string, string>>({});

  const recent = useMemo(() => pings, [pings]);
  const replyOptions = quickReplies.length > 0 ? quickReplies : QUICK_REPLY_PRESETS.map((p, i) => ({
    id: `preset-${i}`,
    label: p.label,
    message: p.message,
    is_favorite: false,
    user_id: "",
    created_at: "",
    updated_at: "",
  }));

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle>{t("partnerSync.pings.recentTitle")}</CardTitle>
        <CardDescription>{t("partnerSync.pings.recentSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recent.length === 0 ? (
          <div className="text-sm text-muted-foreground">{t("partnerSync.pings.empty")}</div>
        ) : (
          recent.map(ping => {
            const isRecipient = ping.recipient_id === currentUserId;
            const pingReactions = reactions[ping.id] ?? {};
            return (
              <Card key={ping.id} className="border border-border/60">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      {ping.tone_tags?.map(tag => (
                        <Badge key={`${ping.id}-${tag}`} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                      {ping.intensity && <Badge variant="outline">{ping.intensity}</Badge>}
                      {ping.theme && <Badge variant="outline">{ping.theme}</Badge>}
                      {ping.priority === "high" && (
                        <Badge variant="destructive">{t("partnerSync.pings.highPriority")}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {ping.is_pinned && <Bookmark className="w-4 h-4 text-primary" />}
                      <Badge variant="secondary">{ping.status}</Badge>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{ping.message}</div>
                  {ping.detailed_message && (
                    <div className="text-sm text-muted-foreground">{ping.detailed_message}</div>
                  )}
                  {privateNotes[ping.id] && (
                    <div className="text-xs text-muted-foreground">
                      {t("partnerSync.pings.privateNote")}: {privateNotes[ping.id]}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(ping.created_at, language)} • {ping.delivery_state}
                  </div>
                  {ping.images_urls && ping.images_urls.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {t("partnerSync.pings.images")}: {ping.images_urls.join(", ")}
                    </div>
                  )}
                  {ping.gifs_urls && ping.gifs_urls.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {t("partnerSync.pings.gifs")}: {ping.gifs_urls.join(", ")}
                    </div>
                  )}
                  {ping.voice_message_url && (
                    <div className="text-xs text-muted-foreground">
                      {t("partnerSync.pings.voice")}: {ping.voice_message_url}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 items-center">
                    {isRecipient && ping.status === "sent" && (
                      <Button size="sm" variant="outline" onClick={() => void onMarkRead(ping.id)}>
                        <Inbox className="w-4 h-4 mr-1" />
                        {t("partnerSync.pings.markRead")}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => void onArchive(ping.id)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      {t("partnerSync.pings.archive")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void onTogglePin(ping.id, !ping.is_pinned)}
                    >
                      <Bookmark className="w-4 h-4 mr-1" />
                      {ping.is_pinned ? t("partnerSync.pings.unpin") : t("partnerSync.pings.pin")}
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {THOUGHT_PING_REACTIONS.map(reaction => (
                      <Button
                        key={`${ping.id}-${reaction.id}`}
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          pingReactions[reaction.id]
                            ? void onRemoveReaction(ping.id, reaction.id)
                            : void onAddReaction(ping.id, reaction.id)
                        }
                      >
                        {reaction.label}
                        {pingReactions[reaction.id] ? ` (${pingReactions[reaction.id]})` : ""}
                      </Button>
                    ))}
                  </div>

                  {isRecipient && (
                    <div className="space-y-2">
                      <Label>{t("partnerSync.pings.reply")}</Label>
                      <div className="flex flex-wrap gap-2">
                        {replyOptions.map(reply => (
                          <Button
                            key={reply.id}
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setResponses(prev => ({ ...prev, [ping.id]: reply.message }))
                            }
                          >
                            {reply.label}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={responses[ping.id] ?? ""}
                          onChange={e =>
                            setResponses(prev => ({ ...prev, [ping.id]: e.target.value }))
                          }
                          placeholder={t("partnerSync.pings.replyPlaceholder")}
                        />
                        <Button
                          onClick={() =>
                            void onRespond(ping.id, responses[ping.id] ?? "", "custom")
                          }
                          disabled={loading}
                        >
                          <Reply className="w-4 h-4 mr-1" />
                          {t("partnerSync.pings.sendReply")}
                        </Button>
                      </div>
                      {ping.response_message && (
                        <div className="text-sm text-success flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          {ping.response_message}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
        {pings.length >= 20 && (
          <Button variant="outline" className="w-full" onClick={onLoadMore} disabled={loading}>
            {t("partnerSync.pings.loadMore")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
