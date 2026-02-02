import React, { useMemo } from "react";

import { Html, Line } from "@react-three/drei";
import * as THREE from "three";

export function MeasurementLine3D({
  start,
  end,
  label,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  label: string;
}) {
  const midpoint = useMemo(
    () => new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5),
    [start, end],
  );

  return (
    <group>
      <Line points={[start, end]} color="#00ff00" lineWidth={2} dashed={false} />
      <Html position={midpoint} distanceFactor={10}>
        <div className="bg-green-500/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {label}
        </div>
      </Html>
    </group>
  );
}
