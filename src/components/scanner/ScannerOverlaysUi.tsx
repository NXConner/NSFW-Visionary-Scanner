import { ScanMode, GridMode } from "@/components/scanner/types";
import { Activity } from "lucide-react";

export function ScannerGridOverlay({ gridMode }: { gridMode: GridMode }) {
  if (gridMode === "none") return null;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.4 }}>
      {gridMode === "thirds" && (
        <>
          <line
            x1="33.33%"
            y1="0"
            x2="33.33%"
            y2="100%"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
          />
          <line
            x1="66.66%"
            y1="0"
            x2="66.66%"
            y2="100%"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1="33.33%"
            x2="100%"
            y2="33.33%"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1="66.66%"
            x2="100%"
            y2="66.66%"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
          />
        </>
      )}
      {gridMode === "center" && (
        <>
          <line x1="50%" y1="40%" x2="50%" y2="60%" stroke="hsl(var(--primary))" strokeWidth="2" />
          <line x1="40%" y1="50%" x2="60%" y2="50%" stroke="hsl(var(--primary))" strokeWidth="2" />
          <circle
            cx="50%"
            cy="50%"
            r="10%"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        </>
      )}
      {gridMode === "measure" && (
        <>
          <defs>
            <pattern id="measureGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#measureGrid)" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="hsl(var(--accent))" strokeWidth="1" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="hsl(var(--accent))" strokeWidth="1" />
        </>
      )}
    </svg>
  );
}

export function ScannerFrameOverlay({ scanMode }: { scanMode: ScanMode }) {
  return (
    <div className="absolute inset-8 pointer-events-none">
      {/* Animated corners */}
      <div className="absolute -top-1 -left-1 w-10 h-10">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-transparent" />
        <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-primary to-transparent" />
      </div>
      <div className="absolute -top-1 -right-1 w-10 h-10">
        <div className="absolute top-0 right-0 w-full h-0.5 bg-gradient-to-l from-primary to-transparent" />
        <div className="absolute top-0 right-0 w-0.5 h-full bg-gradient-to-b from-primary to-transparent" />
      </div>
      <div className="absolute -bottom-1 -left-1 w-10 h-10">
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-transparent" />
        <div className="absolute bottom-0 left-0 w-0.5 h-full bg-gradient-to-t from-primary to-transparent" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-10 h-10">
        <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-l from-primary to-transparent" />
        <div className="absolute bottom-0 right-0 w-0.5 h-full bg-gradient-to-t from-primary to-transparent" />
      </div>

      {/* Scan line animation */}
      {scanMode === "scanning" && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line shadow-[0_0_20px_hsl(var(--primary))]" />
        </div>
      )}

      {/* Processing indicator */}
      {scanMode === "processing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-transparent border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <div className="absolute bottom-8 text-center">
            <p className="text-sm font-medium text-primary">Analyzing...</p>
            <p className="text-xs text-muted-foreground">AI processing morphology data</p>
          </div>
        </div>
      )}
    </div>
  );
}
