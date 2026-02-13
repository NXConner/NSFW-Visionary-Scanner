import type { ProcessingOptions } from "./types";
import { preprocessImageBitmap, toGrayscale } from "./steps/preprocess";
import { autoThreshold, binarizeEdges, sobelEdges } from "./steps/edgeDetection";
import { extractLargestEdgeComponent } from "./steps/contourExtraction";
import { fitCurve } from "./steps/curveFit";
import { estimateCurvatureFromCenterline } from "./steps/curvatureAngle";
import { polylineLengthPx } from "./steps/lengthEstimation";
import { estimateGirthFromContour } from "./steps/girthEstimation";
import { decodeDataUrlToImageBitmap } from "@/scanner/utils/image";
import { 
  estimateCurvatureFromLandmarks, 
  type LandmarkCurvatureResult,
  type CurvatureType 
} from "./steps/landmarkCurvature";

export interface PipelineOutput {
  image: { width: number; height: number; downscale: number };
  edges: { threshold: number; edgePx: number; edgeDensity: number };
  contour: { points: { x: number; y: number }[]; componentCount: number };
  curve: {
    centerline: { x: number; y: number }[];
    rmse: number;
  };
  curvature: {
    angleDeg: number;
    direction: "dorsal" | "ventral" | "lateral-left" | "lateral-right" | "unknown";
    /** Curvature type classification (hinge vs arc) */
    curvatureType?: CurvatureType;
    /** Detection method used */
    method?: "4-point-landmark" | "centerline-fallback";
    /** Overall detection confidence (0-1) */
    detectionConfidence?: number;
  };
  /** Enhanced landmark-based curvature result */
  landmarkCurvature?: LandmarkCurvatureResult;
  length: { px: number };
  girth: { 
    avgWidthPx: number; 
    circumferencePx: number;
    maxWidthPx: number;
  } | null;
  warnings: string[];
}

export async function runProcessingPipeline(
  imageDataUrl: string,
  opts: ProcessingOptions = {},
): Promise<PipelineOutput> {
  const bitmap = await decodeDataUrlToImageBitmap(imageDataUrl);
  return await runProcessingPipelineFromBitmap(bitmap, opts);
}

export async function runProcessingPipelineFromBitmap(
  bitmap: ImageBitmap,
  opts: ProcessingOptions = {},
): Promise<PipelineOutput> {
  const warnings: string[] = [];

  // Use smaller default for mobile (768) vs desktop (1024) for better performance
  const isMobile = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const defaultMaxDim = isMobile ? 640 : 896;
  const maxDim = Math.max(480, Math.min(1536, opts.maxDim ?? defaultMaxDim));
  const { imageData, scale } = await preprocessImageBitmap(bitmap, { maxDim });
  const { width, height } = imageData;

  const gray = toGrayscale(imageData);
  const mag = sobelEdges(gray, width, height);
  const threshold =
    typeof opts.edgeThreshold === "number" ? opts.edgeThreshold : autoThreshold(mag);
  const edge = binarizeEdges(mag, width, height, threshold);
  let edgePx = 0;
  for (let i = 0; i < edge.data.length; i++) edgePx += edge.data[i]!;
  const edgeDensity = edgePx / Math.max(1, width * height);

  const contour = extractLargestEdgeComponent(edge);
  if (contour.points.length < 120) warnings.push("Contour extraction produced too few points.");

  const fit = fitCurve(contour.points, { degree: opts.polyDegree ?? 3 });
  if (!fit) {
    warnings.push("Curve fitting failed; capture may be too noisy or not centered.");
    return {
      image: { width, height, downscale: scale },
      edges: { threshold, edgePx, edgeDensity },
      contour: { points: contour.points, componentCount: contour.componentCount },
      curve: { centerline: [], rmse: 0 },
      curvature: { angleDeg: 0, direction: "unknown" },
      length: { px: 0 },
      girth: null,
      warnings,
    };
  }

  // Legacy curvature estimation (centerline-based fallback)
  const legacyCurvature = estimateCurvatureFromCenterline(fit.centerline);
  
  // Enhanced 4-point landmark curvature detection (PMC10150132 method)
  const landmarkCurvature = estimateCurvatureFromLandmarks(
    fit.centerline,
    contour.points,
    width,
    height
  );
  
  // Use landmark method if confident, otherwise fall back to legacy
  const useLandmarkMethod = landmarkCurvature.confidence > 0.5 && 
    landmarkCurvature.method === "4-point-landmark";
  
  const curvature = {
    angleDeg: useLandmarkMethod ? landmarkCurvature.angleDeg : legacyCurvature.angleDeg,
    direction: useLandmarkMethod ? landmarkCurvature.direction : legacyCurvature.direction,
    curvatureType: landmarkCurvature.curvatureType,
    method: landmarkCurvature.method,
    detectionConfidence: landmarkCurvature.confidence,
  };

  const lengthPx = polylineLengthPx(fit.centerline);
  
  // Estimate girth/circumference from contour width perpendicular to centerline
  const girthResult = estimateGirthFromContour(fit.centerline, contour.points, {
    sampleCount: 20,
    outlierPercent: 0.15,
  });
  
  const girth = girthResult ? {
    avgWidthPx: girthResult.avgWidthPx,
    circumferencePx: girthResult.circumferencePx,
    maxWidthPx: girthResult.maxWidthPx,
  } : null;

  return {
    image: { width, height, downscale: scale },
    edges: { threshold, edgePx, edgeDensity },
    contour: { points: contour.points, componentCount: contour.componentCount },
    curve: { centerline: fit.centerline, rmse: fit.rmse },
    curvature,
    landmarkCurvature,
    length: { px: lengthPx },
    girth,
    warnings,
  };
}
