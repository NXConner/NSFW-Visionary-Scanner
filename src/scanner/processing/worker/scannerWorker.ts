/// <reference lib="webworker" />

import { runProcessingPipelineFromBitmap } from "@/scanner/processing/pipeline";
import type { WorkerRequest, WorkerResponse } from "./protocol";
import { computeConfidence } from "@/scanner/processing/steps/confidence";
import { annotateImageToBlob } from "@/scanner/processing/steps/annotate";

const ENGINE_VERSION = "scanner-engine-v1-worker";

function post(msg: WorkerResponse, transfer?: Transferable[]) {
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg, transfer ?? []);
}

function newId(): string {
  // Not crypto-critical; avoids bringing crypto polyfills into worker.
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

self.onmessage = async (ev: MessageEvent<WorkerRequest>) => {
  const req = ev.data;
  if (!req || typeof req !== "object" || !("id" in req) || typeof req.id !== "string") return;

  try {
    if (req.kind === "ping") {
      post({ id: req.id, ok: true, kind: "pong" });
      return;
    }

    if (req.kind !== "measure") {
      post({
        id: (req as { id: string }).id,
        ok: false,
        kind: "error",
        error: { message: "Unknown request" },
      });
      return;
    }

    if (typeof createImageBitmap !== "function") {
      post({
        id: req.id,
        ok: false,
        kind: "error",
        error: { message: "Worker cannot decode images (createImageBitmap unavailable)" },
      });
      return;
    }

    const mimeType = req.image?.mimeType || "image/jpeg";
    const blob = new Blob([req.image.bytes], { type: mimeType });
    const bitmap = await createImageBitmap(blob);

    const pipeline = await runProcessingPipelineFromBitmap(bitmap, req.opts ?? {});
    const pixelsPerMm = req.calibration?.pixelsPerMm;
    const calibrated =
      typeof pixelsPerMm === "number" && Number.isFinite(pixelsPerMm) && pixelsPerMm > 0;

    const lengthPx = pipeline.length.px;
    const lengthMm = calibrated ? lengthPx / pixelsPerMm! : undefined;
    const lengthCm = typeof lengthMm === "number" ? lengthMm / 10 : undefined;
    const lengthIn = typeof lengthMm === "number" ? lengthMm / 25.4 : undefined;

    const conf = computeConfidence({
      edgeDensity: pipeline.edges.edgeDensity,
      contourPoints: pipeline.contour.points.length,
      rmse: pipeline.curve.rmse,
      calibrated,
      warnings: pipeline.warnings,
    });

    const invScale = pipeline.image.downscale > 0 ? 1 / pipeline.image.downscale : 1;
    const centerlinePx = pipeline.curve.centerline.map(p => ({
      x: p.x * invScale,
      y: p.y * invScale,
    }));

    const lengthLabel = calibrated
      ? `${(lengthCm ?? 0).toFixed(1)} cm`
      : `${Math.round(lengthPx)} px`;

    const annotatedBlob = await annotateImageToBlob({
      originalBitmap: bitmap,
      centerline: centerlinePx,
      curvatureAngleDeg: pipeline.curvature.angleDeg,
      lengthLabel,
      confidence: conf.score,
    });

    const annotatedBytes = await annotatedBlob.arrayBuffer();

    post(
      {
        id: req.id,
        ok: true,
        kind: "measure",
        result: {
          curvatureAngleDeg: pipeline.curvature.angleDeg,
          curvatureDirection: pipeline.curvature.direction,
          lengthPx,
          lengthMm,
          lengthCm,
          lengthIn,
          confidence: conf.score,
          centerlinePx,
          export: {
            createdAt: new Date().toISOString(),
            inputs: { calibration: req.calibration },
            outputs: {
              curvatureAngleDeg: pipeline.curvature.angleDeg,
              curvatureDirection: pipeline.curvature.direction,
              lengthPx,
              lengthMm,
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
                polynomialDegree: req.opts?.polyDegree ?? 3,
                rmse: pipeline.curve.rmse,
                samples: pipeline.curve.centerline.length,
              },
              length: { px: lengthPx, mm: lengthMm },
              warnings: pipeline.warnings,
            },
          },
        },
        annotated: { bytes: annotatedBytes, mimeType: annotatedBlob.type || "image/jpeg" },
      },
      [annotatedBytes],
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Worker error";
    post({ id: (req as any).id ?? newId(), ok: false, kind: "error", error: { message: msg } });
  }
};
