import type React from "react";
import { useRef } from "react";

import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

export function CameraController({ autoRotate }: { autoRotate: boolean; resetTrigger: number }) {
  type OrbitControlsRef = React.ElementRef<typeof OrbitControls>;
  const controlsRef = useRef<OrbitControlsRef>(null);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      minDistance={2}
      maxDistance={20}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI - Math.PI / 6}
    />
  );
}
