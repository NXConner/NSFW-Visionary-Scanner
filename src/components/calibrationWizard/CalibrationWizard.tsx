import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

import type {
  CalibrationData,
  CalibrationWizardProps,
  PointPercent,
  ReferenceType,
} from "@/components/calibrationWizard/types";
import {
  getReferenceDimensions,
  referenceObjects,
} from "@/components/calibrationWizard/lib/referenceObjects";
import { calculateCalibrationMetrics } from "@/components/calibrationWizard/lib/calculation";
import { useCalibrationCamera } from "@/components/calibrationWizard/lib/camera";
import {
  Step1ReferenceSelect,
  Step2Capture,
  Step3MarkCorners,
  Step4Complete,
  WizardFooter,
  WizardHeader,
} from "@/components/calibrationWizard/components";

const TOTAL_STEPS = 4;

export const CalibrationWizard = ({
  isOpen,
  onClose,
  onCalibrationComplete,
  videoRef: externalVideoRef,
}: CalibrationWizardProps) => {
  const [step, setStep] = useState(1);
  const [referenceType, setReferenceType] = useState<ReferenceType>("credit-card");
  const [customWidth, setCustomWidth] = useState(50);
  const [customHeight, setCustomHeight] = useState(30);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cornerPoints, setCornerPoints] = useState<PointPercent[]>([]);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationResult, setCalibrationResult] = useState<CalibrationData | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const internalVideoRef = useRef<HTMLVideoElement>(null);

  const progress = (step / TOTAL_STEPS) * 100;

  const referenceDimensions = useMemo(
    () => getReferenceDimensions({ referenceType, customWidth, customHeight }),
    [referenceType, customWidth, customHeight],
  );

  const { cameraActive, cameraError, startCamera, stopCamera } = useCalibrationCamera({
    isOpen,
    step,
    externalVideoRef,
    internalVideoRef,
  });

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setCapturedImage(null);
      setCornerPoints([]);
      setCalibrationResult(null);
      setIsCalibrating(false);
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  const captureImage = useCallback(() => {
    const video = internalVideoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      toast.error("Camera not ready");
      return;
    }

    setIsCapturing(true);
    const ctx = canvas.getContext("2d");
    if (ctx && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      setCapturedImage(canvas.toDataURL("image/jpeg", 0.95));
      setCornerPoints([]);
      toast.success("Image captured! Mark the corners.");
    } else {
      toast.error("Camera not initialized");
    }

    setTimeout(() => setIsCapturing(false), 500);
  }, []);

  const onRetake = useCallback(() => {
    setCapturedImage(null);
    void startCamera();
  }, [startCamera]);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (cornerPoints.length >= 4) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setCornerPoints([...cornerPoints, { x, y }]);
    },
    [cornerPoints],
  );

  const calculateCalibration = useCallback(() => {
    if (cornerPoints.length !== 4) return;
    const img = imageRef.current;
    if (!img) return;

    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;
    if (!imgW || !imgH) {
      toast.error("Image size unavailable");
      return;
    }

    setIsCalibrating(true);
    const referenceWidth = referenceDimensions.width;
    const referenceHeight = referenceDimensions.height || referenceDimensions.width;

    const metrics = calculateCalibrationMetrics({
      cornerPointsPercent: cornerPoints as [PointPercent, PointPercent, PointPercent, PointPercent],
      imageWidthPx: imgW,
      imageHeightPx: imgH,
      referenceWidthMm: referenceWidth,
      referenceHeightMm: referenceHeight,
    });

    setTimeout(() => {
      const result: CalibrationData = {
        referenceType,
        referenceWidth,
        referenceHeight,
        pixelsPerMm: metrics.pixelsPerMm,
        isCalibrated: true,
        calibrationDate: new Date(),
        calibrationConfidence: metrics.confidence,
        calibrationDiagnostics: {
          pixelsPerMmWidth: metrics.pixelsPerMmWidth,
          pixelsPerMmHeight: metrics.pixelsPerMmHeight,
          skewPercent: metrics.skewPercent,
          avgWidthPx: metrics.avgWidthPx,
          avgHeightPx: metrics.avgHeightPx,
        },
      };
      setCalibrationResult(result);
      setIsCalibrating(false);
      setStep(4);
    }, 900);
  }, [cornerPoints, referenceDimensions.height, referenceDimensions.width, referenceType]);

  const canProceed = useMemo(() => {
    if (step === 1) return true;
    if (step === 2) return !!capturedImage;
    if (step === 3) return cornerPoints.length === 4;
    return true;
  }, [capturedImage, cornerPoints.length, step]);

  const onBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onClose();
    }
  }, [onClose, step]);

  const onNext = useCallback(() => {
    if (step === 3) {
      calculateCalibration();
      return;
    }
    if (step === 2 && !capturedImage) return;
    if (step === 3 && cornerPoints.length < 4) return;
    if (step < 4) setStep(step + 1);
  }, [calculateCalibration, capturedImage, cornerPoints.length, step]);

  const onDone = useCallback(() => {
    if (calibrationResult) onCalibrationComplete(calibrationResult);
    onClose();
  }, [calibrationResult, onCalibrationComplete, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto border-primary/20 shadow-2xl">
        <WizardHeader step={step} totalSteps={TOTAL_STEPS} progress={progress} onClose={onClose} />

        <CardContent className="p-6">
          <canvas ref={canvasRef} className="hidden" />

          {step === 1 && (
            <Step1ReferenceSelect
              referenceType={referenceType}
              setReferenceType={setReferenceType}
              customWidth={customWidth}
              setCustomWidth={setCustomWidth}
              customHeight={customHeight}
              setCustomHeight={setCustomHeight}
            />
          )}

          {step === 2 && (
            <Step2Capture
              titleObjectName={referenceObjects[referenceType].name.toLowerCase()}
              capturedImage={capturedImage}
              isCapturing={isCapturing}
              cameraActive={cameraActive}
              cameraError={cameraError}
              onCapture={captureImage}
              onRetake={onRetake}
              onStartCamera={() => void startCamera()}
              internalVideoRef={internalVideoRef}
            />
          )}

          {step === 3 && (
            <Step3MarkCorners
              capturedImage={capturedImage}
              imageRef={imageRef}
              cornerPoints={cornerPoints}
              onImageClick={handleImageClick}
              onResetCorners={() => setCornerPoints([])}
            />
          )}

          {step === 4 && (
            <Step4Complete
              isCalibrating={isCalibrating}
              calibrationResult={calibrationResult}
              referenceType={referenceType}
            />
          )}
        </CardContent>

        <WizardFooter
          step={step}
          canProceed={canProceed}
          onBack={onBack}
          onNext={onNext}
          onDone={onDone}
        />
      </Card>
    </div>
  );
};

export default CalibrationWizard;
