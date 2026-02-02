import { Card, CardContent } from "@/components/ui/card";
import { ScannerActionButtons } from "@/components/scanner/ScannerActionButtons";
import { ScannerCameraSurface } from "@/components/scanner/ScannerCameraSurface";
import { ScannerExternalControls } from "@/components/scanner/ScannerExternalControls";
import { ScannerInlineSettingsPanel } from "@/components/scanner/ScannerInlineSettingsPanel";
import { ScannerTelemetryProvider } from "@/components/scanner/telemetry/ScannerTelemetryContext";
import { ScannerViewHeader } from "@/components/scanner/ScannerViewHeader";
import type { ScannerSettings } from "@/components/scannerOverlays/types";
import { GridMode, ScanMode } from "@/components/scanner/types";
import type { LandmarkCurvatureResult } from "@/scanner/processing/steps/landmarkCurvature";
import * as React from "react";

export function ScannerViewCard({
  scanMode,
  scanType,
  setScanType,
  isFullWidthScanner,
  toggleFullWidth,
  videoRef,
  isActive,
  isStarting,
  error,
  capturedImage,
  zoom,
  setZoom,
  gridMode,
  onCycleGridMode,
  brightness,
  setBrightness,
  contrast,
  setContrast,
  showSettings,
  toggleShowSettings,
  showOverlaySettings,
  openOverlaySettings,
  closeOverlaySettings,
  scannerSettings,
  setScannerSettings,
  previousScanImage,
  showAngleMeasurement,
  detectedAngle,
  calibrationData,
  guidanceMessage,
  countdown,
  torchOn,
  toggleTorch,
  getVideoTrack,
  focusState,
  tapFocusFeedback,
  onTapToFocus,
  captureFlashNonce,
  timerDelay,
  setTimerDelay,
  isCalibrated,
  saveDisabled,
  saveDisabledReason,
  onOpenSaveBlockedHelp,
  onStartCamera,
  onReset,
  onCapture,
  onAutoCaptureNow,
  onSave,
  onShowTutorial,
  onShowCalibration,
  landmarkCurvatureResult,
}: {
  scanMode: ScanMode;
  scanType: "3d" | "2d";
  setScanType: (v: "3d" | "2d") => void;
  isFullWidthScanner: boolean;
  toggleFullWidth: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  isStarting: boolean;
  error: string | null;
  capturedImage: string | null;
  zoom: number;
  setZoom: (v: number) => void;
  gridMode: GridMode;
  onCycleGridMode: () => void;
  brightness: number;
  setBrightness: (v: number) => void;
  contrast: number;
  setContrast: (v: number) => void;
  showSettings: boolean;
  toggleShowSettings: () => void;
  showOverlaySettings: boolean;
  openOverlaySettings: () => void;
  closeOverlaySettings: () => void;
  scannerSettings: ScannerSettings;
  setScannerSettings: React.Dispatch<React.SetStateAction<ScannerSettings>>;
  previousScanImage: string | null;
  showAngleMeasurement: boolean;
  detectedAngle: number;
  calibrationData: any;
  guidanceMessage: { text: string; type: "info" | "success" | "warning" | "error" } | null;
  countdown: number;
  torchOn: boolean;
  toggleTorch: () => void;
  getVideoTrack: () => MediaStreamTrack | null;
  focusState: "searching" | "focusing" | "locked" | "manual" | "unsupported";
  tapFocusFeedback: {
    visible: boolean;
    xPct: number;
    yPct: number;
    state: "focusing" | "locked" | "failed";
  } | null;
  onTapToFocus: (xNorm: number, yNorm: number, viewPoint: { xPct: number; yPct: number }) => void;
  captureFlashNonce: number;
  timerDelay: number;
  setTimerDelay: (v: number) => void;
  isCalibrated: boolean;
  saveDisabled?: boolean;
  saveDisabledReason?: string | null;
  onOpenSaveBlockedHelp?: () => void;
  onStartCamera: () => void;
  onReset: () => void;
  onCapture: () => void;
  /** Auto-capture should always capture immediately (bypass timerDelay). */
  onAutoCaptureNow: () => void;
  onSave: () => void;
  onShowTutorial: () => void;
  onShowCalibration: () => void;
  /** Landmark curvature result from pipeline for visualization */
  landmarkCurvatureResult?: LandmarkCurvatureResult | null;
}) {
  return (
    <Card variant="glass" className="overflow-hidden animate-fade-in">
      <ScannerViewHeader
        scanType={scanType}
        setScanType={setScanType}
        isFullWidthScanner={isFullWidthScanner}
        toggleFullWidth={toggleFullWidth}
      />

      <CardContent className="p-0">
        <ScannerTelemetryProvider
          enabled={scanMode === "camera" || scanMode === "countdown"}
          scanMode={scanMode}
          brightness={brightness}
          videoRef={videoRef}
          focusState={focusState}
          scannerSettings={{
            autoCapture: scannerSettings.autoCapture,
            autoCaptureDelay: scannerSettings.autoCaptureDelay,
            hapticFeedback: scannerSettings.hapticFeedback,
            showTiltIndicator: scannerSettings.showTiltIndicator,
            showDistanceIndicator: scannerSettings.showDistanceIndicator,
            showQualityIndicators: scannerSettings.showQualityIndicators,
            showStatusBar: scannerSettings.showStatusBar,
          }}
          onAutoCaptureNow={onAutoCaptureNow}
        >
          <div className="flex">
            <ScannerCameraSurface
              scanMode={scanMode}
              scanType={scanType}
              videoRef={videoRef}
              isActive={isActive}
              isStarting={isStarting}
              error={error}
              capturedImage={capturedImage}
              zoom={zoom}
              gridMode={gridMode}
              brightness={brightness}
              contrast={contrast}
              scannerSettings={scannerSettings}
              onScannerSettingsChange={next => setScannerSettings(next)}
              showAngleMeasurement={showAngleMeasurement}
              detectedAngle={detectedAngle}
              calibrationData={calibrationData}
              previousScanImage={previousScanImage}
              showOverlaySettings={showOverlaySettings}
              onCloseOverlaySettings={closeOverlaySettings}
              guidanceMessage={guidanceMessage}
              countdown={countdown}
              onReset={onReset}
              onCapture={onCapture}
              getVideoTrack={getVideoTrack}
              focusState={focusState}
              tapFocusFeedback={tapFocusFeedback}
              onTapToFocus={onTapToFocus}
              torchOn={torchOn}
              captureFlashNonce={captureFlashNonce}
              landmarkCurvatureResult={landmarkCurvatureResult}
            />

            <ScannerExternalControls
              scanMode={scanMode}
              torchOn={torchOn}
              onToggleTorch={toggleTorch}
              gridMode={gridMode}
              onCycleGridMode={onCycleGridMode}
              showSettings={showSettings}
              onToggleSettings={toggleShowSettings}
              onOpenOverlaySettings={openOverlaySettings}
              scannerSettings={scannerSettings}
              setScannerSettings={setScannerSettings}
              brightness={brightness}
              isActive={isActive}
            />
          </div>
        </ScannerTelemetryProvider>

        {showSettings && (scanMode === "camera" || scanMode === "countdown") && (
          <ScannerInlineSettingsPanel
            zoom={zoom}
            setZoom={setZoom}
            brightness={brightness}
            setBrightness={setBrightness}
            contrast={contrast}
            setContrast={setContrast}
            timerDelay={timerDelay}
            setTimerDelay={setTimerDelay}
          />
        )}

        <ScannerActionButtons
          scanMode={scanMode}
          error={error}
          timerDelay={timerDelay}
          isCalibrated={isCalibrated}
          saveDisabled={saveDisabled}
          saveDisabledReason={saveDisabledReason}
          onOpenSaveBlockedHelp={onOpenSaveBlockedHelp}
          onStartCamera={onStartCamera}
          onReset={onReset}
          onCapture={onCapture}
          onSave={onSave}
          onShowTutorial={onShowTutorial}
          onShowCalibration={onShowCalibration}
          isActive={isActive}
          isStarting={isStarting}
        />
      </CardContent>
    </Card>
  );
}
