import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilteredImage } from "@/components/media/FilteredImage";
import type { PEProgressEntry } from "./types";

export function OverlayView(props: { left: PEProgressEntry; right: PEProgressEntry }) {
  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle>Overlay Comparison</CardTitle>
        <CardDescription>Images overlaid with transparency</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-square relative max-w-lg mx-auto rounded-lg overflow-hidden">
          <FilteredImage
            src={props.left.imageData}
            alt="Before"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <FilteredImage
            src={props.right.imageData}
            alt="After"
            className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-difference"
          />
        </div>
      </CardContent>
    </Card>
  );
}
