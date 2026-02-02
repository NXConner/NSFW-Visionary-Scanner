import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import {
  INTIMACY_THEMES,
  THOUGHT_PING_INTENSITIES,
  THOUGHT_PING_PRIORITIES,
  THOUGHT_PING_TONE_TAGS,
} from "@/lib/partnerSync";
import type { ThoughtPingIntensity, ThoughtPingPriority, ThoughtPingTemplate } from "@/lib/partnerSync";

type ThoughtPingComposerProps = {
  partnerId: string | null;
  loading: boolean;
  templates: ThoughtPingTemplate[];
  allowMedia: boolean;
  allowScheduled: boolean;
  onSend: (input: {
    recipientId: string;
    message: string;
    detailedMessage?: string;
    toneTags: string[];
    intensity: ThoughtPingIntensity;
    priority?: ThoughtPingPriority;
    isPinned?: boolean;
    theme?: string;
    scheduledAt?: string;
    remindAt?: string;
    images?: string[];
    gifs?: string[];
    voiceMessageUrl?: string;
    readReceiptRequested?: boolean;
  }) => Promise<boolean>;
  onSaveTemplate: (payload: Partial<ThoughtPingTemplate>) => Promise<boolean>;
};

export function ThoughtPingComposer({
  partnerId,
  loading,
  templates,
  allowMedia,
  allowScheduled,
  onSend,
  onSaveTemplate,
}: ThoughtPingComposerProps) {
  const { t } = useI18n();
  const [toneTags, setToneTags] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<ThoughtPingIntensity>("medium");
  const [priority, setPriority] = useState<ThoughtPingPriority>("normal");
  const [theme, setTheme] = useState("");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [imagesInput, setImagesInput] = useState("");
  const [gifsInput, setGifsInput] = useState("");
  const [voiceMessageUrl, setVoiceMessageUrl] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [readReceiptRequested, setReadReceiptRequested] = useState(true);
  const [privateNote, setPrivateNote] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const templateOptions = useMemo(() => templates, [templates]);

  const applyTemplate = (templateId: string) => {
    const template = templateOptions.find(tpl => tpl.id === templateId);
    if (!template) return;
    setMessage(template.message);
    setDetails(template.detailed_message ?? "");
    setToneTags(template.tone_tags ?? []);
    setIntensity(template.intensity ?? "medium");
    setTheme(template.theme ?? "");
  };

  const parseList = (value: string) =>
    value
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);

  const handleSend = async () => {
    setError(null);
    if (!partnerId) {
      setError(t("partnerSync.error.connectFirst"));
      return;
    }
    if (!message.trim()) {
      setError(t("partnerSync.error.messageRequired"));
      return;
    }
    if (scheduledAt && new Date(scheduledAt).getTime() < Date.now()) {
      setError(t("partnerSync.error.scheduleInFuture"));
      return;
    }
    const ok = await onSend({
      recipientId: partnerId,
      message: message.trim(),
      detailedMessage: details.trim() || privateNote.trim() || undefined,
      toneTags,
      intensity,
      priority,
      isPinned,
      theme: theme || undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      remindAt: remindAt ? new Date(remindAt).toISOString() : undefined,
      images: parseList(imagesInput),
      gifs: parseList(gifsInput),
      voiceMessageUrl: voiceMessageUrl.trim() || undefined,
      readReceiptRequested,
    });
    if (ok) {
      setMessage("");
      setDetails("");
      setToneTags([]);
      setTheme("");
      setIntensity("medium");
      setPriority("normal");
      setScheduledAt("");
      setRemindAt("");
      setImagesInput("");
      setGifsInput("");
      setVoiceMessageUrl("");
      setIsPinned(false);
      setReadReceiptRequested(true);
      setPrivateNote("");
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !message.trim()) {
      setError(t("partnerSync.error.templateNameRequired"));
      return;
    }
    await onSaveTemplate({
      title: templateName.trim(),
      message: message.trim(),
      detailed_message: details.trim() || null,
      tone_tags: toneTags,
      intensity,
      theme: theme || null,
    });
    setTemplateName("");
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle>{t("partnerSync.pings.composeTitle")}</CardTitle>
        <CardDescription>{t("partnerSync.pings.composeSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {templateOptions.length > 0 && (
          <div className="space-y-2">
            <Label>{t("partnerSync.pings.templates")}</Label>
            <Select onValueChange={applyTemplate}>
              <SelectTrigger aria-label={t("partnerSync.pings.templates")}>
                <SelectValue placeholder={t("partnerSync.pings.templatesPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {templateOptions.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>{t("partnerSync.pings.toneTags")}</Label>
          <ToggleGroup
            type="multiple"
            value={toneTags}
            onValueChange={value => setToneTags(value)}
            className="flex flex-wrap justify-start"
            aria-label={t("partnerSync.pings.toneTags")}
          >
            {THOUGHT_PING_TONE_TAGS.map(tag => (
              <ToggleGroupItem key={tag} value={tag} size="sm">
                {tag}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("partnerSync.pings.intensity")}</Label>
            <Select value={intensity} onValueChange={v => setIntensity(v as ThoughtPingIntensity)}>
              <SelectTrigger aria-label={t("partnerSync.pings.intensity")}>
                <SelectValue placeholder={t("partnerSync.pings.intensityPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {THOUGHT_PING_INTENSITIES.map(level => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.pings.priority")}</Label>
            <Select value={priority} onValueChange={v => setPriority(v as ThoughtPingPriority)}>
              <SelectTrigger aria-label={t("partnerSync.pings.priority")}>
                <SelectValue placeholder={t("partnerSync.pings.priorityPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {THOUGHT_PING_PRIORITIES.map(level => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("partnerSync.pings.theme")}</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger aria-label={t("partnerSync.pings.theme")}>
                <SelectValue placeholder={t("partnerSync.pings.themePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {INTIMACY_THEMES.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {allowScheduled && (
            <>
              <div className="space-y-2">
                <Label>{t("partnerSync.pings.schedule")}</Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  aria-label={t("partnerSync.pings.schedule")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partnerSync.pings.remind")}</Label>
                <Input
                  type="datetime-local"
                  value={remindAt}
                  onChange={e => setRemindAt(e.target.value)}
                  aria-label={t("partnerSync.pings.remind")}
                />
              </div>
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t("partnerSync.pings.message")}</Label>
          <Input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={t("partnerSync.pings.messagePlaceholder")}
            aria-label={t("partnerSync.pings.message")}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("partnerSync.pings.details")}</Label>
          <Textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder={t("partnerSync.pings.detailsPlaceholder")}
            rows={3}
            aria-label={t("partnerSync.pings.details")}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("partnerSync.pings.privateNote")}</Label>
          <Input
            value={privateNote}
            onChange={e => setPrivateNote(e.target.value)}
            placeholder={t("partnerSync.pings.privateNotePlaceholder")}
            aria-label={t("partnerSync.pings.privateNote")}
          />
        </div>

        {allowMedia && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("partnerSync.pings.imageUrls")}</Label>
              <Input
                value={imagesInput}
                onChange={e => setImagesInput(e.target.value)}
                placeholder={t("partnerSync.pings.imageUrlsPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("partnerSync.pings.gifUrls")}</Label>
              <Input
                value={gifsInput}
                onChange={e => setGifsInput(e.target.value)}
                placeholder={t("partnerSync.pings.gifUrlsPlaceholder")}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t("partnerSync.pings.voiceUrl")}</Label>
              <Input
                value={voiceMessageUrl}
                onChange={e => setVoiceMessageUrl(e.target.value)}
                placeholder={t("partnerSync.pings.voiceUrlPlaceholder")}
              />
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Switch
              checked={isPinned}
              onCheckedChange={setIsPinned}
              aria-label={t("partnerSync.pings.pin")}
            />
            <div>
              <Label className="text-sm">{t("partnerSync.pings.pin")}</Label>
              <p className="text-xs text-muted-foreground">{t("partnerSync.pings.pinHint")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Switch
              checked={readReceiptRequested}
              onCheckedChange={setReadReceiptRequested}
              aria-label={t("partnerSync.pings.readReceipt")}
            />
            <div>
              <Label className="text-sm">{t("partnerSync.pings.readReceipt")}</Label>
              <p className="text-xs text-muted-foreground">{t("partnerSync.pings.readReceiptHint")}</p>
            </div>
          </div>
        </div>

        {error && <div className="text-sm text-destructive">{error}</div>}

        <div className="flex flex-wrap gap-2">
          <Button className="flex-1" onClick={handleSend} disabled={!partnerId || loading}>
            {t("partnerSync.pings.send")}
          </Button>
          <div className="flex items-center gap-2">
            <Input
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder={t("partnerSync.pings.saveTemplatePlaceholder")}
              aria-label={t("partnerSync.pings.saveTemplate")}
            />
            <Button variant="outline" onClick={handleSaveTemplate} disabled={loading}>
              {t("partnerSync.pings.saveTemplate")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
