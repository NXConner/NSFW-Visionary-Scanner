import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useCamera } from "@/hooks/useCamera";
import { useData } from "@/contexts/DataContext";
import { AIAssistant } from "@/components/AIAssistant";
import { ImageUploadScan } from "@/components/ImageUploadScan";
import {
  ScannerFeedback,
  PositioningOverlay,
  AngleMeasurementOverlay,
  GuidanceMessage,
} from "@/components/ScannerFeedback";
import {
  ScannerSettingsPanel,
  DistanceIndicator,
  TiltIndicator,
  EdgeDetectionOverlay,
  GhostOverlay,
  VirtualRulerOverlay,
  AutoCaptureIndicator,
  QualityMeter,
} from "@/components/ScannerOverlays";
import type { ScannerSettings } from "@/components/scannerOverlays/types";
import { CalibrationWizard } from "@/components/CalibrationWizard";
import { CalibrationVerifyWizard } from "@/components/CalibrationVerifyWizard";
import type { CalibrationData } from "@/components/calibrationWizard/types";
import { ScannerTutorial } from "@/components/ScannerTutorial";
import { ObjectDetectionOverlay } from "@/components/ObjectDetectionOverlay";
import { LightingQuality } from "@/components/LightingQuality";
import { MeasurementConfidence } from "@/components/MeasurementConfidence";
import { AIScanAnalysisPanel } from "@/components/AIScanAnalysisPanel";
import { useAIScanAnalysis } from "@/hooks/useAIScanAnalysis";
import { VisualContentDisplay } from "@/components/VisualContentDisplay";
import { useVisualContent } from "@/hooks/useVisualContent";
import { VISUAL_CONTENT_CATEGORIES } from "@/lib/visualContentManager";
import { triggerHaptic } from "@/lib/hapticFeedback";
import { ScannerBackgroundEffects } from "@/components/scanner/ScannerBackgroundEffects";
import { ScannerHeaderBlock } from "@/components/scanner/ScannerHeaderBlock";
import { ScannerSidePanel } from "@/components/scanner/ScannerSidePanel";
import { ScannerViewCard } from "@/components/scanner/ScannerViewCard";
import { ScanMode, GridMode, MeasurementResult } from "@/components/scanner/types";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useNsfwScannerAddon } from "@/addons/nsfw-scanner/hooks/useNsfwScannerAddon";
import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";
import type { NsfwDetectionResult } from "@/addons/nsfw-scanner/scanner/types";
import { useAdvancedNsfwDetectionAddon } from "@/addons/nsfw-advanced-detection/hooks/useAdvancedNsfwDetectionAddon";
import { recordAdvancedNsfwDetection } from "@/addons/nsfw-advanced-detection/lib/recordDetection";
import { appendAuditLogEntry } from "@/lib/auditLogStorage";
import { useScannerCaptureFlow } from "@/components/scannerSection/useScannerCaptureFlow";
import {
  fromCalibrationWizardData,
  isCalibrationStale,
  loadCalibrationProfile,
  saveCalibrationProfile,
  toCalibrationWizardData,
} from "@/scanner/calibration";
import { usePersistentScannerSettings } from "@/scanner/ui/hooks";
import {
  Camera,
  Ruler,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Target,
  RotateCcw,
  Shield,
  Scan,
  CircleDot,
  Video,
  VideoOff,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Flashlight,
  Timer,
  Focus,
  Maximize2,
  Settings2,
  Crosshair,
  SunMedium,
  Contrast,
  RotateCw,
  Eye,
  Sparkles,
  Sliders,
  GraduationCap,
  Scale,
  Columns,
  Square,
} from "lucide-react";

