import type { MeasurementResult } from "./types";

export interface MeasurementExportBundle {
  json: string;
  annotatedImageDataUrl: string;
}

export function exportMeasurement(result: MeasurementResult): MeasurementExportBundle {
  return {
    json: JSON.stringify(result.export, null, 2),
    annotatedImageDataUrl: result.annotatedImageDataUrl,
  };
}
