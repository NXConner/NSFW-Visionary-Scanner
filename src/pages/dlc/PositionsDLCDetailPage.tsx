import React from "react";
import { useParams } from "react-router-dom";
import PositionsDLCPage from "./PositionsDLCPage";

export default function PositionsDLCDetailPage(): React.ReactElement {
  const params = useParams();
  const rawId = typeof params.id === "string" ? params.id : undefined;
  // Defensive: if someone navigates to the literal template route `/positions/:id`,
  // React Router will pass `":id"` as the param value. Never forward that to DB queries.
  const id = rawId && rawId.startsWith(":") ? undefined : rawId;
  return <PositionsDLCPage initialPositionId={id} />;
}
