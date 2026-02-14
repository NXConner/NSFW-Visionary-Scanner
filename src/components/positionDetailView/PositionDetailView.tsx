import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, X } from "lucide-react";
import type { Position } from "@/components/positionsGallery/model";
import { getDifficultyBadgeClass } from "./utils";
import { usePositionMediaOverrides } from "./usePositionMediaOverrides";
import { FullscreenImageDialog } from "./FullscreenImageDialog";
import { OverviewTab } from "./tabs/OverviewTab";
import { MediaTab } from "./tabs/MediaTab";
import { InstructionsTab } from "./tabs/InstructionsTab";
import { EducationTab } from "./tabs/EducationTab";

export interface PositionDetailViewProps {
  position: Position | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  invertedColors?: boolean;
  onMediaOverrideChange?: (positionId: string) => void;
}

export const PositionDetailView = ({
  position,
  isOpen,
  onClose,
  onToggleFavorite,
  isFavorite,
  invertedColors = true,
  onMediaOverrideChange,
}: PositionDetailViewProps): JSX.Element | null => {
  const pos = position;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);

  useEffect(() => {
    if (!pos?.id) return;
    setSelectedImageIndex(0);
    setIsImageFullscreen(false);
  }, [pos?.id]);

  useEffect(() => {
    if (isOpen) return;
    setIsImageFullscreen(false);
  }, [isOpen]);

  const { overrideUrls, overrideLoading, uploadingKind, handleUpload, handleRemoveOverride } =
    usePositionMediaOverrides({
      positionId: pos?.id,
      isOpen,
      onMediaOverrideChange,
    });

  const displayImages = useMemo(() => {
    const base = pos?.images || [];
    return overrideUrls.image ? [overrideUrls.image] : base;
  }, [overrideUrls.image, pos?.images]);

  const displayGifs = useMemo(() => {
    const base = pos?.gifs || [];
    return overrideUrls.gif ? [overrideUrls.gif] : base;
  }, [overrideUrls.gif, pos?.gifs]);

  const displayVideos = useMemo(() => {
    const base = pos?.videos || [];
    return overrideUrls.video ? [overrideUrls.video] : base;
  }, [overrideUrls.video, pos?.videos]);

  const currentImage = useMemo(() => {
    if (displayImages.length === 0) return "";
    return displayImages[selectedImageIndex] || displayImages[0] || "";
  }, [displayImages, selectedImageIndex]);

  const mediaFilterClass = invertedColors ? "invert hue-rotate-180" : "";

  if (!pos) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{pos.name}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => onToggleFavorite(pos.id)}>
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge className={getDifficultyBadgeClass(pos.difficulty)}>{pos.difficulty}</Badge>
            <Badge variant="secondary">{pos.category.replace("-", " ")}</Badge>
            <Badge variant="outline">Flexibility: {pos.requiredFlexibility}</Badge>
            <Badge variant="outline">Intimacy: {pos.intimacyLevel}</Badge>
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

            <TabsContent value="overview">
              <OverviewTab
                position={pos}
                displayImages={displayImages}
                selectedImageIndex={selectedImageIndex}
                onSelectImageIndex={setSelectedImageIndex}
                onOpenFullscreen={() => setIsImageFullscreen(true)}
                mediaFilterClass={mediaFilterClass}
              />
            </TabsContent>

            <TabsContent value="media">
              <MediaTab
                position={pos}
                displayImages={displayImages}
                displayGifs={displayGifs}
                displayVideos={displayVideos}
                overrideUrls={overrideUrls}
                uploadingKind={uploadingKind}
                overrideLoading={overrideLoading}
                mediaFilterClass={mediaFilterClass}
                onUpload={handleUpload}
                onRemoveOverride={handleRemoveOverride}
              />
            </TabsContent>

            <TabsContent value="instructions">
              <InstructionsTab position={pos} />
            </TabsContent>

            <TabsContent value="education">
              <EducationTab position={pos} />
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>

      {isImageFullscreen && currentImage ? (
        <FullscreenImageDialog
          open={isImageFullscreen}
          onOpenChange={setIsImageFullscreen}
          src={currentImage}
          alt={pos.name}
          mediaFilterClass={mediaFilterClass}
        />
      ) : null}
    </Dialog>
  );
};
