/**
 * AI Scan Analysis Hook
 * Connects to the ai-scan-analysis edge function for real AI-powered health analysis
 */
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { isLovablePolicyBuild } from "@/lib/featureFlags";

export interface AIScanAnalysisCondition {
  name: string;
  confidence: number;
  severity: "low" | "medium" | "high";
  description: string;
}

export interface AIScanAnalysisResult {
  conditions: AIScanAnalysisCondition[];
  recommendations: string[];
  overallHealth: "good" | "fair" | "needs_attention" | "concerning";
  confidenceLevel: number;
  curvatureAssessment: {
    detected: boolean;
    estimatedAngle?: number;
    direction?: string;
    severity?: "none" | "mild" | "moderate" | "severe" | null;
  };
  skinHealth: {
    status: "healthy" | "minor_concerns" | "needs_attention" | string;
    observations: string[];
  };
  urgency: "routine" | "soon" | "urgent";
  disclaimer: string;
  rawResponse?: string;
  analysisId?: string;
  timestamp?: string;
}

interface UseAIScanAnalysisOptions {
  onSuccess?: (result: AIScanAnalysisResult) => void;
  onError?: (error: string) => void;
  saveToHistory?: boolean;
}

export const useAIScanAnalysis = (options: UseAIScanAnalysisOptions = {}) => {
  const { onSuccess, onError, saveToHistory = true } = options;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AIScanAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const analyzeImage = useCallback(
    async (imageData: string): Promise<AIScanAnalysisResult | null> => {
      setIsAnalyzing(true);
      setError(null);
      setProgress(10);

      const startTime = Date.now();
      logger.scanEvent("start", undefined, { analysisType: "ai_scan" });

      try {
        // Lovable-safe policy: disable genital “medical image analysis” in store/lovable builds.
        if (isLovablePolicyBuild()) {
          throw new Error("AI scan analysis isn’t available in this build.");
        }

        // Validate image data
        if (!imageData) {
          throw new Error("No image data provided");
        }

        setProgress(20);

        // Ensure proper base64 format
        let processedImageData = imageData;
        if (!imageData.startsWith("data:image/")) {
          // Assume it's raw base64, add proper prefix
          processedImageData = `data:image/jpeg;base64,${imageData}`;
        }

        setProgress(30);

        // Call the edge function
        const { data, error: functionError } = await supabase.functions.invoke("ai-scan-analysis", {
          body: { imageBase64: processedImageData },
        });

        setProgress(70);

        if (functionError) {
          logger.error("AI scan analysis function error", { error: functionError.message });
          throw new Error(functionError.message || "Analysis failed");
        }

        if (!data) {
          throw new Error("No analysis data received");
        }

        // Handle error responses from the function
        if (data.error) {
          if (data.error.includes("Rate limit")) {
            throw new Error("Too many requests. Please wait a moment and try again.");
          }
          if (data.error.includes("credits exhausted")) {
            throw new Error("AI analysis credits exhausted. Please try again later.");
          }
          throw new Error(data.error);
        }

        setProgress(85);

        // Process and validate the response
        const analysisResult: AIScanAnalysisResult = {
          conditions: Array.isArray(data.conditions) ? data.conditions : [],
          recommendations: Array.isArray(data.recommendations)
            ? data.recommendations
            : ["Continue regular monitoring", "Maintain healthy lifestyle"],
          overallHealth: validateOverallHealth(data.overallHealth),
          confidenceLevel:
            typeof data.confidenceLevel === "number"
              ? Math.min(100, Math.max(0, data.confidenceLevel))
              : 75,
          curvatureAssessment: {
            detected: data.curvatureAssessment?.detected ?? false,
            estimatedAngle: data.curvatureAssessment?.estimatedAngle,
            direction: data.curvatureAssessment?.direction,
            severity: data.curvatureAssessment?.severity,
          },
          skinHealth: {
            status: data.skinHealth?.status || "healthy",
            observations: Array.isArray(data.skinHealth?.observations)
              ? data.skinHealth.observations
              : [],
          },
          urgency: validateUrgency(data.urgency),
          disclaimer:
            data.disclaimer ||
            "This assessment is for educational purposes only and should not replace professional medical advice. Please consult a healthcare provider for proper evaluation.",
          rawResponse: data.rawResponse,
          analysisId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        };

        setProgress(95);

        // Optionally save to scan history (using scan_history table which exists)
        if (saveToHistory) {
          await saveScanToHistory(analysisResult, processedImageData);
        }

        setProgress(100);
        setResult(analysisResult);

        const duration = Date.now() - startTime;
        logger.scanEvent("complete", undefined, {
          duration,
          confidenceLevel: analysisResult.confidenceLevel,
          overallHealth: analysisResult.overallHealth,
          urgency: analysisResult.urgency,
        });

        if (onSuccess) {
          onSuccess(analysisResult);
        }

        return analysisResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed";
        setError(message);
        // Always clear prior result on error so UIs/tests don't display stale data.
        setResult(null);

        logger.scanEvent("error", undefined, { error: message });

        if (onError) {
          onError(message);
        } else {
          toast.error(message);
        }

        return null;
      } finally {
        setIsAnalyzing(false);
        setProgress(0);
      }
    },
    [onSuccess, onError, saveToHistory],
  );

  const analyzeScan = useCallback(
    async (input: unknown): Promise<AIScanAnalysisResult | null> => {
      const normalized = normalizeScanInput(input);
      if (!normalized) {
        const message = "Invalid scan data";
        setError(message);
        setResult(null);
        setIsAnalyzing(false);
        setProgress(0);

        if (onError) {
          onError(message);
        } else {
          toast.error(message);
        }
        return null;
      }
      return analyzeImage(normalized);
    },
    [analyzeImage, onError],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  const resetAnalysis = reset;
  const clearAnalysis = reset;

  // Get analysis history for the current user (using scan_history table)
  const getAnalysisHistory = useCallback(async (limit: number = 10) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("scan_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      logger.error("Failed to get analysis history", { error: err });
      return [];
    }
  }, []);

  // Compare two analyses
  const compareAnalyses = useCallback(
    (current: AIScanAnalysisResult, previous: AIScanAnalysisResult) => {
      const comparison = {
        healthImproved:
          getHealthScore(current.overallHealth) > getHealthScore(previous.overallHealth),
        confidenceChange: current.confidenceLevel - previous.confidenceLevel,
        newConditions: current.conditions.filter(
          c => !previous.conditions.some(p => p.name === c.name),
        ),
        resolvedConditions: previous.conditions.filter(
          p => !current.conditions.some(c => c.name === p.name),
        ),
        curvatureChange:
          current.curvatureAssessment.detected !== previous.curvatureAssessment.detected,
        urgencyChange: current.urgency !== previous.urgency,
      };

      return comparison;
    },
    [],
  );

  return {
    // Analysis functions
    analyzeImage,
    analyzeScan,
    reset,
    resetAnalysis,
    clearAnalysis,
    getAnalysisHistory,
    compareAnalyses,

    // State
    isAnalyzing,
    result,
    analysis: result,
    error,
    progress,
  };
};

