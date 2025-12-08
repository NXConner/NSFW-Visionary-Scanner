/**
 * Media Upload & Storage Utilities
 * Handles file uploads to Supabase Storage for images, videos, audio, and other media
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

export interface UploadOptions {
  bucket?: string
  folder?: string
  maxSize?: number // in bytes
  allowedTypes?: string[]
  onProgress?: (progress: number) => void
  compress?: boolean
  quality?: number // 0-1 for images
}

export interface UploadResult {
  url: string
  path: string
  publicUrl: string
  size: number
  type: string
}

// Storage buckets
export const STORAGE_BUCKETS = {
  USER_UPLOADS: 'user-uploads',
  VIDEOS: 'videos',
  IMAGES: 'images',
  AUDIO: 'audio',
  SCREENSHOTS: 'screenshots',
  RECORDINGS: 'recordings',
  EXPERT_CONTENT: 'expert-content',
  NSFW_CONTENT: 'nsfw-content'
} as const

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult | null> {
  try {
    const {
      bucket = STORAGE_BUCKETS.USER_UPLOADS,
      folder = '',
      maxSize = 100 * 1024 * 1024, // 100MB default
      allowedTypes = [],
      onProgress,
      compress = false,
      quality = 0.8
    } = options

    // Validate file size
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(0)}MB`)
      return null
    }

    // Validate file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      toast.error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`)
      return null
    }

    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to upload files')
      return null
    }

    // Process file if needed (compress images)
    let processedFile = file
    if (compress && file.type.startsWith('image/')) {
      processedFile = await compressImage(file, quality)
    }

    // Generate unique filename
    const fileExt = processedFile.name.split('.').pop() || 'bin'
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileName = `${timestamp}-${randomId}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName

    // Upload with progress tracking
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, processedFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      logger.error('Upload error:', error)
      toast.error(`Upload failed: ${error.message}`)
      return null
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    toast.success('File uploaded successfully')

    return {
      url: publicUrl,
      path: filePath,
      publicUrl,
      size: processedFile.size,
      type: processedFile.type
    }
  } catch (error) {
    logger.error('Error in uploadFile:', error)
    toast.error('Failed to upload file')
    return null
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  
  for (const file of files) {
    const result = await uploadFile(file, options)
    if (result) {
      results.push(result)
    }
  }

  return results
}

/**
 * Upload video file with chunked upload for large files
 */
export async function uploadVideo(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult | null> {
  const chunkSize = 5 * 1024 * 1024 // 5MB chunks
  const maxSize = options.maxSize || 500 * 1024 * 1024 // 500MB default for videos

  if (file.size > maxSize) {
    toast.error(`Video too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(0)}MB`)
    return null
  }

  // For small videos, use regular upload
  if (file.size < chunkSize) {
    return uploadFile(file, {
      ...options,
      bucket: options.bucket || STORAGE_BUCKETS.VIDEOS
    })
  }

  // For large videos, use chunked upload
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to upload videos')
      return null
    }

    const fileExt = file.name.split('.').pop() || 'mp4'
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileName = `${timestamp}-${randomId}.${fileExt}`
    const folder = options.folder || 'videos'
    const filePath = `${folder}/${fileName}`

    const totalChunks = Math.ceil(file.size / chunkSize)
    let uploadedBytes = 0

    // Upload chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)

      const chunkPath = `${filePath}.chunk.${i}`
      const { error } = await supabase.storage
        .from(options.bucket || STORAGE_BUCKETS.VIDEOS)
        .upload(chunkPath, chunk, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        logger.error('Chunk upload error:', error)
        toast.error(`Upload failed at chunk ${i + 1}/${totalChunks}`)
        return null
      }

      uploadedBytes += chunk.size
      const progress = (uploadedBytes / file.size) * 100
      options.onProgress?.(progress)
    }

    // Merge chunks via Edge Function
    const { data: mergeData, error: mergeError } = await supabase.functions.invoke('merge-video-chunks', {
      body: {
        file_path: filePath,
        total_chunks: totalChunks,
        bucket: options.bucket || STORAGE_BUCKETS.VIDEOS
      }
    })

    if (mergeError || !mergeData) {
      logger.error('Chunk merge error:', mergeError)
      toast.error('Failed to merge video chunks')
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from(options.bucket || STORAGE_BUCKETS.VIDEOS)
      .getPublicUrl(filePath)

    toast.success('Video uploaded successfully')

    return {
      url: publicUrl,
      path: filePath,
      publicUrl,
      size: file.size,
      type: file.type
    }
  } catch (error) {
    logger.error('Error in uploadVideo:', error)
    toast.error('Failed to upload video')
    return null
  }
}

/**
 * Compress image file
 */
async function compressImage(file: File, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        // Calculate new dimensions (max 1920px width)
        let width = img.width
        let height = img.height
        const maxWidth = 1920

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          },
          file.type,
          quality
        )
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  path: string,
  bucket: string = STORAGE_BUCKETS.USER_UPLOADS
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      logger.error('Delete error:', error)
      toast.error('Failed to delete file')
      return false
    }

    toast.success('File deleted')
    return true
  } catch (error) {
    logger.error('Error in deleteFile:', error)
    return false
  }
}

/**
 * Get file URL
 */
export function getFileUrl(
  path: string,
  bucket: string = STORAGE_BUCKETS.USER_UPLOADS
): string {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  return publicUrl
}

/**
 * List files in a folder
 */
export async function listFiles(
  folder: string = '',
  bucket: string = STORAGE_BUCKETS.USER_UPLOADS,
  limit: number = 100
): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      logger.error('List files error:', error)
      return []
    }

    return data?.map(file => folder ? `${folder}/${file.name}` : file.name) || []
  } catch (error) {
    logger.error('Error in listFiles:', error)
    return []
  }
}

/**
 * Check if file exists
 */
export async function fileExists(
  path: string,
  bucket: string = STORAGE_BUCKETS.USER_UPLOADS
): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path.split('/').slice(0, -1).join('/'))

    if (error) return false

    const fileName = path.split('/').pop()
    return data?.some(file => file.name === fileName) || false
  } catch {
    return false
  }
}

