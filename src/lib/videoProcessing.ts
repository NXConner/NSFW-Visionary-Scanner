/**
 * Video Processing Utilities
 * Handles video recording, encoding, playback, and processing
 */

import { uploadVideo, getFileUrl, STORAGE_BUCKETS } from './mediaUpload'
import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

export interface VideoRecordingOptions {
  quality?: '720p' | '1080p' | '2k' | '4k'
  frameRate?: number
  audio?: boolean
  onProgress?: (progress: number) => void
}

export interface VideoRecording {
  id: string
  blob: Blob
  duration: number
  startTime: number
  endTime: number
}

/**
 * Record video from MediaStream
 */
export async function recordVideo(
  stream: MediaStream,
  options: VideoRecordingOptions = {}
): Promise<VideoRecording | null> {
  try {
    const {
      quality = '1080p',
      frameRate = 30,
      audio = true,
      onProgress
    } = options

    // Get video constraints based on quality
    const constraints: MediaRecorderOptions = {
      mimeType: 'video/webm;codecs=vp9,opus',
      videoBitsPerSecond: 
        quality === '4k' ? 25000000 : 
        quality === '2k' ? 15000000 : 
        quality === '1080p' ? 8000000 : 
        4000000
    }

    // Try different codecs if webm not supported
    if (!MediaRecorder.isTypeSupported(constraints.mimeType!)) {
      constraints.mimeType = 'video/webm;codecs=vp8,opus'
      if (!MediaRecorder.isTypeSupported(constraints.mimeType!)) {
        constraints.mimeType = 'video/mp4'
      }
    }

    const recorder = new MediaRecorder(stream, constraints)
    const chunks: Blob[] = []
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
          const progress = (chunks.length / 100) * 100 // Estimate
          onProgress?.(Math.min(progress, 99))
        }
      }

      recorder.onstop = () => {
        const endTime = Date.now()
        const duration = (endTime - startTime) / 1000
        const blob = new Blob(chunks, { type: constraints.mimeType || 'video/webm' })

        resolve({
          id: `recording-${Date.now()}`,
          blob,
          duration,
          startTime,
          endTime
        })
      }

      recorder.onerror = (event) => {
        logger.error('Recording error:', event)
        reject(new Error('Recording failed'))
      }

      recorder.start(1000) // Collect data every second
    })
  } catch (error) {
    logger.error('Error in recordVideo:', error)
    toast.error('Failed to start recording')
    return null
  }
}

/**
 * Stop video recording
 */
export function stopRecording(recorder: MediaRecorder): void {
  if (recorder.state === 'recording') {
    recorder.stop()
  }
}

/**
 * Upload recorded video
 */
export async function uploadRecordedVideo(
  recording: VideoRecording,
  sessionId: string,
  folder?: string
): Promise<string | null> {
  try {
    // Convert blob to file
    const file = new File(
      [recording.blob],
      `recording-${recording.id}.webm`,
      { type: recording.blob.type }
    )

    // Upload video
    const result = await uploadVideo(file, {
      bucket: STORAGE_BUCKETS.RECORDINGS,
      folder: folder || `sessions/${sessionId}`,
      maxSize: 500 * 1024 * 1024, // 500MB
      onProgress: (progress) => {
        // Progress handled by uploadVideo
      }
    })

    if (!result) {
      return null
    }

    // Update database with video URL
    const { error } = await supabase
      .from('video_recordings')
      .update({
        video_file_url: result.url,
        video_file_path: result.path,
        duration_seconds: recording.duration,
        file_size_bytes: recording.blob.size
      })
      .eq('session_id', sessionId)

    if (error) {
      logger.error('Error updating video recording:', error)
    }

    return result.url
  } catch (error) {
    logger.error('Error in uploadRecordedVideo:', error)
    toast.error('Failed to upload video')
    return null
  }
}

/**
 * Get video playback URL
 */
export function getVideoUrl(path: string): string {
  return getFileUrl(path, STORAGE_BUCKETS.VIDEOS)
}

/**
 * Create video thumbnail
 */
export async function createVideoThumbnail(
  videoFile: File | Blob,
  time: number = 0
): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      resolve(null)
      return
    }

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(time, video.duration)
    }

    video.onseeked = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null)
          return
        }

        // Upload thumbnail
        const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' })
        // Use mediaUpload to upload thumbnail
        resolve(URL.createObjectURL(blob)) // Temporary URL, should upload to storage
      }, 'image/jpeg', 0.8)
    }

    video.onerror = () => resolve(null)

    const url = videoFile instanceof File
      ? URL.createObjectURL(videoFile)
      : URL.createObjectURL(videoFile)
    video.src = url
  })
}

/**
 * Get video duration
 */
export async function getVideoDuration(videoFile: File | Blob): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.onloadedmetadata = () => {
      resolve(video.duration)
      URL.revokeObjectURL(video.src)
    }
    video.onerror = () => resolve(0)
    const url = videoFile instanceof File
      ? URL.createObjectURL(videoFile)
      : URL.createObjectURL(videoFile)
    video.src = url
  })
}

/**
 * Extract video frames
 */
export async function extractVideoFrames(
  videoFile: File | Blob,
  frameCount: number = 10
): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const frames: string[] = []

    if (!ctx) {
      resolve([])
      return
    }

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const interval = video.duration / frameCount

      let currentFrame = 0
      const extractFrame = () => {
        if (currentFrame >= frameCount) {
          resolve(frames)
          URL.revokeObjectURL(video.src)
          return
        }

        video.currentTime = currentFrame * interval
      }

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        frames.push(canvas.toDataURL('image/jpeg', 0.8))
        currentFrame++
        extractFrame()
      }

      extractFrame()
    }

    video.onerror = () => resolve([])

    const url = videoFile instanceof File
      ? URL.createObjectURL(videoFile)
      : URL.createObjectURL(videoFile)
    video.src = url
  })
}

