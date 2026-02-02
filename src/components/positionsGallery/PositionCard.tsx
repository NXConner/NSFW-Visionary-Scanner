import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Grid, Heart, Image as ImageIcon, Video } from "lucide-react";
import type { Position } from "./model";
import { getDifficultyColor } from "./difficulty";

export function PositionCard(props: {
  position: Position;
  viewMode: "grid" | "list";
  invertedColors: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}): JSX.Element {
  const { position, viewMode, invertedColors, isFavorite, onSelect, onToggleFavorite } = props;
  const mediaFilterClass = invertedColors ? "invert hue-rotate-180" : "";

  return (
    <Card
      className={`glass-card border-border/50 cursor-pointer hover-lift ${viewMode === "list" ? "flex flex-row" : ""}`}
      onClick={onSelect}
    >
      {viewMode === "grid" && position.images && position.images.length > 0 && (
        <div className="relative aspect-video bg-muted/30 overflow-hidden rounded-t-lg">
          <img
            src={position.images[0]}
            alt={position.name}
            className={`w-full h-full object-cover ${mediaFilterClass}`}
            loading="lazy"
          />
          {position.images.length > 1 && (
            <Badge className="absolute top-2 right-2 bg-black/50 text-white">
              +{position.images.length - 1}
            </Badge>
          )}
          {position.videos && position.videos.length > 0 && (
            <div className="absolute bottom-2 left-2">
              <Video className="w-4 h-4 text-white drop-shadow-lg" />
            </div>
          )}
        </div>
      )}

      <CardHeader className={viewMode === "list" ? "flex-1 pb-2" : "pb-2"}>
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{position.name}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mt-1 -mr-2"
            onClick={e => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge className={getDifficultyColor(position.difficulty)} variant="outline">
            {position.difficulty}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {position.category.replace("-", " ")}
          </Badge>
          {position.images && position.images.length > 0 && (
            <Badge variant="outline" className="text-xs gap-1">
              <ImageIcon className="w-3 h-3" />
              {position.images.length}
            </Badge>
          )}
          {!position.images?.length && (
            <Badge variant="outline" className="text-xs gap-1">
              <Grid className="w-3 h-3" />
              No media
            </Badge>
          )}
        </div>
      </CardHeader>

      {viewMode === "grid" && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">{position.description}</p>
        </CardContent>
      )}

      {viewMode === "list" && (
        <CardContent className="flex items-center gap-4 py-4">
          {position.images && position.images.length > 0 && (
            <div className="w-20 h-20 rounded overflow-hidden bg-muted/30 flex-shrink-0">
              <img
                src={position.images[0]}
                alt={position.name}
                className={`w-full h-full object-cover ${mediaFilterClass}`}
                loading="lazy"
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground flex-1 line-clamp-1">
            {position.description}
          </p>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </CardContent>
      )}
    </Card>
  );
}
