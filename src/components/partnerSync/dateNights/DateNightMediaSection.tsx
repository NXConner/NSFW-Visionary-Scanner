import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { uploadFile, uploadFiles } from "@/lib/mediaUpload";
import type { DateNightPlanInput } from "@/lib/partnerSync";
import { toast } from "sonner";
import { Mic, Square, UploadCloud, X } from "lucide-react";

type DateNightMediaSectionProps = {
  plan: DateNightPlanInput;
  onUpdate: (patch: Partial<DateNightPlanInput>) => void;
};

const AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mpeg", "audio/mp4"];
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const GIF_TYPES = ["image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

function mergeUnique(existing: string[] | undefined, next: string[]): string[] {
  const list = [...(existing ?? []), ...next].filter(Boolean);
  return Array.from(new Set(list));
}

export function DateNightMediaSection({ plan, onUpdate }: DateNightMediaSectionProps): JSX.Element {
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploading, setUploading] = useState(false);
  const voice = useVoiceRecorder();
  const voiceCaptionsUrl = plan.voiceMessageUrl ? `${plan.voiceMessageUrl}.vtt` : "";

  const voiceLabel = useMemo(() => {
    if (voice.isRecording) return "Recording…";
    if (plan.voiceMessageUrl) return "Voice message ready";
    return "No voice message";
  }, [plan.voiceMessageUrl, voice.isRecording]);

  const handleVoiceStop = useCallback(async () => {
    const result = await voice.stop();
    if (!result.blob) {
      toast.error("No audio captured");
      return;
    }
    setUploading(true);
    setUploadPercent(0);
    const file = new File([result.blob], `date-voice-${Date.now()}.webm`, {
      type: result.mimeType || "audio/webm",
    });
    const upload = await uploadFile(file, {
      folder: "intimate-dates/voice",
      allowedTypes: AUDIO_TYPES,
      maxSize: 15 * 1024 * 1024,
      compress: false,
      onProgress: setUploadPercent,
    });
    setUploading(false);
    if (!upload) {
      toast.error("Failed to upload voice message");
      return;
    }
    onUpdate({
      voiceMessageUrl: upload.publicUrl || upload.path,
      voiceMessageDurationSeconds: result.durationSeconds,
    });
    toast.success("Voice message added");
  }, [onUpdate, voice]);

  const handleUploadFiles = useCallback(
    async (files: FileList | null, kind: "images" | "gifs" | "videos") => {
      if (!files || files.length === 0) return;
      setUploading(true);
      setUploadPercent(0);
      const list = Array.from(files);
      const allowedTypes =
        kind === "images" ? IMAGE_TYPES : kind === "gifs" ? GIF_TYPES : VIDEO_TYPES;
      const folder =
        kind === "images"
          ? "intimate-dates/images"
          : kind === "gifs"
            ? "intimate-dates/gifs"
            : "intimate-dates/videos";
      const results = await uploadFiles(list, {
        folder,
        allowedTypes,
        maxSize: kind === "videos" ? 120 * 1024 * 1024 : 15 * 1024 * 1024,
        compress: kind !== "videos",
        onProgress: setUploadPercent,
      });
      setUploading(false);
      if (!results.length) {
        toast.error("Upload failed");
        return;
      }
      const urls = results.map(r => r.publicUrl || r.path).filter(Boolean) as string[];
      if (kind === "images") onUpdate({ images: mergeUnique(plan.images, urls) });
      if (kind === "gifs") onUpdate({ gifs: mergeUnique(plan.gifs, urls) });
      if (kind === "videos") onUpdate({ videos: mergeUnique(plan.videos, urls) });
      toast.success("Media uploaded");
    },
    [onUpdate, plan.gifs, plan.images, plan.videos],
  );

  const removeMedia = useCallback(
    (kind: "images" | "gifs" | "videos", url: string) => {
      const list =
        (kind === "images" ? plan.images : kind === "gifs" ? plan.gifs : plan.videos) ?? [];
      const next = list.filter(item => item !== url);
      if (kind === "images") onUpdate({ images: next });
      if (kind === "gifs") onUpdate({ gifs: next });
      if (kind === "videos") onUpdate({ videos: next });
    },
    [onUpdate, plan.gifs, plan.images, plan.videos],
  );

  const updateList = useCallback(
    (value: string, key: "links" | "emojis") => {
      const parsed = value
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
      if (key === "links") {
        const normalized: string[] = [];
        const invalid: string[] = [];
        for (const raw of parsed) {
          const candidate = raw.includes("://")
            ? raw
            : raw.startsWith("//")
              ? `https:${raw}`
              : `https://${raw}`;
          try {
            const url = new URL(candidate);
            if (url.protocol !== "http:" && url.protocol !== "https:") {
              invalid.push(raw);
              continue;
            }
            normalized.push(url.toString());
          } catch {
            invalid.push(raw);
          }
        }
        if (invalid.length > 0) {
          toast.error("Some links were invalid and were ignored.");
        }
        onUpdate({ links: normalized } as Partial<DateNightPlanInput>);
        return;
      }

      onUpdate({ emojis: parsed } as Partial<DateNightPlanInput>);
    },
    [onUpdate],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Voice message</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{voiceLabel}</Badge>
          {!voice.isRecording ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void voice.start()}
              disabled={uploading}
            >
              <Mic className="w-4 h-4 mr-1" />
              Record
            </Button>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => void handleVoiceStop()}
              disabled={uploading}
            >
              <Square className="w-4 h-4 mr-1" />
              Stop
            </Button>
          )}
          {plan.voiceMessageUrl && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onUpdate({ voiceMessageUrl: "", voiceMessageDurationSeconds: null })}
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        {plan.voiceMessageUrl && (
          <audio controls src={plan.voiceMessageUrl} className="w-full">
            <track kind="captions" srcLang="en" label="English" src={voiceCaptionsUrl} />
          </audio>
        )}
        {voice.error && <div className="text-xs text-destructive">{voice.error}</div>}
      </div>

      <div className="space-y-3">
        <Label>Attach media</Label>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Images</Label>
            <Input
              type="file"
              multiple
              accept={IMAGE_TYPES.join(",")}
              onChange={e => void handleUploadFiles(e.target.files, "images")}
            />
            {plan.images && plan.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {plan.images.map(url => (
                  <Badge key={url} variant="outline" className="gap-1">
                    <span className="truncate max-w-[120px]">{url}</span>
                    <button
                      type="button"
                      onClick={() => removeMedia("images", url)}
                      aria-label="Remove image attachment"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">GIFs</Label>
            <Input
              type="file"
              multiple
              accept={GIF_TYPES.join(",")}
              onChange={e => void handleUploadFiles(e.target.files, "gifs")}
            />
            {plan.gifs && plan.gifs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {plan.gifs.map(url => (
                  <Badge key={url} variant="outline" className="gap-1">
                    <span className="truncate max-w-[120px]">{url}</span>
                    <button
                      type="button"
                      onClick={() => removeMedia("gifs", url)}
                      aria-label="Remove GIF attachment"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Videos</Label>
            <Input
              type="file"
              multiple
              accept={VIDEO_TYPES.join(",")}
              onChange={e => void handleUploadFiles(e.target.files, "videos")}
            />
            {plan.videos && plan.videos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {plan.videos.map(url => (
                  <Badge key={url} variant="outline" className="gap-1">
                    <span className="truncate max-w-[120px]">{url}</span>
                    <button
                      type="button"
                      onClick={() => removeMedia("videos", url)}
                      aria-label="Remove video attachment"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        {uploading && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <UploadCloud className="w-4 h-4" />
              Uploading… {uploadPercent}%
            </div>
            <Progress value={uploadPercent} />
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Links (comma-separated)</Label>
          <Input
            value={(plan.links ?? []).join(", ")}
            onChange={e => updateList(e.target.value, "links")}
            placeholder="Paste links separated by commas"
          />
        </div>
        <div className="space-y-2">
          <Label>Emojis (comma-separated)</Label>
          <Input
            value={(plan.emojis ?? []).join(", ")}
            onChange={e => updateList(e.target.value, "emojis")}
            placeholder="🔥, 💋, ✨"
          />
        </div>
      </div>
    </div>
  );
}
