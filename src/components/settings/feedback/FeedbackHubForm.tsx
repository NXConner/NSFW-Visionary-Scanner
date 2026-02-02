import {
  ClipboardCopy,
  RefreshCw,
  Send,
  Sparkles,
  Bug,
  ListPlus,
  HeartHandshake,
  MessageSquareText,
  ThumbsUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { triggerHaptic } from "@/lib/haptics";
import type { FeedbackKind } from "@/lib/feedback";
import { useFeedbackHub } from "./useFeedbackHub";
import { kindIcon, kindLabel } from "./utils";

type FeedbackHubState = ReturnType<typeof useFeedbackHub>;

export function FeedbackHubForm(props: { hub: FeedbackHubState; onSubmitted?: () => void }) {
  const hub = props.hub;
  const Icon = kindIcon(hub.activeKind);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">Requests • Wishlist • Bugs</Badge>
        <span className="text-xs text-muted-foreground">Private to your account</span>
      </div>

      <Tabs
        value={hub.activeKind}
        onValueChange={v => {
          hub.setActiveKind(v as FeedbackKind);
          triggerHaptic("selection");
        }}
      >
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="feature_request" className="gap-2">
            <Sparkles className="w-4 h-4" /> Feature
          </TabsTrigger>
          <TabsTrigger value="expansion_request" className="gap-2">
            <ListPlus className="w-4 h-4" /> Expansion
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="gap-2">
            <HeartHandshake className="w-4 h-4" /> Wishlist
          </TabsTrigger>
          <TabsTrigger value="bug" className="gap-2">
            <Bug className="w-4 h-4" /> Bug
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <MessageSquareText className="w-4 h-4" /> General
          </TabsTrigger>
          <TabsTrigger value="praise" className="gap-2">
            <ThumbsUp className="w-4 h-4" /> Praise
          </TabsTrigger>
        </TabsList>

        <TabsContent value={hub.activeKind} className="mt-4 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{kindLabel(hub.activeKind)}</div>
              <div className="text-xs text-muted-foreground">
                Help us prioritize what to build next.
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base">How do you feel about the app?</Label>
            <div className="flex items-center gap-3">
              <div className="ml-auto text-sm text-muted-foreground">
                Score: <span className="font-medium text-foreground">{hub.rating}/10</span>
              </div>
            </div>
            <Slider
              value={[hub.rating]}
              min={0}
              max={10}
              step={1}
              onValueChange={v => hub.setRating(v[0] ?? 0)}
            />
            <p className="text-xs text-muted-foreground">
              This score helps us measure satisfaction and prioritize fixes/features.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-base">Title</Label>
              <Input
                value={hub.title}
                onChange={e => hub.setTitle(e.target.value)}
                placeholder="Short, specific summary"
              />
              {hub.fieldErrors.title && (
                <p className="text-xs text-destructive">{hub.fieldErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-base">Tags (comma-separated)</Label>
              <Input
                value={hub.tagsRaw}
                onChange={e => hub.setTagsRaw(e.target.value)}
                placeholder="e.g. reports, scanner, ui"
              />
              {hub.fieldErrors.tags && (
                <p className="text-xs text-destructive">{hub.fieldErrors.tags}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base">Details</Label>
            <Textarea
              value={hub.description}
              onChange={e => hub.setDescription(e.target.value)}
              placeholder={
                hub.isBugLike
                  ? "What happened? What were you doing right before it occurred?"
                  : "Describe the change/feature you want and why it matters."
              }
              className="min-h-[140px]"
            />
            {hub.fieldErrors.description && (
              <p className="text-xs text-destructive">{hub.fieldErrors.description}</p>
            )}
          </div>

          {hub.isBugLike && (
            <div className="space-y-4 rounded-xl border border-border/60 bg-secondary/10 p-4">
              <div className="text-sm font-semibold">Bug report details</div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base">Severity</Label>
                  <Select
                    value={hub.severity}
                    onValueChange={v => hub.setSeverity(v as typeof hub.severity)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  {hub.fieldErrors.severity && (
                    <p className="text-xs text-destructive">{hub.fieldErrors.severity}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Frequency</Label>
                  <Select
                    value={hub.frequency}
                    onValueChange={v => hub.setFrequency(v as typeof hub.frequency)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Once</SelectItem>
                      <SelectItem value="sometimes">Sometimes</SelectItem>
                      <SelectItem value="often">Often</SelectItem>
                      <SelectItem value="always">Always</SelectItem>
                    </SelectContent>
                  </Select>
                  {hub.fieldErrors.frequency && (
                    <p className="text-xs text-destructive">{hub.fieldErrors.frequency}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base">Steps to reproduce</Label>
                <Textarea
                  value={hub.stepsToReproduce}
                  onChange={e => hub.setStepsToReproduce(e.target.value)}
                  placeholder={"1) ...\n2) ...\n3) ..."}
                  className="min-h-[110px]"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base">Expected</Label>
                  <Textarea
                    value={hub.expected}
                    onChange={e => hub.setExpected(e.target.value)}
                    className="min-h-[90px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Actual</Label>
                  <Textarea
                    value={hub.actual}
                    onChange={e => hub.setActual(e.target.value)}
                    className="min-h-[90px]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-base">Attachments (optional)</Label>
              <Input
                type="file"
                multiple
                accept="image/*,text/plain,application/json"
                onChange={e => {
                  const files = Array.from(e.target.files ?? []);
                  hub.setAttachments(files.slice(0, 5));
                  triggerHaptic("selection");
                }}
              />
              <p className="text-xs text-muted-foreground">
                Attachments are recorded as references for now; enabling uploads requires a storage
                bucket + policy.
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-base">Privacy</Label>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Include diagnostics</div>
                  <div className="text-xs text-muted-foreground">
                    Device/app metadata only (no sensitive personal data)
                  </div>
                </div>
                <Switch
                  checked={hub.includeDiagnostics}
                  onCheckedChange={hub.setIncludeDiagnostics}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Include recent activity</div>
                  <div className="text-xs text-muted-foreground">
                    Last ~25 actions to help reproduce issues
                  </div>
                </div>
                <Switch
                  checked={hub.includeRecentAudit}
                  onCheckedChange={hub.setIncludeRecentAudit}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-secondary/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Contact</div>
                <div className="text-xs text-muted-foreground">
                  Optionally let us reply to clarify details.
                </div>
              </div>
              <Switch
                checked={hub.allowContact}
                onCheckedChange={v => {
                  hub.setAllowContact(v);
                  triggerHaptic("selection");
                }}
              />
            </div>
            {hub.allowContact && (
              <div className="space-y-2">
                <Label className="text-base">Email</Label>
                <Input
                  value={hub.contactEmail}
                  onChange={e => hub.setContactEmail(e.target.value)}
                  placeholder="you@domain.com"
                />
                {hub.fieldErrors.contactEmail && (
                  <p className="text-xs text-destructive">{hub.fieldErrors.contactEmail}</p>
                )}
              </div>
            )}
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                const res = await hub.submit();
                if (res.ok && props.onSubmitted) props.onSubmitted();
              }}
              disabled={hub.submitting}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {hub.user ? "Submit" : "Save locally"}
            </Button>
            <Button type="button" variant="outline" onClick={hub.copyDiagnostics} className="gap-2">
              <ClipboardCopy className="w-4 h-4" />
              Copy diagnostics
            </Button>
            <Button type="button" variant="outline" onClick={hub.requestSync} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Sync now
            </Button>
            <Button type="button" variant="ghost" onClick={hub.resetForm}>
              Reset
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
