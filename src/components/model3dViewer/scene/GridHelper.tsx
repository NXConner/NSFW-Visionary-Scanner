import React from "react";

export function GridHelper({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <group>
      <gridHelper args={[10, 20, "#444444", "#222222"]} position={[0, -2, 0]} />
      <axesHelper args={[5]} />
    </group>
  );
}
