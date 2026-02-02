import type { Calibration } from "@/scanner/measurement/types";
import type { ProcessingOptions } from "@/scanner/processing/types";
import type { CurvatureDirection } from "@/scanner/measurement/types";

export type WorkerRequest =
  | {
      id: string;
      kind: "measure";
      image: { bytes: ArrayBuffer; mimeType: string };
      calibration?: Calibration;
      opts?: ProcessingOptions;
    }
  | {
      id: string;
      kind: "ping";
    };

export type WorkerResponsePong = {
  id: string;
  ok: true;
  kind: "pong";
};

export type WorkerResponseMeasure = {
  id: string;
  ok: true;
  kind: "measure";
  result: {
    curvatureAngleDeg: number;
    curvatureDirection: CurvatureDirection;
    lengthPx: number;
    lengthMm?: number;
    lengthCm?: number;
    lengthIn?: number;
    confidence: number;
    centerlinePx: Array<{ x: number; y: number }>;
    export: {
      createdAt: string;
      inputs: { calibration?: Calibration };
      outputs: {
        curvatureAngleDeg: number;
        curvatureDirection: CurvatureDirection;
        lengthPx: number;
        lengthMm?: number;
        confidence: number;
      };
      debug?: {
        version: string;
        image: { width: number; height: number };
        preprocessing: { downscale: number; grayscale: boolean };
        edges: { threshold: number; edgePx: number; edgeDensity: number };
        contour: { points: number; componentCount: number };
        fit: { rotated: boolean; polynomialDegree: number; rmse: number; samples: number };
        length: { px: number; mm?: number };
        warnings: string[];
      };
    };
  };
  annotated: { bytes: ArrayBuffer; mimeType: string };
};

export type WorkerResponseError = {
  id: string;
  ok: false;
  kind: "error";
  error: { message: string };
};

export type WorkerResponse = WorkerResponsePong | WorkerResponseMeasure | WorkerResponseError;
