/**
 * Prediction Engine
 * ML-based prediction engine for health trends
 */

import {
  type DataPoint,
  type TrendResult,
  type MovingAverageResult,
  type AnomalyDetectionResult,
  type SeasonalityResult,
  analyzeTrend,
  calculateMovingAverage,
  calculateEMA,
  detectAnomalies,
  detectSeasonality,
  projectTrend,
  calculateStatistics,
} from "./trendAnalysis";
import {
  type RiskAssessment,
  type RiskLevel,
  assessRisk,
  getRiskLevelColor,
} from "./riskAssessment";

export type PredictionType = "trend" | "value" | "range" | "category";
export type PredictionTimeframe = "7d" | "14d" | "30d" | "90d";

export interface Prediction {
  id: string;
  type: PredictionType;
  metricId: string;
  timeframe: PredictionTimeframe;
  predictedValue?: number;
  predictedRange?: { min: number; max: number };
  predictedTrend?: TrendResult["direction"];
  confidence: number; // 0-100
  factors: PredictionFactor[];
  generatedAt: string;
  validUntil: string;
}

export interface PredictionFactor {
  name: string;
  impact: "positive" | "negative" | "neutral";
  weight: number;
  description: string;
}

export interface HealthInsight {
  id: string;
  title: string;
  description: string;
  severity: "info" | "success" | "warning" | "alert";
  category: string;
  actionable: boolean;
  suggestedAction?: string;
  relatedMetrics: string[];
  timestamp: string;
}

export interface AnalysisResult {
  metricId: string;
  trend: TrendResult;
  movingAverage: MovingAverageResult;
  exponentialMA: MovingAverageResult;
  anomalies: AnomalyDetectionResult;
  seasonality: SeasonalityResult;
  riskAssessment: RiskAssessment;
  predictions: Prediction[];
  insights: HealthInsight[];
  projectedValues: DataPoint[];
}

export interface PredictionEngineState {
  isInitialized: boolean;
  lastAnalysis: Date | null;
  cachedResults: Map<string, AnalysisResult>;
}

/**
 * Prediction Engine Class
 */
export class PredictionEngine {
  private state: PredictionEngineState;
  private analysisHistory: Map<string, AnalysisResult[]>;

  constructor() {
    this.state = {
      isInitialized: false,
      lastAnalysis: null,
      cachedResults: new Map(),
    };
    this.analysisHistory = new Map();
  }

  /**
   * Initialize the engine
   */
  initialize(): void {
    this.state.isInitialized = true;
  }

  /**
   * Perform comprehensive analysis on data
   */
  analyze(dataPoints: DataPoint[], metricId: string = "default"): AnalysisResult {
    if (!this.state.isInitialized) {
      this.initialize();
    }

    // Run all analysis algorithms
    const trend = analyzeTrend(dataPoints);
    const movingAverage = calculateMovingAverage(dataPoints, 7);
    const exponentialMA = calculateEMA(dataPoints, 7);
    const anomalies = detectAnomalies(dataPoints);
    const seasonality = detectSeasonality(dataPoints);
    const riskAssessment = assessRisk(dataPoints, metricId);
    const projectedValues = projectTrend(dataPoints, 30);

    // Generate predictions
    const predictions = this.generatePredictions(dataPoints, trend, seasonality, metricId);

    // Generate insights
    const insights = this.generateInsights(trend, anomalies, riskAssessment, seasonality);

    const result: AnalysisResult = {
      metricId,
      trend,
      movingAverage,
      exponentialMA,
      anomalies,
      seasonality,
      riskAssessment,
      predictions,
      insights,
      projectedValues,
    };

    // Cache result
    this.state.cachedResults.set(metricId, result);
    this.state.lastAnalysis = new Date();

    // Store in history
    const history = this.analysisHistory.get(metricId) || [];
    history.push(result);
    if (history.length > 30) history.shift(); // Keep last 30 analyses
    this.analysisHistory.set(metricId, history);

    return result;
  }

