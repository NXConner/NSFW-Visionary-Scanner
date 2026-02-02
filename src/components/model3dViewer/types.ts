import type * as THREE from "three";

export interface MeasurementPoint {
  id: string;
  position: THREE.Vector3;
  label: string;
}

export interface MeasurementLine {
  id: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  distance: number;
  label: string;
}

export interface Model3DScanData {
  length?: number;
  girth?: number;
  curvature?: number;
  timestamp?: string;
}

export interface Model3DComparisonDatum {
  timestamp: string;
  length: number;
  girth: number;
}

export interface Model3DViewerProps {
  modelUrl?: string;
  scanData?: Model3DScanData;
  comparisonData?: Model3DComparisonDatum[];
  onCapture?: (imageData: string) => void;
  onMeasure?: (measurement: { type: string; value: number }) => void;
}
