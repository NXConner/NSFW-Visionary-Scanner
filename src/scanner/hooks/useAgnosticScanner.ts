/**
 * AGNOSTIC SCANNER HOOK
 * Core scanning logic that works identically in Safe and NSFW builds.
 * Feature gating is handled via CONFIG from content-manifest.ts.
 */

import { useState, useCallback } from "react";
import { APP_CONFIG } from "@/config/content-manifest";
import type {
  ScanResult,
  ScannerHookOptions,
  ScannerHookResult,
  ScanAnalysis,
  ScanMetadata,
} from "@/types/scanner";

const DEFAULT_OPTIONS: ScannerHookOptions = {
  autoProcess: true,
  maxResolution: APP_CONFIG.version === "nsfw" ? 4096 : 2048,
  enableUnrestricted: APP_CONFIG.adultContentEnabled,
};

function generateScanId(): string {
  return `scan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function extractMetadata(imageData: string): ScanMetadata {
  const img = new Image();
  img.src = imageData;

  return {
    resolution: { width: img.naturalWidth || 0, height: img.naturalHeight || 0 },
    format: imageData.startsWith("data:image/png") ? "image/png" : "image/jpeg",
    fileSize: Math.round((imageData.length * 3) / 4),
    platform: typeof window !== "undefined" && "Capacitor" in window ? "capacitor" : "web",
    orientation: "upright",
  };
}

function buildAnalysis(options: ScannerHookOptions): ScanAnalysis {
  const baseAnalysis: ScanAnalysis = {
    label: "pending",
    confidence: 0,
    detections: [],
  };

  // Gate unrestricted details based on manifest config
  if (options.enableUnrestricted && APP_CONFIG.version === "nsfw") {
    baseAnalysis.unrestrictedDetails = {
      rawOutput: null,
      sensitiveFlags: [],
      modelVersion: "v1.0.0-nsfw",
    };
  }

  return baseAnalysis;
}

export function useAgnosticScanner(
  userOptions: Partial<ScannerHookOptions> = {},
): ScannerHookResult {
  const options = { ...DEFAULT_OPTIONS, ...userOptions };

  const [scan, setScan] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(
    async (imageData: string): Promise<ScanResult> => {
      setIsProcessing(true);
      setError(null);

      try {
        const metadata = extractMetadata(imageData);

        // Enforce resolution limits based on manifest
        if (
          metadata.resolution.width > options.maxResolution! ||
          metadata.resolution.height > options.maxResolution!
        ) {
          throw new Error(`Image exceeds maximum resolution of ${options.maxResolution}px`);
        }

        const newScan: ScanResult = {
          id: generateScanId(),
          timestamp: new Date().toISOString(),
          sourceImage: imageData,
          status: "processing",
          metadata,
          analysis: buildAnalysis(options),
        };

        setScan(newScan);

        // Simulate async processing (replace with actual scanner logic)
        await new Promise(resolve => setTimeout(resolve, 100));

        const completedScan: ScanResult = {
          ...newScan,
          status: "completed",
          analysis: {
            ...newScan.analysis,
            label: "processed",
            confidence: 0.95,
          },
        };

        setScan(completedScan);
        setIsProcessing(false);
        return completedScan;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Scan failed";
        setError(message);
        setIsProcessing(false);

        const failedScan: ScanResult = {
          id: generateScanId(),
          timestamp: new Date().toISOString(),
          sourceImage: imageData,
          status: "failed",
          metadata: extractMetadata(imageData),
          analysis: { label: "error", confidence: 0, detections: [] },
        };

        setScan(failedScan);
        throw new Error(message);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setScan(null);
    setIsProcessing(false);
    setError(null);
  }, []);

  return { scan, isProcessing, error, capture, reset };
}
