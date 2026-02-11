import * as React from "react";

import { toast } from "sonner";
import { useCamera } from "@/hooks/useCamera";
import { measureImage } from "@/scanner/measurement";
import type { CalibrationData } from "@/components/calibrationWizard/types";
import type { CurvatureCaptureView } from "@/components/scannerOverlays/CurvatureScanOverlay";
import { computeBaseAnchoredAngleDeg } from "../refine/baseAngle";
import { computeCurvatureDirectionFromCenterline } from "../refine/direction";
import { useCurvatureScanSettings } from "./useCurvatureScanSettings";

function viewLabel(view: CurvatureCaptureView) {
  return view === "dorsal" ? "Dorsal (top-down)" : "Lateral (side)";
}

export type CapturedViewState = {
  rawImageDataUrl: string;
  annotatedImageDataUrl: string;
  angleDeg: number;
  confidence: number;
  lengthCm?: number;
  centerlinePx?: Array<{ x: number; y: number }>;
  baseAnchorPx?: { x: number; y: number };
  curvatureDirection?: "dorsal" | "ventral" | "lateral-left" | "lateral-right" | "unknown";
  warnings?: string[];
};

export function useCurvatureScanFlow() {
  const {
    videoRef,
    canvasRef,
    isActive,
    isStarting,
    error,
    startCamera,
    stopCamera,
    captureImageAsync,
  } = useCamera();
  const settings = useCurvatureScanSettings();

  const [view, setView] = React.useState<CurvatureCaptureView>("dorsal");
  const [showCalibration, setShowCalibration] = React.useState(false);
  const [calibrationData, setCalibrationData] = React.useState<CalibrationData | null>(null);
  const [processing, setProcessing] = React.useState(false);

  const [dorsal, setDorsal] = React.useState<CapturedViewState | null>(null);
  const [lateral, setLateral] = React.useState<CapturedViewState | null>(null);
  const [lengthCm, setLengthCm] = React.useState<number>(0);

  const [refinePicking, setRefinePicking] = React.useState<CurvatureCaptureView | null>(null);

  React.useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const totalSteps = 2;
  const step = view === "dorsal" ? 1 : 2;
  const canGoNext = view === "dorsal" ? Boolean(dorsal) : false;
  const canSave = Boolean(dorsal) && Boolean(lateral);

  const currentPreview = React.useMemo(() => {
    if (refinePicking) {
      const v = refinePicking === "dorsal" ? dorsal : lateral;
      return v?.rawImageDataUrl ?? null;
    }
    const v = view === "dorsal" ? dorsal : lateral;
    if (!v) return null;
    return v.annotatedImageDataUrl || v.rawImageDataUrl;
  }, [dorsal, lateral, refinePicking, view]);

  const quality = React.useMemo(() => {
    const blockers: string[] = [];
    if (dorsal && (!dorsal.centerlinePx || dorsal.centerlinePx.length < 10))
      blockers.push("Dorsal centerline not found.");
    if (lateral && (!lateral.centerlinePx || lateral.centerlinePx.length < 10))
      blockers.push("Lateral centerline not found.");
    if (dorsal && dorsal.confidence < 20) blockers.push("Dorsal confidence too low.");
    if (lateral && lateral.confidence < 20) blockers.push("Lateral confidence too low.");
    return { blockers, hardBlocked: blockers.length > 0 };
  }, [dorsal, lateral]);

  const handleStart = async () => {
    const res = await startCamera();
    if (!res.ok) {
      toast.error("Camera error", { description: (res as { ok: false; error: string }).error });
      return;
    }
    toast.success("Camera active", { description: `Capture ${viewLabel(view)} photo.` });
  };

  const handleCapture = async () => {
    setProcessing(true);
    try {
      const img = await captureImageAsync({ maxWidth: 1600, maxHeight: 1600, quality: 0.9 });
      if (!img) {
        toast.error("Failed to capture image");
        return;
      }

      const calibration = calibrationData?.pixelsPerMm
        ? {
            pixelsPerMm: calibrationData.pixelsPerMm,
            source: "reference-object" as const,
            referenceLabel: String(calibrationData.referenceType ?? "reference"),
          }
        : { source: "none" as const };

      const det = await measureImage(
        { imageDataUrl: img, calibration, requestedUnits: "cm" },
        { maxDim: 1024, polyDegree: 3 },
      );

      const nextState: CapturedViewState = {
        rawImageDataUrl: img,
        annotatedImageDataUrl: det.annotatedImageDataUrl,
        angleDeg: Math.round(det.curvatureAngleDeg),
        confidence: det.confidence,
        lengthCm: det.lengthCm ? Number(det.lengthCm.toFixed(1)) : undefined,
        centerlinePx: det.centerlinePx,
        warnings: det.export.debug?.warnings ?? [],
      };

      if (view === "dorsal") {
        setDorsal(nextState);
        if (nextState.lengthCm) setLengthCm(nextState.lengthCm);
        setView("lateral");
        toast.success("Dorsal captured", { description: "Now capture the lateral (side) view." });
      } else {
        setLateral(nextState);
        if (!lengthCm && nextState.lengthCm) setLengthCm(nextState.lengthCm);
        stopCamera();
        toast.success("Lateral captured", { description: "Review and save your session." });
      }
    } catch {
      toast.error("Local analysis failed", { description: "Try better lighting and reframe." });
    } finally {
      setProcessing(false);
    }
  };

  const handleRetake = async () => {
    setRefinePicking(null);
    if (view === "dorsal") {
      setDorsal(null);
      setView("dorsal");
    } else {
      setLateral(null);
      setView("lateral");
    }
    if (!isActive) {
      try {
        await startCamera();
      } catch {
        // ignore
      }
    }
    toast.message("Retake ready", { description: `Capture ${viewLabel(view)} again.` });
  };

  const handleReset = () => {
    stopCamera();
    setView("dorsal");
    setDorsal(null);
    setLateral(null);
    setLengthCm(0);
    setRefinePicking(null);
    toast.message("Session reset");
  };

  const handleRefinePick = (targetView: CurvatureCaptureView) => {
    const v = targetView === "dorsal" ? dorsal : lateral;
    if (!v?.rawImageDataUrl || !v.centerlinePx?.length) {
      toast.message("Refine unavailable", {
        description: "No centerline found; retake with better framing.",
      });
      return;
    }
    setRefinePicking(targetView);
  };

  const applyBasePick = (pt: { xPx: number; yPx: number; xPct: number; yPct: number }) => {
    const targetView = refinePicking;
    if (!targetView) return;
    const v = targetView === "dorsal" ? dorsal : lateral;
    if (!v?.centerlinePx?.length) {
      setRefinePicking(null);
      return;
    }

    const basePointPx = { x: pt.xPx, y: pt.yPx };
    const anchored = computeBaseAnchoredAngleDeg(v.centerlinePx, basePointPx);
    if (anchored == null) {
      toast.error("Refine failed", { description: "Could not compute base-anchored angle." });
      setRefinePicking(null);
      return;
    }

    let dir = computeCurvatureDirectionFromCenterline({
      view: targetView,
      centerlinePx: v.centerlinePx,
      basePointPx,
    });
    if (targetView === "dorsal" && settings.flipTopViewLeftRight) {
      dir =
        dir === "lateral-left" ? "lateral-right" : dir === "lateral-right" ? "lateral-left" : dir;
    }
    if (targetView === "lateral" && settings.flipSideViewDorsalVentral) {
      dir = dir === "dorsal" ? "ventral" : dir === "ventral" ? "dorsal" : dir;
    }

    const next = {
      ...v,
      angleDeg: Math.round(anchored),
      baseAnchorPx: basePointPx,
      curvatureDirection: dir,
    };
    if (targetView === "dorsal") setDorsal(next);
    else setLateral(next);

    toast.success("Angle refined", {
      description: `Base-anchored angle: ${Math.round(anchored)}°`,
    });
    setRefinePicking(null);
  };

  return {
    // camera
    videoRef,
    canvasRef,
    isActive,
    isStarting,
    error,
    startCamera: handleStart,
    stopCamera,
    // flow
    view,
    step,
    totalSteps,
    processing,
    dorsal,
    lateral,
    lengthCm,
    setView,
    canGoNext,
    canSave,
    currentPreview,
    refinePicking,
    setRefinePicking,
    // calibration
    showCalibration,
    setShowCalibration,
    calibrationData,
    setCalibrationData,
    // settings
    settings,
    // quality
    quality,
    // actions
    capture: handleCapture,
    retake: handleRetake,
    reset: handleReset,
    refine: handleRefinePick,
    applyBasePick,
  };
}
