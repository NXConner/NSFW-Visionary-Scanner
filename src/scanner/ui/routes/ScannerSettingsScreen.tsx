import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ScannerSettingsPanel } from "@/components/ScannerOverlays";
import { RouteTopNav } from "@/components/navigation/RouteTopNav";
import { usePersistentScannerSettings } from "@/scanner/ui/hooks";
import { CalibrationWizard } from "@/components/CalibrationWizard";
import { CalibrationVerifyWizard } from "@/components/CalibrationVerifyWizard";
import type { CalibrationData } from "@/components/calibrationWizard/types";
import {
  fromCalibrationWizardData,
  loadCalibrationProfile,
  saveCalibrationProfile,
  toCalibrationWizardData,
} from "@/scanner/calibration";

export function ScannerSettingsScreen(): React.ReactElement {
  const navigate = useNavigate();
  const [settings, setSettings] = usePersistentScannerSettings();
  const [calibrationData, setCalibrationData] = React.useState<CalibrationData | null>(null);
  const [isCalibrated, setIsCalibrated] = React.useState(false);
  const [showCalibration, setShowCalibration] = React.useState(false);
  const [showVerify, setShowVerify] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const profile = await loadCalibrationProfile();
      if (!profile || cancelled) return;
      const data = toCalibrationWizardData(profile);
      setCalibrationData(data);
      setIsCalibrated(Boolean(data.pixelsPerMm) && data.pixelsPerMm > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <RouteTopNav title="Scanner Settings" backTo="/scanner" backLabel="Scanner" />
      <main className="relative container mx-auto px-4 py-8 max-w-4xl">
        <ScannerSettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => navigate(-1)}
          calibration={{
            isCalibrated,
            summary: calibrationData?.pixelsPerMm
              ? `Reference: ${calibrationData.referenceWidth}mm × ${calibrationData.referenceHeight}mm · ${calibrationData.pixelsPerMm.toFixed(
                  3,
                )} px/mm`
              : null,
            qualityPercent:
              typeof calibrationData?.calibrationConfidence === "number"
                ? calibrationData.calibrationConfidence * 100
                : null,
            skewPercent: calibrationData?.calibrationDiagnostics?.skewPercent ?? null,
            data: calibrationData,
            onVerify: isCalibrated && calibrationData ? () => setShowVerify(true) : undefined,
            onRecalibrate: () => setShowCalibration(true),
          }}
        />
      </main>

      <CalibrationWizard
        isOpen={showCalibration}
        onClose={() => setShowCalibration(false)}
        onCalibrationComplete={data => {
          setCalibrationData(data);
          setIsCalibrated(Boolean(data.pixelsPerMm) && data.pixelsPerMm > 0);
          void saveCalibrationProfile(fromCalibrationWizardData({ data }));
        }}
      />

      {calibrationData ? (
        <CalibrationVerifyWizard
          isOpen={showVerify}
          currentCalibration={calibrationData}
          onClose={() => setShowVerify(false)}
          onOpenFullRecalibration={() => setShowCalibration(true)}
          onApplyUpdatedCalibration={updated => {
            setCalibrationData(updated);
            setIsCalibrated(Boolean(updated.pixelsPerMm) && updated.pixelsPerMm > 0);
            void saveCalibrationProfile(fromCalibrationWizardData({ data: updated }));
          }}
        />
      ) : null}
    </div>
  );
}
