import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check } from "lucide-react";

import type { PointPercent } from "@/components/calibrationWizard/types";

export function Step3MarkCorners({
  capturedImage,
  imageRef,
  cornerPoints,
  onImageClick,
  onResetCorners,
}: {
  capturedImage: string | null;
  imageRef: React.RefObject<HTMLImageElement>;
  cornerPoints: PointPercent[];
  onImageClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onResetCorners: () => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Mark Reference Corners</h3>
        <p className="text-sm text-muted-foreground">
          Tap the 4 corners of your reference object in order: top-left, top-right, bottom-right,
          bottom-left
        </p>
      </div>

      <div className="flex justify-center gap-2">
        {["TL", "TR", "BR", "BL"].map((corner, i) => (
          <Badge
            key={corner}
            variant={cornerPoints.length > i ? "default" : "outline"}
            className={cornerPoints.length > i ? "bg-success" : ""}
          >
            {cornerPoints.length > i ? <Check className="w-3 h-3 mr-1" /> : null}
            {corner}
          </Badge>
        ))}
      </div>

      <div className="relative aspect-video bg-secondary/30 rounded-xl overflow-hidden border border-border">
        {capturedImage ? (
          <div className="relative w-full h-full">
            <button
              type="button"
              className="w-full h-full cursor-crosshair"
              onClick={onImageClick}
              aria-label="Mark reference corners"
            >
              <img
                ref={imageRef}
                src={capturedImage}
                alt="Reference"
                className="w-full h-full object-contain pointer-events-none"
              />
            </button>

            {cornerPoints.map((point, i) => (
              <div
                key={i}
                className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
              >
                <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow-lg" />
                <span className="absolute -top-5 text-xs font-bold text-primary">{i + 1}</span>
              </div>
            ))}

            {cornerPoints.length >= 2 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {cornerPoints.map((point, i) => {
                  const nextPoint = cornerPoints[(i + 1) % cornerPoints.length];
                  if (i >= cornerPoints.length - 1 && cornerPoints.length < 4) return null;
                  return (
                    <line
                      key={i}
                      x1={`${point.x}%`}
                      y1={`${point.y}%`}
                      x2={`${nextPoint.x}%`}
                      y2={`${nextPoint.y}%`}
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  );
                })}
              </svg>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No image captured</p>
          </div>
        )}
      </div>

      {cornerPoints.length > 0 && (
        <Button variant="outline" size="sm" onClick={onResetCorners} className="w-full">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Corners
        </Button>
      )}
    </div>
  );
}
