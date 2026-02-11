/**
 * Trend Analysis
 * Algorithms for detecting trends in measurement data
 */

export type TrendDirection = "increasing" | "decreasing" | "stable" | "fluctuating";
export type TrendStrength = "strong" | "moderate" | "weak" | "none";

export interface DataPoint {
  timestamp: string;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface TrendResult {
  direction: TrendDirection;
  strength: TrendStrength;
  slope: number; // Rate of change
  rSquared: number; // Goodness of fit
  meanValue: number;
  standardDeviation: number;
  percentChange: number;
  startValue: number;
  endValue: number;
  dataPoints: number;
  confidence: number; // 0-100
}

export interface MovingAverageResult {
  values: number[];
  timestamps: string[];
  period: number;
}

export interface SeasonalityResult {
  hasSeasonality: boolean;
  periodDays: number;
  amplitude: number;
  phase: number;
  confidence: number;
}

export interface AnomalyDetectionResult {
  anomalies: Array<{
    index: number;
    timestamp: string;
    value: number;
    expectedValue: number;
    zScore: number;
    severity: "mild" | "moderate" | "severe";
  }>;
  threshold: number;
  upperBound: number[];
  lowerBound: number[];
}

/**
 * Calculate basic statistics
 */
export function calculateStatistics(data: number[]): {
  mean: number;
  median: number;
  standardDeviation: number;
  min: number;
  max: number;
  range: number;
} {
  if (data.length === 0) {
    return { mean: 0, median: 0, standardDeviation: 0, min: 0, max: 0, range: 0 };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;

  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const standardDeviation = Math.sqrt(variance);

  return {
    mean,
    median,
    standardDeviation,
    min: sorted[0],
    max: sorted[n - 1],
    range: sorted[n - 1] - sorted[0],
  };
}

/**
 * Linear regression for trend line
 */
export function linearRegression(
  xValues: number[],
  yValues: number[],
): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  const n = xValues.length;
  if (n < 2) {
    return { slope: 0, intercept: yValues[0] || 0, rSquared: 0 };
  }

  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = yValues.reduce((sum, y) => sum + y * y, 0);

  const meanX = sumX / n;
  const meanY = sumY / n;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = meanY - slope * meanX;

  // Calculate R-squared
  const ssRes = yValues.reduce((sum, y, i) => {
    const predicted = slope * xValues[i] + intercept;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, rSquared: Math.max(0, rSquared) };
}

/**
 * Analyze trend in data series
 */
export function analyzeTrend(dataPoints: DataPoint[]): TrendResult {
  if (dataPoints.length < 2) {
    return {
      direction: "stable",
      strength: "none",
      slope: 0,
      rSquared: 0,
      meanValue: dataPoints[0]?.value || 0,
      standardDeviation: 0,
      percentChange: 0,
      startValue: dataPoints[0]?.value || 0,
      endValue: dataPoints[0]?.value || 0,
      dataPoints: dataPoints.length,
      confidence: 0,
    };
  }

  const values = dataPoints.map(d => d.value);
  const stats = calculateStatistics(values);

  // Create x values (days from start)
  const startDate = new Date(dataPoints[0].timestamp).getTime();
  const xValues = dataPoints.map(
    d => (new Date(d.timestamp).getTime() - startDate) / (1000 * 60 * 60 * 24),
  );

  const regression = linearRegression(xValues, values);

  // Determine direction
  let direction: TrendDirection;
  const normalizedSlope = (regression.slope / stats.mean) * 100; // % per day

  if (Math.abs(normalizedSlope) < 0.1) {
    direction = "stable";
  } else if (regression.rSquared < 0.3) {
    direction = "fluctuating";
  } else if (normalizedSlope > 0) {
    direction = "increasing";
  } else {
    direction = "decreasing";
  }

  // Determine strength
  let strength: TrendStrength;
  if (regression.rSquared >= 0.7) {
    strength = "strong";
  } else if (regression.rSquared >= 0.4) {
    strength = "moderate";
  } else if (regression.rSquared >= 0.2) {
    strength = "weak";
  } else {
    strength = "none";
  }

  // Calculate percent change
  const startValue = values[0];
  const endValue = values[values.length - 1];
  const percentChange = startValue !== 0 ? ((endValue - startValue) / startValue) * 100 : 0;

  // Confidence based on data points and R-squared
  const dataPointFactor = Math.min(1, dataPoints.length / 10);
  const confidence = regression.rSquared * dataPointFactor * 100;

  return {
    direction,
    strength,
    slope: regression.slope,
    rSquared: regression.rSquared,
    meanValue: stats.mean,
    standardDeviation: stats.standardDeviation,
    percentChange,
    startValue,
    endValue,
    dataPoints: dataPoints.length,
    confidence,
  };
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(
  dataPoints: DataPoint[],
  period: number = 7,
): MovingAverageResult {
  const values: number[] = [];
  const timestamps: string[] = [];

  for (let i = period - 1; i < dataPoints.length; i++) {
    const window = dataPoints.slice(i - period + 1, i + 1);
    const avg = window.reduce((sum, d) => sum + d.value, 0) / period;
    values.push(avg);
    timestamps.push(dataPoints[i].timestamp);
  }

  return { values, timestamps, period };
}

/**
 * Calculate exponential moving average
 */
export function calculateEMA(dataPoints: DataPoint[], period: number = 7): MovingAverageResult {
  if (dataPoints.length === 0) {
    return { values: [], timestamps: [], period };
  }

  const multiplier = 2 / (period + 1);
  const values: number[] = [dataPoints[0].value];
  const timestamps: string[] = [dataPoints[0].timestamp];

  for (let i = 1; i < dataPoints.length; i++) {
    const ema = (dataPoints[i].value - values[i - 1]) * multiplier + values[i - 1];
    values.push(ema);
    timestamps.push(dataPoints[i].timestamp);
  }

  return { values, timestamps, period };
}

/**
 * Detect anomalies using z-score
 */
export function detectAnomalies(
  dataPoints: DataPoint[],
  threshold: number = 2.5,
): AnomalyDetectionResult {
  const values = dataPoints.map(d => d.value);
  const stats = calculateStatistics(values);

  const anomalies: AnomalyDetectionResult["anomalies"] = [];
  const upperBound: number[] = [];
  const lowerBound: number[] = [];

  for (let i = 0; i < dataPoints.length; i++) {
    const zScore =
      stats.standardDeviation !== 0
        ? (dataPoints[i].value - stats.mean) / stats.standardDeviation
        : 0;

    upperBound.push(stats.mean + threshold * stats.standardDeviation);
    lowerBound.push(stats.mean - threshold * stats.standardDeviation);

    if (Math.abs(zScore) > threshold) {
      let severity: "mild" | "moderate" | "severe";
      if (Math.abs(zScore) > threshold * 2) {
        severity = "severe";
      } else if (Math.abs(zScore) > threshold * 1.5) {
        severity = "moderate";
      } else {
        severity = "mild";
      }

      anomalies.push({
        index: i,
        timestamp: dataPoints[i].timestamp,
        value: dataPoints[i].value,
        expectedValue: stats.mean,
        zScore,
        severity,
      });
    }
  }

  return { anomalies, threshold, upperBound, lowerBound };
}

/**
 * Detect seasonality using autocorrelation
 */
export function detectSeasonality(
  dataPoints: DataPoint[],
  maxPeriod: number = 30,
): SeasonalityResult {
  const values = dataPoints.map(d => d.value);
  const n = values.length;

  if (n < maxPeriod * 2) {
    return {
      hasSeasonality: false,
      periodDays: 0,
      amplitude: 0,
      phase: 0,
      confidence: 0,
    };
  }

  const stats = calculateStatistics(values);

  // Calculate autocorrelation for different lags
  let bestCorrelation = 0;
  let bestPeriod = 0;

  for (let lag = 7; lag <= maxPeriod; lag++) {
    let sum = 0;
    let count = 0;

    for (let i = 0; i < n - lag; i++) {
      sum += (values[i] - stats.mean) * (values[i + lag] - stats.mean);
      count++;
    }

    const correlation = sum / (count * stats.standardDeviation * stats.standardDeviation);

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestPeriod = lag;
    }
  }

  const hasSeasonality = bestCorrelation > 0.5;
  const amplitude = hasSeasonality ? stats.standardDeviation : 0;

  return {
    hasSeasonality,
    periodDays: bestPeriod,
    amplitude,
    phase: 0, // Would require more complex calculation
    confidence: bestCorrelation * 100,
  };
}

/**
 * Project future values based on trend
 */
export function projectTrend(dataPoints: DataPoint[], daysAhead: number): DataPoint[] {
  const trend = analyzeTrend(dataPoints);
  const lastPoint = dataPoints[dataPoints.length - 1];
  const lastDate = new Date(lastPoint.timestamp);

  const projections: DataPoint[] = [];

  for (let i = 1; i <= daysAhead; i++) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i);

    // Simple linear projection
    const projectedValue = trend.endValue + trend.slope * i;

    projections.push({
      timestamp: date.toISOString(),
      value: Math.max(0, projectedValue), // Ensure non-negative
      metadata: {
        isProjection: true,
        confidence: Math.max(0, trend.confidence - i * 5), // Decreasing confidence
      },
    });
  }

  return projections;
}
