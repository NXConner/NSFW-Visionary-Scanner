import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AIAssistant } from "@/components/AIAssistant";
import { LightingQuality } from "@/components/LightingQuality";
import { ObjectDetectionOverlay } from "@/components/ObjectDetectionOverlay";
import {
  AutoCaptureIndicator,
  EdgeDetectionOverlay,
  GhostOverlay,
  QualityMeter,
  ScannerSettingsPanel,
  VirtualRulerOverlay,
} from "@/components/ScannerOverlays";
import type { ScannerSettings } from "@/components/scannerOverlays/types";
import {
  AngleMeasurementOverlay,
  GuidanceMessage,
  PositioningOverlay,
  ScannerFeedback,
} from "@/components/ScannerFeedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScannerFrameOverlay, ScannerGridOverlay } from "@/components/scanner/ScannerOverlaysUi";
import { GridMode, ScanMode } from "@/components/scanner/types";
import { useAdvancedCamera } from "@/hooks/useAdvancedCamera";
import { playFeedbackSound } from "@/lib/feedbackSounds";
import { triggerHaptic } from "@/lib/hapticFeedback";
import { CaptureFlashOverlay } from "@/components/scanner/CaptureFlashOverlay";
import { FocusStateIndicator } from "@/components/scanner/FocusStateIndicator";
import { LandmarkCurvatureOverlay } from "@/components/scanner/LandmarkCurvatureOverlay";
import { MLProcessingIndicator } from "@/components/scanner/MLProcessingIndicator";
import { MultiObjectBadges } from "@/components/scanner/MultiObjectBadges";
import { ObjectTrackingVisualization } from "@/components/scanner/ObjectTrackingVisualization";
import { ObjectMaskingOverlay } from "@/components/scanner/ObjectMaskingOverlay";
import { ScannerStatusBar } from "@/components/scanner/ScannerStatusBar";
import { TapToFocusOverlay } from "@/components/scanner/TapToFocusOverlay";
import { useScannerTelemetry } from "@/components/scanner/telemetry/useScannerTelemetry";
import { useObjectAutoTrack } from "@/hooks/useObjectAutoTrack";
import { AlertCircle, Camera, CheckCircle2, Focus, RotateCcw, RotateCw, Scan } from "lucide-react";
import { FilteredImage } from "@/components/media/FilteredImage";

import type { LandmarkCurvatureResult } from "@/scanner/processing/steps/landmarkCurvature";

