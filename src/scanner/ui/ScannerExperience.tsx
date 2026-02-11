import * as React from "react";
import { ScannerSection } from "@/components/ScannerSection";

/**
 * Canonical scanner entry component.
 *
 * This is intentionally a thin wrapper today:
 * - It gives us a stable import path for both tab-based and route-based entry points.
 * - Future milestones will move scanner routing/state (history/results/settings) here
 *   without duplicating scanner logic across pages.
 */
export function ScannerExperience(): React.ReactElement {
  return <ScannerSection />;
}
