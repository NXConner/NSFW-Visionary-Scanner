import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, Sparkles, Video } from "lucide-react";
import type { Position } from "@/components/positionsGallery/model";
import type { PositionMediaKind } from "@/lib/positions/userPositionMediaOverrides";

type OverrideUrls = Partial<Record<PositionMediaKind, string>>;

export function MediaTab(props: {
  position: Position;
  displayImages: string[];
  displayGifs: string[];
  displayVideos: string[];
  overrideUrls: OverrideUrls;
  uploadingKind: PositionMediaKind | null;
  overrideLoading: boolean;
  mediaFilterClass?: string;
  onUpload: (file: File) => Promise<void>;
  onRemoveOverride: (kind: PositionMediaKind) => Promise<void>;
}): JSX.Element {
  const {
    position,
    displayImages,
    displayGifs,
    displayVideos,
    overrideUrls,
    uploadingKind,
    overrideLoading,
    mediaFilterClass = "",
    onUpload,
    onRemoveOverride,
  } = props;

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h4 className="font-semibold">Replace Media (optional)</h4>
          <p className="text-sm text-muted-foreground">
            Upload your own photo, GIF, or video for this position. Your uploads are private to your
            account via RLS (and stored in your configured Supabase Storage bucket).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Image
                </span>
                {overrideUrls.image ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void onRemoveOverride("image")}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              <Input
                type="file"
                accept="image/*"
                disabled={uploadingKind !== null}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) void onUpload(f);
                  e.currentTarget.value = "";
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> GIF
                </span>
                {overrideUrls.gif ? (
                  <Button size="sm" variant="outline" onClick={() => void onRemoveOverride("gif")}>
                    Remove
                  </Button>
                ) : null}
              </div>
              <Input
                type="file"
                accept="image/gif"
                disabled={uploadingKind !== null}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) void onUpload(f);
                  e.currentTarget.value = "";
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Video className="w-4 h-4" /> Video
                </span>
                {overrideUrls.video ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void onRemoveOverride("video")}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              <Input
                type="file"
                accept="video/*"
                disabled={uploadingKind !== null}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) void onUpload(f);
                  e.currentTarget.value = "";
                }}
              />
            </div>
          </div>

          {uploadingKind ? (
            <p className="text-sm text-muted-foreground">Uploading {uploadingKind}…</p>
          ) : null}
          {overrideLoading ? (
            <p className="text-sm text-muted-foreground">Loading overrides…</p>
          ) : null}
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
    </div>
  );
}
