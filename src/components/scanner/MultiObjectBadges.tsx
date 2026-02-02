import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DetectedObject } from "@/hooks/useObjectDetection";

export function MultiObjectBadges(props: {
  detections: DetectedObject[];
  selectedIndex: number;
  onSelect: (nextIndex: number) => void;
}) {
  const { detections, selectedIndex, onSelect } = props;
  if (detections.length <= 1) return null;

  const safeIndex = Math.max(0, Math.min(detections.length - 1, selectedIndex));

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => onSelect((safeIndex - 1 + detections.length) % detections.length)}
        aria-label="Select previous detected object"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <Badge className="bg-background/70 text-foreground border border-border/60 backdrop-blur">
        {detections.length} objects • {safeIndex + 1}/{detections.length}
      </Badge>

      <Button
        variant="secondary"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => onSelect((safeIndex + 1) % detections.length)}
        aria-label="Select next detected object"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
