/**
 * Advanced Reporting System
 * Handles custom report builder, scheduled reports, report sharing, comparative analytics, predictive modeling, and health risk scoring
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Custom Reports ====================

export interface CustomReport {
  id: string
  user_id: string
  report_name: string
  description: string | null
  report_type: 'health_summary' | 'detailed_analysis' | 'comparison' | 'trend' | 'risk_assessment' | 'custom'
  report_config: any
  selected_metrics: string[]
  date_range: any
  theme: 'default' | 'dark' | 'light' | 'medical' | 'minimal'
  color_scheme: any
  chart_types: any
  is_shared: boolean
  share_token: string | null
  shared_with_users: string[] | null
  shared_with_doctors: string[] | null
  is_scheduled: boolean
  schedule_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | null
  schedule_day: number | null
  schedule_time: string | null
  next_scheduled_at: string | null
  last_generated_at: string | null
  generation_count: number
  view_count: number
  share_count: number
  is_favorite: boolean
  is_template: boolean
  created_at: string
  updated_at: string
}

export async function createCustomReport(
  reportName: string,
  reportType: CustomReport['report_type'],
  reportConfig: any,
  selectedMetrics: string[],
  dateRange: any,
  description?: string
): Promise<CustomReport | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create a report')
      return null
    }

    const { data, error } = await supabase
      .from('custom_reports')
      .insert({
        user_id: user.id,
        report_name: reportName,
        description,
        report_type: reportType,
        report_config: reportConfig,
        selected_metrics: selectedMetrics,
        date_range: dateRange
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating custom report:', error)
      toast.error('Failed to create report')
      return null
    }

    toast.success('Report created!')
    return data as CustomReport
  } catch (error) {
    logger.error('Error in createCustomReport:', error)
    return null
  }
}

export async function generateReport(
  customReportId: string,
  format?: 'json' | 'pdf' | 'excel' | 'csv' | 'hl7_fhir' | 'xml'
): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to generate report')
      return null
    }

    // Call report generation Edge Function
    const { data, error } = await supabase.functions.invoke('generate-custom-report', {
      body: {
        custom_report_id: customReportId,
        format: format || 'pdf'
      }
    })

    if (error) {
      logger.error('Error generating report:', error)
      toast.error('Failed to generate report')
      return null
    }

    // Update report generation count
    await supabase.rpc('increment', {
      table_name: 'custom_reports',
      column_name: 'generation_count',
      id: customReportId
    })

    toast.success('Report generated!')
    return data.download_url || data.file_url
  } catch (error) {
    logger.error('Error in generateReport:', error)
    return null
  }
}

export async function scheduleReport(
  customReportId: string,
  frequency: CustomReport['schedule_frequency'],
  scheduleDay: number,
  scheduleTime: string
): Promise<boolean> {
  try {
    // Calculate next scheduled time
    const now = new Date()
    let nextScheduled = new Date()

    switch (frequency) {
      case 'daily':
        nextScheduled.setDate(now.getDate() + 1)
        break
      case 'weekly':
        const daysUntil = (scheduleDay - now.getDay() + 7) % 7 || 7
        nextScheduled.setDate(now.getDate() + daysUntil)
        break
      case 'monthly':
        nextScheduled.setMonth(now.getMonth() + 1)
        nextScheduled.setDate(scheduleDay)
        break
      // Add other frequencies as needed
    }

    const [hours, minutes] = scheduleTime.split(':').map(Number)
    nextScheduled.setHours(hours, minutes, 0, 0)

    const { error } = await supabase
      .from('custom_reports')
      .update({
        is_scheduled: true,
        schedule_frequency: frequency,
        schedule_day: scheduleDay,
        schedule_time: scheduleTime,
        next_scheduled_at: nextScheduled.toISOString()
      })
      .eq('id', customReportId)

    if (error) {
      logger.error('Error scheduling report:', error)
      toast.error('Failed to schedule report')
      return false
    }

    toast.success('Report scheduled!')
    return true
  } catch (error) {
    logger.error('Error in scheduleReport:', error)
    return false
  }
}

// ==================== Report Templates ====================

export interface ReportTemplate {
  id: string
  template_name: string
  description: string | null
  category: 'health_summary' | 'detailed' | 'comparison' | 'trend' | 'risk' | 'medical' | 'fitness' | null
  template_config: any
  default_metrics: string[] | null
  default_date_range: any
  preview_image_url: string | null
  preview_description: string | null
  usage_count: number
  is_featured: boolean
  is_premium: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export async function getReportTemplates(category?: ReportTemplate['category']): Promise<ReportTemplate[]> {
  try {
    let query = supabase
      .from('report_templates')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('usage_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching templates:', error)
      return []
    }

    return (data || []) as ReportTemplate[]
  } catch (error) {
    logger.error('Error in getReportTemplates:', error)
    return []
  }
}

// ==================== Comparative Analytics ====================

export interface ComparativeAnalytics {
  id: string
  user_id: string
  comparison_type: 'time_period' | 'user_group' | 'population' | 'goal' | 'baseline'
  baseline_data: any
  comparison_data: any
  differences: any
  percentage_changes: any
  comparison_period: any
  comparison_group: string | null
  insights: string[] | null
  significant_changes: any
  created_at: string
}

export async function createComparativeAnalysis(
  comparisonType: ComparativeAnalytics['comparison_type'],
  baselineData: any,
  comparisonData: any,
  comparisonPeriod: any
): Promise<ComparativeAnalytics | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create comparison')
      return null
    }

    // Calculate differences and percentage changes
    const differences: any = {}
    const percentageChanges: any = {}

    for (const key in baselineData) {
      if (typeof baselineData[key] === 'number' && typeof comparisonData[key] === 'number') {
        differences[key] = comparisonData[key] - baselineData[key]
        percentageChanges[key] = baselineData[key] !== 0
          ? ((comparisonData[key] - baselineData[key]) / baselineData[key]) * 100
          : 0
      }
    }

    const { data, error } = await supabase
      .from('comparative_analytics')
      .insert({
        user_id: user.id,
        comparison_type: comparisonType,
        baseline_data: baselineData,
        comparison_data: comparisonData,
        differences,
        percentage_changes,
        comparison_period: comparisonPeriod
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating comparison:', error)
      toast.error('Failed to create comparison')
      return null
    }

    return data as ComparativeAnalytics
  } catch (error) {
    logger.error('Error in createComparativeAnalysis:', error)
    return null
  }
}

// ==================== Predictive Modeling ====================

export interface PredictiveModelingResult {
  id: string
  user_id: string
  model_type: 'growth_prediction' | 'health_risk' | 'outcome_simulation' | 'trend_forecast'
  input_data: any
  prediction_horizon_days: number
  predictions: any
  confidence_intervals: any
  confidence_level: number
  model_version: string | null
  model_accuracy: number | null
  scenarios: any
  recommendations: string[] | null
  generated_at: string
  created_at: string
}

export async function generatePredictiveModel(
  modelType: PredictiveModelingResult['model_type'],
  predictionHorizonDays: number = 90
): Promise<PredictiveModelingResult | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to generate predictions')
      return null
    }

    // Call predictive modeling Edge Function
    const { data, error } = await supabase.functions.invoke('predictive-modeling', {
      body: {
        model_type: modelType,
        prediction_horizon_days: predictionHorizonDays
      }
    })

    if (error) {
      logger.error('Error generating predictions:', error)
      toast.error('Failed to generate predictions')
      return null
    }

    // Save result
    const { data: result, error: saveError } = await supabase
      .from('predictive_modeling_results')
      .insert({
        user_id: user.id,
        model_type: modelType,
        input_data: data.input_data,
        prediction_horizon_days: predictionHorizonDays,
        predictions: data.predictions,
        confidence_intervals: data.confidence_intervals,
        confidence_level: data.confidence_level,
        model_version: data.model_version,
        model_accuracy: data.model_accuracy,
        scenarios: data.scenarios,
        recommendations: data.recommendations
      })
      .select()
      .single()

    if (saveError) {
      logger.error('Error saving predictions:', saveError)
      return null
    }

    return result as PredictiveModelingResult
  } catch (error) {
    logger.error('Error in generatePredictiveModel:', error)
    return null
  }
}

// ==================== Health Risk Scoring ====================

export interface HealthRiskScore {
  id: string
  user_id: string
  risk_category: 'erectile_dysfunction' | 'peyronies' | 'prostate' | 'testicular' | 'general_sexual_health' | 'overall'
  overall_risk_score: number
  risk_level: 'low' | 'moderate' | 'high' | 'very_high'
  risk_factors: any[]
  contributing_metrics: any
  compared_to_population: boolean
  population_percentile: number | null
  recommendations: string[] | null
  urgency_level: 'routine' | 'soon' | 'urgent' | 'immediate' | null
  calculated_at: string
  valid_until: string | null
  created_at: string
}

export async function calculateHealthRiskScore(
  riskCategory: HealthRiskScore['risk_category']
): Promise<HealthRiskScore | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to calculate risk score')
      return null
    }

    // Call risk scoring Edge Function
    const { data, error } = await supabase.functions.invoke('calculate-health-risk', {
      body: { risk_category: riskCategory }
    })

    if (error) {
      logger.error('Error calculating risk score:', error)
      toast.error('Failed to calculate risk score')
      return null
    }

    // Save risk score
    const { data: riskScore, error: saveError } = await supabase
      .from('health_risk_scores')
      .insert({
        user_id: user.id,
        risk_category: riskCategory,
        overall_risk_score: data.overall_risk_score,
        risk_level: data.risk_level,
        risk_factors: data.risk_factors,
        contributing_metrics: data.contributing_metrics,
        compared_to_population: data.compared_to_population,
        population_percentile: data.population_percentile,
        recommendations: data.recommendations,
        urgency_level: data.urgency_level,
        valid_until: data.valid_until
      })
      .select()
      .single()

    if (saveError) {
      logger.error('Error saving risk score:', saveError)
      return null
    }

    return riskScore as HealthRiskScore
  } catch (error) {
    logger.error('Error in calculateHealthRiskScore:', error)
    return null
  }
}

export async function getHealthRiskScores(
  riskCategory?: HealthRiskScore['risk_category']
): Promise<HealthRiskScore[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('health_risk_scores')
      .select('*')
      .eq('user_id', user.id)
      .order('calculated_at', { ascending: false })

    if (riskCategory) {
      query = query.eq('risk_category', riskCategory)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching risk scores:', error)
      return []
    }

    return (data || []) as HealthRiskScore[]
  } catch (error) {
    logger.error('Error in getHealthRiskScores:', error)
    return []
  }
}

