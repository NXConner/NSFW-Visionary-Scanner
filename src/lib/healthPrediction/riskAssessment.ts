/**
 * Risk Assessment
 * Risk scoring based on patterns and anomalies
 */

import {
  type DataPoint,
  type TrendResult,
  analyzeTrend,
  detectAnomalies,
  calculateStatistics,
} from "./trendAnalysis";

export type RiskLevel = "low" | "moderate" | "elevated" | "high";
export type RiskCategory = "trend" | "variability" | "anomaly" | "consistency" | "threshold";

export interface RiskFactor {
  category: RiskCategory;
  name: string;
  description: string;
  score: number; // 0-100
  weight: number; // Importance factor
  details?: Record<string, unknown>;
}

export interface RiskAssessment {
  overallScore: number; // 0-100 (higher = more risk)
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  recommendations: string[];
  confidence: number; // 0-100
  assessmentDate: string;
  dataPointsAnalyzed: number;
}

export interface ThresholdConfig {
  warningLow?: number;
  warningHigh?: number;
  criticalLow?: number;
  criticalHigh?: number;
  optimalMin?: number;
  optimalMax?: number;
}

export interface HealthMetricConfig {
  metricId: string;
  name: string;
  unit: string;
  thresholds: ThresholdConfig;
  trendImportance: number; // 0-1
  variabilityImportance: number; // 0-1
}

// Default health metric configurations
export const DEFAULT_METRIC_CONFIGS: Record<string, HealthMetricConfig> = {
  measurement_length: {
    metricId: "measurement_length",
    name: "Length Measurement",
    unit: "cm",
    thresholds: {},
    trendImportance: 0.7,
    variabilityImportance: 0.5,
  },
  measurement_circumference: {
    metricId: "measurement_circumference",
    name: "Circumference",
    unit: "cm",
    thresholds: {},
    trendImportance: 0.6,
    variabilityImportance: 0.4,
  },
  health_score: {
    metricId: "health_score",
    name: "Health Score",
    unit: "points",
    thresholds: {
      warningLow: 40,
      criticalLow: 20,
      optimalMin: 70,
      optimalMax: 100,
    },
    trendImportance: 0.8,
    variabilityImportance: 0.3,
  },
};

/**
 * Calculate variability risk score
 */
function calculateVariabilityRisk(dataPoints: DataPoint[], config: HealthMetricConfig): RiskFactor {
  const values = dataPoints.map(d => d.value);
  const stats = calculateStatistics(values);

  // Coefficient of variation (normalized standard deviation)
  const cv = stats.mean !== 0 ? (stats.standardDeviation / stats.mean) * 100 : 0;

  // Score based on CV (higher CV = higher risk)
  let score = 0;
  if (cv < 5) score = 0;
  else if (cv < 10) score = 20;
  else if (cv < 15) score = 40;
  else if (cv < 20) score = 60;
  else if (cv < 30) score = 80;
  else score = 100;

  return {
    category: "variability",
    name: "Measurement Variability",
    description:
      cv > 15
        ? "High variability in measurements detected"
        : "Measurements are reasonably consistent",
    score,
    weight: config.variabilityImportance,
    details: {
      coefficientOfVariation: cv,
      standardDeviation: stats.standardDeviation,
      mean: stats.mean,
    },
  };
}

/**
 * Calculate trend-based risk
 */
function calculateTrendRisk(trend: TrendResult, config: HealthMetricConfig): RiskFactor {
  let score = 0;
  let description = "Trend is within normal parameters";

  // Significant decreasing trend might indicate concern
  if (trend.direction === "decreasing" && trend.strength !== "none") {
    if (trend.percentChange < -20) {
      score = 80;
      description = "Significant decreasing trend detected";
    } else if (trend.percentChange < -10) {
      score = 50;
      description = "Moderate decreasing trend detected";
    } else {
      score = 25;
      description = "Slight decreasing trend detected";
    }
  } else if (trend.direction === "fluctuating") {
    score = 40;
    description = "Inconsistent pattern in measurements";
  }

  return {
    category: "trend",
    name: "Trend Analysis",
    description,
    score,
    weight: config.trendImportance,
    details: {
      direction: trend.direction,
      strength: trend.strength,
      percentChange: trend.percentChange,
      rSquared: trend.rSquared,
    },
  };
}

