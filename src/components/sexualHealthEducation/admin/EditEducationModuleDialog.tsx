import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EducationModule } from "@/lib/sexualHealthEducation";
import { updateSexualHealthEducationModule } from "@/lib/sexualHealthEducationAdmin";

export function EditEducationModuleDialog({
  module,
  onSaved,
}: {
  module: EducationModule;
  onSaved: () => void | Promise<void>;
}): JSX.Element {
  const initial = useMemo(
    () => ({
      title: module.title,
      description: module.description ?? "",
      contentText: module.content_text ?? "",
      contentHtml: module.content_html ?? "",
      videoUrl: module.video_url ?? "",
    }),
    [module],
  );

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [contentText, setContentText] = useState(initial.contentText);
  const [contentHtml, setContentHtml] = useState(initial.contentHtml);
  const [videoUrl, setVideoUrl] = useState(initial.videoUrl);

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await updateSexualHealthEducationModule(module.id!, {
        title,
        description: description || undefined,
        content_text: contentText || undefined,
        content_html: contentHtml || undefined,
        video_url: videoUrl || undefined,
      });
      if (!ok) return;
      await onSaved();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit Module
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Education Module</DialogTitle>
          <DialogDescription>
            Updates are saved directly to the database (admin-only).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mod-title">Title</Label>
            <Input id="mod-title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mod-desc">Description</Label>
            <Textarea
              id="mod-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mod-video">Video URL (optional)</Label>
            <Input
              id="mod-video"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="Enter video URL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mod-html">HTML Content (optional)</Label>
            <Textarea
              id="mod-html"
              value={contentHtml}
              onChange={e => setContentHtml(e.target.value)}
              rows={8}
            />
            <p className="text-xs text-muted-foreground">
              If HTML is set, it will be rendered (sanitized). Otherwise, Text Content will be used.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mod-text">Text Content (optional)</Label>
            <Textarea
              id="mod-text"
              value={contentText}
              onChange={e => setContentText(e.target.value)}
              rows={8}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} variant="gradient">
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