export function ScannerCameraSurface({
  scanMode,
  scanType,
  videoRef,
  isActive,
  isStarting,
  error,
  capturedImage,
  zoom,
  gridMode,
  brightness,
  contrast,
  scannerSettings,
  onScannerSettingsChange,
  showAngleMeasurement,
  detectedAngle,
  calibrationData,
  previousScanImage,
  showOverlaySettings,
  onCloseOverlaySettings,
  guidanceMessage,
  countdown,
  onReset,
  onCapture,
  getVideoTrack,
  focusState,
  tapFocusFeedback,
  onTapToFocus,
  torchOn,
  captureFlashNonce,
  landmarkCurvatureResult,
}: {
  scanMode: ScanMode;
  scanType: "3d" | "2d";
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  isStarting: boolean;
  error: string | null;
  capturedImage: string | null;
  zoom: number;
  gridMode: GridMode;
  brightness: number;
  contrast: number;
  scannerSettings: ScannerSettings;
  onScannerSettingsChange: (next: ScannerSettings) => void;
  showAngleMeasurement: boolean;
  detectedAngle: number;
  calibrationData: any;
  previousScanImage: string | null;
  showOverlaySettings: boolean;
  onCloseOverlaySettings: () => void;
  guidanceMessage: { text: string; type: "info" | "success" | "warning" | "error" } | null;
  countdown: number;
  onReset: () => void;
  onCapture: () => void;
  getVideoTrack: () => MediaStreamTrack | null;
  focusState: "searching" | "focusing" | "locked" | "manual" | "unsupported";
  tapFocusFeedback: {
    visible: boolean;
    xPct: number;
    yPct: number;
    state: "focusing" | "locked" | "failed";
  } | null;
  onTapToFocus: (xNorm: number, yNorm: number, viewPoint: { xPct: number; yPct: number }) => void;
  torchOn: boolean;
  captureFlashNonce: number;
  /** Optional landmark curvature result for overlay visualization */
  landmarkCurvatureResult?: LandmarkCurvatureResult | null;
}) {
  const {
    isStabilized,
    tiltX,
    tiltY,
    estimatedDistance,
    autoCapturing,
    autoCaptureCountdown,
    qualityScore,
    lightingScore,
    sharpnessScore,
    focusOk,
    cancelAutoCapture,
  } = useScannerTelemetry();

  const lastDetectionCountRef = useRef<number>(0);
  const lastFocusStateRef = useRef<string>("searching");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lockedTrackId, setLockedTrackId] = useState<number | null>(null);

  const { detection, tracking, capabilities } = useAdvancedCamera({
    videoRef,
    getVideoTrack,
    isActive,
    settings: scannerSettings,
  });

  const detections = detection.detections;
  const tracks = tracking.tracks;

  // Auto-tracking hook for tap-to-select-and-follow
  const autoTrack = useObjectAutoTrack({
    enabled: scannerSettings.enableAutoTracking && scannerSettings.enableTracking && isActive,
    tracks,
    onFocusPointChange: scannerSettings.autoTrackingFocusEnabled
      ? point => {
          if (point && scannerSettings.tapToFocusEnabled) {
            onTapToFocus(point.x, point.y, { xPct: point.x * 100, yPct: point.y * 100 });
          }
        }
      : undefined,
    focusUpdateIntervalMs: 300,
  });

  useEffect(() => {
    if (selectedIndex >= detections.length) setSelectedIndex(0);
  }, [detections.length, selectedIndex]);

  // Detection enter sound/haptic
  useEffect(() => {
    const prev = lastDetectionCountRef.current;
    const next = detections.length;
    if (prev === 0 && next > 0) {
      if (scannerSettings.enableSoundFeedback) {
        void playFeedbackSound("object_detected", {
          volume: scannerSettings.soundVolume,
          force: false,
        });
      }
      triggerHaptic("object_detected", { enabled: scannerSettings.hapticFeedback });
    }
    lastDetectionCountRef.current = next;
  }, [
    detections.length,
    scannerSettings.enableSoundFeedback,
    scannerSettings.soundVolume,
    scannerSettings.hapticFeedback,
  ]);

  // Focus lock sound/haptic
  useEffect(() => {
    const prev = lastFocusStateRef.current;
    const next = focusState;
    if (prev !== "locked" && next === "locked") {
      if (scannerSettings.enableSoundFeedback) {
        void playFeedbackSound("focus_lock", { volume: scannerSettings.soundVolume, force: false });
      }
      triggerHaptic("focus_lock", { enabled: scannerSettings.hapticFeedback });
    }
    lastFocusStateRef.current = next;
  }, [
    focusState,
    scannerSettings.enableSoundFeedback,
    scannerSettings.soundVolume,
    scannerSettings.hapticFeedback,
  ]);

  const handleTapToFocus = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!(scanMode === "camera" || scanMode === "countdown")) return;
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const xPct = x * 100;
      const yPct = y * 100;

      // Try to select a tracked object first (auto-tracking)
      if (
        scannerSettings.enableAutoTracking &&
        scannerSettings.enableTracking &&
        tracks.length > 0
      ) {
        const selectedObj = autoTrack.handleTapToSelect(xPct, yPct);
        if (selectedObj) {
          // Play feedback for object selection
          triggerHaptic("object_detected", { enabled: scannerSettings.hapticFeedback });
          if (scannerSettings.enableSoundFeedback) {
            void playFeedbackSound("focus_lock", {
              volume: scannerSettings.soundVolume,
              force: false,
            });
          }
          return; // Object selected, auto-tracking will handle focus
        }
      }

      // No object tapped, fall back to regular tap-to-focus
      if (scannerSettings.tapToFocusEnabled) {
        onTapToFocus(Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y)), {
          xPct,
          yPct,
        });
      }
    },
    [
      onTapToFocus,
      scanMode,
      scannerSettings.tapToFocusEnabled,
      scannerSettings.enableAutoTracking,
      scannerSettings.enableTracking,
      scannerSettings.hapticFeedback,
      scannerSettings.enableSoundFeedback,
      scannerSettings.soundVolume,
      tracks.length,
      autoTrack,
    ],
  );

  const autoCaptureStatus = useMemo(() => {
    const lightingOk = brightness >= 80 && brightness <= 120;
    const qualityOk = qualityScore >= 70 && sharpnessScore >= 60;
    const detectionEnabled =
      scannerSettings.enableRealDetection && scannerSettings.showObjectDetection;
    const hasDet = detections.length > 0;

    if (autoCapturing) return { phase: "capturing" as const, message: "Capturing…" };
    if (autoCaptureCountdown > 0)
      return {
        phase: "countdown" as const,
        countdown: autoCaptureCountdown,
        message: "Capturing in…",
      };

    if (detectionEnabled && !hasDet)
      return { phase: "waiting_detection" as const, message: "Waiting for detection…" };
    if (detectionEnabled && hasDet && (!lightingOk || !isStabilized || !focusOk || !qualityOk))
      return { phase: "stabilizing" as const, message: "Stabilizing…" };
    if (detectionEnabled && hasDet && lightingOk && isStabilized && focusOk && qualityOk)
      return { phase: "optimal" as const, message: "Optimal conditions" };

    // Fallback to pre-AI readiness
    if (!lightingOk || !isStabilized || !focusOk || !qualityOk)
      return { phase: "stabilizing" as const, message: "Stabilizing…" };
    return { phase: "optimal" as const, message: "Optimal conditions" };
  }, [
    autoCapturing,
    autoCaptureCountdown,
    brightness,
    detections.length,
    isStabilized,
    focusOk,
    qualityScore,
    sharpnessScore,
    scannerSettings.enableRealDetection,
    scannerSettings.showObjectDetection,
  ]);

  const selectedTrack = useMemo(() => {
    if (!tracks.length) return null;
    return tracks[Math.max(0, Math.min(tracks.length - 1, selectedIndex))] ?? null;
  }, [tracks, selectedIndex]);

  useEffect(() => {
    if (!scannerSettings.trackingLockEnabled) {
      setLockedTrackId(null);
      return;
    }
    if (selectedTrack && lockedTrackId == null) setLockedTrackId(selectedTrack.trackId);
  }, [scannerSettings.trackingLockEnabled, selectedTrack, lockedTrackId]);

  // Use auto-tracking selection if enabled, otherwise fall back to legacy selection
  const resolvedSelectedTrackId = scannerSettings.enableAutoTracking
    ? autoTrack.selectedTrackId
    : scannerSettings.trackingLockEnabled
      ? lockedTrackId
      : (selectedTrack?.trackId ?? null);

  return (
    <div
      className="relative flex-1 aspect-[3/4] md:aspect-[4/3] min-h-[500px] lg:min-h-[550px] bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center overflow-hidden"
      style={
        brightness === 100 && contrast === 100
          ? undefined
          : { filter: `brightness(${brightness}%) contrast(${contrast}%)` }
      }
      onPointerDown={handleTapToFocus}
    >
      {/* Camera Feed */}
      {(scanMode === "camera" || scanMode === "countdown" || isActive) && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
        />
      )}

      {/* Captured Image */}
      {capturedImage && scanMode !== "camera" && scanMode !== "countdown" && (
        <FilteredImage
          src={capturedImage}
          alt="Captured"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Grid Overlay */}
      <ScannerGridOverlay gridMode={gridMode} />

      {(scanMode === "camera" || scanMode === "countdown") && (
        <div className="absolute left-3 top-3 z-30">
          <LightingQuality brightness={brightness} contrast={contrast} />
        </div>
      )}

      {(scanMode === "camera" || scanMode === "countdown") && scannerSettings.showMLIndicator && (
        <MLProcessingIndicator
          status={detection.status}
          fps={detection.fps}
          inferenceMs={detection.lastInferenceMs}
        />
      )}

      {(scanMode === "camera" || scanMode === "countdown") &&
        scannerSettings.showFocusIndicator && (
          <FocusStateIndicator
            state={capabilities.hasFocus ? focusState : "unsupported"}
            modeLabel={scannerSettings.focusMode ? `Mode: ${scannerSettings.focusMode}` : undefined}
            focusDistanceMm={null}
          />
        )}

      {tapFocusFeedback?.visible && (scanMode === "camera" || scanMode === "countdown") && (
        <TapToFocusOverlay
          visible={tapFocusFeedback.visible}
          xPct={tapFocusFeedback.xPct}
          yPct={tapFocusFeedback.yPct}
          state={tapFocusFeedback.state}
        />
      )}

      {(scanMode === "camera" || scanMode === "countdown") &&
        scannerSettings.showObjectDetection && (
          <MultiObjectBadges
            detections={detections}
            selectedIndex={selectedIndex}
            onSelect={idx => {
              setSelectedIndex(idx);
              if (scannerSettings.trackingLockEnabled) {
                const maybeTrack = tracks[Math.max(0, Math.min(tracks.length - 1, idx))];
                setLockedTrackId(maybeTrack?.trackId ?? null);
              }
            }}
          />
        )}

      {scannerSettings.showPositioningGuide &&
        (scanMode === "camera" || scanMode === "countdown") && (
          <PositioningOverlay scanType={scanType} />
        )}

      {scannerSettings.showVirtualRuler && (scanMode === "camera" || scanMode === "countdown") && (
        <VirtualRulerOverlay unitSystem="cm" />
      )}

      {scannerSettings.showGhostOverlay && (scanMode === "camera" || scanMode === "countdown") && (
        <GhostOverlay previousImage={previousScanImage} opacity={30} />
      )}

      {scannerSettings.showEdgeDetection && (scanMode === "camera" || scanMode === "countdown") && (
        <EdgeDetectionOverlay intensity={60} />
      )}

      {showAngleMeasurement && <AngleMeasurementOverlay angle={detectedAngle} />}

      {scannerSettings.showObjectDetection &&
        (scanMode === "camera" || scanMode === "countdown") && (
          <>
            {scannerSettings.enableTracking ? (
              <ObjectTrackingVisualization
                tracks={tracks}
                selectedTrackId={resolvedSelectedTrackId}
                showTrails={scannerSettings.showMotionTrails}
                showIds={scannerSettings.showObjectIds}
              />
            ) : (
              <ObjectDetectionOverlay
                isActive={isActive}
                detections={detections}
                selectedIndex={selectedIndex}
                showDetectionConfidence={scannerSettings.showDetectionConfidence}
                showMeasurementGuides={scannerSettings.showMeasurementGuides}
                calibrationScale={calibrationData?.pixelsPerMm || 3.5}
                onDetection={detected => {
                  if (detected)
                    triggerHaptic("object_detected", { enabled: scannerSettings.hapticFeedback });
                }}
              />
            )}
          </>
        )}

      {/* Object masking overlay - masks non-selected objects */}
      {scannerSettings.enableMasking &&
        scannerSettings.enableTracking &&
        (scanMode === "camera" || scanMode === "countdown") && (
          <ObjectMaskingOverlay
            tracks={tracks}
            selectedTrackId={resolvedSelectedTrackId}
            maskingMode={scannerSettings.maskingMode}
            maskIntensity={scannerSettings.maskIntensity}
            showSelectionHighlight={autoTrack.isTracking}
          />
        )}

      {/* Landmark Curvature Overlay (4-point PMC10150132 method) */}
      {scannerSettings.showLandmarkCurvature &&
        landmarkCurvatureResult &&
        (scanMode === "complete" || capturedImage) && (
          <LandmarkCurvatureOverlay
            result={landmarkCurvatureResult}
            isActive={true}
            containerWidth={videoRef.current?.clientWidth || 400}
            containerHeight={videoRef.current?.clientHeight || 300}
            imageWidth={videoRef.current?.videoWidth || 400}
            imageHeight={videoRef.current?.videoHeight || 300}
            showClinicalNote={scannerSettings.showCurvatureClinicalNote}
            compact={false}
          />
        )}

      {scannerSettings.autoCapture && (scanMode === "camera" || scanMode === "countdown") && (
        <AutoCaptureIndicator status={autoCaptureStatus} onCancel={cancelAutoCapture} />
      )}

      {scannerSettings.showQualityIndicators &&
        (scanMode === "camera" || scanMode === "countdown") && (
          <QualityMeter
            lighting={lightingScore}
            stability={isStabilized ? 100 : 55}
            focus={focusOk ? 100 : focusState === "focusing" ? 70 : 55}
            distance={
              !scannerSettings.showDistanceIndicator
                ? 100
                : estimatedDistance > 0 && estimatedDistance >= 12 && estimatedDistance <= 18
                  ? 100
                  : 55
            }
            tilt={Math.max(0, Math.min(100, 100 - Math.max(Math.abs(tiltX), Math.abs(tiltY)) * 4))}
          />
        )}

      <CaptureFlashOverlay enabled={scannerSettings.enableCaptureFlash} nonce={captureFlashNonce} />

      <ScannerFrameOverlay scanMode={scanMode} />

      {scannerSettings.showStepGuide && (
        <ScannerFeedback
          isActive={isActive}
          isStabilized={isStabilized}
          scanMode={scanMode}
          onCapture={onCapture}
          brightness={brightness}
        />
      )}

      <AIAssistant
        isActive={["camera", "countdown", "scanning", "processing", "complete"].includes(scanMode)}
        currentPhase={
          scanMode === "countdown"
            ? "camera"
            : (scanMode as "idle" | "camera" | "scanning" | "complete")
        }
        isStabilized={isStabilized}
      />

      {showOverlaySettings && (
        <ScannerSettingsPanel
          settings={scannerSettings}
          onSettingsChange={onScannerSettingsChange}
          onClose={onCloseOverlaySettings}
        />
      )}

      {guidanceMessage && (
        <GuidanceMessage message={guidanceMessage.text} type={guidanceMessage.type} />
      )}

      {scanMode === "countdown" && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm z-30">
          <div className="text-8xl font-bold gradient-text animate-scale-in">{countdown}</div>
        </div>
      )}

      {scanMode === "idle" && !isActive && !error && (
        <div className="text-center z-10 animate-fade-in">
          <div className="w-24 h-24 mx-auto rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
            {scanType === "3d" ? (
              <Scan className="w-12 h-12 text-primary-foreground" />
            ) : (
              <Camera className="w-12 h-12 text-primary-foreground" />
            )}
          </div>
          <p className="text-foreground font-semibold mt-6 text-lg">
            Ready for {scanType.toUpperCase()} Scan
          </p>
          <p className="text-sm text-muted-foreground mt-1">Tap Start Camera to begin</p>
        </div>
      )}

      {(scanMode === "camera" || scanMode === "countdown") && !isActive && !error && (
        <div className="text-center z-10 animate-fade-in">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-background/40 border border-border/50 flex items-center justify-center shadow-lg backdrop-blur">
            <Camera className="w-12 h-12 text-muted-foreground" />
          </div>
          <p className="text-foreground font-semibold mt-6 text-lg">
            {isStarting ? "Starting camera…" : "Camera not started"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {isStarting ? "Approve the permission prompt if shown." : "Tap Start Camera to begin."}
          </p>
        </div>
      )}

      {error && (
        <div className="text-center z-10 p-6 animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-destructive font-medium">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {scanMode === "complete" && !capturedImage && (
        <div className="text-center z-10 animate-scale-in">
          <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <p className="text-success font-medium mt-4">Scan Complete</p>
        </div>
      )}

      <ScannerStatusBar
        visible={scannerSettings.showStatusBar}
        scanType={scanType}
        scanMode={scanMode}
        isStabilized={isStabilized}
        zoom={zoom}
        torchOn={torchOn}
        focusState={capabilities.hasFocus ? focusState : "unsupported"}
        detectionsCount={detections.length}
        aiStatus={scannerSettings.enableRealDetection ? detection.status : "idle"}
        qualityScore={qualityScore}
      />
    </div>
  );
}
