/**
 * useHealthPrediction Hook
 * React hook for health prediction operations
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  PredictionEngine,
  getPredictionEngine,
  type DataPoint,
  type AnalysisResult,
  type Prediction,
  type HealthInsight,
  type TrendResult,
  type RiskAssessment,
} from "@/lib/healthPrediction";

export interface UseHealthPredictionOptions {
  metricId?: string;
  autoAnalyze?: boolean;
  cacheResults?: boolean;
}

export interface UseHealthPredictionReturn {
  // State
  isAnalyzing: boolean;
  lastAnalysis: AnalysisResult | null;
  trend: TrendResult | null;
  riskAssessment: RiskAssessment | null;
  predictions: Prediction[];
  insights: HealthInsight[];
  projectedValues: DataPoint[];

  // Actions
  analyze: (dataPoints: DataPoint[]) => AnalysisResult;
  getQuickSummary: (dataPoints: DataPoint[]) => ReturnType<PredictionEngine["getQuickSummary"]>;
  comparePeriods: (
    period1: DataPoint[],
    period2: DataPoint[],
  ) => ReturnType<PredictionEngine["comparePeriods"]>;
  clearCache: () => void;

  // Computed
  hasEnoughData: boolean;
  confidenceLevel: "low" | "medium" | "high";
}

export function useHealthPrediction(
  options: UseHealthPredictionOptions = {},
): UseHealthPredictionReturn {
  const { metricId = "default", autoAnalyze = false, cacheResults = true } = options;

  const engineRef = useRef<PredictionEngine>(getPredictionEngine());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);

  // Load cached analysis on mount
  useEffect(() => {
    if (cacheResults) {
      const cached = engineRef.current.getCachedAnalysis(metricId);
      if (cached) {
        setLastAnalysis(cached);
      }
    }
  }, [metricId, cacheResults]);

  const analyze = useCallback(
    (dataPoints: DataPoint[]) => {
      setIsAnalyzing(true);
      try {
        const result = engineRef.current.analyze(dataPoints, metricId);
        setLastAnalysis(result);
        return result;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [metricId],
  );

  const getQuickSummary = useCallback((dataPoints: DataPoint[]) => {
    return engineRef.current.getQuickSummary(dataPoints);
  }, []);

  const comparePeriods = useCallback((period1: DataPoint[], period2: DataPoint[]) => {
    return engineRef.current.comparePeriods(period1, period2);
  }, []);

  const clearCache = useCallback(() => {
    engineRef.current.clearCache();
    setLastAnalysis(null);
  }, []);

  // Derived state
  const trend = lastAnalysis?.trend || null;
  const riskAssessment = lastAnalysis?.riskAssessment || null;
  const predictions = lastAnalysis?.predictions || [];
  const insights = lastAnalysis?.insights || [];
  const projectedValues = lastAnalysis?.projectedValues || [];

  const hasEnoughData = useMemo(() => {
    return (lastAnalysis?.trend.dataPoints || 0) >= 5;
  }, [lastAnalysis]);

  const confidenceLevel = useMemo((): "low" | "medium" | "high" => {
    const confidence = lastAnalysis?.trend.confidence || 0;
    if (confidence >= 70) return "high";
    if (confidence >= 40) return "medium";
    return "low";
  }, [lastAnalysis]);

  return {
    // State
    isAnalyzing,
    lastAnalysis,
    trend,
    riskAssessment,
    predictions,
    insights,
    projectedValues,

    // Actions
    analyze,
    getQuickSummary,
    comparePeriods,
    clearCache,

    // Computed
    hasEnoughData,
    confidenceLevel,
  };
}

export default useHealthPrediction;
