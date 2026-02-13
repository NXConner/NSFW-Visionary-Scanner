import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Ruler, Camera, RotateCcw, Save, ArrowRight, ArrowLeft, Crosshair } from "lucide-react";
import { CurvatureScanOverlay } from "@/components/ScannerOverlays";
import { BaseAnchorPicker } from "../refine/BaseAnchorPicker";
import type { CapturedViewState } from "../hooks/useCurvatureScanFlow";
import type { CurvatureCaptureView } from "@/components/scannerOverlays/CurvatureScanOverlay";

function viewLabel(view: CurvatureCaptureView) {
  return view === "dorsal" ? "Dorsal (top-down)" : "Lateral (side)";
}

export function ScanTab({
  // camera/preview
  videoRef,
  isActive,
  isStarting,
  error,
  currentPreview,
  refinePicking,
  onApplyBasePick,
  onCancelRefine,
  // flow
  view,
  step,
  totalSteps,
  processing,
  canGoNext,
  canSave,
  dorsal,
  lateral,
  lengthCm,
  onSetView,
  onStartCamera,
  onCapture,
  onRetake,
  onReset,
  onRefine,
  // calibration
  onOpenCalibration,
  // settings
  storeAnnotatedImages,
  onToggleStoreAnnotatedImages,
  flipTopViewLeftRight,
  onToggleFlipTopViewLeftRight,
  flipSideViewDorsalVentral,
  onToggleFlipSideViewDorsalVentral,
  // quality
  hardBlocked,
  blockers,
  // save
  onSave,
  onSaveAnyway,
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  isStarting: boolean;
  error: string | null;
  currentPreview: string | null;
  refinePicking: CurvatureCaptureView | null;
  onApplyBasePick: (pt: { xPx: number; yPx: number; xPct: number; yPct: number }) => void;
  onCancelRefine: () => void;

  view: CurvatureCaptureView;
  step: number;
  totalSteps: number;
  processing: boolean;
  canGoNext: boolean;
  canSave: boolean;
  dorsal: CapturedViewState | null;
  lateral: CapturedViewState | null;
  lengthCm: number;
  onSetView: (v: CurvatureCaptureView) => void;
  onStartCamera: () => Promise<void>;
  onCapture: () => Promise<void>;
  onRetake: () => Promise<void>;
  onReset: () => void;
  onRefine: (v: CurvatureCaptureView) => void;

  onOpenCalibration: () => void;

  storeAnnotatedImages: boolean;
  onToggleStoreAnnotatedImages: (v: boolean) => Promise<void>;
  flipTopViewLeftRight: boolean;
  onToggleFlipTopViewLeftRight: (v: boolean) => Promise<void>;
  flipSideViewDorsalVentral: boolean;
  onToggleFlipSideViewDorsalVentral: (v: boolean) => Promise<void>;

  hardBlocked: boolean;
  blockers: string[];

  onSave: () => Promise<void>;
  onSaveAnyway: () => Promise<void>;
}) {
  return (
    <div className="grid gap-8 grid-cols-1 lg:grid-cols-[3fr_2fr]">
      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              {viewLabel(view)}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Step {step}/{totalSteps}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative aspect-[4/3] bg-black/30">
            {refinePicking && currentPreview ? (
              <BaseAnchorPicker
                imageDataUrl={currentPreview}
                onPick={onApplyBasePick}
                onCancel={onCancelRefine}
              />
            ) : currentPreview ? (
              <img
                src={currentPreview}
                alt={`${view} capture`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                <CurvatureScanOverlay view={view} step={step} totalSteps={totalSteps} />
                {!isActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-xl border border-border/50 bg-background/60 backdrop-blur px-4 py-3">
                      <div className="text-sm font-medium">
                        {isStarting ? "Starting camera…" : "Camera not started"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {isStarting
                          ? "Approve the permission prompt if shown."
                          : "Tap “Start Camera” to begin."}
                      </div>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
                      {error}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 flex flex-wrap gap-2">
            <Button
              variant="scan"
              onClick={onStartCamera}
              disabled={isActive || isStarting || processing}
              className="gap-2"
            >
              <Camera className="w-4 h-4" />
              {isStarting ? "Starting…" : "Start Camera"}
            </Button>
            <Button
              variant="hero"
              onClick={onCapture}
              disabled={!isActive || processing}
              className="gap-2"
            >
              Capture
            </Button>
            <Button variant="outline" onClick={onOpenCalibration} className="gap-2">
              <Ruler className="w-4 h-4" />
              Calibrate
            </Button>
            <Button variant="outline" onClick={onRetake} disabled={processing} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Retake {view === "dorsal" ? "Dorsal" : "Lateral"}
            </Button>
            <Button variant="ghost" onClick={onReset} disabled={processing}>
              Reset
            </Button>

            {view === "lateral" && dorsal && !lateral && (
              <Button variant="ghost" onClick={() => onSetView("dorsal")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dorsal
              </Button>
            )}
            {view === "dorsal" && canGoNext && (
              <Button variant="ghost" onClick={() => onSetView("lateral")} className="gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card variant="glow">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg">Results</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-secondary/20 border border-border/50 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">Store annotated images in history</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Optional. Saved locally (encrypted). Can increase storage usage.
                  </div>
                </div>
                <Switch
                  checked={storeAnnotatedImages}
                  onCheckedChange={checked => void onToggleStoreAnnotatedImages(Boolean(checked))}
                  aria-label="Store annotated images in history"
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">Flip left/right labels (top view)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Use if your camera preview or device orientation mirrors the dorsal image.
                  </div>
                </div>
                <Switch
                  checked={flipTopViewLeftRight}
                  onCheckedChange={checked => void onToggleFlipTopViewLeftRight(Boolean(checked))}
                  aria-label="Flip left/right labels for top view"
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">Flip dorsal/ventral labels (side view)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Use if your side-view interpretation is inverted (camera flipped).
                  </div>
                </div>
                <Switch
                  checked={flipSideViewDorsalVentral}
                  onCheckedChange={checked =>
                    void onToggleFlipSideViewDorsalVentral(Boolean(checked))
                  }
                  aria-label="Flip dorsal/ventral labels for side view"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-secondary/20 border border-border/50">
                <div className="text-xs text-muted-foreground">Dorsal angle</div>
                <div className="text-2xl font-bold">
                  {dorsal?.angleDeg ? `${dorsal.angleDeg}°` : "—"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Direction: {dorsal?.curvatureDirection ?? "—"} • Conf:{" "}
                  {dorsal?.confidence ? `${dorsal.confidence}%` : "—"}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 gap-2"
                  onClick={() => onRefine("dorsal")}
                  disabled={!dorsal?.centerlinePx?.length}
                >
                  <Crosshair className="w-4 h-4" />
                  Refine (base)
                </Button>
              </div>
              <div className="p-4 rounded-xl bg-secondary/20 border border-border/50">
                <div className="text-xs text-muted-foreground">Lateral angle</div>
                <div className="text-2xl font-bold">
                  {lateral?.angleDeg ? `${lateral.angleDeg}°` : "—"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Direction: {lateral?.curvatureDirection ?? "—"} • Conf:{" "}
                  {lateral?.confidence ? `${lateral.confidence}%` : "—"}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 gap-2"
                  onClick={() => onRefine("lateral")}
                  disabled={!lateral?.centerlinePx?.length}
                >
                  <Crosshair className="w-4 h-4" />
                  Refine (base)
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/20 border border-border/50">
              <div className="text-xs text-muted-foreground">Estimated length</div>
              <div className="text-2xl font-bold">
                {lengthCm ? `${lengthCm.toFixed(1)} cm` : "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Best accuracy requires calibration.
              </div>
            </div>

            <Button
              variant="gradient"
              className="w-full gap-2"
              onClick={() => void onSave()}
              disabled={!canSave || processing}
            >
              <Save className="w-4 h-4" />
              Save Session (Local)
            </Button>

            {canSave && hardBlocked ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                <div className="text-sm font-medium">Retake recommended</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {blockers.slice(0, 2).join(" ")}
                </div>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => void onSaveAnyway()}
                    disabled={processing}
                  >
                    Save anyway
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
