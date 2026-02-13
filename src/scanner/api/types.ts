import type { Calibration, MeasurementResult } from "../measurement/types";

export interface ScanUploadRequest {
  imageDataUrl: string;
  /** Optional: client-generated id to correlate. */
  clientScanId?: string;
}

export interface ScanUploadResponse {
  objectPath: string;
  bucket: string;
  /** Signed URL (short-lived) to read the uploaded image. */
  signedUrl: string;
}

export interface ScanAnalyzeRequest {
  imageDataUrl?: string;
  imageObjectPath?: string;
  calibration?: Calibration;
  /** Optional: client-computed deterministic measurement results to store. */
  deterministic?: MeasurementResult["export"]["outputs"];
}

export interface ScanAnalyzeResponse {
  scanId: string;
  ai?: unknown;
  deterministic?: MeasurementResult["export"]["outputs"];
}

export interface ScanHistoryResponse {
  scans: Array<{
    id: string;
    scanned_at: string;
    scan_type: string;
    length?: number | null;
    girth?: number | null;
    curvature_angle?: number | null;
    curvature_direction?: string | null;
    confidence_level?: number | null;
    overall_health?: string | null;
    has_image?: boolean | null;
    image_signed_url?: string | null;
  }>;
}

