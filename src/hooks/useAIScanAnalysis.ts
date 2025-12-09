/**
 * useAIScanAnalysis Hook
 * Provides AI-powered analysis for scan data
 */

import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/lib/logger'

export interface ScanData {
  length?: number
  circumference?: number
  curvature?: number
  image?: string
  [key: string]: any
}

export interface AnalysisResult {
  condition?: string
  confidence?: number
  recommendations?: string[]
  severity?: 'low' | 'medium' | 'high'
  findings?: {
    category: string
    description: string
    severity: string
  }[]
  measurements?: {
    length?: { value: number; unit: string; percentile?: number }
    circumference?: { value: number; unit: string; percentile?: number }
    curvature?: { value: number; unit: string; status?: string }
  }
  healthIndicators?: {
    overall: string
    details: string[]
  }
  [key: string]: any
}

export interface UseAIScanAnalysisReturn {
  analyzeImage: (imageData: string) => Promise<AnalysisResult | null>
  analyzeScan: (scanData: ScanData) => Promise<void>
  isAnalyzing: boolean
  result: AnalysisResult | null
  analysis: AnalysisResult | null
  error: string | null
  reset: () => void
  clearAnalysis: () => void
}

export function useAIScanAnalysis(): UseAIScanAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Validate scan data before analysis
   */
  const validateScanData = (scanData: ScanData): { valid: boolean; error?: string } => {
    // Check for negative values
    if (scanData.length !== undefined && scanData.length < 0) {
      return { valid: false, error: 'Invalid scan data: length cannot be negative' }
    }
    if (scanData.circumference !== undefined && scanData.circumference < 0) {
      return { valid: false, error: 'Invalid scan data: circumference cannot be negative' }
    }
    if (scanData.curvature !== undefined && (scanData.curvature < 0 || scanData.curvature > 90)) {
      return { valid: false, error: 'Invalid scan data: curvature must be between 0 and 90 degrees' }
    }

    // Require at least some data
    const hasData = scanData.length !== undefined || 
                    scanData.circumference !== undefined || 
                    scanData.image !== undefined
    
    if (!hasData) {
      return { valid: false, error: 'Invalid scan data: no measurement data provided' }
    }

    return { valid: true }
  }

  /**
   * Analyze scan data using AI
   */
  const analyzeScan = useCallback(async (scanData: ScanData): Promise<void> => {
    // Validate input
    const validation = validateScanData(scanData)
    if (!validation.valid) {
      setError(validation.error || 'Invalid scan data')
      setIsAnalyzing(false)
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('ai-scan-analysis', {
        body: scanData
      })

      if (invokeError) {
        logger.error('AI scan analysis failed', { error: invokeError })
        setError(invokeError.message || 'Analysis failed')
        setResult(null)
        return
      }

      setResult(data)
      setError(null)

      logger.info('AI scan analysis completed', { 
        condition: data?.condition,
        confidence: data?.confidence 
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error('AI scan analysis error', { error: errorMessage })
      setError(errorMessage)
      setResult(null)
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  /**
   * Analyze image data using AI
   */
  const analyzeImage = useCallback(async (imageData: string): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('ai-scan-analysis', {
        body: { image: imageData }
      })

      if (invokeError) {
        logger.error('AI image analysis failed', { error: invokeError })
        setError(invokeError.message || 'Analysis failed')
        return null
      }

      setResult(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error('AI image analysis error', { error: errorMessage })
      setError(errorMessage)
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  /**
   * Reset/clear analysis state
   */
  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setIsAnalyzing(false)
  }, [])

  /**
   * Alias for reset (backwards compatibility)
   */
  const clearAnalysis = reset

  return {
    analyzeImage,
    analyzeScan,
    isAnalyzing,
    result,
    analysis: result, // Alias for backwards compatibility
    error,
    reset,
    clearAnalysis
  }
}

export default useAIScanAnalysis
