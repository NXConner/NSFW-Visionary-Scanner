/**
 * Content Package Management
 * Handles downloading, verifying, and installing DLC content packages
 */

import { logger } from './logger'
import { toast } from 'sonner'

export interface ContentPackageManifest {
  version: string
  files: ContentFile[]
  checksum: string
  size: number
  releaseDate: string
  changelog: string[]
}

export interface ContentFile {
  path: string
  url: string
  checksum: string
  size: number
  type: 'image' | 'gif' | 'video' | 'data' | 'component'
}

/**
 * Download content package
 */
export const downloadContentPackage = async (
  packageUrl: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; data?: ArrayBuffer; error?: string }> => {
  try {
    logger.info('Starting content package download', { packageUrl })

    const response = await fetch(packageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`)
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10)
    const reader = response.body?.getReader()
    const chunks: Uint8Array[] = []
    let receivedLength = 0

    if (!reader) {
      throw new Error('Response body is not readable')
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      chunks.push(value)
      receivedLength += value.length

      if (onProgress && contentLength > 0) {
        const progress = (receivedLength / contentLength) * 100
        onProgress(progress)
      }
    }

    // Combine chunks into single ArrayBuffer
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    logger.info('Content package downloaded successfully', {
      size: receivedLength,
      packageUrl
    })

    return { success: true, data: result.buffer }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to download content package', {
      error: errorMessage,
      packageUrl
    })
    return { success: false, error: errorMessage }
  }
}

/**
 * Verify package checksum
 */
export const verifyPackageChecksum = async (
  data: ArrayBuffer,
  expectedChecksum: string
): Promise<boolean> => {
  try {
    // Import crypto for SHA-256 hashing
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const isValid = hashHex === expectedChecksum.toLowerCase()
    
    if (!isValid) {
      logger.error('Package checksum verification failed', {
        expected: expectedChecksum,
        actual: hashHex
      })
    }

    return isValid
  } catch (error) {
    logger.error('Error verifying package checksum', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return false
  }
}

/**
 * Extract content package
 */
export const extractContentPackage = async (
  data: ArrayBuffer
): Promise<{ success: boolean; manifest?: ContentPackageManifest; files?: ContentFile[]; error?: string }> => {
  try {
    // For now, assume the package is a JSON manifest
    // In production, this would handle ZIP extraction
    const text = new TextDecoder().decode(data)
    const packageData = JSON.parse(text)

    if (!packageData.manifest || !packageData.files) {
      throw new Error('Invalid package format')
    }

    const manifest: ContentPackageManifest = packageData.manifest
    const files: ContentFile[] = packageData.files

    logger.info('Content package extracted', {
      version: manifest.version,
      fileCount: files.length
    })

    return { success: true, manifest, files }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to extract content package', { error: errorMessage })
    return { success: false, error: errorMessage }
  }
}

/**
 * Install content package
 */
export const installContentPackage = async (
  manifest: ContentPackageManifest,
  files: ContentFile[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    logger.info('Installing content package', { version: manifest.version })

    // Store manifest
    localStorage.setItem('dlc_content_manifest', JSON.stringify(manifest))

    // Download and store files
    const filePromises = files.map(async (file) => {
      try {
        const response = await fetch(file.url)
        if (!response.ok) {
          throw new Error(`Failed to download file: ${file.path}`)
        }

        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()

        // Verify file checksum
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        if (hashHex !== file.checksum.toLowerCase()) {
          throw new Error(`Checksum mismatch for file: ${file.path}`)
        }

        // Store file in IndexedDB or cache
        await storeContentFile(file.path, arrayBuffer)

        logger.info('File installed', { path: file.path })
      } catch (error) {
        logger.error('Failed to install file', {
          path: file.path,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        throw error
      }
    })

    await Promise.all(filePromises)

    // Update installed version
    localStorage.setItem('dlc_content_version', manifest.version)
    localStorage.setItem('dlc_content_installed', new Date().toISOString())

    logger.info('Content package installed successfully', { version: manifest.version })
    toast.success('DLC content installed successfully!')

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to install content package', { error: errorMessage })
    toast.error('Failed to install content package')
    return { success: false, error: errorMessage }
  }
}

/**
 * Store content file in IndexedDB
 */
const storeContentFile = async (path: string, data: ArrayBuffer): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('dlc_content', 1)

    request.onerror = () => reject(new Error('Failed to open IndexedDB'))
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['files'], 'readwrite')
      const store = transaction.objectStore('files')
      const putRequest = store.put({ path, data, timestamp: Date.now() })
      putRequest.onsuccess = () => resolve()
      putRequest.onerror = () => reject(new Error('Failed to store file'))
    }

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'path' })
      }
    }
  })
}

/**
 * Get installed content version
 */
export const getInstalledContentVersion = (): string | null => {
  return localStorage.getItem('dlc_content_version')
}

/**
 * Check if content is installed
 */
export const isContentInstalled = (): boolean => {
  return !!localStorage.getItem('dlc_content_installed')
}

/**
 * Get content file from storage
 */
export const getContentFile = async (path: string): Promise<ArrayBuffer | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('dlc_content', 1)

    request.onerror = () => reject(new Error('Failed to open IndexedDB'))
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['files'], 'readonly')
      const store = transaction.objectStore('files')
      const getRequest = store.get(path)
      
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(getRequest.result.data)
        } else {
          resolve(null)
        }
      }
      getRequest.onerror = () => reject(new Error('Failed to get file'))
    }
  })
}

/**
 * Complete DLC content download and installation flow
 */
export const downloadAndInstallDLC = async (
  packageUrl: string,
  expectedChecksum: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; error?: string }> => {
  try {
    toast.info('Downloading DLC content...')

    // Download package
    const downloadResult = await downloadContentPackage(packageUrl, onProgress)
    if (!downloadResult.success || !downloadResult.data) {
      return { success: false, error: downloadResult.error || 'Download failed' }
    }

    // Verify checksum
    toast.info('Verifying package integrity...')
    const isValid = await verifyPackageChecksum(downloadResult.data, expectedChecksum)
    if (!isValid) {
      return { success: false, error: 'Package checksum verification failed' }
    }

    // Extract package
    toast.info('Extracting content...')
    const extractResult = await extractContentPackage(downloadResult.data)
    if (!extractResult.success || !extractResult.manifest || !extractResult.files) {
      return { success: false, error: extractResult.error || 'Extraction failed' }
    }

    // Install package
    toast.info('Installing content...')
    const installResult = await installContentPackage(
      extractResult.manifest,
      extractResult.files
    )

    return installResult
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('DLC download and installation failed', { error: errorMessage })
    return { success: false, error: errorMessage }
  }
}

