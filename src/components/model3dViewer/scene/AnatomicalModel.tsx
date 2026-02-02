import React, { useMemo, useRef, useState } from "react";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function AnatomicalModel({
  length = 5.5,
  girth = 4.5,
  curvature = 0,
  showWireframe = false,
  color = "#ffb6c1",
}: {
  length?: number;
  girth?: number;
  curvature?: number;
  showWireframe?: boolean;
  color?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const normalizedLength = length / 5;
  const normalizedGirth = girth / 15;

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, normalizedLength * 0.3, Math.sin((curvature * Math.PI) / 180) * 0.1),
      new THREE.Vector3(0, normalizedLength * 0.6, Math.sin((curvature * Math.PI) / 180) * 0.15),
      new THREE.Vector3(0, normalizedLength, Math.sin((curvature * Math.PI) / 180) * 0.2),
    ]);

    return new THREE.TubeGeometry(curve, 32, normalizedGirth, 16, false);
  }, [normalizedLength, normalizedGirth, curvature]);

  useFrame(state => {
    if (meshRef.current) {
      meshRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
      meshRef.current.scale.z = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
    }
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -normalizedLength / 2, 0]}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {showWireframe ? (
          <meshBasicMaterial color="#00ff00" wireframe />
        ) : (
          <meshStandardMaterial
            color={hovered ? "#ffc0cb" : color}
            roughness={0.6}
            metalness={0.1}
          />
        )}
      </mesh>
      <mesh position={[0, normalizedLength + 0.15, Math.sin((curvature * Math.PI) / 180) * 0.2]}>
        <sphereGeometry args={[normalizedGirth * 1.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {showWireframe ? (
          <meshBasicMaterial color="#00ff00" wireframe />
        ) : (
          <meshStandardMaterial
            color={hovered ? "#ffc0cb" : color}
            roughness={0.6}
            metalness={0.1}
          />
        )}
      </mesh>
    </group>
  );
}
