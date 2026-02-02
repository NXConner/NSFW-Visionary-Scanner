import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import type { QuickReplyTemplate, ThoughtPingTemplate } from "@/lib/partnerSync";

type ThoughtPingTemplatesPanelProps = {
  templates: ThoughtPingTemplate[];
  quickReplies: QuickReplyTemplate[];
  onCreateTemplate: (payload: Partial<ThoughtPingTemplate>) => Promise<boolean>;
  onDeleteTemplate: (id: string) => Promise<boolean>;
  onCreateQuickReply: (payload: Partial<QuickReplyTemplate>) => Promise<boolean>;
  onDeleteQuickReply: (id: string) => Promise<boolean>;
};

export function ThoughtPingTemplatesPanel({
  templates,
  quickReplies,
  onCreateTemplate,
  onDeleteTemplate,
  onCreateQuickReply,
  onDeleteQuickReply,
}: ThoughtPingTemplatesPanelProps) {
  const { t } = useI18n();
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateMessage, setTemplateMessage] = useState("");
  const [quickLabel, setQuickLabel] = useState("");
  const [quickMessage, setQuickMessage] = useState("");

  const handleCreateTemplate = async () => {
    if (!templateTitle.trim() || !templateMessage.trim()) return;
    await onCreateTemplate({ title: templateTitle, message: templateMessage });
    setTemplateTitle("");
    setTemplateMessage("");
  };

  const handleCreateQuickReply = async () => {
    if (!quickLabel.trim() || !quickMessage.trim()) return;
    await onCreateQuickReply({ label: quickLabel, message: quickMessage });
    setQuickLabel("");
    setQuickMessage("");
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle>{t("partnerSync.pings.templatesPanelTitle")}</CardTitle>
        <CardDescription>{t("partnerSync.pings.templatesPanelSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>{t("partnerSync.pings.createTemplate")}</Label>
          <div className="grid gap-2 md:grid-cols-2">
            <Input
              value={templateTitle}
              onChange={e => setTemplateTitle(e.target.value)}
              placeholder={t("partnerSync.pings.templateNamePlaceholder")}
            />
            <Input
              value={templateMessage}
              onChange={e => setTemplateMessage(e.target.value)}
              placeholder={t("partnerSync.pings.templateMessagePlaceholder")}
            />
          </div>
          <Button variant="outline" onClick={handleCreateTemplate}>
            {t("partnerSync.pings.saveTemplate")}
          </Button>
        </div>

        <div className="space-y-2">
          <Label>{t("partnerSync.pings.savedTemplates")}</Label>
          {templates.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("partnerSync.pings.templatesEmpty")}</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {templates.map(template => (
                <Button
                  key={template.id}
                  size="sm"
                  variant="outline"
                  onClick={() => void onDeleteTemplate(template.id)}
                >
                  {template.title}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t("partnerSync.pings.createQuickReply")}</Label>
          <div className="grid gap-2 md:grid-cols-2">
            <Input
              value={quickLabel}
              onChange={e => setQuickLabel(e.target.value)}
              placeholder={t("partnerSync.pings.quickReplyLabelPlaceholder")}
            />
            <Input
              value={quickMessage}
              onChange={e => setQuickMessage(e.target.value)}
              placeholder={t("partnerSync.pings.quickReplyMessagePlaceholder")}
            />
          </div>
          <Button variant="outline" onClick={handleCreateQuickReply}>
            {t("partnerSync.pings.saveQuickReply")}
          </Button>
        </div>

        <div className="space-y-2">
          <Label>{t("partnerSync.pings.savedQuickReplies")}</Label>
          {quickReplies.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("partnerSync.pings.quickRepliesEmpty")}</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {quickReplies.map(reply => (
                <Button
                  key={reply.id}
                  size="sm"
                  variant="outline"
                  onClick={() => void onDeleteQuickReply(reply.id)}
                >
                  {reply.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
