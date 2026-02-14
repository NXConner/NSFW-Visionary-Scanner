import { useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
  RefreshCw,
  Send,
  Trash2,
  Pencil,
  Copy,
  XCircle,
} from "lucide-react";

import type { AdminBroadcastNotificationDto } from "./types";
import {
  adminCancelBroadcastNotification,
  adminDeleteBroadcastNotification,
  adminSendBroadcastNow,
} from "./api";

function readRatePercent(n: AdminBroadcastNotificationDto): number {
  const denom = Math.max(0, n.targetCount || 0);
  if (denom <= 0) return 0;
  return Math.round((Math.max(0, n.readCount || 0) / denom) * 100);
}

function getTypeIcon(type: string) {
  switch (type) {
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case "success":
      return <CheckCircle className="h-4 w-4 text-success" />;
    case "error":
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Info className="h-4 w-4 text-primary" />;
  }
}

function formatMaybeDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function ItemRow(props: {
  n: AdminBroadcastNotificationDto;
  onEdit: (n: AdminBroadcastNotificationDto) => void;
  onDuplicate: (n: AdminBroadcastNotificationDto) => void;
  onChanged: () => void;
}) {
  const n = props.n;
  const rate = readRatePercent(n);
  const when =
    n.status === "scheduled"
      ? `Scheduled: ${formatMaybeDate(n.scheduledForIso)}`
      : n.status === "sent"
        ? `Sent: ${formatMaybeDate(n.sentAtIso)}`
        : `Updated: ${formatMaybeDate(n.updatedAtIso)}`;

  return (
    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {getTypeIcon(n.type)}
            <span className="font-semibold truncate">{n.title}</span>
            <Badge variant="outline" className="uppercase">
              {n.audience}
            </Badge>
            {n.status === "scheduled" ? <Badge variant="secondary">Scheduled</Badge> : null}
            {n.status === "draft" ? <Badge variant="secondary">Draft</Badge> : null}
            {n.status === "cancelled" ? <Badge variant="secondary">Cancelled</Badge> : null}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => props.onEdit(n)} aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => props.onDuplicate(n)}
            aria-label="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {n.status === "draft" ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                try {
                  await adminSendBroadcastNow({
                    title: n.title,
                    message: n.message,
                    type: n.type,
                    audience: n.audience,
                    audienceUserIds: n.audienceUserIds,
                    channels: n.channels,
                    scheduledForIso: null,
                  });
                  toast.success("Sent");
                  props.onChanged();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to send");
                }
              }}
              aria-label="Send draft now"
            >
              <Send className="h-4 w-4" />
            </Button>
          ) : null}
          {n.status === "scheduled" ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                try {
                  await adminCancelBroadcastNotification(n.id);
                  toast.success("Cancelled");
                  props.onChanged();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to cancel");
                }
              }}
              aria-label="Cancel scheduled notification"
            >
              <Clock className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={async () => {
              try {
                await adminDeleteBroadcastNotification(n.id);
                toast.success("Deleted");
                props.onChanged();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to delete");
              }
            }}
            aria-label="Delete notification"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground whitespace-pre-line">{n.message}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{when}</span>
        {n.status === "sent" ? (
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {rate}% read ({n.readCount}/{n.targetCount || 0})
          </span>
        ) : null}
        {n.lastError ? (
          <span className="flex items-center gap-1 text-destructive">
            <AlertTriangle className="h-3 w-3" />
            {n.lastError}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function AdminBroadcastNotificationHistoryCard(props: {
  loading: boolean;
  notifications: AdminBroadcastNotificationDto[];
  onRefresh: () => void;
  onEdit: (n: AdminBroadcastNotificationDto) => void;
  onDuplicate: (n: AdminBroadcastNotificationDto) => void;
}): JSX.Element {
  const grouped = useMemo(() => {
    const sent: AdminBroadcastNotificationDto[] = [];
    const scheduled: AdminBroadcastNotificationDto[] = [];
    const drafts: AdminBroadcastNotificationDto[] = [];
    const cancelled: AdminBroadcastNotificationDto[] = [];
    for (const n of props.notifications) {
      if (n.isDeleted) continue;
      if (n.status === "sent") sent.push(n);
      else if (n.status === "scheduled") scheduled.push(n);
      else if (n.status === "draft") drafts.push(n);
      else cancelled.push(n);
    }
    return { sent, scheduled, drafts, cancelled };
  }, [props.notifications]);

  return (
    <Card className="glass-card lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Notification History</span>
          <Button variant="outline" size="sm" onClick={props.onRefresh} disabled={props.loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>Real broadcast notification log (database-backed)</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sent">
          <TabsList className="mb-4">
            <TabsTrigger value="sent">Sent ({grouped.sent.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled ({grouped.scheduled.length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({grouped.drafts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="sent">
            <ScrollArea className="h-[420px]">
              <div className="space-y-3">
                {grouped.sent.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No sent notifications yet.
                  </div>
                ) : (
                  grouped.sent.map(n => (
                    <ItemRow
                      key={n.id}
                      n={n}
                      onEdit={props.onEdit}
                      onDuplicate={props.onDuplicate}
                      onChanged={props.onRefresh}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="scheduled">
            <ScrollArea className="h-[420px]">
              <div className="space-y-3">
                {grouped.scheduled.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No scheduled notifications.
                  </div>
                ) : (
                  grouped.scheduled.map(n => (
                    <ItemRow
                      key={n.id}
                      n={n}
                      onEdit={props.onEdit}
                      onDuplicate={props.onDuplicate}
                      onChanged={props.onRefresh}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="drafts">
            <ScrollArea className="h-[420px]">
              <div className="space-y-3">
                {grouped.drafts.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No drafts saved.
                  </div>
                ) : (
                  grouped.drafts.map(n => (
                    <ItemRow
                      key={n.id}
                      n={n}
                      onEdit={props.onEdit}
                      onDuplicate={props.onDuplicate}
                      onChanged={props.onRefresh}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
