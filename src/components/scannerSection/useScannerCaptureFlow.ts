import { useCallback } from "react";
import { toast } from "sonner";
import { playFeedbackSound } from "@/lib/feedbackSounds";
import { triggerHaptic } from "@/lib/hapticFeedback";
import type { MeasurementResult as UiMeasurementResult } from "@/components/scanner/types";
import type { CalibrationData } from "@/components/calibrationWizard/types";
import type { ScannerSettings } from "@/components/scannerOverlays/types";
import type { NsfwDetectionResult } from "@/addons/nsfw-scanner/scanner/types";
import type { NsfwScannerPolicy } from "@/addons/nsfw-scanner/scanner/types";
import { detectNsfwFromDataUrl } from "@/addons/nsfw-scanner/scanner/nsfwDetection";
import { measureImageOptimized, addToMeasurementHistory } from "@/scanner/measurement";
import { normalizeImageBlobOrientation } from "@/scanner/utils/image/exif";
import { blobToDataUrl, dataUrlToBlob } from "@/scanner/utils/image";
import { saveLastScanSnapshot } from "@/scanner/ui/state/lastScanStore";

type GuidanceMessage = { text: string; type: "info" | "success" | "warning" | "error" } | null;

export function useScannerCaptureFlow(args: {
  brightness: number;
  contrast: number;
  scannerSettings: ScannerSettings;
  calibrationData: CalibrationData | null;

  captureImageBlobAsync: (opts?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }) => Promise<{ blob: Blob; width: number; height: number; mimeType: string } | null>;
  captureImageAsync: (opts?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }) => Promise<string | null>;
  stopCamera: () => void;

  analyzeImage: (dataUrl: string) => Promise<any>;

  nsfwPolicy: NsfwScannerPolicy;

  setRawCapturedImage: (v: string | null) => void;
  setCapturedImage: (v: string | null) => void;
  setNsfwDetection: (v: NsfwDetectionResult | null) => void;
  setScanMode: (v: any) => void;
  setGuidanceMessage: (v: GuidanceMessage) => void;
  setMeasurements: (
    v: UiMeasurementResult | ((prev: UiMeasurementResult) => UiMeasurementResult),
  ) => void;
  setConfidenceScore: (v: number) => void;
  setConfidenceContext: (v: string) => void;
  setShowAngleMeasurement: (v: boolean) => void;
  setDetectedAngle: (v: number) => void;
  setCaptureFlashNonce: (fn: (n: number) => number) => void;
}): {
  applyFiltersToDataUrl: (dataUrl: string) => Promise<string>;
  performCapture: () => Promise<void>;
} {
  const {
    brightness,
    contrast,
    scannerSettings,
    calibrationData,
    captureImageBlobAsync,
    captureImageAsync,
    stopCamera,
    analyzeImage,
    nsfwPolicy,
    setRawCapturedImage,
    setCapturedImage,
    setNsfwDetection,
    setScanMode,
    setGuidanceMessage,
    setMeasurements,
    setConfidenceScore,
    setConfidenceContext,
    setShowAngleMeasurement,
    setDetectedAngle,
    setCaptureFlashNonce,
  } = args;

  const applyFiltersToDataUrl = useCallback(
    async (dataUrl: string): Promise<string> => {
      try {
        // Decode as blob first so we can normalize orientation without expensive DataURL churn.
        const inBlob = await dataUrlToBlob(dataUrl);
        const normalized = await normalizeImageBlobOrientation(inBlob);
        const blob = normalized.blob;

        const bitmap =
          typeof createImageBitmap === "function" ? await createImageBitmap(blob) : null;
        const srcW = bitmap?.width ?? 0;
        const srcH = bitmap?.height ?? 0;
        if (!bitmap || !srcW || !srcH) return dataUrl;

        // Cap output size for faster encode + smaller payload.
        const maxDim = 1600;
        const scale = Math.min(1, maxDim / srcW, maxDim / srcH);
        const outW = Math.max(1, Math.round(srcW * scale));
        const outH = Math.max(1, Math.round(srcH * scale));

        const canvas: HTMLCanvasElement | OffscreenCanvas =
          typeof OffscreenCanvas !== "undefined"
            ? new OffscreenCanvas(outW, outH)
            : Object.assign(document.createElement("canvas"), { width: outW, height: outH });

        const ctx = canvas.getContext("2d");
        if (!ctx) return dataUrl;

        (ctx as CanvasRenderingContext2D).filter =
          `brightness(${brightness}%) contrast(${contrast}%)`;
        ctx.drawImage(bitmap, 0, 0, outW, outH);

        const outBlob: Blob =
          "convertToBlob" in canvas
            ? await (canvas as OffscreenCanvas).convertToBlob({ type: "image/jpeg", quality: 0.86 })
            : await new Promise<Blob>((resolve, reject) => {
                (canvas as HTMLCanvasElement).toBlob(
                  b => (b ? resolve(b) : reject(new Error("Failed to encode filtered image"))),
                  "image/jpeg",
                  0.86,
                );
              });

        const outDataUrl = await blobToDataUrl(outBlob);
        return outDataUrl || dataUrl;
      } catch {
        return dataUrl;
      }
    },
    [brightness, contrast],
  );

  const performCapture = useCallback(async () => {
    setCaptureFlashNonce(n => n + 1);
    if (scannerSettings.enableSoundFeedback) {
      void playFeedbackSound("capture", { volume: scannerSettings.soundVolume, force: false });
    }
    triggerHaptic("capture", { enabled: scannerSettings.hapticFeedback });

    const captured =
      (await captureImageBlobAsync({ maxWidth: 1600, maxHeight: 1600, quality: 0.86 })) ?? null;
    const legacyDataUrl = captured
      ? null
      : await captureImageAsync({ maxWidth: 1600, maxHeight: 1600, quality: 0.86 });

    if (!captured && !legacyDataUrl) return;

    stopCamera();
    setScanMode("scanning");
    setGuidanceMessage({ text: "Preparing image for analysis...", type: "info" });
    toast.info("Analyzing scan...", { description: "Processing in progress" });

    try {
      const filteredBlob = captured
        ? await (async () => {
            const normalized = await normalizeImageBlobOrientation(captured.blob);
            const blob = normalized.blob;

            const bitmap =
              typeof createImageBitmap === "function" ? await createImageBitmap(blob) : null;
            const srcW = bitmap?.width ?? 0;
            const srcH = bitmap?.height ?? 0;
            if (!bitmap || !srcW || !srcH) return blob;

            const maxDim = 1600;
            const scale = Math.min(1, maxDim / srcW, maxDim / srcH);
            const outW = Math.max(1, Math.round(srcW * scale));
            const outH = Math.max(1, Math.round(srcH * scale));

            const canvas: HTMLCanvasElement | OffscreenCanvas =
              typeof OffscreenCanvas !== "undefined"
                ? new OffscreenCanvas(outW, outH)
                : Object.assign(document.createElement("canvas"), { width: outW, height: outH });

            const ctx = canvas.getContext("2d");
            if (!ctx) return blob;

            (ctx as CanvasRenderingContext2D).filter =
              `brightness(${brightness}%) contrast(${contrast}%)`;
            ctx.drawImage(bitmap, 0, 0, outW, outH);

            const outBlob: Blob =
              "convertToBlob" in canvas
                ? await (canvas as OffscreenCanvas).convertToBlob({
                    type: "image/jpeg",
                    quality: 0.86,
                  })
                : await new Promise<Blob>((resolve, reject) => {
                    (canvas as HTMLCanvasElement).toBlob(
                      b => (b ? resolve(b) : reject(new Error("Failed to encode filtered image"))),
                      "image/jpeg",
                      0.86,
                    );
                  });

            return outBlob;
          })()
        : await dataUrlToBlob(await applyFiltersToDataUrl(legacyDataUrl!));

      const filtered = await blobToDataUrl(filteredBlob);
      setRawCapturedImage(filtered);
      setCapturedImage(filtered);
      setNsfwDetection(null);
      setScanMode("processing");
      setGuidanceMessage({
        text: "Running measurement engine (edge + contour + curve fit)...",
        type: "info",
      });

      // Deterministic measurement (prefer worker path)
      try {
        const calibration = calibrationData?.pixelsPerMm
          ? {
              pixelsPerMm: calibrationData.pixelsPerMm,
              source: "reference-object" as const,
              referenceLabel: String(calibrationData.referenceType ?? "reference"),
            }
          : { source: "none" as const };

        const deterministic = await (
          await import("@/scanner/measurement")
        ).measureBlobOptimized(
          { blob: filteredBlob, calibration, requestedUnits: "cm" },
          { maxDim: 1024, polyDegree: 3 },
        );

        const nextDeterministic: UiMeasurementResult = {
          length: deterministic.lengthCm ? Number(deterministic.lengthCm.toFixed(1)) : 0,
          circumference: deterministic.girthCm ? Number(deterministic.girthCm.toFixed(1)) : 0,
          curvatureAngle: Math.round(deterministic.curvatureAngleDeg),
          curvatureDirection:
            deterministic.curvatureDirection === "dorsal"
              ? "Dorsal (upward)"
              : deterministic.curvatureDirection === "ventral"
                ? "Ventral (downward)"
                : deterministic.curvatureDirection === "lateral-left"
                  ? "Lateral (left)"
                  : deterministic.curvatureDirection === "lateral-right"
                    ? "Lateral (right)"
                    : "",
        };

        setMeasurements(nextDeterministic);
        setConfidenceScore(deterministic.confidence);
        setConfidenceContext(
          deterministic.export.debug?.warnings?.length
            ? `Engine confidence ${deterministic.confidence}%. ${deterministic.export.debug.warnings.join(" ")}`
            : `Engine confidence ${deterministic.confidence}%.`,
        );

        // Prefer annotated output for preview + export/share.
        setCapturedImage(deterministic.annotatedImageDataUrl || filtered);

        addToMeasurementHistory({
          result: deterministic.export.outputs,
          annotatedImageDataUrl: deterministic.annotatedImageDataUrl,
        });

        // Store last scan snapshot for /scanner/results deep-link screen.
        void saveLastScanSnapshot({
          schemaVersion: 1,
          createdAt: new Date().toISOString(),
          annotatedImageDataUrl: deterministic.annotatedImageDataUrl,
          rawImageDataUrl: filtered,
          measurements: {
            lengthCm: deterministic.lengthCm ?? null,
            circumferenceCm: deterministic.girthCm ?? null,
            curvatureAngleDeg: deterministic.curvatureAngleDeg ?? null,
            curvatureDirection: deterministic.curvatureDirection ?? null,
            confidence: deterministic.confidence ?? null,
          },
          calibration: {
            pixelsPerMm: calibrationData?.pixelsPerMm,
            calibrationConfidence: calibrationData?.calibrationConfidence,
            skewPercent: calibrationData?.calibrationDiagnostics?.skewPercent,
          },
        });
      } catch {
        setConfidenceScore(0);
        setConfidenceContext(
          "Measurement engine unavailable. You can still enter values manually.",
        );
      }

      // Optional: on-device explicit-content detection (DLC)
      if (nsfwPolicy.enabled && nsfwPolicy.enableOnDeviceDetection) {
        try {
          const res = await detectNsfwFromDataUrl(filtered, {
            explicitThreshold: nsfwPolicy.explicitThreshold,
            suggestiveThreshold: nsfwPolicy.suggestiveThreshold,
          });
          setNsfwDetection(res);
        } catch {
          // ignore
        }
      }

      if (scannerSettings.enableCloudAiAnalysis) {
        setGuidanceMessage({ text: "Running AI analysis (optional)...", type: "info" });
        const analysis = await analyzeImage(filtered);
        if (analysis?.curvatureAssessment?.estimatedAngle) {
          setMeasurements(prev => ({
            ...prev,
            curvatureAngle:
              prev.curvatureAngle > 0
                ? prev.curvatureAngle
                : Math.round(analysis.curvatureAssessment.estimatedAngle),
            curvatureDirection:
              prev.curvatureDirection || (analysis.curvatureAssessment.direction ?? ""),
          }));
        }
      }

      setScanMode("complete");
      setShowAngleMeasurement(false);
      setDetectedAngle(0);
      setGuidanceMessage({
        text: scannerSettings.enableCloudAiAnalysis
          ? "Scan complete! Review results and save."
          : "Scan complete! (AI analysis not enabled). Review results and save.",
        type: "success",
      });
      if (navigator.vibrate) navigator.vibrate(200);
      toast.success("Scan Ready", { description: "Review analysis and enter measurements" });
      setTimeout(() => setGuidanceMessage(null), 5000);
    } catch {
      setScanMode("complete");
      setGuidanceMessage({
        text: "Capture complete. Measurement engine failed; enter values manually to save.",
        type: "warning",
      });
    }
  }, [
    analyzeImage,
    applyFiltersToDataUrl,
    calibrationData?.pixelsPerMm,
    calibrationData?.referenceType,
    calibrationData?.calibrationConfidence,
    calibrationData?.calibrationDiagnostics?.skewPercent,
    captureImageBlobAsync,
    captureImageAsync,
    nsfwPolicy.enableOnDeviceDetection,
    nsfwPolicy.enabled,
    nsfwPolicy.explicitThreshold,
    nsfwPolicy.suggestiveThreshold,
    scannerSettings.enableCloudAiAnalysis,
    scannerSettings.enableSoundFeedback,
    scannerSettings.hapticFeedback,
    scannerSettings.soundVolume,
    setCaptureFlashNonce,
    setCapturedImage,
    setConfidenceContext,
    setConfidenceScore,
    setDetectedAngle,
    setGuidanceMessage,
    setMeasurements,
    setNsfwDetection,
    setRawCapturedImage,
    setScanMode,
    setShowAngleMeasurement,
    brightness,
    contrast,
    stopCamera,
  ]);

  return { applyFiltersToDataUrl, performCapture };
}
