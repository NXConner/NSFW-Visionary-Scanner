/**
 * Position Detail View Component
 * Displays detailed information about a position with images, videos, and educational content
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Heart,
  Star,
  Info,
  Sparkles,
  ChevronRight,
  Play,
  Image as ImageIcon,
  Video,
  BookOpen,
  Lightbulb,
  Users,
  Zap,
  X,
  Maximize2,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { uploadFile } from "@/lib/mediaUpload/upload";
import {
  deleteMyPositionMediaOverride,
  upsertMyPositionMediaOverride,
  type PositionMediaKind,
} from "@/lib/positions/userPositionMediaOverrides";
import { supabase } from "@/integrations/supabase/client";

interface Position {
  id: string;
  name: string;
  category: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  description: string;
  instructions: string[];
  benefits: string[];
  tips: string[];
  tags: string[];
  stimulationType: string[];
  requiredFlexibility: "low" | "medium" | "high";
  intimacyLevel: "low" | "medium" | "high";
  images?: string[];
  videos?: string[];
  gifs?: string[];
  animations?: string[];
}

interface PositionDetailViewProps {
  position: Position | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  invertedColors?: boolean;
  onMediaOverrideChange?: (positionId: string) => void;
}

export const PositionDetailView: React.FC<PositionDetailViewProps> = ({
  position,
  isOpen,
  onClose,
  onToggleFavorite,
  isFavorite,
  invertedColors = true,
  onMediaOverrideChange,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [overrideUrls, setOverrideUrls] = useState<Partial<Record<PositionMediaKind, string>>>({});
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<PositionMediaKind | null>(null);

  const pos = position;

  const displayImages = useMemo(() => {
    const base = pos?.images || [];
    const override = overrideUrls.image ? [overrideUrls.image] : [];
    return override.length > 0 ? override : base;
  }, [overrideUrls.image, pos?.images]);

  const displayGifs = useMemo(() => {
    const base = pos?.gifs || [];
    const override = overrideUrls.gif ? [overrideUrls.gif] : [];
    return override.length > 0 ? override : base;
  }, [overrideUrls.gif, pos?.gifs]);

  const displayVideos = useMemo(() => {
    const base = pos?.videos || [];
    const override = overrideUrls.video ? [overrideUrls.video] : [];
    return override.length > 0 ? override : base;
  }, [overrideUrls.video, pos?.videos]);

  const allMedia = [...displayImages, ...displayGifs, ...displayVideos];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "hard":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "expert":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "";
    }
  };

  const currentImage = displayImages[selectedImageIndex] || allMedia[0];

  const mediaFilterClass = invertedColors ? "invert hue-rotate-180" : "";

  const loadOverrides = useCallback(async () => {
    if (!pos?.id) return;
    setOverrideLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setOverrideUrls({});
        return;
      }

      type OverrideRow = { media_kind: PositionMediaKind; public_url: string | null };
      type SupabaseBuilder = {
        select: (columns: string) => SupabaseBuilder;
        eq: (column: string, value: string) => SupabaseBuilder;
      };

      const builder = (supabase as unknown as { from: (table: string) => SupabaseBuilder })
        .from("user_position_media_overrides")
        .select("media_kind, public_url")
        .eq("user_id", user.id)
        .eq("position_key", pos.id);

      const { data, error } = (await (builder as unknown as Promise<{
        data: unknown;
        error: { message?: string } | null;
      }>)) as { data: unknown; error: { message?: string } | null };

      if (error) {
        setOverrideUrls({});
        return;
      }

      const next: Partial<Record<PositionMediaKind, string>> = {};
      const rows = (Array.isArray(data) ? data : []) as unknown as OverrideRow[];
      for (const row of rows) {
        if (row?.media_kind && row.public_url) next[row.media_kind] = row.public_url;
      }
      setOverrideUrls(next);
    } finally {
      setOverrideLoading(false);
    }
  }, [pos?.id]);

  useEffect(() => {
    if (!isOpen) return;
    void loadOverrides();
  }, [isOpen, loadOverrides]);

  const sanitizeForFolder = (value: string): string => {
    return String(value)
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 64);
  };

  const handleUpload = useCallback(
    async (file: File) => {
      if (!pos?.id) return;

      const kind: PositionMediaKind =
        file.type === "image/gif" ? "gif" : file.type.startsWith("video/") ? "video" : "image";

      setUploadingKind(kind);
      try {
        const folder = `positions/${sanitizeForFolder(pos.id)}`;
        const res = await uploadFile(file, {
          folder,
          // Keep uploads safe-ish by restricting MIME types.
          allowedTypes:
            kind === "video"
              ? ["video/mp4", "video/webm", "video/quicktime"]
              : kind === "gif"
                ? ["image/gif"]
                : [
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                    "image/avif",
                    "image/heic",
                    "image/heif",
                  ],
          maxSize: kind === "video" ? 500 * 1024 * 1024 : 25 * 1024 * 1024,
        });

        if (!res?.publicUrl) {
          toast.error("Upload failed (no public URL returned). Check storage bucket permissions.");
          return;
        }

        const ok = await upsertMyPositionMediaOverride({
          positionKey: pos.id,
          kind,
          bucket: res.bucket,
          storagePath: res.path,
          publicUrl: res.publicUrl,
          mimeType: res.mimeType,
        });

        if (!ok) {
          toast.error("Could not save override. Make sure you're signed in.");
          return;
        }

        toast.success("Media updated for this position.");
        await loadOverrides();
        onMediaOverrideChange?.(pos.id);
      } catch {
        toast.error("Upload failed.");
      } finally {
        setUploadingKind(null);
      }
    },
    [loadOverrides, onMediaOverrideChange, pos?.id],
  );

  const handleRemoveOverride = useCallback(
    async (kind: PositionMediaKind) => {
      if (!pos?.id) return;
      const ok = await deleteMyPositionMediaOverride({ positionKey: pos.id, kind });
      if (!ok) {
        toast.error("Could not remove override. Make sure you're signed in.");
        return;
      }
      toast.success("Override removed.");
      await loadOverrides();
      onMediaOverrideChange?.(pos.id);
    },
    [loadOverrides, onMediaOverrideChange, pos?.id],
  );

  if (!pos) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{position.name}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => onToggleFavorite(position.id)}>
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge className={getDifficultyColor(position.difficulty)}>{position.difficulty}</Badge>
            <Badge variant="secondary">{position.category.replace("-", " ")}</Badge>
            <Badge variant="outline">Flexibility: {position.requiredFlexibility}</Badge>
            <Badge variant="outline">Intimacy: {position.intimacyLevel}</Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="instructions">How To</TabsTrigger>
              <TabsTrigger value="education">Learn</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div>
                <p className="text-muted-foreground">{position.description}</p>
              </div>

              {displayImages.length > 0 && (
                <Card className="overflow-hidden">
                  <div className="relative aspect-video bg-muted/30">
                    <img
                      src={currentImage}
                      alt={position.name}
                      className={`w-full h-full object-contain ${mediaFilterClass}`}
                    />
                    {displayImages.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2"
                          onClick={() =>
                            setSelectedImageIndex(
                              prev => (prev - 1 + displayImages.length) % displayImages.length,
                            )
                          }
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() =>
                            setSelectedImageIndex(prev => (prev + 1) % displayImages.length)
                          }
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => setIsImageFullscreen(true)}
                        >
                          <Maximize2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  {displayImages.length > 1 && (
                    <div className="flex gap-2 p-2 overflow-x-auto">
                      {displayImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 ${
                            selectedImageIndex === idx ? "border-primary" : "border-transparent"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${position.name} ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" /> Benefits
                    </h4>
                    <ul className="space-y-1">
                      {position.benefits.map((benefit, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <ChevronRight className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" /> Tips
                    </h4>
                    <ul className="space-y-1">
                      {position.tips.map((tip, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <Sparkles className="w-3 h-3 text-purple-400 mt-1 shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap gap-2">
                {position.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h4 className="font-semibold">Replace Media (optional)</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload your own photo, GIF, or video for this position. Your uploads are private
                    to your account via RLS (and stored in your configured Supabase Storage bucket).
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" /> Image
                        </span>
                        {overrideUrls.image && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleRemoveOverride("image")}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        disabled={uploadingKind !== null}
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) void handleUpload(f);
                          e.currentTarget.value = "";
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> GIF
                        </span>
                        {overrideUrls.gif && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleRemoveOverride("gif")}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <Input
                        type="file"
                        accept="image/gif"
                        disabled={uploadingKind !== null}
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) void handleUpload(f);
                          e.currentTarget.value = "";
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Video className="w-4 h-4" /> Video
                        </span>
                        {overrideUrls.video && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleRemoveOverride("video")}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <Input
                        type="file"
                        accept="video/*"
                        disabled={uploadingKind !== null}
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) void handleUpload(f);
                          e.currentTarget.value = "";
                        }}
                      />
                    </div>
                  </div>

                  {uploadingKind && (
                    <p className="text-sm text-muted-foreground">Uploading {uploadingKind}…</p>
                  )}
                  {overrideLoading && (
                    <p className="text-sm text-muted-foreground">Loading overrides…</p>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {displayImages.map((img, idx) => (
                  <Card
                    key={idx}
                    className="overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="aspect-square bg-muted/30">
                      <img
                        src={img}
                        alt={`${position.name} ${idx + 1}`}
                        className={`w-full h-full object-cover ${mediaFilterClass}`}
                      />
                    </div>
                  </Card>
                ))}
                {displayGifs.map((gif, idx) => (
                  <Card
                    key={`gif-${idx}`}
                    className="overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="aspect-square bg-muted/30 relative">
                      <img
                        src={gif}
                        alt={`${position.name} GIF ${idx + 1}`}
                        className={`w-full h-full object-cover ${mediaFilterClass}`}
                      />
                      <Badge className="absolute top-2 right-2">GIF</Badge>
                    </div>
                  </Card>
                ))}
                {displayVideos.map((video, idx) => (
                  <Card
                    key={`video-${idx}`}
                    className="overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="aspect-square bg-muted/30 relative">
                      <video
                        src={video}
                        className={`w-full h-full object-cover ${mediaFilterClass}`}
                        controls
                      >
                        <track
                          kind="captions"
                          src="/captions/blank.vtt"
                          srcLang="en"
                          label="English"
                          default
                        />
                      </video>
                      <Badge className="absolute top-2 right-2">Video</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="instructions" className="space-y-4 mt-4">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" /> Step-by-Step Instructions
                </h4>
                <ol className="space-y-3">
                  {position.instructions.map((inst, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="bg-primary/20 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm shrink-0 font-semibold">
                        {i + 1}
                      </span>
                      <div className="flex-1 pt-1">
                        <p className="text-sm">{inst}</p>
                        {position.images?.[i] && (
                          <div className="mt-2 rounded overflow-hidden max-w-xs">
                            <img
                              src={position.images[i]}
                              alt={`Step ${i + 1}`}
                              className="w-full h-auto"
                            />
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="education" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" /> Educational Information
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium mb-2">Stimulation Types</h5>
                      <div className="flex flex-wrap gap-2">
                        {position.stimulationType.map((type, i) => (
                          <Badge key={i} variant="outline">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Physical Requirements</h5>
                      <p className="text-sm text-muted-foreground">
                        Flexibility Level: <strong>{position.requiredFlexibility}</strong>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Intimacy Level: <strong>{position.intimacyLevel}</strong>
                      </p>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Best For</h5>
                      <p className="text-sm text-muted-foreground">
                        This position is ideal for {position.tags.join(", ")} experiences.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>

      {/* Fullscreen Image Modal */}
      {isImageFullscreen && currentImage && (
        <Dialog open={isImageFullscreen} onOpenChange={setIsImageFullscreen}>
          <DialogContent className="max-w-7xl max-h-[95vh] p-0" aria-describedby={undefined}>
            <DialogHeader className="sr-only">
              <DialogTitle>Fullscreen Image</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-[95vh] bg-black">
              <img
                src={currentImage}
                alt={position.name}
                className={`w-full h-full object-contain ${mediaFilterClass}`}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={() => setIsImageFullscreen(false)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};
