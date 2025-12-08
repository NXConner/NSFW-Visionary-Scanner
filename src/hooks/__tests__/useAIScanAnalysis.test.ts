import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAIScanAnalysis } from '../useAIScanAnalysis'
import { supabase } from '../../integrations/supabase/client'

// Mock Supabase
vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}))

const mockSupabase = vi.mocked(supabase)

describe('useAIScanAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should analyze scan data successfully', async () => {
    const mockAnalysisResult = {
      condition: 'normal',
      confidence: 0.95,
      recommendations: ['Maintain healthy habits'],
      severity: 'low'
    }

    mockSupabase.functions.invoke.mockResolvedValue({
      data: mockAnalysisResult,
      error: null
    })

    const { result } = renderHook(() => useAIScanAnalysis())

    const scanData = {
      length: 15.2,
      circumference: 12.8,
      curvature: 15,
      image: 'base64-image-data'
    }

    result.current.analyzeScan(scanData)

    await waitFor(() => {
      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.analysis).toEqual(mockAnalysisResult)
      expect(result.current.error).toBeNull()
    })

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('ai-scan-analysis', {
      body: scanData
    })
  })

  it('should handle analysis errors', async () => {
    const mockError = { message: 'Analysis failed' }

    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: mockError
    })

    const { result } = renderHook(() => useAIScanAnalysis())

    const scanData = {
      length: 10.0,
      circumference: 10.0,
      curvature: 20,
      image: 'base64-image-data'
    }

    result.current.analyzeScan(scanData)

    await waitFor(() => {
      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.analysis).toBeNull()
      expect(result.current.error).toEqual(mockError.message)
    })
  })

  it('should handle network errors', async () => {
    mockSupabase.functions.invoke.mockRejectedValue(
      new Error('Network error')
    )

    const { result } = renderHook(() => useAIScanAnalysis())

    const scanData = {
      length: 10.0,
      circumference: 10.0,
      curvature: 20,
      image: 'base64-image-data'
    }

    result.current.analyzeScan(scanData)

    await waitFor(() => {
      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.analysis).toBeNull()
      expect(result.current.error).toContain('Network error')
    })
  })

  it('should clear previous results', () => {
    const { result } = renderHook(() => useAIScanAnalysis())

    // Simulate previous analysis result
    result.current.analysis = { condition: 'previous' }
    result.current.error = null

    result.current.clearAnalysis()

    expect(result.current.analysis).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should validate scan data', async () => {
    const { result } = renderHook(() => useAIScanAnalysis())

    // Test with invalid data
    const invalidScanData = {
      length: -5, // Invalid negative length
      circumference: 10.0,
      curvature: 20
      // Missing image
    }

    result.current.analyzeScan(invalidScanData)

    await waitFor(() => {
      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.error).toContain('Invalid scan data')
    })

    // Should not call the API
    expect(mockSupabase.functions.invoke).not.toHaveBeenCalled()
  })
})