/**
 * Calculate anomaly-based risk
 */
function calculateAnomalyRisk(dataPoints: DataPoint[]): RiskFactor {
  const anomalyResult = detectAnomalies(dataPoints);
  const anomalyRate =
    dataPoints.length > 0 ? (anomalyResult.anomalies.length / dataPoints.length) * 100 : 0;

  let score = 0;
  let description = "No significant anomalies detected";

  const severeCount = anomalyResult.anomalies.filter(a => a.severity === "severe").length;
  const moderateCount = anomalyResult.anomalies.filter(a => a.severity === "moderate").length;

  if (severeCount > 0) {
    score = 70 + severeCount * 10;
    description = `${severeCount} severe anomaly(ies) detected`;
  } else if (moderateCount > 0) {
    score = 40 + moderateCount * 10;
    description = `${moderateCount} moderate anomaly(ies) detected`;
  } else if (anomalyResult.anomalies.length > 0) {
    score = 20 + anomalyResult.anomalies.length * 5;
    description = "Minor anomalies detected";
  }

  return {
    category: "anomaly",
    name: "Anomaly Detection",
    description,
    score: Math.min(100, score),
    weight: 0.8,
    details: {
      totalAnomalies: anomalyResult.anomalies.length,
      severeCount,
      moderateCount,
      anomalyRate,
    },
  };
}

/**
 * Calculate consistency risk (based on measurement frequency)
 */