  /**
   * Generate predictions based on analysis
   */
  private generatePredictions(
    dataPoints: DataPoint[],
    trend: TrendResult,
    seasonality: SeasonalityResult,
    metricId: string,
  ): Prediction[] {
    const predictions: Prediction[] = [];
    const now = new Date();

    // Trend prediction
    predictions.push({
      id: `pred_trend_${Date.now()}`,
      type: "trend",
      metricId,
      timeframe: "30d",
      predictedTrend: this.predictFutureTrend(trend),
      confidence: Math.min(90, trend.confidence * 0.8 + (dataPoints.length / 20) * 20),
      factors: this.getTrendFactors(trend, seasonality),
      generatedAt: now.toISOString(),
      validUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Value predictions for different timeframes
    const timeframes: PredictionTimeframe[] = ["7d", "14d", "30d"];

    for (const timeframe of timeframes) {
      const days = parseInt(timeframe);
      const projected = projectTrend(dataPoints, days);
      const lastProjected = projected[projected.length - 1];

      if (lastProjected) {
        const confidenceDecay = 1 - days / 100;
        const stats = calculateStatistics(dataPoints.map(d => d.value));

        predictions.push({
          id: `pred_value_${timeframe}_${Date.now()}`,
          type: "range",
          metricId,
          timeframe,
          predictedValue: lastProjected.value,
          predictedRange: {
            min: Math.max(0, lastProjected.value - stats.standardDeviation * 1.5),
            max: lastProjected.value + stats.standardDeviation * 1.5,
          },
          confidence: Math.max(20, trend.confidence * confidenceDecay),
          factors: this.getValueFactors(trend, days),
          generatedAt: now.toISOString(),
          validUntil: new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    return predictions;
  }

  private predictFutureTrend(currentTrend: TrendResult): TrendResult["direction"] {
    // Simple persistence model - predict trend will continue
    if (currentTrend.strength === "strong" || currentTrend.strength === "moderate") {
      return currentTrend.direction;
    }
    return "stable";
  }

  private getTrendFactors(trend: TrendResult, seasonality: SeasonalityResult): PredictionFactor[] {
    const factors: PredictionFactor[] = [];

    factors.push({
      name: "Historical Trend",
      impact:
        trend.direction === "increasing"
          ? "positive"
          : trend.direction === "decreasing"
            ? "negative"
            : "neutral",
      weight: trend.rSquared,
      description: `${trend.direction} trend with ${trend.strength} strength`,
    });

    factors.push({
      name: "Data Consistency",
      impact: trend.standardDeviation / trend.meanValue < 0.1 ? "positive" : "neutral",
      weight: 0.3,
      description: "Based on measurement variability",
    });

    if (seasonality.hasSeasonality) {
      factors.push({
        name: "Seasonal Pattern",
        impact: "neutral",
        weight: seasonality.confidence / 100,
        description: `${seasonality.periodDays}-day cycle detected`,
      });
    }

    return factors;
  }

  private getValueFactors(trend: TrendResult, days: number): PredictionFactor[] {
    return [
      {
        name: "Trend Extrapolation",
        impact: "neutral",
        weight: Math.max(0.3, trend.rSquared),
        description: `Based on ${trend.dataPoints} historical data points`,
      },
      {
        name: "Time Horizon",
        impact: days > 14 ? "negative" : "neutral",
        weight: 0.2,
        description: `${days}-day prediction window`,
      },
    ];
  }

  /**
   * Generate actionable insights
   */
  private generateInsights(
    trend: TrendResult,
    anomalies: AnomalyDetectionResult,
    risk: RiskAssessment,
    seasonality: SeasonalityResult,
  ): HealthInsight[] {
    const insights: HealthInsight[] = [];
    const now = new Date().toISOString();

    // Trend insight
    if (trend.strength !== "none") {
      insights.push({
        id: `insight_trend_${Date.now()}`,
        title: `${trend.direction.charAt(0).toUpperCase() + trend.direction.slice(1)} Trend Detected`,
        description: `Your measurements show a ${trend.strength} ${trend.direction} trend over the analyzed period (${trend.percentChange.toFixed(1)}% change).`,
        severity:
          trend.direction === "decreasing" && trend.strength === "strong" ? "warning" : "info",
        category: "trend",
        actionable: trend.strength === "strong",
        suggestedAction:
          trend.direction === "decreasing" && trend.strength !== "weak"
            ? "Continue monitoring and consider consulting a healthcare provider if the trend persists."
            : undefined,
        relatedMetrics: [],
        timestamp: now,
      });
    }

    // Anomaly insight
    if (anomalies.anomalies.length > 0) {
      const severeCount = anomalies.anomalies.filter(a => a.severity === "severe").length;
      insights.push({
        id: `insight_anomaly_${Date.now()}`,
        title: "Unusual Measurements Detected",
        description: `${anomalies.anomalies.length} measurement(s) were outside the normal range. ${severeCount > 0 ? `${severeCount} were significantly different.` : ""}`,
        severity: severeCount > 0 ? "alert" : "warning",
        category: "anomaly",
        actionable: true,
        suggestedAction:
          "Review these measurements to ensure they were taken correctly. Retake if necessary.",
        relatedMetrics: [],
        timestamp: now,
      });
    }

    // Risk insight
    if (risk.riskLevel !== "low") {
      insights.push({
        id: `insight_risk_${Date.now()}`,
        title: `${risk.riskLevel.charAt(0).toUpperCase() + risk.riskLevel.slice(1)} Risk Level`,
        description: risk.recommendations[0] || "Some factors warrant attention.",
        severity:
          risk.riskLevel === "high" ? "alert" : risk.riskLevel === "elevated" ? "warning" : "info",
        category: "risk",
        actionable: true,
        suggestedAction: risk.recommendations[0],
        relatedMetrics: [],
        timestamp: now,
      });
    }

    // Consistency insight
    if (trend.dataPoints >= 10 && trend.standardDeviation / trend.meanValue < 0.05) {
      insights.push({
        id: `insight_consistency_${Date.now()}`,
        title: "Excellent Measurement Consistency",
        description:
          "Your measurements are very consistent, indicating good technique and reliable data.",
        severity: "success",
        category: "quality",
        actionable: false,
        relatedMetrics: [],
        timestamp: now,
      });
    }

    // Seasonality insight
    if (seasonality.hasSeasonality && seasonality.confidence > 70) {
      insights.push({
        id: `insight_seasonality_${Date.now()}`,
        title: "Cyclical Pattern Detected",
        description: `A ${seasonality.periodDays}-day cycle has been detected in your data. This could indicate natural variations.`,
        severity: "info",
        category: "pattern",
        actionable: false,
        relatedMetrics: [],
        timestamp: now,
      });
    }

    return insights;
  }

  /**
   * Get cached analysis result
   */
  getCachedAnalysis(metricId: string): AnalysisResult | undefined {
    return this.state.cachedResults.get(metricId);
  }

  /**
   * Get analysis history
   */
  getAnalysisHistory(metricId: string): AnalysisResult[] {
    return this.analysisHistory.get(metricId) || [];
  }

  /**
   * Get quick summary
   */
  getQuickSummary(dataPoints: DataPoint[]): {
    trend: TrendResult["direction"];
    riskLevel: RiskLevel;
    confidence: number;
    topInsight: string;
  } {
    const analysis = this.analyze(dataPoints);

    return {
      trend: analysis.trend.direction,
      riskLevel: analysis.riskAssessment.riskLevel,
      confidence: analysis.trend.confidence,
      topInsight: analysis.insights[0]?.title || "No significant findings",
    };
  }

  /**
   * Compare two time periods
   */
  comparePeriods(
    period1: DataPoint[],
    period2: DataPoint[],
  ): {
    period1Stats: ReturnType<typeof calculateStatistics>;
    period2Stats: ReturnType<typeof calculateStatistics>;
    meanChange: number;
    meanChangePercent: number;
    varianceChange: number;
    improvement: boolean;
  } {
    const stats1 = calculateStatistics(period1.map(d => d.value));
    const stats2 = calculateStatistics(period2.map(d => d.value));

    const meanChange = stats2.mean - stats1.mean;
    const meanChangePercent = stats1.mean !== 0 ? (meanChange / stats1.mean) * 100 : 0;
    const varianceChange = stats2.standardDeviation - stats1.standardDeviation;

    return {
      period1Stats: stats1,
      period2Stats: stats2,
      meanChange,
      meanChangePercent,
      varianceChange,
      improvement: meanChange > 0 && varianceChange <= 0,
    };
  }

  /**
   * Clear cached results
   */
  clearCache(): void {
    this.state.cachedResults.clear();
  }

  /**
   * Reset engine
   */
  reset(): void {
    this.state = {
      isInitialized: false,
      lastAnalysis: null,
      cachedResults: new Map(),
    };
    this.analysisHistory.clear();
  }
}

// Singleton instance
let engineInstance: PredictionEngine | null = null;

export function getPredictionEngine(): PredictionEngine {
  if (!engineInstance) {
    engineInstance = new PredictionEngine();
    engineInstance.initialize();
  }
  return engineInstance;
}

// Re-export types and utilities
export { getRiskLevelColor };
export type { DataPoint, TrendResult, RiskAssessment, RiskLevel };
