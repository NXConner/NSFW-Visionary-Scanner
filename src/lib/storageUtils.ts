/**
 * Storage Utilities
 * Helper functions for Supabase Storage operations
 */

import { supabase } from '@/integrations/supabase/client'
import { STORAGE_BUCKETS } from './mediaUpload'
import { logger } from './logger'

/**
 * Get storage bucket URL
 */
export function getStorageUrl(bucket: string, path: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  return publicUrl
}

/**
 * Check if file exists in storage
 */
export async function fileExistsInStorage(
  bucket: string,
  path: string
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

/**
 * Get file size from storage
 */
export async function getFileSize(
  bucket: string,
  path: string
): Promise<number | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path.split('/').slice(0, -1).join('/'))

    if (error) return null

    const fileName = path.split('/').pop()
    const file = data?.find(f => f.name === fileName)
    return file?.metadata?.size || null
  } catch {
    return null
  }
}

/**
 * Delete multiple files from storage
 */
export async function deleteFiles(
  bucket: string,
  paths: string[]
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths)

    if (error) {
      logger.error('Error deleting files:', error)
      return false
    }

    return true
  } catch (error) {
    logger.error('Error in deleteFiles:', error)
    return false
  }
}

/**
 * Copy file in storage
 */
export async function copyFile(
  bucket: string,
  sourcePath: string,
  destinationPath: string
): Promise<boolean> {
  try {
    // Download source file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(sourcePath)

    if (downloadError || !fileData) {
      logger.error('Error downloading file:', downloadError)
      return false
    }

    // Upload to destination
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(destinationPath, fileData, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      logger.error('Error uploading file:', uploadError)
      return false
    }

    return true
  } catch (error) {
    logger.error('Error in copyFile:', error)
    return false
  }
}

/**
 * Get storage usage for user
 */
export async function getStorageUsage(
  userId: string,
  buckets: string[] = Object.values(STORAGE_BUCKETS)
): Promise<number> {
  try {
    let totalSize = 0

    for (const bucket of buckets) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(userId, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (!error && data) {
        const userFiles = data.filter(file => 
          file.name.startsWith(userId) || file.metadata?.owner === userId
        )
        totalSize += userFiles.reduce((sum, file) => 
          sum + (file.metadata?.size || 0), 0
        )
      }
    }

    return totalSize
  } catch (error) {
    logger.error('Error calculating storage usage:', error)
    return 0
  }
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