function calculateConsistencyRisk(dataPoints: DataPoint[]): RiskFactor {
  if (dataPoints.length < 2) {
    return {
      category: "consistency",
      name: "Measurement Consistency",
      description: "Insufficient data for consistency analysis",
      score: 50,
      weight: 0.3,
      details: { dataPoints: dataPoints.length },
    };
  }

  // Calculate gaps between measurements
  const gaps: number[] = [];
  for (let i = 1; i < dataPoints.length; i++) {
    const current = new Date(dataPoints[i].timestamp);
    const prev = new Date(dataPoints[i - 1].timestamp);
    const gapDays = (current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    gaps.push(gapDays);
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const maxGap = Math.max(...gaps);

  let score = 0;
  let description = "Measurements are taken consistently";

  if (avgGap > 14) {
    score = 60;
    description = "Measurements are taken infrequently";
  } else if (avgGap > 7) {
    score = 30;
    description = "Consider more frequent measurements";
  }

  if (maxGap > 30) {
    score = Math.max(score, 50);
    description = "Large gaps in measurement history";
  }

  return {
    category: "consistency",
    name: "Measurement Frequency",
    description,
    score,
    weight: 0.3,
    details: {
      averageGapDays: avgGap,
      maxGapDays: maxGap,
      totalMeasurements: dataPoints.length,
    },
  };
}

/**
 * Calculate threshold-based risk
 */
function calculateThresholdRisk(
  dataPoints: DataPoint[],
  config: HealthMetricConfig,
): RiskFactor | null {
  const thresholds = config.thresholds;
  if (!thresholds || Object.keys(thresholds).length === 0) {
    return null;
  }

  const recentValues = dataPoints.slice(-5).map(d => d.value);
  const avgRecent = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;

  let score = 0;
  let description = "Values are within acceptable range";

  // Check against thresholds
  if (thresholds.criticalLow !== undefined && avgRecent < thresholds.criticalLow) {
    score = 100;
    description = "Values are critically low";
  } else if (thresholds.criticalHigh !== undefined && avgRecent > thresholds.criticalHigh) {
    score = 100;
    description = "Values are critically high";
  } else if (thresholds.warningLow !== undefined && avgRecent < thresholds.warningLow) {
    score = 60;
    description = "Values are below recommended range";
  } else if (thresholds.warningHigh !== undefined && avgRecent > thresholds.warningHigh) {
    score = 60;
    description = "Values are above recommended range";
  } else if (thresholds.optimalMin !== undefined && thresholds.optimalMax !== undefined) {
    if (avgRecent >= thresholds.optimalMin && avgRecent <= thresholds.optimalMax) {
      score = 0;
      description = "Values are in optimal range";
    } else {
      score = 20;
      description = "Values are outside optimal range";
    }
  }

  return {
    category: "threshold",
    name: "Threshold Check",
    description,
    score,
    weight: 1.0,
    details: {
      recentAverage: avgRecent,
      thresholds,
    },
  };
}

/**
 * Generate recommendations based on risk factors
 */
function generateRecommendations(riskFactors: RiskFactor[]): string[] {
  const recommendations: string[] = [];

  for (const factor of riskFactors) {
    if (factor.score > 50) {
      switch (factor.category) {
        case "trend":
          recommendations.push(
            "Monitor the current trend closely and consider consulting a healthcare provider if it continues.",
          );
          break;
        case "variability":
          recommendations.push(
            "Try to maintain consistent measurement conditions (time of day, technique) for more reliable tracking.",
          );
          break;
        case "anomaly":
          recommendations.push(
            "Review any unusual measurements and verify they were taken correctly.",
          );
          break;
        case "consistency":
          recommendations.push(
            "Try to take measurements more regularly for better trend analysis.",
          );
          break;
        case "threshold":
          recommendations.push(
            "Some values are outside recommended ranges. Consider consulting a healthcare professional.",
          );
          break;
      }
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Continue with your current measurement routine. Everything looks good!");
  }

  return [...new Set(recommendations)]; // Remove duplicates
}

/**
 * Determine overall risk level
 */
function determineRiskLevel(score: number): RiskLevel {
  if (score < 25) return "low";
  if (score < 50) return "moderate";
  if (score < 75) return "elevated";
  return "high";
}

/**
 * Main risk assessment function
 */
export function assessRisk(
  dataPoints: DataPoint[],
  metricId: string = "measurement_length",
): RiskAssessment {
  const config = DEFAULT_METRIC_CONFIGS[metricId] || DEFAULT_METRIC_CONFIGS["measurement_length"];

  if (dataPoints.length < 3) {
    return {
      overallScore: 0,
      riskLevel: "low",
      riskFactors: [],
      recommendations: ["Take more measurements to enable trend and risk analysis."],
      confidence: 0,
      assessmentDate: new Date().toISOString(),
      dataPointsAnalyzed: dataPoints.length,
    };
  }

  const trend = analyzeTrend(dataPoints);
  const riskFactors: RiskFactor[] = [];

  // Calculate all risk factors
  riskFactors.push(calculateTrendRisk(trend, config));
  riskFactors.push(calculateVariabilityRisk(dataPoints, config));
  riskFactors.push(calculateAnomalyRisk(dataPoints));
  riskFactors.push(calculateConsistencyRisk(dataPoints));

  const thresholdRisk = calculateThresholdRisk(dataPoints, config);
  if (thresholdRisk) {
    riskFactors.push(thresholdRisk);
  }

  // Calculate weighted overall score
  const totalWeight = riskFactors.reduce((sum, f) => sum + f.weight, 0);
  const weightedSum = riskFactors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Calculate confidence based on data quality
  const confidence = Math.min(100, (dataPoints.length / 10) * 50 + trend.confidence * 0.5);

  return {
    overallScore,
    riskLevel: determineRiskLevel(overallScore),
    riskFactors,
    recommendations: generateRecommendations(riskFactors),
    confidence,
    assessmentDate: new Date().toISOString(),
    dataPointsAnalyzed: dataPoints.length,
  };
}

/**
 * Get risk level color
 */
export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "#22C55E"; // green
    case "moderate":
      return "#F59E0B"; // amber
    case "elevated":
      return "#EF4444"; // red-orange
    case "high":
      return "#DC2626"; // red
    default:
      return "#9CA3AF"; // gray
  }
}