export const ScannerSection = () => {
  const premiumMesh = useFeatureFlag("premium_mesh");
  const premiumParticles = useFeatureFlag("premium_particles");
  const [scanMode, setScanMode] = useState<ScanMode>("idle");
  const [scanType, setScanType] = useState<"3d" | "2d">("3d");
  const [measurements, setMeasurements] = useState<MeasurementResult>({
    length: 0,
    circumference: 0,
    curvatureAngle: 0,
    curvatureDirection: "",
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [rawCapturedImage, setRawCapturedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [gridMode, setGridMode] = useState<GridMode>("none");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [countdown, setCountdown] = useState(0);
  const [timerDelay, setTimerDelay] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [guidanceMessage, setGuidanceMessage] = useState<{
    text: string;
    type: "info" | "success" | "warning" | "error";
  } | null>(null);
  const [showPositioning, setShowPositioning] = useState(true);
  const [showAngleMeasurement, setShowAngleMeasurement] = useState(false);
  const [detectedAngle, setDetectedAngle] = useState(0);
  const [showOverlaySettings, setShowOverlaySettings] = useState(false);
  const [scannerSettings, setScannerSettings] = usePersistentScannerSettings();
  const [previousScanImage, setPreviousScanImage] = useState<string | null>(null);
  const [nsfwDetection, setNsfwDetection] = useState<NsfwDetectionResult | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [showCalibrationVerify, setShowCalibrationVerify] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [confidenceContext, setConfidenceContext] = useState("");
  const [isFullWidthScanner, setIsFullWidthScanner] = useState(false);
  const [captureFlashNonce, setCaptureFlashNonce] = useState(0);

  const {
    videoRef,
    canvasRef,
    isActive,
    isStarting,
    error,
    startCamera,
    stopCamera,
    captureImageAsync,
    captureImageBlobAsync,
    getVideoTrack,
    focusState,
    tapFocusFeedback,
    setFocusMode,
    setFocusDistance,
    tapToFocus,
    setTorch,
    setZoomFactor,
  } = useCamera();
  const { saveScan } = useData();
  const {
    analyzeImage,
    isAnalyzing,
    result: aiAnalysisResult,
    reset: resetAIAnalysis,
  } = useAIScanAnalysis();

  const nsfwScanner = useNsfwScannerAddon();
  const advancedNsfwDetection = useAdvancedNsfwDetectionAddon();

  // Load visual content for scanner positioning guides
  const { content: scannerVisuals } = useVisualContent({
    categories: [VISUAL_CONTENT_CATEGORIES.TUTORIALS, VISUAL_CONTENT_CATEGORIES.MEASUREMENT],
    autoLoad: true,
    autoInvert: true,
  });

  const { performCapture } = useScannerCaptureFlow({
    brightness,
    contrast,
    scannerSettings,
    calibrationData,
    captureImageBlobAsync: async opts => {
      const res = await captureImageBlobAsync({
        maxWidth: opts?.maxWidth,
        maxHeight: opts?.maxHeight,
        quality: opts?.quality,
      });
      if (!res) return null;
      return { blob: res.blob, width: res.width, height: res.height, mimeType: res.mimeType };
    },
    captureImageAsync,
    stopCamera,
    analyzeImage,
    nsfwPolicy: nsfwScanner.policy,
    setRawCapturedImage,
    setCapturedImage,
    setNsfwDetection,
    setScanMode,
    setGuidanceMessage,
    setMeasurements,
    setConfidenceScore,
    setConfidenceContext,
    setShowAngleMeasurement,
    setDetectedAngle,
    setCaptureFlashNonce,
  });

  // Load saved calibration profile (per-device) on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const profile = await loadCalibrationProfile();
      if (!profile || cancelled) return;
      const data = toCalibrationWizardData(profile);
      setCalibrationData(data);
      setIsCalibrated(Boolean(data.pixelsPerMm) && data.pixelsPerMm > 0);
      if (isCalibrationStale(profile, 60)) {
        toast.message("Calibration is older than 60 days", {
          description: "For best accuracy, recalibrate from the Scanner screen.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sensor + auto-capture logic moved into ScannerTelemetryProvider (inside ScannerViewCard)

  // Apply focus settings while camera is active
  useEffect(() => {
    if (!(scanMode === "camera" || scanMode === "countdown")) return;
    void setFocusMode(scannerSettings.focusMode);
    if (scannerSettings.focusMode === "manual") {
      void setFocusDistance(scannerSettings.focusDistance);
    }
  }, [
    scanMode,
    scannerSettings.focusMode,
    scannerSettings.focusDistance,
    setFocusMode,
    setFocusDistance,
  ]);

  // Best-effort: sync zoom slider to camera zoom when supported
  useEffect(() => {
    if (!(scanMode === "camera" || scanMode === "countdown")) return;
    void setZoomFactor(zoom);
  }, [scanMode, zoom, setZoomFactor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && scanMode === "countdown") {
      performCapture();
    }
  }, [countdown, scanMode, performCapture]);

  const handleStartCamera = async () => {
    // Give immediate UI feedback and prevent repeated clicks.
    if (scanMode !== "idle") return;
    setGuidanceMessage({ text: "Starting camera…", type: "info" });
    setScanMode("camera");
    const res = await startCamera();
    if (!res.ok) {
      // Revert to idle so the primary CTA returns; error panel will also explain what happened.
      setScanMode("idle");
      setGuidanceMessage(null);
      toast.error("Camera error", { description: (res as { ok: false; error: string }).error });
      return;
    }

    setGuidanceMessage({ text: "Position subject within the guide frame", type: "info" });
    toast.success("Camera Active", { description: "Follow the on-screen guide" });

    // Clear guidance after 3 seconds
    setTimeout(() => setGuidanceMessage(null), 3000);
  };

  const handleTimerCapture = () => {
    if (timerDelay > 0) {
      setCountdown(timerDelay);
      setScanMode("countdown");
      setGuidanceMessage({ text: `Capturing in ${timerDelay} seconds...`, type: "info" });
    } else {
      performCapture();
    }
  };

  let saveBlockedReason: string | null = null;
  if (
    nsfwDetection?.label === "explicit" &&
    nsfwScanner.policy.enabled &&
    !nsfwScanner.policy.allowExplicit
  ) {
    saveBlockedReason = BUILD_ALLOW_ADULT_BUNDLE
      ? "Explicit content was detected and your scanner policy disallows saving. Enable “Allow explicit saves” in Settings → Scanner DLC to proceed."
      : "Saving is blocked by your policy settings.";
  }

  const openNsfwScannerSettings = useCallback(() => {
    window.dispatchEvent(new CustomEvent("navigate-tab", { detail: "settings" }));
  }, []);

  const handleSaveScan = async () => {
    if (saveBlockedReason) {
      toast.error("Saving blocked by policy", { description: saveBlockedReason });
      await appendAuditLogEntry({
        action: "Scan save blocked by policy",
        category: "scan",
        details: "Explicit content detected; save blocked by user policy.",
        metadata: {
          model: nsfwDetection?.model ?? "nsfwjs",
          label: nsfwDetection?.label ?? "unknown",
          confidence: nsfwDetection?.confidence ?? 0,
        },
      });
      return;
    }
    if (measurements.length <= 0 || measurements.circumference <= 0) {
      toast.error("Enter length and circumference before saving.");
      return;
    }
    const saved = await saveScan({
      scan_type: scanType,
      length: measurements.length,
      circumference: measurements.circumference,
      curvature_angle: measurements.curvatureAngle,
      curvature_direction: measurements.curvatureDirection,
      image_data: capturedImage,
      notes: null,
      content_classification:
        nsfwScanner.policy.enabled &&
        nsfwScanner.policy.storeClassificationMetadata &&
        nsfwDetection &&
        nsfwDetection.label !== "unknown"
          ? {
              label: nsfwDetection.label,
              confidence: nsfwDetection.confidence,
              model: nsfwDetection.model,
            }
          : null,
    });

    // Optional: advanced detection history logging (opt-in; never stores image)
    if (nsfwDetection) {
      void recordAdvancedNsfwDetection({
        scanId: saved.id,
        detection: nsfwDetection,
        policy: advancedNsfwDetection.policy,
        thresholds: {
          explicitThreshold: nsfwScanner.policy.explicitThreshold,
          suggestiveThreshold: nsfwScanner.policy.suggestiveThreshold,
        },
      });
    }

    // Store for ghost overlay (prefer raw image so overlay aligns with capture)
    if (rawCapturedImage) {
      setPreviousScanImage(rawCapturedImage);
    }

    if (scannerSettings.hapticFeedback && navigator.vibrate) navigator.vibrate(100);
    toast.success("Saved to Health Diary!", { description: "Data encrypted & stored locally" });
  };

  const resetScan = () => {
    stopCamera();
    setScanMode("idle");
    setCapturedImage(null);
    setRawCapturedImage(null);
    setMeasurements({ length: 0, circumference: 0, curvatureAngle: 0, curvatureDirection: "" });
    setConfidenceScore(0);
    setConfidenceContext("");
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setCountdown(0);
    setGuidanceMessage(null);
    setShowAngleMeasurement(false);
    setDetectedAngle(0);
    setNsfwDetection(null);
    resetAIAnalysis();
  };

  const cycleGridMode = () => {
    setGridMode(prev =>
      prev === "none"
        ? "measure"
        : prev === "measure"
          ? "thirds"
          : prev === "thirds"
            ? "center"
            : "none",
    );
  };

  const toggleTorch = async () => {
    try {
      const ok = await setTorch(!torchOn);
      if (ok) setTorchOn(!torchOn);
      else toast.error("Torch not available on this device");
    } catch (e) {
      toast.error("Torch not available on this device");
    }
  };

  return (
    <section className="min-h-screen px-4 py-20 relative">
      <canvas ref={canvasRef} className="hidden" />

      {/* Background effects */}
      <ScannerBackgroundEffects
        premiumMesh={premiumMesh}
        premiumParticles={premiumParticles}
        paused={scanMode === "camera" || scanMode === "countdown" || scanMode === "processing"}
      />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <ScannerHeaderBlock scanMode={scanMode} scannerVisuals={scannerVisuals} />

        <div
          className={`grid gap-8 ${isFullWidthScanner ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[3fr_2fr]"}`}
        >
          {/* Scanner View */}
          <ScannerViewCard
            scanMode={scanMode}
            scanType={scanType}
            setScanType={setScanType}
            isFullWidthScanner={isFullWidthScanner}
            toggleFullWidth={() => setIsFullWidthScanner(v => !v)}
            videoRef={videoRef}
            isActive={isActive}
            isStarting={isStarting}
            error={error}
            capturedImage={capturedImage}
            zoom={zoom}
            setZoom={setZoom}
            gridMode={gridMode}
            onCycleGridMode={cycleGridMode}
            brightness={brightness}
            setBrightness={setBrightness}
            contrast={contrast}
            setContrast={setContrast}
            showSettings={showSettings}
            toggleShowSettings={() => setShowSettings(v => !v)}
            showOverlaySettings={showOverlaySettings}
            openOverlaySettings={() => setShowOverlaySettings(true)}
            closeOverlaySettings={() => setShowOverlaySettings(false)}
            scannerSettings={scannerSettings}
            setScannerSettings={setScannerSettings}
            previousScanImage={previousScanImage}
            showAngleMeasurement={showAngleMeasurement}
            detectedAngle={detectedAngle}
            calibrationData={calibrationData}
            guidanceMessage={guidanceMessage}
            countdown={countdown}
            torchOn={torchOn}
            toggleTorch={toggleTorch}
            getVideoTrack={getVideoTrack}
            focusState={focusState}
            tapFocusFeedback={tapFocusFeedback}
            onTapToFocus={(xNorm, yNorm, viewPoint) => {
              void tapToFocus(xNorm, yNorm, viewPoint);
            }}
            captureFlashNonce={captureFlashNonce}
            timerDelay={timerDelay}
            setTimerDelay={setTimerDelay}
            isCalibrated={isCalibrated}
            saveDisabled={Boolean(saveBlockedReason)}
            saveDisabledReason={saveBlockedReason}
            onOpenSaveBlockedHelp={openNsfwScannerSettings}
            onStartCamera={handleStartCamera}
            onReset={resetScan}
            onCapture={handleTimerCapture}
            onAutoCaptureNow={performCapture}
            onSave={handleSaveScan}
            onShowTutorial={() => setShowTutorial(true)}
            onShowCalibration={() => setShowCalibration(true)}
          />

          {/* Results & Options Panel */}
          <ScannerSidePanel
            scanMode={scanMode}
            measurements={measurements}
            onMeasurementsChange={setMeasurements}
            confidenceScore={confidenceScore}
            confidenceContext={confidenceContext}
            isAnalyzing={isAnalyzing}
            aiAnalysisResult={aiAnalysisResult}
            nsfwDetection={nsfwDetection}
            nsfwPolicy={nsfwScanner.policy}
            isCalibrated={isCalibrated}
            calibrationSummary={
              calibrationData?.pixelsPerMm
                ? `Reference: ${calibrationData.referenceWidth}mm × ${calibrationData.referenceHeight}mm · ${calibrationData.pixelsPerMm.toFixed(
                    3,
                  )} px/mm`
                : null
            }
            calibrationConfidence={calibrationData?.calibrationConfidence ?? null}
            calibrationSkewPercent={calibrationData?.calibrationDiagnostics?.skewPercent ?? null}
            onOpenCalibration={() => setShowCalibration(true)}
            onVerifyCalibration={
              isCalibrated && calibrationData ? () => setShowCalibrationVerify(true) : undefined
            }
          />
        </div>
      </div>

      {/* Tutorial Modal */}
      <ScannerTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={() => {
          toast.success("Tutorial completed!", { description: "You're ready to start scanning" });
        }}
      />

      {/* Calibration Wizard */}
      <CalibrationWizard
        isOpen={showCalibration}
        onClose={() => setShowCalibration(false)}
        onCalibrationComplete={data => {
          setCalibrationData(data);
          setIsCalibrated(true);
          void saveCalibrationProfile(fromCalibrationWizardData({ data }));
          toast.success("Calibration successful!", {
            description: `Reference: ${data.referenceWidth}mm × ${data.referenceHeight}mm`,
          });
        }}
        videoRef={videoRef}
      />

      {/* Calibration Verify Wizard */}
      {calibrationData ? (
        <CalibrationVerifyWizard
          isOpen={showCalibrationVerify}
          currentCalibration={calibrationData}
          onClose={() => setShowCalibrationVerify(false)}
          onOpenFullRecalibration={() => setShowCalibration(true)}
          onApplyUpdatedCalibration={updated => {
            setCalibrationData(updated);
            setIsCalibrated(Boolean(updated.pixelsPerMm) && updated.pixelsPerMm > 0);
            void saveCalibrationProfile(fromCalibrationWizardData({ data: updated }));
          }}
          videoRef={videoRef}
        />
      ) : null}
    </section>
  );
};