// Helper functions
function normalizeScanInput(input: unknown): string | null {
  if (typeof input === "string") return input;
  if (!input || typeof input !== "object") return null;
  const maybe = (input as { imageBase64?: unknown }).imageBase64;
  if (typeof maybe !== "string") return null;
  return maybe.trim() ? maybe : null;
}

function validateOverallHealth(value: string): AIScanAnalysisResult["overallHealth"] {
  const validValues: AIScanAnalysisResult["overallHealth"][] = [
    "good",
    "fair",
    "needs_attention",
    "concerning",
  ];
  return validValues.includes(value as any)
    ? (value as AIScanAnalysisResult["overallHealth"])
    : "fair";
}

function validateUrgency(value: string): AIScanAnalysisResult["urgency"] {
  const validValues: AIScanAnalysisResult["urgency"][] = ["routine", "soon", "urgent"];
  return validValues.includes(value as any)
    ? (value as AIScanAnalysisResult["urgency"])
    : "routine";
}

function getHealthScore(health: AIScanAnalysisResult["overallHealth"]): number {
  const scores: Record<AIScanAnalysisResult["overallHealth"], number> = {
    good: 4,
    fair: 3,
    needs_attention: 2,
    concerning: 1,
  };
  return scores[health] || 0;
}

async function saveScanToHistory(result: AIScanAnalysisResult, imageData: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Use the existing scan_history table
    const { error } = await supabase.from("scan_history").insert({
      user_id: user.id,
      scan_type: "ai_analysis",
      notes: JSON.stringify({
        analysis_result: result,
        overall_health: result.overallHealth,
        confidence_level: result.confidenceLevel,
        urgency: result.urgency,
      }),
      curvature_angle: result.curvatureAssessment.estimatedAngle || null,
      curvature_direction: result.curvatureAssessment.direction || null,
    });

    if (error) {
      logger.warn("Failed to save scan to history", { error: error.message });
    }
  } catch (err) {
    logger.warn("Failed to save scan to history", { error: err });
  }
}

export default useAIScanAnalysis;
