import React, { Suspense } from "react";

import { Environment, PerspectiveCamera } from "@react-three/drei";

import ErrorBoundary from "@/components/ErrorBoundary";
import { Loader } from "@/components/model3dViewer/components/Loader";
import { AnatomicalModel } from "@/components/model3dViewer/scene/AnatomicalModel";
import { CameraController } from "@/components/model3dViewer/scene/CameraController";
import { GridHelper } from "@/components/model3dViewer/scene/GridHelper";
import { MeasurementLine3D } from "@/components/model3dViewer/scene/MeasurementLine3D";
import { MeasurementMarker } from "@/components/model3dViewer/scene/MeasurementMarker";
import type {
  MeasurementLine,
  MeasurementPoint,
  Model3DScanData,
} from "@/components/model3dViewer/types";

export function Scene({
  scanData,
  showGrid,
  showWireframe,
  showMeasurements,
  autoRotate,
  measurementPoints,
  measurementLines,
  modelColor,
  resetTrigger,
}: {
  scanData?: Model3DScanData;
  showGrid: boolean;
  showWireframe: boolean;
  showMeasurements: boolean;
  autoRotate: boolean;
  measurementPoints: MeasurementPoint[];
  measurementLines: MeasurementLine[];
  modelColor: string;
  resetTrigger: number;
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <CameraController autoRotate={autoRotate} resetTrigger={resetTrigger} />

      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* `Environment preset="studio"` fetches a remote HDR (studio_small_03_1k.hdr).
          In some deployments, network/CSP rules block that fetch which used to crash the whole app.
          Contain it so the viewer continues rendering with the fallback lights above. */}
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <Environment preset="studio" />
        </Suspense>
      </ErrorBoundary>
      <GridHelper visible={showGrid} />

      <Suspense fallback={<Loader />}>
        <AnatomicalModel
          length={scanData?.length || 5.5}
          girth={scanData?.girth || 4.5}
          curvature={scanData?.curvature || 0}
          showWireframe={showWireframe}
          color={modelColor}
        />
      </Suspense>

      {showMeasurements &&
        measurementPoints.map(point => (
          <MeasurementMarker key={point.id} position={point.position} label={point.label} />
        ))}

      {showMeasurements &&
        measurementLines.map(line => (
          <MeasurementLine3D
            key={line.id}
            start={line.start}
            end={line.end}
            label={`${line.label}: ${line.distance.toFixed(2)} in`}
          />
        ))}
    </>
  );
}
