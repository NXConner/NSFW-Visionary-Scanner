import { useRef, useState } from "react";
import { wallpaperPresets, isVideoUrl, isMediaUrl } from "@/design-system";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Image, Video, X, Sparkles, Snowflake, Sun, Upload } from "lucide-react";

interface WallpaperPickerProps {
  activeWallpaper: string;
  onChange: (value: string | null) => void;
  onUploadFile?: (file: File) => void;
  blur?: number;
  opacity?: number;
  onBlurChange?: (value: number) => void;
  onOpacityChange?: (value: number) => void;
}

export const WallpaperPicker = ({
  activeWallpaper,
  onChange,
  onUploadFile,
  blur = 200,
  opacity = 0.55,
  onBlurChange,
  onOpacityChange,
}: WallpaperPickerProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeCategory, setActiveCategory] = useState<
    "all" | "gradient" | "animated" | "seasonal"
  >("all");

  const activeWallpaperForRender = activeWallpaper.split("#", 1)[0] ?? activeWallpaper;

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image (JPG, PNG, GIF, WebP) or video (MP4, WebM, MOV) file.");
      return;
    }

    const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File too large. Maximum size: ${file.type.startsWith("video/") ? "50MB" : "10MB"}`);
      return;
    }

    if (onUploadFile) {
      onUploadFile(file);
      // allow re-uploading same file
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Fallback (legacy): store as data URL
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result;
      if (typeof dataUrl === "string") {
        onChange(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const isCurrentVideo = isVideoUrl(activeWallpaper);
  const isCurrentMedia = isMediaUrl(activeWallpaper);

  const filteredPresets =
    activeCategory === "all"
      ? wallpaperPresets
      : wallpaperPresets.filter(p => p.category === activeCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "animated":
        return <Sparkles className="w-3 h-3" />;
      case "seasonal":
        return <Snowflake className="w-3 h-3" />;
      default:
        return <Sun className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Blur & Opacity Sliders */}
      <div className="space-y-4 p-4 rounded-xl border border-border/60 bg-muted/20">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Blur Intensity</Label>
            <span className="text-xs text-muted-foreground">{blur}px</span>
          </div>
          <Slider
            value={[blur]}
            onValueChange={([v]) => onBlurChange?.(v)}
            min={0}
            max={500}
            step={10}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Opacity</Label>
            <span className="text-xs text-muted-foreground">{Math.round(opacity * 100)}%</span>
          </div>
          <Slider
            value={[opacity * 100]}
            onValueChange={([v]) => onOpacityChange?.(v / 100)}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
        </div>
      </div>

      {/* Current wallpaper preview */}
      {isCurrentMedia && (
        <div className="relative rounded-xl overflow-hidden border border-border/60">
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onChange(null)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {isCurrentVideo ? (
            <video
              src={activeWallpaperForRender}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-32 object-cover"
            />
          ) : (
            <img
              src={activeWallpaperForRender}
              alt="Current wallpaper"
              className="w-full h-32 object-cover"
            />
          )}
          <div className="absolute bottom-2 left-2">
            <span className="text-xs bg-background/80 px-2 py-1 rounded-md flex items-center gap-1">
              {isCurrentVideo ? <Video className="w-3 h-3" /> : <Image className="w-3 h-3" />}
              {isCurrentVideo ? "Video Wallpaper" : "Custom Image"}
            </span>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "gradient", "animated", "seasonal"] as const).map(cat => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat)}
            className="capitalize"
          >
            {cat !== "all" && getCategoryIcon(cat)}
            {cat}
          </Button>
        ))}
      </div>

      {/* Preset wallpapers */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filteredPresets.map(preset => (
          <button
            key={preset.id}
            type="button"
            aria-label={`Apply ${preset.label} wallpaper`}
            aria-pressed={activeWallpaper === preset.value}
            onClick={() => onChange(preset.value)}
            className={cn(
              "rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 relative overflow-hidden",
              activeWallpaper === preset.value
                ? "border-primary/70 shadow-[0_0_0_1px_hsl(var(--primary))]"
                : "border-border/60 hover:border-primary/40",
            )}
          >
            <div
              aria-hidden
              className={cn(
                "mb-2 h-16 w-full rounded-xl",
                preset.animated && "animate-gradient-shift",
              )}
              style={{
                backgroundImage: preset.value,
                backgroundSize: preset.animated ? "400% 400%" : "cover",
              }}
            />
            <div className="flex items-center gap-2">
              {preset.animated && <Sparkles className="w-3 h-3 text-primary" />}
              <p className="text-sm font-medium">{preset.label}</p>
            </div>
            <p className="text-xs text-muted-foreground">{preset.description}</p>
            {preset.category && (
              <span className="absolute top-2 right-2 text-[10px] bg-background/80 px-1.5 py-0.5 rounded capitalize">
                {preset.category}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Upload section */}
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
          onChange={handleUpload}
          aria-label="Upload custom wallpaper"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-border/50 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <p className="font-medium text-sm mb-1">Upload Custom Wallpaper</p>
          <p className="text-xs text-muted-foreground">
            Images (JPG, PNG, GIF, WebP) or videos (MP4, WebM, MOV)
          </p>
        </button>

        <Button variant="outline" onClick={() => onChange(null)} className="w-full">
          Use Theme Default
        </Button>
      </div>
    </div>
  );
};
