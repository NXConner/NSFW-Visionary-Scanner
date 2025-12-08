/**
 * useVideoScreenshots Hook
 * React hook for managing video screenshots
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  captureVideoScreenshot, 
  getVideoScreenshots, 
  deleteScreenshot,
  type VideoScreenshot 
} from '@/lib/videoScreenshots'
import { toast } from 'sonner'

export const useVideoScreenshots = (videoId: string | null) => {
  const [screenshots, setScreenshots] = useState<VideoScreenshot[]>([])
  const [loading, setLoading] = useState(false)

  const loadScreenshots = useCallback(async () => {
    if (!videoId) return

    setLoading(true)
    try {
      const shots = await getVideoScreenshots(videoId)
      setScreenshots(shots)
    } catch (error) {
      toast.error('Failed to load screenshots')
    } finally {
      setLoading(false)
    }
  }, [videoId])

  useEffect(() => {
    loadScreenshots()
  }, [loadScreenshots])

  const captureScreenshot = useCallback(async (
    videoElement: HTMLVideoElement,
    timestamp: number
  ) => {
    if (!videoId) {
      toast.error('Video ID required')
      return null
    }

    const screenshot = await captureVideoScreenshot(videoElement, timestamp, videoId)
    if (screenshot) {
      setScreenshots(prev => [...prev, screenshot])
    }
    return screenshot
  }, [videoId])

  const removeScreenshot = useCallback(async (screenshotId: string) => {
    const success = await deleteScreenshot(screenshotId)
    if (success) {
      setScreenshots(prev => prev.filter(s => s.id !== screenshotId))
    }
    return success
  }, [])

  return {
    screenshots,
    loading,
    captureScreenshot,
    removeScreenshot,
    refresh: loadScreenshots
  }
}

