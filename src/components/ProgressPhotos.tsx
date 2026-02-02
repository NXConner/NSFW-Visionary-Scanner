import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useData } from "@/contexts/DataContext";
import { format } from "date-fns";
import {
  ImageIcon,
  ArrowLeftRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  ZoomIn,
} from "lucide-react";
import { VisualContentDisplay } from "./VisualContentDisplay";
import { useVisualContent } from "@/hooks/useVisualContent";
import { VISUAL_CONTENT_CATEGORIES } from "@/lib/visualContentManager";
import { FilteredImage } from "@/components/media/FilteredImage";

export const ProgressPhotos = () => {
  const { scans } = useData();
  const [selectedLeft, setSelectedLeft] = useState<string>("");
  const [selectedRight, setSelectedRight] = useState<string>("");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Load visual content for progress tracking
  const { content: progressVisuals } = useVisualContent({
    categories: [VISUAL_CONTENT_CATEGORIES.PROGRESS, VISUAL_CONTENT_CATEGORIES.MEASUREMENT],
    autoLoad: true,
    autoInvert: true,
  });

  const scansWithImages = useMemo(() => scans.filter(s => s.image_data), [scans]);

  const leftScan = scansWithImages.find(s => s.id === selectedLeft);
  const rightScan = scansWithImages.find(s => s.id === selectedRight);

  const getComparison = () => {
    if (!leftScan || !rightScan) return null;

    const angleDiff = rightScan.curvature_angle - leftScan.curvature_angle;
    const lengthDiff = rightScan.length - leftScan.length;
    const circumDiff = rightScan.circumference - leftScan.circumference;

    return { angleDiff, lengthDiff, circumDiff };
  };

  const comparison = getComparison();

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-red-400" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-green-400" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  if (scansWithImages.length < 2) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Not Enough Photos</h3>
            <p className="text-muted-foreground max-w-md">
              You need at least 2 scans with captured images to compare progress. Use the Scanner to
              capture more images.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">Progress Comparison</h2>
        <p className="text-muted-foreground">Compare photos over time to track changes</p>
        {/* Visual examples for progress tracking */}
        {progressVisuals.length > 0 && (
          <div className="mt-4 max-w-2xl mx-auto">
            <VisualContentDisplay
              content={progressVisuals.slice(0, 3)}
              title="Progress Tracking Examples"
              showThumbnails={true}
              className="max-h-32"
            />
          </div>
        )}
      </div>

      <Card className="glass-card border-border/50 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            Select Photos to Compare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-medium" htmlFor="progress-photo-earlier">
                Earlier Photo
              </label>
              <Select value={selectedLeft} onValueChange={setSelectedLeft}>
                <SelectTrigger id="progress-photo-earlier">
                  <SelectValue placeholder="Select earlier scan" />
                </SelectTrigger>
                <SelectContent>
                  {scansWithImages.map(scan => (
                    <SelectItem key={scan.id} value={scan.id}>
                      {format(new Date(scan.created_at), "MMM d, yyyy h:mm a")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium" htmlFor="progress-photo-later">
                Later Photo
              </label>
              <Select value={selectedRight} onValueChange={setSelectedRight}>
                <SelectTrigger id="progress-photo-later">
                  <SelectValue placeholder="Select later scan" />
                </SelectTrigger>
                <SelectContent>
                  {scansWithImages.map(scan => (
                    <SelectItem key={scan.id} value={scan.id}>
                      {format(new Date(scan.created_at), "MMM d, yyyy h:mm a")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {leftScan && rightScan && (
        <>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card className="glass-card border-border/50 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-primary/30">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(leftScan.created_at), "MMM d, yyyy")}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setZoomedImage(leftScan.image_data)}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-square rounded-lg overflow-hidden bg-muted/20 mb-4">
                  <FilteredImage
                    src={leftScan.image_data!}
                    alt="Earlier scan"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="p-2 rounded bg-muted/30">
                    <p className="text-muted-foreground">Angle</p>
                    <p className="font-semibold">{leftScan.curvature_angle}°</p>
                  </div>
                  <div className="p-2 rounded bg-muted/30">
                    <p className="text-muted-foreground">Length</p>
                    <p className="font-semibold">{leftScan.length} cm</p>
                  </div>
                  <div className="p-2 rounded bg-muted/30">
                    <p className="text-muted-foreground">Circ.</p>
                    <p className="font-semibold">{leftScan.circumference} cm</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-accent/30">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(rightScan.created_at), "MMM d, yyyy")}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setZoomedImage(rightScan.image_data)}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-square rounded-lg overflow-hidden bg-muted/20 mb-4">
                  <FilteredImage
                    src={rightScan.image_data!}
                    alt="Later scan"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="p-2 rounded bg-muted/30">
                    <p className="text-muted-foreground">Angle</p>
                    <p className="font-semibold">{rightScan.curvature_angle}°</p>
                  </div>
                  <div className="p-2 rounded bg-muted/30">
                    <p className="text-muted-foreground">Length</p>
                    <p className="font-semibold">{rightScan.length} cm</p>
                  </div>
                  <div className="p-2 rounded bg-muted/30">
                    <p className="text-muted-foreground">Circ.</p>
                    <p className="font-semibold">{rightScan.circumference} cm</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {comparison && (
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>Change Analysis</CardTitle>
                <CardDescription>
                  Comparing {format(new Date(leftScan.created_at), "MMM d")} to{" "}
                  {format(new Date(rightScan.created_at), "MMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">Curvature Angle</span>
                      <TrendIcon value={comparison.angleDiff} />
                    </div>
                    <p className="text-2xl font-bold">
                      {comparison.angleDiff > 0 ? "+" : ""}
                      {comparison.angleDiff}°
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {comparison.angleDiff > 0
                        ? "Increased curvature"
                        : comparison.angleDiff < 0
                          ? "Reduced curvature"
                          : "No change"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">Length</span>
                      <TrendIcon value={-comparison.lengthDiff} />
                    </div>
                    <p className="text-2xl font-bold">
                      {comparison.lengthDiff > 0 ? "+" : ""}
                      {comparison.lengthDiff.toFixed(1)} cm
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {comparison.lengthDiff > 0
                        ? "Increased"
                        : comparison.lengthDiff < 0
                          ? "Decreased"
                          : "No change"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">Circumference</span>
                      <TrendIcon value={-comparison.circumDiff} />
                    </div>
                    <p className="text-2xl font-bold">
                      {comparison.circumDiff > 0 ? "+" : ""}
                      {comparison.circumDiff.toFixed(1)} cm
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {comparison.circumDiff > 0
                        ? "Increased"
                        : comparison.circumDiff < 0
                          ? "Decreased"
                          : "No change"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Photo Detail</DialogTitle>
          </DialogHeader>
          {zoomedImage && (
            <FilteredImage src={zoomedImage} alt="Zoomed scan" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
