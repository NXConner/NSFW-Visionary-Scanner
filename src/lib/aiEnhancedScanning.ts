/**
 * AI-Enhanced Scanning
 * Handles real-time health condition detection, automatic measurement suggestions, quality assessment, anomaly detection, and health trend visualization
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== AI Scan Analysis ====================

export interface AIScanAnalysis {
  id: string
  scan_id: string | null
  user_id: string
  analysis_type: 'health_detection' | 'measurement_suggestion' | 'quality_assessment' | 'anomaly_detection' | 'comparison' | 'trend_visualization'
  detected_conditions: any[] | null
  risk_factors: any[] | null
  health_alerts: any[] | null
  suggested_measurements: any | null
  measurement_confidence: number | null
  measurement_reasoning: string | null
  overall_quality_score: number | null
  quality_breakdown: any | null
  quality_recommendations: string[] | null
  anomalies_detected: any[] | null
  anomaly_confidence: number | null
  previous_scan_id: string | null
  comparison_results: any | null
  trend_direction: 'improving' | 'stable' | 'declining' | 'fluctuating' | null
  trend_data: any | null
  visualization_url: string | null
  ai_model_version: string | null
  ai_model_confidence: number | null
  processing_time_ms: number | null
  analyzed_at: string
  created_at: string
}

export async function analyzeScanWithAI(
  scanId: string,
  analysisTypes: AIScanAnalysis['analysis_type'][]
): Promise<AIScanAnalysis[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to analyze scan')
      return []
    }

    // Call AI analysis Edge Function
    const { data, error } = await supabase.functions.invoke('analyze-scan-ai', {
      body: {
        scan_id: scanId,
        analysis_types: analysisTypes
      }
    })

    if (error) {
      logger.error('Error analyzing scan:', error)
      toast.error('Failed to analyze scan')
      return []
    }

    return (data.analyses || []) as AIScanAnalysis[]
  } catch (error) {
    logger.error('Error in analyzeScanWithAI:', error)
    return []
  }
}

export async function getRealTimeScanFeedback(
  imageData: string, // Base64 image or image URL
  sessionId: string
): Promise<any> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Call real-time analysis Edge Function
    const { data, error } = await supabase.functions.invoke('real-time-scan-analysis', {
      body: {
        image_data: imageData,
        session_id: sessionId
      }
    })

    if (error) {
      logger.error('Error getting real-time feedback:', error)
      return null
    }

    // Save feedback to database
    await supabase
      .from('real_time_scan_feedback')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        frame_analysis: data.analysis,
        quality_score: data.quality_score,
        suggestions: data.suggestions,
        warnings: data.warnings,
        detected_objects: data.detected_objects,
        preview_measurements: data.measurements
      })

    return data
  } catch (error) {
    logger.error('Error in getRealTimeScanFeedback:', error)
    return null
  }
}

// ==================== Measurement Suggestions ====================

export interface MeasurementSuggestion {
  id: string
  scan_id: string | null
  user_id: string
  suggestion_type: 'angle_adjustment' | 'distance_adjustment' | 'lighting_improvement' | 'focus_improvement' | 'position_correction'
  current_value: number | null
  suggested_value: number
  improvement_expected: number
  reasoning: string | null
  priority: 'low' | 'medium' | 'high'
  is_applied: boolean
  applied_at: string | null
  created_at: string
}

export async function getMeasurementSuggestions(scanId: string): Promise<MeasurementSuggestion[]> {
  try {
    const { data, error } = await supabase
      .from('measurement_suggestions')
      .select('*')
      .eq('scan_id', scanId)
      .order('priority', { ascending: false })
      .order('improvement_expected', { ascending: false })

    if (error) {
      logger.error('Error fetching suggestions:', error)
      return []
    }

    return (data || []) as MeasurementSuggestion[]
  } catch (error) {
    logger.error('Error in getMeasurementSuggestions:', error)
    return []
  }
}

export async function applyMeasurementSuggestion(suggestionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('measurement_suggestions')
      .update({
        is_applied: true,
        applied_at: new Date().toISOString()
      })
      .eq('id', suggestionId)

    if (error) {
      logger.error('Error applying suggestion:', error)
      return false
    }

    toast.success('Suggestion applied!')
    return true
  } catch (error) {
    logger.error('Error in applyMeasurementSuggestion:', error)
    return false
  }
}

// ==================== Quality Assessment ====================

export interface QualityAssessment {
  id: string
  scan_id: string | null
  user_id: string
  overall_score: number
  lighting_score: number | null
  focus_score: number | null
  angle_score: number | null
  distance_score: number | null
  stability_score: number | null
  contrast_score: number | null
  recommendations: string[] | null
  critical_issues: string[] | null
  compared_to_average: boolean
  average_score: number | null
  percentile_rank: number | null
  assessed_at: string
  created_at: string
}

export async function assessScanQuality(scanId: string): Promise<QualityAssessment | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Call quality assessment Edge Function
    const { data, error } = await supabase.functions.invoke('assess-scan-quality', {
      body: { scan_id: scanId }
    })

    if (error) {
      logger.error('Error assessing quality:', error)
      return null
    }

    // Save assessment
    const { data: assessment, error: saveError } = await supabase
      .from('quality_assessment_history')
      .insert({
        user_id: user.id,
        scan_id: scanId,
        overall_score: data.overall_score,
        lighting_score: data.lighting_score,
        focus_score: data.focus_score,
        angle_score: data.angle_score,
        distance_score: data.distance_score,
        stability_score: data.stability_score,
        contrast_score: data.contrast_score,
        recommendations: data.recommendations,
        critical_issues: data.critical_issues
      })
      .select()
      .single()

    if (saveError) {
      logger.error('Error saving assessment:', saveError)
      return null
    }

    return assessment as QualityAssessment
  } catch (error) {
    logger.error('Error in assessScanQuality:', error)
    return null
  }
}

// ==================== Anomaly Detection ====================

export interface AnomalyDetection {
  id: string
  scan_id: string | null
  user_id: string
  anomaly_type: 'measurement_outlier' | 'shape_anomaly' | 'color_anomaly' | 'texture_anomaly' | 'size_anomaly' | 'position_anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  description: string
  location: any
  affected_measurements: string[] | null
  compared_to_previous: boolean
  previous_scan_id: string | null
  deviation_amount: number | null
  recommendation: string | null
  requires_attention: boolean
  is_reviewed: boolean
  reviewed_at: string | null
  review_notes: string | null
  detected_at: string
  created_at: string
}

export async function detectAnomalies(scanId: string): Promise<AnomalyDetection[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Call anomaly detection Edge Function
    const { data, error } = await supabase.functions.invoke('detect-scan-anomalies', {
      body: { scan_id: scanId }
    })

    if (error) {
      logger.error('Error detecting anomalies:', error)
      return []
    }

    // Save detections
    if (data.anomalies && data.anomalies.length > 0) {
      const anomaliesToInsert = data.anomalies.map((anomaly: any) => ({
        user_id: user.id,
        scan_id: scanId,
        ...anomaly
      }))

      await supabase
        .from('anomaly_detection_log')
        .insert(anomaliesToInsert)
    }

    return (data.anomalies || []) as AnomalyDetection[]
  } catch (error) {
    logger.error('Error in detectAnomalies:', error)
    return []
  }
}

export async function getAnomalies(scanId?: string): Promise<AnomalyDetection[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('anomaly_detection_log')
      .select('*')
      .eq('user_id', user.id)
      .order('detected_at', { ascending: false })

    if (scanId) {
      query = query.eq('scan_id', scanId)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching anomalies:', error)
      return []
    }

    return (data || []) as AnomalyDetection[]
  } catch (error) {
    logger.error('Error in getAnomalies:', error)
    return []
  }
}

// ==================== Health Trend Visualization ====================

export interface HealthTrendVisualization {
  id: string
  user_id: string
  visualization_type: 'growth_trend' | 'measurement_trend' | 'health_score_trend' | 'comparison_trend'
  trend_data: any
  time_period_days: number | null
  data_points: any
  chart_image_url: string | null
  chart_config: any
  insights: string[] | null
  predictions: any
  generated_at: string
  created_at: string
}

export async function generateHealthTrendVisualization(
  visualizationType: HealthTrendVisualization['visualization_type'],
  timePeriodDays?: number
): Promise<HealthTrendVisualization | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Call visualization generation Edge Function
    const { data, error } = await supabase.functions.invoke('generate-trend-visualization', {
      body: {
        visualization_type: visualizationType,
        time_period_days: timePeriodDays
      }
    })

    if (error) {
      logger.error('Error generating visualization:', error)
      return null
    }

    // Save visualization
    const { data: viz, error: saveError } = await supabase
      .from('health_trend_visualizations')
      .insert({
        user_id: user.id,
        visualization_type: visualizationType,
        trend_data: data.trend_data,
        time_period_days: timePeriodDays || null,
        data_points: data.data_points,
        chart_image_url: data.chart_url,
        chart_config: data.chart_config,
        insights: data.insights,
        predictions: data.predictions
      })
      .select()
      .single()

    if (saveError) {
      logger.error('Error saving visualization:', saveError)
      return null
    }

    return viz as HealthTrendVisualization
  } catch (error) {
    logger.error('Error in generateHealthTrendVisualization:', error)
    return null
  }
}

