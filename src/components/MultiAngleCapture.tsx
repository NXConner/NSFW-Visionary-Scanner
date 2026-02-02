import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Camera, RotateCw, CheckCircle2, AlertCircle, ChevronRight, Layers } from "lucide-react";

interface CapturedAngle {
  id: string;
  angle: string;
  image: string;
  timestamp: Date;
  quality: number;
}

interface MultiAngleCaptureProps {
  isActive: boolean;
  onCapture: (image: string, angle: string) => void;
  onComplete: (captures: CapturedAngle[]) => void;
  onCancel: () => void;
}

const REQUIRED_ANGLES = [
  { id: "front", label: "Front View", description: "Straight-on frontal capture", icon: "📷" },
  { id: "left", label: "Left Side", description: "Turn 90° counter-clockwise", icon: "⬅️" },
  { id: "right", label: "Right Side", description: "Turn 90° clockwise", icon: "➡️" },
  { id: "top", label: "Top View", description: "Camera above, looking down", icon: "⬆️" },
];

export const MultiAngleCapture = ({
  isActive,
  onCapture,
  onComplete,
  onCancel,
}: MultiAngleCaptureProps) => {
  const [captures, setCaptures] = useState<CapturedAngle[]>([]);
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);

  const currentAngle = REQUIRED_ANGLES[currentAngleIndex];
  const progress = (captures.length / REQUIRED_ANGLES.length) * 100;

  const handleCapture = useCallback(
    (imageData: string) => {
      setIsCapturing(true);

      // Simulate quality analysis
      setTimeout(() => {
        const quality = 70 + Math.random() * 30;
        const newCapture: CapturedAngle = {
          id: currentAngle.id,
          angle: currentAngle.label,
          image: imageData,
          timestamp: new Date(),
          quality,
        };

        setCaptures(prev => [...prev, newCapture]);
        onCapture(imageData, currentAngle.id);

        if (currentAngleIndex < REQUIRED_ANGLES.length - 1) {
          setCurrentAngleIndex(prev => prev + 1);
        }

        setIsCapturing(false);
      }, 500);
    },
    [currentAngle, currentAngleIndex, onCapture],
  );

  const handleComplete = () => {
    if (captures.length >= REQUIRED_ANGLES.length) {
      onComplete(captures);
    }
  };

  const handleRetake = (index: number) => {
    setCaptures(prev => prev.filter((_, i) => i !== index));
    setCurrentAngleIndex(index);
  };

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-background/95 backdrop-blur-xl"
    >
      <div className="h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Multi-Angle Capture
            </h3>
            <p className="text-sm text-muted-foreground">
              Capture from multiple angles for 3D reconstruction
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {captures.length}/{REQUIRED_ANGLES.length} angles
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current angle instruction */}
        <Card variant="glass" className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <motion.div
                key={currentAngleIndex}
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="text-4xl"
              >
                {currentAngle?.icon}
              </motion.div>
              <div className="flex-1">
                <h4 className="font-semibold text-primary">{currentAngle?.label}</h4>
                <p className="text-sm text-muted-foreground">{currentAngle?.description}</p>
              </div>
              {captures.length >= REQUIRED_ANGLES.length ? (
                <Badge variant="default" className="bg-success text-success-foreground">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              ) : (
                <Badge variant="outline">
                  Step {currentAngleIndex + 1}/{REQUIRED_ANGLES.length}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Capture preview grid */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {REQUIRED_ANGLES.map((angle, index) => {
            const capture = captures.find(c => c.id === angle.id);
            const isCurrent = index === currentAngleIndex && !capture;

            return (
              <motion.div
                key={angle.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  relative aspect-square rounded-xl overflow-hidden border-2 transition-all
                  ${
                    isCurrent
                      ? "border-primary ring-2 ring-primary/30"
                      : capture
                        ? "border-success/50"
                        : "border-border/50"
                  }
                `}
              >
                {capture ? (
                  <>
                    <img
                      src={capture.image}
                      alt={angle.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="flex items-center justify-between">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span className="text-[10px] text-white font-medium">
                          {capture.quality.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRetake(index)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                    >
                      <RotateCw className="w-3 h-3 text-white" />
                    </button>
                  </>
                ) : (
                  <div
                    className={`
                    w-full h-full flex flex-col items-center justify-center
                    ${isCurrent ? "bg-primary/10" : "bg-muted/30"}
                  `}
                  >
                    <span className="text-lg">{angle.icon}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {angle.label.split(" ")[0]}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Camera viewfinder placeholder */}
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-black/50 border border-border/50 mb-4">
          <div className="absolute inset-0 flex items-center justify-center">
            {isCapturing ? (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Analyzing quality...</p>
              </motion.div>
            ) : (
              <div className="text-center">
                <Camera className="w-12 h-12 text-muted-foreground mb-2 mx-auto" />
                <p className="text-sm text-muted-foreground">Camera preview</p>
              </div>
            )}
          </div>

          {/* AR overlay guides */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="guideGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.5" />
              </linearGradient>
            </defs>

            {/* Corner guides */}
            <path
              d="M 20 60 L 20 20 L 60 20"
              fill="none"
              stroke="url(#guideGradient)"
              strokeWidth="2"
            />
            <path
              d="M 60 100% L 20 100% L 20 calc(100% - 40)"
              fill="none"
              stroke="url(#guideGradient)"
              strokeWidth="2"
              transform="translate(0, -20)"
            />
            <path
              d="M 100% 60 L 100% 20 L calc(100% - 40) 20"
              fill="none"
              stroke="url(#guideGradient)"
              strokeWidth="2"
              transform="translate(-20, 0)"
            />
            <path
              d="M calc(100% - 60) 100% L 100% 100% L 100% calc(100% - 40)"
              fill="none"
              stroke="url(#guideGradient)"
              strokeWidth="2"
              transform="translate(-20, -20)"
            />
          </svg>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {captures.length >= REQUIRED_ANGLES.length ? (
            <Button variant="hero" className="flex-1" onClick={handleComplete}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete Scan
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant="hero"
              className="flex-1"
              onClick={() => handleCapture("data:image/jpeg;base64,placeholder")}
              disabled={isCapturing}
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture {currentAngle?.label}
            </Button>
          )}
        </div>

        {/* Quality tips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/50"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
            <div>
              <p className="text-xs font-medium">Capture Tips</p>
              <p className="text-xs text-muted-foreground">
                Keep consistent distance and lighting between angles for best 3D reconstruction
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
