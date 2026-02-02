import * as React from "react";
import type { ScannerSettings } from "@/components/scannerOverlays/types";
import { loadScannerSettings, saveScannerSettings } from "@/scanner/ui/state/scannerSettingsStore";

export function usePersistentScannerSettings(): [
  ScannerSettings,
  React.Dispatch<React.SetStateAction<ScannerSettings>>,
] {
  const [settings, setSettings] = React.useState<ScannerSettings>(() => loadScannerSettings());

  // Persist with small debounce to avoid excessive storage writes while toggling.
  const tRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => {
      saveScannerSettings(settings);
    }, 180);
    return () => {
      if (tRef.current) window.clearTimeout(tRef.current);
    };
  }, [settings]);

  return [settings, setSettings];
}
