import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageUploadScan } from "@/components/ImageUploadScan";
import { ScanMode } from "@/components/scanner/types";
import {
  Activity,
  CheckCircle2,
  Crosshair,
  GraduationCap,
  RotateCcw,
  Scale,
  Shield,
  Timer,
  Video,
  VideoOff,
} from "lucide-react";

export function ScannerActionButtons({
  scanMode,
  error,
  timerDelay,
  isCalibrated,
  saveDisabled,
  saveDisabledReason,
  onOpenSaveBlockedHelp,
  onStartCamera,
  onReset,
  onCapture,
  onSave,
  onShowTutorial,
  onShowCalibration,
  isActive,
  isStarting,
}: {
  scanMode: ScanMode;
  error: string | null;
  timerDelay: number;
  isCalibrated: boolean;
  saveDisabled?: boolean;
  saveDisabledReason?: string | null;
  onOpenSaveBlockedHelp?: () => void;
  onStartCamera: () => void;
  onReset: () => void;
  onCapture: () => void;
  onSave: () => void;
  onShowTutorial: () => void;
  onShowCalibration: () => void;
  isActive: boolean;
  isStarting: boolean;
}) {
  return (
    <div className="p-6 space-y-4">
      {scanMode === "idle" && !error && (
        <div className="space-y-3">
          <Button
            variant="hero"
            className="w-full group"
            onClick={onStartCamera}
            disabled={isStarting}
          >
            <Video className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            {isStarting ? "Starting…" : "Start Camera"}
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <ImageUploadScan />

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onShowTutorial}>
              <GraduationCap className="w-4 h-4 mr-2" />
              Tutorial
            </Button>
            <Button
              variant={isCalibrated ? "outline" : "secondary"}
              className="flex-1"
              onClick={onShowCalibration}
            >
              <Scale className="w-4 h-4 mr-2" />
              {isCalibrated ? "Recalibrate" : "Calibrate"}
            </Button>
          </div>

          <Badge
            variant="outline"
            className={
              isCalibrated
                ? "w-full justify-center bg-success/10 border-success/30 text-success"
                : "w-full justify-center bg-warning/10 border-warning/30 text-warning"
            }
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {isCalibrated
              ? "Calibrated for accurate measurements"
              : "Not calibrated — auto length will be limited"}
          </Badge>
        </div>
      )}

      {(scanMode === "camera" || scanMode === "countdown") && (
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onReset}>
            <VideoOff className="w-5 h-5 mr-2" />
            Cancel
          </Button>
          <Button
            variant="hero"
            className="flex-1 group"
            onClick={onCapture}
            disabled={scanMode === "countdown" || isStarting || !isActive}
          >
            {timerDelay > 0 ? (
              <>
                <Timer className="w-5 h-5 mr-2" />
                Capture ({timerDelay}s)
              </>
            ) : (
              <>
                <Crosshair className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Capture
              </>
            )}
          </Button>
        </div>
      )}

      {(scanMode === "scanning" || scanMode === "processing") && (
        <Button variant="hero" className="w-full" disabled>
          <Activity className="w-5 h-5 mr-2 animate-pulse" />
          {scanMode === "scanning" ? "Analyzing..." : "Processing..."}
        </Button>
      )}

      {scanMode === "complete" && (
        <div className="space-y-3">
          {saveDisabled && saveDisabledReason ? (
            <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-warning/10 border border-warning/20">
              <Shield className="w-4 h-4 mt-0.5 text-warning flex-shrink-0" />
              <div className="min-w-0">
                <div className="font-medium text-warning">Saving blocked by policy</div>
                <div className="mt-0.5">{saveDisabledReason}</div>
                {onOpenSaveBlockedHelp ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={onOpenSaveBlockedHelp}
                  >
                    Open NSFW Scanner Settings
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onReset}>
              <RotateCcw className="w-5 h-5 mr-2" />
              New Scan
            </Button>
            <Button
              variant="hero"
              className="flex-1"
              onClick={onSave}
              disabled={Boolean(saveDisabled)}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Save Results
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-success/5 border border-success/20">
        <Shield className="w-4 h-4 mt-0.5 text-success flex-shrink-0" />
        <span>AES-256 encrypted. All data stored locally. Works offline.</span>
      </div>
    </div>
  );
}
