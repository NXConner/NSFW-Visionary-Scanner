/**
 * Video Utilities
 * Helper functions for video operations
 */

/**
 * Format duration in seconds to HH:MM:SS
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || isNaN(seconds)) return '0:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Parse duration string to seconds
 */
export function parseDuration(duration: string): number {
  const parts = duration.split(':').map(Number)
  
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  return parts[0] || 0
}

/**
 * Get video quality from URL or file
 */
export function getVideoQuality(url: string): 'sd' | 'hd' | '4k' | 'unknown' {
  if (url.includes('4k') || url.includes('2160')) return '4k'
  if (url.includes('hd') || url.includes('1080')) return 'hd'
  if (url.includes('sd') || url.includes('720')) return 'sd'
  return 'unknown'
}

/**
 * Check if browser supports video codec
 */
export function supportsVideoCodec(codec: string): boolean {
  const video = document.createElement('video')
  return video.canPlayType(`video/${codec}`) !== ''
}

/**
 * Get recommended video quality based on connection
 */
export async function getRecommendedQuality(): Promise<'sd' | 'hd' | '4k'> {
  if ('connection' in navigator) {
    const conn = (navigator as any).connection
    const effectiveType = conn?.effectiveType

    if (effectiveType === '4g' && conn?.downlink > 10) {
      return '4k'
    } else if (effectiveType === '4g' || effectiveType === '3g') {
      return 'hd'
    }
    return 'sd'
  }

  // Fallback: assume good connection
  return 'hd'
}

/**
 * Create video thumbnail from URL
 */
export function createVideoThumbnailUrl(videoUrl: string, timestamp: number = 0): string {
  // This would typically use a service or generate server-side
  // For now, return a placeholder or use the video URL with timestamp
  return `${videoUrl}#t=${timestamp}`
}

/**
 * Validate video file
 */
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 500 * 1024 * 1024 // 500MB
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']

  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(0)}MB` }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type not supported. Allowed: ${allowedTypes.join(', ')}` }
  }

  return { valid: true }
}

/**
 * Get video dimensions from file
 */
export function getVideoDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight
      })
      URL.revokeObjectURL(video.src)
    }

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'))
      URL.revokeObjectURL(video.src)
    }

    video.src = URL.createObjectURL(file)
  })
}

