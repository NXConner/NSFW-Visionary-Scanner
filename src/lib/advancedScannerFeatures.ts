/**
 * Advanced Scanner Features
 * Handles multi-angle 3D reconstruction, time-lapse comparison, measurement templates, batch scanning, and 3D model export
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Multi-Angle 3D Reconstruction ====================

export interface MultiAngleScanSession {
  id: string
  user_id: string
  session_name: string | null
  scan_type: '3d_reconstruction' | 'time_lapse' | 'batch_scan'
  target_angles: number
  angles_captured: number
  is_complete: boolean
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  processing_started_at: string | null
  processing_completed_at: string | null
  processing_error: string | null
  reconstructed_3d_model_url: string | null
  model_format: 'obj' | 'stl' | 'ply' | 'gltf' | null
  point_cloud_url: string | null
  texture_map_url: string | null
  created_at: string
  updated_at: string
}

export interface MultiAngleScanImage {
  id: string
  session_id: string
  angle_index: number
  angle_degrees: number | null
  image_url: string
  thumbnail_url: string | null
  camera_position: any
  camera_rotation: any
  focal_length: number | null
  lighting_quality: number | null
  sharpness_score: number | null
  contrast_score: number | null
  measurements: any
  created_at: string
}

export async function createMultiAngleScanSession(
  sessionName: string,
  targetAngles: number = 8
): Promise<MultiAngleScanSession | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create a scan session')
      return null
    }

    const { data, error } = await supabase
      .from('multi_angle_scan_sessions')
      .insert({
        user_id: user.id,
        session_name: sessionName,
        target_angles: targetAngles,
        scan_type: '3d_reconstruction'
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating multi-angle session:', error)
      toast.error('Failed to create scan session')
      return null
    }

    return data as MultiAngleScanSession
  } catch (error) {
    logger.error('Error in createMultiAngleScanSession:', error)
    return null
  }
}

export async function addAngleToSession(
  sessionId: string,
  angleIndex: number,
  imageUrl: string,
  angleDegrees: number,
  measurements?: any
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('multi_angle_scan_images')
      .insert({
        session_id: sessionId,
        angle_index: angleIndex,
        angle_degrees: angleDegrees,
        image_url: imageUrl,
        measurements: measurements || null
      })

    if (error) {
      logger.error('Error adding angle:', error)
      return false
    }

    // Update session angles_captured count
    await supabase.rpc('increment', {
      table_name: 'multi_angle_scan_sessions',
      column_name: 'angles_captured',
      id: sessionId
    })

    return true
  } catch (error) {
    logger.error('Error in addAngleToSession:', error)
    return false
  }
}

export async function start3DReconstruction(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('multi_angle_scan_sessions')
      .update({
        processing_status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) {
      logger.error('Error starting reconstruction:', error)
      return false
    }

    // Trigger cloud processing job (would be handled by Edge Function)
    await supabase.functions.invoke('process-3d-reconstruction', {
      body: { session_id: sessionId }
    })

    return true
  } catch (error) {
    logger.error('Error in start3DReconstruction:', error)
    return false
  }
}

// ==================== Time-Lapse Comparison ====================

export interface TimeLapseComparison {
  id: string
  user_id: string
  comparison_name: string | null
  start_scan_id: string | null
  end_scan_id: string | null
  length_change: number | null
  circumference_change: number | null
  curvature_change: number | null
  time_period_days: number | null
  comparison_image_url: string | null
  overlay_image_url: string | null
  slider_image_url: string | null
  animated_gif_url: string | null
  growth_rate_per_month: number | null
  growth_percentage: number | null
  created_at: string
}

export async function createTimeLapseComparison(
  startScanId: string,
  endScanId: string,
  comparisonName?: string
): Promise<TimeLapseComparison | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create a comparison')
      return null
    }

    // Get scan data
    const { data: startScan } = await supabase
      .from('scans')
      .select('*')
      .eq('id', startScanId)
      .single()

    const { data: endScan } = await supabase
      .from('scans')
      .select('*')
      .eq('id', endScanId)
      .single()

    if (!startScan || !endScan) {
      toast.error('Scans not found')
      return null
    }

    // Calculate changes
    const lengthChange = (endScan.length || 0) - (startScan.length || 0)
    const circumferenceChange = (endScan.circumference || 0) - (startScan.circumference || 0)
    const curvatureChange = (endScan.curvature_angle || 0) - (startScan.curvature_angle || 0)
    
    const startDate = new Date(startScan.created_at)
    const endDate = new Date(endScan.created_at)
    const timePeriodDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const growthRatePerMonth = timePeriodDays > 0 ? (lengthChange / timePeriodDays) * 30 : 0
    const growthPercentage = startScan.length > 0 ? (lengthChange / startScan.length) * 100 : 0

    const { data, error } = await supabase
      .from('time_lapse_comparisons')
      .insert({
        user_id: user.id,
        comparison_name: comparisonName || `Comparison ${new Date().toLocaleDateString()}`,
        start_scan_id: startScanId,
        end_scan_id: endScanId,
        length_change: lengthChange,
        circumference_change: circumferenceChange,
        curvature_change: curvatureChange,
        time_period_days: timePeriodDays,
        growth_rate_per_month: growthRatePerMonth,
        growth_percentage: growthPercentage
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating comparison:', error)
      toast.error('Failed to create comparison')
      return null
    }

    // Generate comparison images (would be handled by Edge Function)
    await supabase.functions.invoke('generate-comparison-images', {
      body: { comparison_id: data.id, start_scan_id: startScanId, end_scan_id: endScanId }
    })

    toast.success('Time-lapse comparison created!')
    return data as TimeLapseComparison
  } catch (error) {
    logger.error('Error in createTimeLapseComparison:', error)
    return null
  }
}

export async function getTimeLapseComparisons(): Promise<TimeLapseComparison[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('time_lapse_comparisons')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching comparisons:', error)
      return []
    }

    return (data || []) as TimeLapseComparison[]
  } catch (error) {
    logger.error('Error in getTimeLapseComparisons:', error)
    return []
  }
}

// ==================== Measurement Templates ====================

export interface MeasurementTemplate {
  id: string
  user_id: string
  template_name: string
  description: string | null
  measurement_points: any
  reference_object_size: number | null
  calibration_data: any
  auto_capture_enabled: boolean
  quality_threshold: number
  angle_requirements: any
  is_default: boolean
  is_shared: boolean
  usage_count: number
  created_at: string
  updated_at: string
}

export async function createMeasurementTemplate(
  templateName: string,
  measurementPoints: any,
  description?: string,
  isDefault: boolean = false
): Promise<MeasurementTemplate | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create a template')
      return null
    }

    const { data, error } = await supabase
      .from('measurement_templates')
      .insert({
        user_id: user.id,
        template_name: templateName,
        description,
        measurement_points: measurementPoints,
        is_default: isDefault
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating template:', error)
      toast.error('Failed to create template')
      return null
    }

    toast.success('Template created!')
    return data as MeasurementTemplate
  } catch (error) {
    logger.error('Error in createMeasurementTemplate:', error)
    return null
  }
}

export async function getMeasurementTemplates(includeShared: boolean = true): Promise<MeasurementTemplate[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('measurement_templates')
      .select('*')
      .or(`user_id.eq.${user.id}${includeShared ? ',is_shared.eq.true' : ''}`)
      .order('is_default', { ascending: false })
      .order('usage_count', { ascending: false })

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching templates:', error)
      return []
    }

    return (data || []) as MeasurementTemplate[]
  } catch (error) {
    logger.error('Error in getMeasurementTemplates:', error)
    return []
  }
}

// ==================== Batch Scanning ====================

export interface BatchScanSession {
  id: string
  user_id: string
  session_name: string | null
  batch_type: 'daily' | 'weekly' | 'custom' | 'routine'
  target_count: number | null
  scans_captured: number
  is_complete: boolean
  scheduled_start_time: string | null
  scheduled_end_time: string | null
  interval_minutes: number | null
  average_measurements: any
  measurement_variance: any
  created_at: string
  updated_at: string
}

export async function createBatchScanSession(
  sessionName: string,
  batchType: BatchScanSession['batch_type'],
  targetCount: number,
  intervalMinutes?: number
): Promise<BatchScanSession | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create a batch session')
      return null
    }

    const { data, error } = await supabase
      .from('batch_scan_sessions')
      .insert({
        user_id: user.id,
        session_name: sessionName,
        batch_type: batchType,
        target_count: targetCount,
        interval_minutes: intervalMinutes || null
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating batch session:', error)
      toast.error('Failed to create batch session')
      return null
    }

    return data as BatchScanSession
  } catch (error) {
    logger.error('Error in createBatchScanSession:', error)
    return null
  }
}

// ==================== 3D Model Export ====================

export interface Exported3DModel {
  id: string
  user_id: string
  session_id: string | null
  export_format: 'obj' | 'stl' | 'ply' | 'gltf' | 'fbx'
  file_url: string
  file_size_bytes: number | null
  include_texture: boolean
  include_measurements: boolean
  quality_level: 'low' | 'medium' | 'high' | 'ultra'
  download_count: number
  last_downloaded_at: string | null
  created_at: string
}

export async function export3DModel(
  sessionId: string,
  format: Exported3DModel['export_format'],
  qualityLevel: Exported3DModel['quality_level'] = 'high',
  includeTexture: boolean = true,
  includeMeasurements: boolean = true
): Promise<Exported3DModel | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to export 3D model')
      return null
    }

    // Trigger export job (would be handled by Edge Function)
    const { data: jobData, error: jobError } = await supabase.functions.invoke('export-3d-model', {
      body: {
        session_id: sessionId,
        format,
        quality_level: qualityLevel,
        include_texture: includeTexture,
        include_measurements: includeMeasurements
      }
    })

    if (jobError) {
      logger.error('Error triggering export:', jobError)
      toast.error('Failed to start export')
      return null
    }

    // Create export record
    const { data, error } = await supabase
      .from('exported_3d_models')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        export_format: format,
        file_url: jobData.file_url,
        file_size_bytes: jobData.file_size,
        include_texture: includeTexture,
        include_measurements: includeMeasurements,
        quality_level: qualityLevel
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating export record:', error)
      return null
    }

    toast.success('3D model export started!')
    return data as Exported3DModel
  } catch (error) {
    logger.error('Error in export3DModel:', error)
    return null
  }
}

export async function getExported3DModels(): Promise<Exported3DModel[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('exported_3d_models')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching exports:', error)
      return []
    }

    return (data || []) as Exported3DModel[]
  } catch (error) {
    logger.error('Error in getExported3DModels:', error)
    return []
  }
}

