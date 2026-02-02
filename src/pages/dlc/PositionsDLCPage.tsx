import React from "react";
import PositionsGallery from "@/components/PositionsGallery";

export default function PositionsDLCPage({
  initialPositionId,
}: {
  initialPositionId?: string;
}): React.ReactElement {
  return <PositionsGallery initialPositionId={initialPositionId} />;
}
