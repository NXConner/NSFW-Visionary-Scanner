/**
 * Advanced Health Data Analytics System
 * Provides multi-metric correlation analysis, trend predictions, risk identification, and report generation
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { getSexualWellnessEntries, getSexualWellnessStatistics } from './sexualWellness'
import { 
  getProstateHealthEntries,
  getTesticularHealthEntries,
  getSexualHealthEntries,
  getHormoneLevels,
  getUrinaryHealthEntries
} from './healthMonitoring'

export interface HealthCorrelation {
  metric1: string
  metric2: string
  correlation: number // -1 to 1
  strength: 'weak' | 'moderate' | 'strong'
  direction: 'positive' | 'negative'
  significance: number // 0 to 1
}

export interface HealthTrend {
  metric: string
  trend: 'improving' | 'declining' | 'stable'
  rate: number // percentage change per period
  confidence: number // 0 to 1
  projection: {
    value: number
    date: string
  }[]
}

export interface HealthRiskFactor {
  factor: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affectedMetrics: string[]
  recommendations: string[]
  urgency: 'routine' | 'soon' | 'urgent'
}

export interface HealthGoal {
  id?: string
  user_id?: string
  goal_type: string
  target_value: number
  target_date?: string
  current_value?: number
  progress_percentage?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface HealthReport {
  id: string
  report_type: 'summary' | 'detailed' | 'comparison' | 'trend' | 'risk'
  generated_at: string
  period_start: string
  period_end: string
  summary: {
    overall_health_score: number
    key_metrics: Record<string, number>
    trends: HealthTrend[]
    risks: HealthRiskFactor[]
    recommendations: string[]
  }
  data: any
}

/**
 * Calculate correlations between health metrics
 */
export async function calculateHealthCorrelations(
  startDate?: string,
  endDate?: string
): Promise<HealthCorrelation[]> {
  try {
    // Get all health data
    const [
      sexualWellness,
      prostateHealth,
      testicularHealth,
      sexualHealth,
      hormoneLevels,
      urinaryHealth
    ] = await Promise.all([
      getSexualWellnessEntries(startDate, endDate),
      getProstateHealthEntries(startDate, endDate),
      getTesticularHealthEntries(startDate, endDate),
      getSexualHealthEntries(startDate, endDate),
      getHormoneLevels(startDate, endDate),
      getUrinaryHealthEntries(startDate, endDate)
    ])

    // Combine and normalize data
    const metrics: Record<string, number[]> = {}
    
    // Extract metrics from different sources
    sexualWellness.forEach(entry => {
      if (entry.erectile_function_score !== undefined) {
        if (!metrics['erectile_function']) metrics['erectile_function'] = []
        metrics['erectile_function'].push(entry.erectile_function_score)
      }
      if (entry.libido_level !== undefined) {
        if (!metrics['libido']) metrics['libido'] = []
        metrics['libido'].push(entry.libido_level)
      }
      if (entry.wellness_score !== undefined) {
        if (!metrics['sexual_wellness']) metrics['sexual_wellness'] = []
        metrics['sexual_wellness'].push(entry.wellness_score)
      }
    })

    // Calculate correlations between all pairs
    const correlations: HealthCorrelation[] = []
    const metricNames = Object.keys(metrics)
    
    for (let i = 0; i < metricNames.length; i++) {
      for (let j = i + 1; j < metricNames.length; j++) {
        const metric1 = metricNames[i]
        const metric2 = metricNames[j]
        const values1 = metrics[metric1]
        const values2 = metrics[metric2]
        
        // Find matching entries (by date or index)
        const minLength = Math.min(values1.length, values2.length)
        if (minLength < 3) continue // Need at least 3 data points
        
        const paired1 = values1.slice(0, minLength)
        const paired2 = values2.slice(0, minLength)
        
        const correlation = calculatePearsonCorrelation(paired1, paired2)
        const absCorrelation = Math.abs(correlation)
        
        if (absCorrelation > 0.3) { // Only include meaningful correlations
          correlations.push({
            metric1,
            metric2,
            correlation,
            strength: absCorrelation > 0.7 ? 'strong' : absCorrelation > 0.5 ? 'moderate' : 'weak',
            direction: correlation > 0 ? 'positive' : 'negative',
            significance: absCorrelation
          })
        }
      }
    }

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
  } catch (error) {
    logger.error('Failed to calculate health correlations', { error })
    throw error
  }
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n === 0) return 0

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * Analyze health trends
 */
