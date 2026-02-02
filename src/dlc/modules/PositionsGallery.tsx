/**
 * Positions Gallery Module
 *
 * NOTE: The source of truth is `src/components/PositionsGallery.tsx`.
 * This module wrapper exists to preserve historical imports without duplicating logic.
 */

import React from "react";
import { PositionsGallery as PositionsGalleryComponent } from "@/components/PositionsGallery";

export interface PositionsGalleryProps {
  /**
   * Optional override to gate access by a specific DLC package ID.
   * The shared PositionsGallery component already enforces entitlement checks.
   */
  dlcPackageId?: string;
}

export function PositionsGallery(_props: PositionsGalleryProps): React.ReactElement {
  return <PositionsGalleryComponent />;
}

export default PositionsGallery;
