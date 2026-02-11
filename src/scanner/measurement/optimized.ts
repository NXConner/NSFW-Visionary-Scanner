import type { ProcessingOptions } from "@/scanner/processing/types";
import type { MeasurementResult, ScanInputs } from "./types";
import { measureImage } from "./engine";
import { measureImageInWorker } from "@/scanner/processing/worker";
import { measureBlobInWorker } from "@/scanner/processing/worker";

/**
 * Detect if running on a low-powered device.
 * Uses hardware concurrency and device memory as heuristics.
 */
function isLowPowerDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  // Check CPU cores (low-end devices typically have 2-4)
  const cores = navigator.hardwareConcurrency ?? 4;
  if (cores <= 2) return true;

  // Check device memory if available (Chrome only)
  const mem = (navigator as any).deviceMemory;
  if (typeof mem === "number" && mem <= 2) return true;

  // Check if mobile
  if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    // Mobile with low cores
    return cores <= 4;
  }

  return false;
}

/**
 * Get optimal processing options based on device capability.
 */
function getAdaptiveOptions(opts: ProcessingOptions = {}): ProcessingOptions {
  if (opts.maxDim !== undefined) return opts;

  const lowPower = isLowPowerDevice();
  return {
    ...opts,
    maxDim: lowPower ? 512 : undefined, // Use pipeline defaults otherwise
    polyDegree: opts.polyDegree ?? (lowPower ? 2 : 3),
  };
}

/**
 * Preferred measurement entry point for UI:
 * - Uses adaptive processing options based on device capability.
 * - Uses a Web Worker when available to avoid main-thread stalls.
 * - Falls back to the existing main-thread engine for environments without Worker support.
 */
export async function measureImageOptimized(
  input: ScanInputs,
  opts: ProcessingOptions = {},
): Promise<MeasurementResult> {
  const adaptiveOpts = getAdaptiveOptions(opts);
  const workerRes = await measureImageInWorker(input, adaptiveOpts).catch(() => null);
  if (workerRes) return workerRes;
  return await measureImage(input, adaptiveOpts);
}

/**
 * Blob-first measurement entry point (preferred when capture already produced a Blob).
 * Uses adaptive processing options for optimal performance.
 * Falls back to converting blob->dataUrl and using the existing main-thread engine.
 */
export async function measureBlobOptimized(
  args: {
    blob: Blob;
    calibration?: ScanInputs["calibration"];
    requestedUnits?: ScanInputs["requestedUnits"];
  },
  opts: ProcessingOptions = {},
): Promise<MeasurementResult> {
  const adaptiveOpts = getAdaptiveOptions(opts);
  const workerRes = await measureBlobInWorker(args.blob, args.calibration, adaptiveOpts).catch(
    () => null,
  );
  if (workerRes) return workerRes;
  const { blobToDataUrl } = await import("@/scanner/utils/image");
  const dataUrl = await blobToDataUrl(args.blob);
  return await measureImage(
    { imageDataUrl: dataUrl, calibration: args.calibration, requestedUnits: args.requestedUnits },
    adaptiveOpts,
  );
}
