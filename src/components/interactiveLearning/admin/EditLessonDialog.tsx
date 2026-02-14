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
import type { LearningLesson } from "@/lib/interactiveLearning";
import { updateLearningLesson } from "@/lib/interactiveLearning/admin";

export function EditLessonDialog({
  lesson,
  onSaved,
}: {
  lesson: LearningLesson;
  onSaved: () => void | Promise<void>;
}): JSX.Element {
  const initial = useMemo(() => {
    const cd = (lesson.content_data ?? {}) as Record<string, unknown>;
    return {
      title: lesson.title,
      contentType: lesson.content_type,
      text: typeof cd.text === "string" ? cd.text : "",
      videoUrl: typeof cd.video_url === "string" ? cd.video_url : "",
    };
  }, [lesson.content_data, lesson.content_type, lesson.title]);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(initial.title);
  const [text, setText] = useState(initial.text);
  const [videoUrl, setVideoUrl] = useState(initial.videoUrl);

  const handleSave = async () => {
    setSaving(true);
    try {
      const content_data: Record<string, unknown> = {
        ...(lesson.content_data as Record<string, unknown> | null),
      };
      if (lesson.content_type === "video") {
        content_data.video_url = videoUrl.trim() || null;
      } else {
        content_data.text = text;
      }

      const ok = await updateLearningLesson(lesson.id, {
        title,
        content_data,
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
          Edit Lesson
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Lesson Content</DialogTitle>
          <DialogDescription>
            Updates are saved directly to the database (admin-only).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Title</Label>
            <Input id="lesson-title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {lesson.content_type === "video" ? (
            <div className="space-y-2">
              <Label htmlFor="lesson-video-url">Video URL</Label>
              <Input
                id="lesson-video-url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="Enter video URL"
              />
              <p className="text-xs text-muted-foreground">
                Use an embeddable / direct video URL compatible with the web & mobile player.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="lesson-text">Lesson Text</Label>
              <Textarea
                id="lesson-text"
                value={text}
                onChange={e => setText(e.target.value)}
                rows={12}
              />
            </div>
          )}
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
