import React from "react";

import { Html, useProgress } from "@react-three/drei";
import { Loader2 } from "lucide-react";

export function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm">{progress.toFixed(0)}% loaded</span>
      </div>
    </Html>
  );
}