export async function analyzeHealthTrends(
  metric: string,
  startDate?: string,
  endDate?: string
): Promise<HealthTrend> {
  try {
    // Get data for the metric
    const data: number[] = []
    const dates: string[] = []

    // Fetch appropriate data based on metric
    if (metric.includes('sexual') || metric.includes('wellness') || metric.includes('erectile') || metric.includes('libido')) {
      const entries = await getSexualWellnessEntries(startDate, endDate)
      entries.forEach(entry => {
        let value: number | undefined
        if (metric === 'erectile_function') value = entry.erectile_function_score
        else if (metric === 'libido') value = entry.libido_level
        else if (metric === 'sexual_wellness') value = entry.wellness_score
        else if (metric === 'satisfaction') value = entry.overall_satisfaction
        
        if (value !== undefined) {
          data.push(value)
          dates.push(entry.entry_date)
        }
      })
    }

    if (data.length < 3) {
      return {
        metric,
        trend: 'stable',
        rate: 0,
        confidence: 0,
        projection: []
      }
    }

    // Calculate trend using linear regression
    const n = data.length
    const x = Array.from({ length: n }, (_, i) => i)
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = data.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const avgY = sumY / n
    const rate = (slope / avgY) * 100 // Percentage change per period

    // Determine trend
    let trend: 'improving' | 'declining' | 'stable' = 'stable'
    if (rate > 2) trend = 'improving'
    else if (rate < -2) trend = 'declining'

    // Calculate confidence (based on data points and variance)
    const variance = data.reduce((sum, val) => sum + Math.pow(val - avgY, 2), 0) / n
    const confidence = Math.min(1, Math.max(0, 1 - (variance / (avgY * avgY))))

    // Generate projection (next 3 periods)
    const lastValue = data[data.length - 1]
    const lastDate = new Date(dates[dates.length - 1])
    const projection = []
    
    for (let i = 1; i <= 3; i++) {
      const projectedValue = lastValue + (slope * i)
      const projectedDate = new Date(lastDate)
      projectedDate.setDate(projectedDate.getDate() + (i * 7)) // Weekly projection
      
      projection.push({
        value: Math.max(0, projectedValue),
        date: projectedDate.toISOString().split('T')[0]
      })
    }

    return {
      metric,
      trend,
      rate,
      confidence,
      projection
    }
  } catch (error) {
    logger.error('Failed to analyze health trends', { error, metric })
    throw error
  }
}

/**
 * Identify health risk factors
 */
export async function identifyHealthRiskFactors(
  startDate?: string,
  endDate?: string
): Promise<HealthRiskFactor[]> {
  try {
    const risks: HealthRiskFactor[] = []
    
    // Get current health data
    const sexualWellnessStats = await getSexualWellnessStatistics(startDate, endDate)
    
    // Check for low scores
    if (sexualWellnessStats.averageErectileFunction < 5) {
      risks.push({
        factor: 'Low Erectile Function',
        severity: sexualWellnessStats.averageErectileFunction < 3 ? 'critical' : 'high',
        description: `Average erectile function score is ${sexualWellnessStats.averageErectileFunction.toFixed(1)}/10, which is below normal range.`,
        affectedMetrics: ['erectile_function', 'sexual_wellness', 'satisfaction'],
        recommendations: [
          'Consult with a healthcare provider',
          'Review lifestyle factors (exercise, diet, sleep)',
          'Consider stress management techniques',
          'Monitor blood pressure and cardiovascular health'
        ],
        urgency: sexualWellnessStats.averageErectileFunction < 3 ? 'urgent' : 'soon'
      })
    }

    if (sexualWellnessStats.averageLibido < 5) {
      risks.push({
        factor: 'Low Libido',
        severity: sexualWellnessStats.averageLibido < 3 ? 'high' : 'medium',
        description: `Average libido level is ${sexualWellnessStats.averageLibido.toFixed(1)}/10, which may indicate hormonal or psychological factors.`,
        affectedMetrics: ['libido', 'sexual_wellness', 'satisfaction'],
        recommendations: [
          'Check hormone levels (testosterone)',
          'Review stress and mental health',
          'Evaluate sleep quality',
          'Consider relationship factors'
        ],
        urgency: 'soon'
      })
    }

    if (sexualWellnessStats.averageSatisfaction < 5) {
      risks.push({
        factor: 'Low Sexual Satisfaction',
        severity: 'medium',
        description: `Average satisfaction score is ${sexualWellnessStats.averageSatisfaction.toFixed(1)}/10.`,
        affectedMetrics: ['satisfaction', 'sexual_wellness', 'confidence'],
        recommendations: [
          'Open communication with partner',
          'Explore new techniques or positions',
          'Address any relationship concerns',
          'Consider professional counseling'
        ],
        urgency: 'routine'
      })
    }

    // Check for declining trends
    if (sexualWellnessStats.trend === 'declining') {
      risks.push({
        factor: 'Declining Sexual Wellness',
        severity: 'medium',
        description: 'Overall sexual wellness trend is declining over the tracked period.',
        affectedMetrics: ['sexual_wellness', 'erectile_function', 'libido', 'satisfaction'],
        recommendations: [
          'Review recent lifestyle changes',
          'Check for new medications or health conditions',
          'Monitor stress levels',
          'Consider professional evaluation'
        ],
        urgency: 'soon'
      })
    }

    return risks.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  } catch (error) {
    logger.error('Failed to identify health risk factors', { error })
    throw error
  }
}

