/**
 * Video Screenshot Utilities
 * Captures screenshots from video at specific timestamps
 */

import { uploadFile, STORAGE_BUCKETS } from './mediaUpload'
import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

export interface VideoScreenshot {
  id: string
  video_id: string
  timestamp_seconds: number
  image_url: string
  image_path: string
  thumbnail_url: string | null
  created_at: string
}

/**
 * Capture screenshot from video element at specific timestamp
 */
export async function captureVideoScreenshot(
  videoElement: HTMLVideoElement,
  timestamp: number,
  videoId: string
): Promise<VideoScreenshot | null> {
  try {
    // Set video to timestamp
    videoElement.currentTime = timestamp

    // Wait for video to seek
    await new Promise((resolve) => {
      videoElement.onseeked = resolve
      setTimeout(resolve, 1000) // Timeout after 1 second
    })

    // Create canvas and capture frame
    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      toast.error('Failed to capture screenshot')
      return null
    }

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

    // Convert to blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
    })

    if (!blob) {
      toast.error('Failed to create screenshot')
      return null
    }

    // Create file from blob
    const file = new File([blob], `screenshot-${Date.now()}.jpg`, { type: 'image/jpeg' })

    // Upload screenshot
    const uploadResult = await uploadFile(file, {
      bucket: STORAGE_BUCKETS.SCREENSHOTS,
      folder: `videos/${videoId}`,
      compress: true,
      quality: 0.9
    })

    if (!uploadResult) {
      return null
    }

    // Create thumbnail (smaller version)
    const thumbnailBlob = await new Promise<Blob | null>((resolve) => {
      const thumbCanvas = document.createElement('canvas')
      thumbCanvas.width = 320
      thumbCanvas.height = 180
      const thumbCtx = thumbCanvas.getContext('2d')
      if (!thumbCtx) {
        resolve(null)
        return
      }
      thumbCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height)
      thumbCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7)
    })

    let thumbnailUrl: string | null = null
    if (thumbnailBlob) {
      const thumbnailFile = new File([thumbnailBlob], `thumb-${Date.now()}.jpg`, { type: 'image/jpeg' })
      const thumbResult = await uploadFile(thumbnailFile, {
        bucket: STORAGE_BUCKETS.SCREENSHOTS,
        folder: `videos/${videoId}/thumbnails`
      })
      thumbnailUrl = thumbResult?.url || null
    }

    // Save to database
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in')
      return null
    }

    const { data, error } = await supabase
      .from('video_screenshots')
      .insert({
        video_id: videoId,
        timestamp_seconds: timestamp,
        image_url: uploadResult.url,
        image_path: uploadResult.path,
        thumbnail_url: thumbnailUrl
      })
      .select()
      .single()

    if (error) {
      logger.error('Error saving screenshot:', error)
      toast.error('Failed to save screenshot')
      return null
    }

    toast.success('Screenshot captured!')
    return data as VideoScreenshot
  } catch (error) {
    logger.error('Error in captureVideoScreenshot:', error)
    toast.error('Failed to capture screenshot')
    return null
  }
}

/**
 * Capture multiple screenshots at different timestamps
 */
export async function captureVideoScreenshots(
  videoElement: HTMLVideoElement,
  timestamps: number[],
  videoId: string
): Promise<VideoScreenshot[]> {
  const screenshots: VideoScreenshot[] = []

  for (const timestamp of timestamps) {
    const screenshot = await captureVideoScreenshot(videoElement, timestamp, videoId)
    if (screenshot) {
      screenshots.push(screenshot)
    }
  }

  return screenshots
}

/**
 * Get screenshots for a video
 */
export async function getVideoScreenshots(videoId: string): Promise<VideoScreenshot[]> {
  try {
    const { data, error } = await supabase
      .from('video_screenshots')
      .select('*')
      .eq('video_id', videoId)
      .order('timestamp_seconds', { ascending: true })

    if (error) {
      logger.error('Error fetching screenshots:', error)
      return []
    }

    return (data || []) as VideoScreenshot[]
  } catch (error) {
    logger.error('Error in getVideoScreenshots:', error)
    return []
  }
}

/**
 * Delete screenshot
 */
export async function deleteScreenshot(screenshotId: string): Promise<boolean> {
  try {
    // Get screenshot to get file path
    const { data: screenshot } = await supabase
      .from('video_screenshots')
      .select('image_path, thumbnail_url')
      .eq('id', screenshotId)
      .single()

    if (screenshot) {
      // Delete from storage
      if (screenshot.image_path) {
        await supabase.storage
          .from(STORAGE_BUCKETS.SCREENSHOTS)
          .remove([screenshot.image_path])
      }

      if (screenshot.thumbnail_url) {
        const thumbPath = screenshot.thumbnail_url.split('/').slice(-2).join('/')
        await supabase.storage
          .from(STORAGE_BUCKETS.SCREENSHOTS)
          .remove([thumbPath])
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('video_screenshots')
      .delete()
      .eq('id', screenshotId)

    if (error) {
      logger.error('Error deleting screenshot:', error)
      return false
    }

    toast.success('Screenshot deleted')
    return true
  } catch (error) {
    logger.error('Error in deleteScreenshot:', error)
    return false
  }
}

