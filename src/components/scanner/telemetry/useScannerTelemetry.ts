import * as React from "react";

import { DEFAULT_SCANNER_TELEMETRY, ScannerTelemetryContext } from "./internalContext";
import type { ScannerTelemetryContextValue } from "./types";

export function useScannerTelemetry(): ScannerTelemetryContextValue {
  const ctx = React.useContext(ScannerTelemetryContext);
  return ctx ?? DEFAULT_SCANNER_TELEMETRY;
}
