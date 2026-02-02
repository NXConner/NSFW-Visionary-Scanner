import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { CalibrationData, PointPercent } from "@/components/calibrationWizard/types";
import { calculateCalibrationMetrics } from "@/components/calibrationWizard/lib/calculation";
import { useCalibrationCamera } from "@/components/calibrationWizard/lib/camera";
import {
  Step2Capture,
  Step3MarkCorners,
  StepVerifyComplete,
  StepVerifyIntro,
  WizardHeader,
} from "@/components/calibrationWizard/components";
import { RotateCcw, ShieldCheck, Sparkles, X } from "lucide-react";

const TOTAL_STEPS = 4;

export function CalibrationVerifyWizard({
  isOpen,
  currentCalibration,
  onClose,
  onApplyUpdatedCalibration,
  onOpenFullRecalibration,
  videoRef,
}: {
  isOpen: boolean;
  currentCalibration: CalibrationData;
  onClose: () => void;
  onApplyUpdatedCalibration: (updated: CalibrationData) => void;
  onOpenFullRecalibration?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
}) {
  const [step, setStep] = useState(1);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cornerPoints, setCornerPoints] = useState<PointPercent[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedCalibration, setVerifiedCalibration] = useState<CalibrationData | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const internalVideoRef = useRef<HTMLVideoElement>(null);

  const progress = (step / TOTAL_STEPS) * 100;

  const { cameraActive, cameraError, startCamera, stopCamera } = useCalibrationCamera({
    isOpen,
    step,
    externalVideoRef: videoRef,
    internalVideoRef,
  });

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setCapturedImage(null);
      setCornerPoints([]);
      setIsVerifying(false);
      setVerifiedCalibration(null);
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
      toast.success("Captured. Mark the corners.");
    } else {
      toast.error("Camera not initialized");
    }
    window.setTimeout(() => setIsCapturing(false), 500);
  }, []);

  const onRetake = useCallback(() => {
    setCapturedImage(null);
    setCornerPoints([]);
    setVerifiedCalibration(null);
    setStep(2);
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

  const calculateVerification = useCallback(() => {
    if (cornerPoints.length !== 4) return;
    const img = imageRef.current;
    if (!img) return;
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;
    if (!imgW || !imgH) {
      toast.error("Image size unavailable");
      return;
    }

    setIsVerifying(true);

    const referenceWidth = currentCalibration.referenceWidth;
    const referenceHeight = currentCalibration.referenceHeight || currentCalibration.referenceWidth;

    const metrics = calculateCalibrationMetrics({
      cornerPointsPercent: cornerPoints as [PointPercent, PointPercent, PointPercent, PointPercent],
      imageWidthPx: imgW,
      imageHeightPx: imgH,
      referenceWidthMm: referenceWidth,
      referenceHeightMm: referenceHeight,
    });

    window.setTimeout(() => {
      const result: CalibrationData = {
        referenceType: currentCalibration.referenceType,
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
      setVerifiedCalibration(result);
      setIsVerifying(false);
      setStep(4);
    }, 750);
  }, [
    cornerPoints,
    currentCalibration.referenceHeight,
    currentCalibration.referenceType,
    currentCalibration.referenceWidth,
  ]);

  const canProceed = useMemo(() => {
    if (step === 1) return true;
    if (step === 2) return Boolean(capturedImage);
    if (step === 3) return cornerPoints.length === 4;
    return true;
  }, [capturedImage, cornerPoints.length, step]);

  const onBack = useCallback(() => {
    if (step > 1) setStep(step - 1);
    else onClose();
  }, [onClose, step]);

  const onNext = useCallback(() => {
    if (step === 3) {
      calculateVerification();
      return;
    }
    if (step === 2 && !capturedImage) return;
    if (step === 3 && cornerPoints.length < 4) return;
    if (step < 4) setStep(step + 1);
  }, [calculateVerification, capturedImage, cornerPoints.length, step]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto border-primary/20 shadow-2xl">
        <WizardHeader step={step} totalSteps={TOTAL_STEPS} progress={progress} onClose={onClose} />

        <CardContent className="p-6">
          <canvas ref={canvasRef} className="hidden" />

          {step === 1 ? <StepVerifyIntro current={currentCalibration} /> : null}

          {step === 2 ? (
            <Step2Capture
              titleObjectName="reference object"
              capturedImage={capturedImage}
              isCapturing={isCapturing}
              cameraActive={cameraActive}
              cameraError={cameraError}
              onCapture={captureImage}
              onRetake={onRetake}
              onStartCamera={() => void startCamera()}
              internalVideoRef={internalVideoRef}
            />
          ) : null}

          {step === 3 ? (
            <Step3MarkCorners
              capturedImage={capturedImage}
              imageRef={imageRef}
              cornerPoints={cornerPoints}
              onImageClick={handleImageClick}
              onResetCorners={() => setCornerPoints([])}
            />
          ) : null}

          {step === 4 ? (
            verifiedCalibration ? (
              <StepVerifyComplete current={currentCalibration} verified={verifiedCalibration} />
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No verification data.
              </div>
            )
          ) : null}
        </CardContent>

        {step < 4 ? (
          <CardFooter className="border-t border-border/50 flex justify-between">
            <Button variant="outline" onClick={onBack}>
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            <Button onClick={onNext} disabled={!canProceed || isVerifying}>
              {step === 3 ? (isVerifying ? "Verifying..." : "Verify") : "Next"}
            </Button>
          </CardFooter>
        ) : (
          <CardFooter className="border-t border-border/50 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={onRetake}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button variant="outline" className="flex-1" onClick={onClose}>
                <X className="w-4 h-4 mr-2" />
                Keep Current
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={() => {
                  if (!verifiedCalibration) return;
                  onApplyUpdatedCalibration(verifiedCalibration);
                  toast.success("Calibration updated");
                  onClose();
                }}
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Apply Update
              </Button>
            </div>

            {onOpenFullRecalibration ? (
              <>
                <Separator />
                <Button
                  variant="hero"
                  className="w-full"
                  onClick={() => {
                    onClose();
                    onOpenFullRecalibration();
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Full recalibration
                </Button>
              </>
            ) : null}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
