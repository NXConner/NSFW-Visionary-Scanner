import { annotateImage } from "@/scanner/processing/steps/annotate";
import { computeConfidence } from "@/scanner/processing/steps/confidence";
import { runProcessingPipeline } from "@/scanner/processing/pipeline";
import type { ProcessingOptions } from "@/scanner/processing/types";
import type { MeasurementResult, ScanInputs } from "./types";

const ENGINE_VERSION = "scanner-engine-v1.1";

export async function measureImage(
  input: ScanInputs,
  opts: ProcessingOptions = {},
): Promise<MeasurementResult> {
  const calibration = input.calibration;
  const pixelsPerMm = calibration?.pixelsPerMm;
  const calibrated =
    typeof pixelsPerMm === "number" && Number.isFinite(pixelsPerMm) && pixelsPerMm > 0;

  const pipeline = await runProcessingPipeline(input.imageDataUrl, opts);

  // Length calculations
  const lengthPx = pipeline.length.px;
  const lengthMm = calibrated ? lengthPx / pixelsPerMm! : undefined;
  const lengthCm = typeof lengthMm === "number" ? lengthMm / 10 : undefined;
  const lengthIn = typeof lengthMm === "number" ? lengthMm / 25.4 : undefined;

  // Girth/circumference calculations
  const girthPx = pipeline.girth?.circumferencePx;
  const girthMm = calibrated && girthPx ? girthPx / pixelsPerMm! : undefined;
  const girthCm = typeof girthMm === "number" ? girthMm / 10 : undefined;
  const girthIn = typeof girthMm === "number" ? girthMm / 25.4 : undefined;
  const avgWidthPx = pipeline.girth?.avgWidthPx;

  const conf = computeConfidence({
    edgeDensity: pipeline.edges.edgeDensity,
    contourPoints: pipeline.contour.points.length,
    rmse: pipeline.curve.rmse,
    calibrated,
    warnings: pipeline.warnings,
  });

  // Pipeline centerline is in processing space (downscaled). Scale back to original.
  const invScale = pipeline.image.downscale > 0 ? 1 / pipeline.image.downscale : 1;
  const centerlineOriginal = pipeline.curve.centerline.map(p => ({
    x: p.x * invScale,
    y: p.y * invScale,
  }));

  const lengthLabel = calibrated
    ? `${(lengthCm ?? 0).toFixed(1)} cm`
    : `${Math.round(lengthPx)} px`;

  const girthLabel =
    calibrated && girthCm
      ? `${girthCm.toFixed(1)} cm`
      : girthPx
        ? `${Math.round(girthPx)} px`
        : undefined;

  const annotatedImageDataUrl = await annotateImage({
    originalImageDataUrl: input.imageDataUrl,
    centerline: centerlineOriginal,
    curvatureAngleDeg: pipeline.curvature.angleDeg,
    lengthLabel,
    girthLabel,
    confidence: conf.score,
  });

  // Extract landmark points for visualization (scale back to original coordinates)
  const landmarkPoints = pipeline.landmarkCurvature?.landmarks.map(lm => ({
    position: {
      x: lm.position.x * invScale,
      y: lm.position.y * invScale,
    },
    type: lm.type,
    confidence: lm.confidence,
  }));

  const result: MeasurementResult = {
    curvatureAngleDeg: pipeline.curvature.angleDeg,
    curvatureDirection: pipeline.curvature.direction,
    curvatureType: pipeline.curvature.curvatureType,
    curvatureMethod: pipeline.curvature.method,
    curvatureConfidence: pipeline.curvature.detectionConfidence,
    lengthPx,
    lengthMm,
    lengthCm,
    lengthIn,
    girthPx,
    girthMm,
    girthCm,
    girthIn,
    avgWidthPx,
    confidence: conf.score,
    annotatedImageDataUrl,
    centerlinePx: centerlineOriginal,
    landmarkPoints,
    export: {
      createdAt: new Date().toISOString(),
      inputs: { calibration },
      outputs: {
        curvatureAngleDeg: pipeline.curvature.angleDeg,
        curvatureDirection: pipeline.curvature.direction,
        curvatureType: pipeline.curvature.curvatureType,
        curvatureMethod: pipeline.curvature.method,
        lengthPx,
        lengthMm,
        girthPx,
        girthMm,
        girthCm,
        confidence: conf.score,
      },
      debug: {
        version: ENGINE_VERSION,
        image: { width: pipeline.image.width, height: pipeline.image.height },
        preprocessing: { downscale: pipeline.image.downscale, grayscale: true },
        edges: {
          threshold: pipeline.edges.threshold,
          edgePx: pipeline.edges.edgePx,
          edgeDensity: pipeline.edges.edgeDensity,
        },
        contour: {
          points: pipeline.contour.points.length,
          componentCount: pipeline.contour.componentCount,
        },
        fit: {
          rotated: true,
          polynomialDegree: opts.polyDegree ?? 3,
          rmse: pipeline.curve.rmse,
          samples: pipeline.curve.centerline.length,
        },
        length: { px: lengthPx, mm: lengthMm },
        warnings: pipeline.warnings,
      },
    },
  };

  return result;
}
