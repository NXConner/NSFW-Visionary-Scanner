import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Maximize2, Sparkles, Star } from "lucide-react";
import type { Position } from "@/components/positionsGallery/model";

export function OverviewTab(props: {
  position: Position;
  displayImages: string[];
  selectedImageIndex: number;
  onSelectImageIndex: (idx: number) => void;
  onOpenFullscreen: () => void;
  mediaFilterClass?: string;
}): JSX.Element {
  const {
    position,
    displayImages,
    selectedImageIndex,
    onSelectImageIndex,
    onOpenFullscreen,
    mediaFilterClass = "",
  } = props;

  const currentImage = useMemo(() => {
    if (displayImages.length === 0) return "";
    return displayImages[selectedImageIndex] || displayImages[0] || "";
  }, [displayImages, selectedImageIndex]);

  const canNavigate = displayImages.length > 1;

  return (
    <div className="space-y-4 mt-4">
      <div>
        <p className="text-muted-foreground">{position.description}</p>
      </div>

      {displayImages.length > 0 && currentImage ? (
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-muted/30">
            <img
              src={currentImage}
              alt={position.name}
              className={`w-full h-full object-contain ${mediaFilterClass}`}
            />

            {canNavigate ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                  onClick={() =>
                    onSelectImageIndex(
                      (selectedImageIndex - 1 + displayImages.length) % displayImages.length,
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
                    onSelectImageIndex((selectedImageIndex + 1) % displayImages.length)
                  }
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={onOpenFullscreen}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={onOpenFullscreen}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {canNavigate ? (
            <div className="flex gap-2 p-2 overflow-x-auto">
              {displayImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectImageIndex(idx)}
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
          ) : null}
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" /> Benefits
            </h4>
            <ul className="space-y-1">
              {position.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
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
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
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
    </div>
  );
}
