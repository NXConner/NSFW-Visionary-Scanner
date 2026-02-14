import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Send, Save, Clock, RotateCcw } from "lucide-react";

import type {
  AdminBroadcastNotificationAudience,
  AdminBroadcastNotificationDto,
  AdminBroadcastNotificationType,
  AdminBroadcastNotificationUpsertInput,
  AdminBroadcastNotificationsStats,
} from "./types";
import {
  adminSaveBroadcastDraft,
  adminScheduleBroadcastNotification,
  adminSendBroadcastNow,
} from "./api";
import { isoToLocalDateTimeInputValue, localDateTimeInputValueToIso } from "./datetime";

function splitCommaOrNewline(value: string): string[] {
  return value
    .split(/[\n,]/g)
    .map(v => v.trim())
    .filter(Boolean);
}

export function AdminBroadcastNotificationComposerCard(props: {
  editing: AdminBroadcastNotificationDto | null;
  stats: AdminBroadcastNotificationsStats | null;
  onChanged: () => void;
  onClearEditing: () => void;
}): JSX.Element {
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AdminBroadcastNotificationType>("info");
  const [audience, setAudience] = useState<AdminBroadcastNotificationAudience>("all");

  const [audienceEmailsText, setAudienceEmailsText] = useState("");
  const [audienceUserIdsText, setAudienceUserIdsText] = useState("");

  const [channelInApp, setChannelInApp] = useState(true);
  const [channelPush, setChannelPush] = useState(false);
  const [channelEmail, setChannelEmail] = useState(false);

  const [scheduleLocal, setScheduleLocal] = useState<string>("");

  const editingId = props.editing?.id ? props.editing.id : null;
  const editingStatus = props.editing?.status ?? null;

  useEffect(() => {
    if (!props.editing) return;
    setTitle(props.editing.title);
    setMessage(props.editing.message);
    setType(props.editing.type);
    setAudience(props.editing.audience);
    setAudienceEmailsText(""); // emails aren't stored; keep editable for send-time resolution
    setAudienceUserIdsText(props.editing.audienceUserIds.join("\n"));
    setChannelInApp(Boolean(props.editing.channels.inApp));
    setChannelPush(Boolean(props.editing.channels.push));
    setChannelEmail(Boolean(props.editing.channels.email));
    setScheduleLocal(isoToLocalDateTimeInputValue(props.editing.scheduledForIso));
  }, [props.editing]);

  const channelHint = useMemo(() => {
    const parts: string[] = [];
    if (channelPush) parts.push("Push sends to registered device tokens.");
    if (channelEmail)
      parts.push("Email sending is capped per broadcast to protect provider limits.");
    if (channelInApp) parts.push("In-app shows the notification in the app feed.");
    return parts.join(" ");
  }, [channelEmail, channelInApp, channelPush]);

  const baseInput: AdminBroadcastNotificationUpsertInput = useMemo(
    () => ({
      id: editingId ?? undefined,
      title: title.trim(),
      message: message.trim(),
      type,
      audience,
      channels: { inApp: channelInApp, push: channelPush, email: channelEmail },
      audienceUserIds: splitCommaOrNewline(audienceUserIdsText),
      audienceEmails: splitCommaOrNewline(audienceEmailsText),
      scheduledForIso: localDateTimeInputValueToIso(scheduleLocal),
    }),
    [
      audience,
      audienceEmailsText,
      audienceUserIdsText,
      channelEmail,
      channelInApp,
      channelPush,
      editingId,
      message,
      scheduleLocal,
      title,
      type,
    ],
  );

  function validateOrToast(requireSchedule: boolean): boolean {
    if (!baseInput.title) {
      toast.error("Title is required");
      return false;
    }
    if (!baseInput.message) {
      toast.error("Message is required");
      return false;
    }
    if (!baseInput.channels.inApp && !baseInput.channels.push && !baseInput.channels.email) {
      toast.error("Select at least one delivery channel");
      return false;
    }
    if (baseInput.audience === "specific") {
      const userIds = baseInput.audienceUserIds ?? [];
      const emails = baseInput.audienceEmails ?? [];
      if (userIds.length === 0 && emails.length === 0) {
        toast.error("Specific audience requires emails and/or user IDs");
        return false;
      }
    }
    if (requireSchedule && !baseInput.scheduledForIso) {
      toast.error("Pick a schedule date/time");
      return false;
    }
    return true;
  }

  return (
    <Card className="glass-card lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Compose</span>
          {props.editing ? (
            <Badge variant="secondary" className="uppercase">
              Editing {editingStatus}
            </Badge>
          ) : null}
        </CardTitle>
        <CardDescription>
          Create a persisted broadcast notification (replaces the old sample-data panel).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="bn-title">Title</Label>
            <Input
              id="bn-title"
              placeholder="Notification title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bn-message">Message</Label>
            <Textarea
              id="bn-message"
              placeholder="Write your message…"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={v => setType(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={v => setAudience(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  <SelectItem value="premium">Premium users</SelectItem>
                  <SelectItem value="free">Free users</SelectItem>
                  <SelectItem value="specific">Specific users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {audience === "specific" ? (
            <div className="space-y-3 rounded-lg border border-border/60 bg-secondary/20 p-3">
              <div className="space-y-2">
                <Label htmlFor="bn-specific-emails">
                  Specific emails (comma/newline-separated)
                </Label>
                <Textarea
                  id="bn-specific-emails"
                  placeholder="user1@example.com, user2@example.com"
                  value={audienceEmailsText}
                  onChange={e => setAudienceEmailsText(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bn-specific-userids">
                  Specific user IDs (comma/newline-separated)
                </Label>
                <Textarea
                  id="bn-specific-userids"
                  placeholder="UUIDs (one per line)"
                  value={audienceUserIdsText}
                  onChange={e => setAudienceUserIdsText(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          ) : null}

          <Separator />

          <div className="space-y-2">
            <Label>Delivery channels</Label>
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-3">
                <Label className="flex items-center gap-2">
                  In-app <Badge variant="outline">default</Badge>
                </Label>
                <Switch checked={channelInApp} onCheckedChange={setChannelInApp} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label className="flex items-center gap-2">Push</Label>
                <Switch checked={channelPush} onCheckedChange={setChannelPush} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label className="flex items-center gap-2">Email</Label>
                <Switch checked={channelEmail} onCheckedChange={setChannelEmail} />
              </div>
            </div>
            {channelHint ? (
              <p className="text-xs text-muted-foreground mt-2">{channelHint}</p>
            ) : null}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="bn-schedule">Schedule (optional)</Label>
            <Input
              id="bn-schedule"
              type="datetime-local"
              value={scheduleLocal}
              onChange={e => setScheduleLocal(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Uses your local time; stored/sent in UTC.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              disabled={saving || sending || scheduling}
              onClick={async () => {
                if (!validateOrToast(false)) return;
                setSaving(true);
                try {
                  await adminSaveBroadcastDraft(baseInput);
                  toast.success("Draft saved");
                  props.onChanged();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to save draft");
                } finally {
                  setSaving(false);
                }
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              {props.editing ? "Update draft" : "Save draft"}
            </Button>
            <Button
              disabled={saving || sending || scheduling}
              onClick={async () => {
                if (!validateOrToast(false)) return;
                setSending(true);
                try {
                  const res = await adminSendBroadcastNow(baseInput);
                  toast.success(`Sent (target ${res.targetCount})`);
                  if (res.lastError) toast.error(res.lastError);
                  props.onChanged();
                  props.onClearEditing();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to send");
                } finally {
                  setSending(false);
                }
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              Send now
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              disabled={saving || sending || scheduling}
              onClick={async () => {
                if (!validateOrToast(true)) return;
                setScheduling(true);
                try {
                  await adminScheduleBroadcastNotification({
                    ...baseInput,
                    scheduledForIso: baseInput.scheduledForIso!,
                  });
                  toast.success("Scheduled");
                  props.onChanged();
                  props.onClearEditing();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to schedule");
                } finally {
                  setScheduling(false);
                }
              }}
            >
              <Clock className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button
              variant="ghost"
              disabled={saving || sending || scheduling}
              onClick={() => {
                setTitle("");
                setMessage("");
                setType("info");
                setAudience("all");
                setAudienceEmailsText("");
                setAudienceUserIdsText("");
                setChannelInApp(true);
                setChannelPush(false);
                setChannelEmail(false);
                setScheduleLocal("");
                props.onClearEditing();
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {props.stats ? (
            <div className="rounded-lg border border-border/60 bg-secondary/20 p-3 text-xs text-muted-foreground">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span>Total users: {props.stats.totalUsers ?? "—"}</span>
                <span>Device tokens: {props.stats.totalTokens ?? "—"}</span>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
