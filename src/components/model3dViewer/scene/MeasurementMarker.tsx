import React from "react";

import { Html } from "@react-three/drei";
import type * as THREE from "three";

export function MeasurementMarker({
  position,
  label,
  onClick,
}: {
  position: THREE.Vector3;
  label: string;
  onClick?: () => void;
}) {
  return (
    <group position={position}>
      <mesh onClick={onClick}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.3} />
      </mesh>
      <Html distanceFactor={10}>
        <div className="bg-green-500/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {label}
        </div>
      </Html>
    </group>
  );
}