/**
 * Generate personalized health insights
 */
export async function generateHealthInsights(
  startDate?: string,
  endDate?: string
): Promise<string[]> {
  try {
    const insights: string[] = []
    const stats = await getSexualWellnessStatistics(startDate, endDate)
    const trends = await Promise.all([
      analyzeHealthTrends('erectile_function', startDate, endDate),
      analyzeHealthTrends('libido', startDate, endDate),
      analyzeHealthTrends('sexual_wellness', startDate, endDate)
    ])

    // Generate insights based on data
    if (stats.trend === 'improving') {
      insights.push('Your sexual wellness is showing positive trends. Keep up the good work!')
    } else if (stats.trend === 'declining') {
      insights.push('Your sexual wellness has been declining. Consider reviewing lifestyle factors and consulting a healthcare provider.')
    }

    if (stats.averageErectileFunction >= 8) {
      insights.push('Your erectile function scores are excellent. Maintain your current routine.')
    } else if (stats.averageErectileFunction < 5) {
      insights.push('Your erectile function may benefit from lifestyle improvements or medical evaluation.')
    }

    if (stats.averageLibido >= 7) {
      insights.push('Your libido levels are healthy. Continue monitoring to maintain optimal levels.')
    }

    const erectileTrend = trends.find(t => t.metric === 'erectile_function')
    if (erectileTrend && erectileTrend.trend === 'improving' && erectileTrend.rate > 5) {
      insights.push(`Your erectile function is improving at a rate of ${erectileTrend.rate.toFixed(1)}% per period.`)
    }

    return insights
  } catch (error) {
    logger.error('Failed to generate health insights', { error })
    throw error
  }
}

/**
 * Generate health report
 */
export async function generateHealthReport(
  reportType: 'summary' | 'detailed' | 'comparison' | 'trend' | 'risk',
  startDate?: string,
  endDate?: string
): Promise<HealthReport> {
  try {
    const stats = await getSexualWellnessStatistics(startDate, endDate)
    const trends = await Promise.all([
      analyzeHealthTrends('erectile_function', startDate, endDate),
      analyzeHealthTrends('libido', startDate, endDate),
      analyzeHealthTrends('sexual_wellness', startDate, endDate)
    ])
    const risks = await identifyHealthRiskFactors(startDate, endDate)
    const insights = await generateHealthInsights(startDate, endDate)
    const correlations = await calculateHealthCorrelations(startDate, endDate)

    const report: HealthReport = {
      id: `report-${Date.now()}`,
      report_type: reportType,
      generated_at: new Date().toISOString(),
      period_start: startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      period_end: endDate || new Date().toISOString().split('T')[0],
      summary: {
        overall_health_score: stats.averageWellnessScore,
        key_metrics: {
          erectile_function: stats.averageErectileFunction,
          libido: stats.averageLibido,
          satisfaction: stats.averageSatisfaction,
          confidence: stats.averageConfidence,
          total_activities: stats.totalActivities
        },
        trends,
        risks,
        recommendations: insights
      },
      data: {
        statistics: stats,
        correlations,
        trends,
        risks,
        insights
      }
    }

    return report
  } catch (error) {
    logger.error('Failed to generate health report', { error })
    throw error
  }
}

/**
 * Export health data
 */
export async function exportHealthData(
  format: 'json' | 'csv' | 'pdf',
  startDate?: string,
  endDate?: string
): Promise<string | Blob> {
  try {
    const report = await generateHealthReport('detailed', startDate, endDate)
    
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2)
      case 'csv': {
        // Convert to CSV format
        const csvRows = [
          ['Metric', 'Value', 'Date'],
          ['Overall Health Score', report.summary.overall_health_score.toString(), report.generated_at],
          ...Object.entries(report.summary.key_metrics).map(([key, value]) => [key, value.toString(), report.generated_at])
        ]
        return csvRows.map(row => row.join(',')).join('\n')
      }
      case 'pdf':
        // For PDF, return a data URL or trigger download
        // This would typically use a PDF generation library
        throw new Error('PDF export not yet implemented')
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  } catch (error) {
    logger.error('Failed to export health data', { error })
    throw error
  }
}

