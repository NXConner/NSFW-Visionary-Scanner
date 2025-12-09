/**
 * DLC (Downloadable Content) Manager
 * Handles NSFW content unlock for hybrid version (SFW base + DLC)
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'

export interface DLCLicense {
  id: string
  userId: string
  licenseKey: string
  purchaseDate: Date
  expirationDate?: Date
  deviceId?: string
  contentVersion: string
  signature: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DLCContentPackage {
  version: string
  downloadUrl: string
  checksum: string
  size: number
  releaseDate: Date
  changelog: string[]
}

/**
 * Check if user has an active DLC license
 */
export const hasDLCLicense = async (userId?: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    
    if (!targetUserId) {
      return false
    }
    
    const { data, error } = await supabase
      .from('dlc_licenses')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      logger.error('Failed to check DLC license', { error: error.message, userId: targetUserId })
      return false
    }
    
    if (!data) {
      return false
    }
    
    // Check if license is expired
    if (data.expiration_date) {
      const expirationDate = new Date(data.expiration_date)
      if (expirationDate < new Date()) {
        logger.warn('DLC license expired', { userId: targetUserId, expirationDate })
        return false
      }
    }
    
    // Verify license signature (cryptographic verification)
    const isValid = await verifyLicenseSignature(data)
    if (!isValid) {
      logger.error('Invalid DLC license signature', { userId: targetUserId })
      return false
    }
    
    return true
  } catch (error) {
    logger.error('Error checking DLC license', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId
    })
    return false
  }
}

/**
 * Public key for license signature verification (ECDSA P-256)
 * In production, this should be loaded from environment or secure storage
 */
const LICENSE_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE8BcRhBnXZIXVGl9Y8e0Gz6qlw9Ff
jPqZkN9sBVnbBBwXOBVHVhYrCT1MLPdCvYUfnHbqF7WHGBLxCbQLSXNvcw==
-----END PUBLIC KEY-----`

/**
 * Convert PEM to CryptoKey for signature verification
 */
async function importPublicKey(pemKey: string): Promise<CryptoKey> {
  // Remove PEM headers and decode base64
  const pemContents = pemKey
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '')
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  
  return await crypto.subtle.importKey(
    'spki',
    binaryKey,
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    false,
    ['verify']
  )
}

/**
 * Verify license signature using ECDSA
 */
const verifyLicenseSignature = async (license: any): Promise<boolean> => {
  try {
    if (!license.signature || !license.license_key || !license.user_id) {
      return false
    }
    
    // Create the message that was signed (deterministic format)
    const message = JSON.stringify({
      license_key: license.license_key,
      user_id: license.user_id,
      purchase_date: license.purchase_date,
      expiration_date: license.expiration_date || null,
      content_version: license.content_version
    })
    
    // Encode message to bytes
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    
    // Decode signature from base64
    const signatureBytes = Uint8Array.from(atob(license.signature), c => c.charCodeAt(0))
    
    // Import public key
    const publicKey = await importPublicKey(LICENSE_PUBLIC_KEY)
    
    // Verify signature
    const isValid = await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      publicKey,
      signatureBytes,
      data
    )
    
    logger.info('License signature verification', { 
      licenseKey: license.license_key?.substring(0, 8) + '...', 
      isValid 
    })
    
    return isValid
  } catch (error) {
    logger.error('License signature verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      licenseKey: license.license_key?.substring(0, 8) + '...'
    })
    // In production, return false on verification failure
    // For development/testing, allow if signature exists
    if (import.meta.env.DEV) {
      return !!license.signature
    }
    return false
  }
}

/**
 * Activate DLC license
 */
export const activateDLCLicense = async (licenseKey: string, deviceId?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }
    
    // Verify license with server
    const { data, error } = await supabase.functions.invoke('verify-dlc-license', {
      body: {
        licenseKey,
        userId: user.id,
        deviceId
      }
    })
    
    if (error) {
      logger.error('Failed to verify DLC license', { error: error.message, licenseKey })
      return { success: false, error: error.message }
    }
    
    if (!data || !data.valid) {
      return { success: false, error: 'Invalid license key' }
    }
    
    // Store license locally
    const license: DLCLicense = {
      id: data.license.id,
      userId: user.id,
      licenseKey,
      purchaseDate: new Date(data.license.purchase_date),
      expirationDate: data.license.expiration_date ? new Date(data.license.expiration_date) : undefined,
      deviceId: deviceId || data.license.device_id,
      contentVersion: data.license.content_version,
      signature: data.license.signature,
      isActive: true,
      createdAt: new Date(data.license.created_at),
      updatedAt: new Date(data.license.updated_at)
    }
    
    // Store in local storage for offline access
    localStorage.setItem('dlc_license', JSON.stringify(license))
    
    logger.info('DLC license activated', { userId: user.id, licenseKey })
    
    return { success: true }
  } catch (error) {
    logger.error('Error activating DLC license', {
      error: error instanceof Error ? error.message : 'Unknown error',
      licenseKey
    })
    return { success: false, error: 'Failed to activate license' }
  }
}

/**
 * Get current DLC license
 */
export const getDLCLicense = async (): Promise<DLCLicense | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return null
    }
    
    // Check local storage first
    const localLicense = localStorage.getItem('dlc_license')
    if (localLicense) {
      try {
        const license = JSON.parse(localLicense) as DLCLicense
        // Verify it's still valid
        if (await hasDLCLicense(user.id)) {
          return license
        }
      } catch (error) {
        // Invalid local license, fetch from server
      }
    }
    
    // Fetch from server
    const { data, error } = await supabase
      .from('dlc_licenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      logger.error('Failed to get DLC license', { error: error.message, userId: user.id })
      return null
    }
    
    if (!data) {
      return null
    }
    
    const license: DLCLicense = {
      id: data.id,
      userId: data.user_id,
      licenseKey: data.license_key,
      purchaseDate: new Date(data.purchase_date),
      expirationDate: data.expiration_date ? new Date(data.expiration_date) : undefined,
      deviceId: data.device_id,
      contentVersion: data.content_version,
      signature: data.signature,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
    
    // Cache in local storage
    localStorage.setItem('dlc_license', JSON.stringify(license))
    
    return license
  } catch (error) {
    logger.error('Error getting DLC license', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return null
  }
}

/**
 * Check for DLC content updates
 */
export const checkDLCUpdates = async (): Promise<DLCContentPackage | null> => {
  try {
    const license = await getDLCLicense()
    if (!license) {
      return null
    }
    
    const { data, error } = await supabase.functions.invoke('check-dlc-updates', {
      body: {
        currentVersion: license.contentVersion,
        userId: license.userId
      }
    })
    
    if (error) {
      logger.error('Failed to check DLC updates', { error: error.message })
      return null
    }
    
    if (!data || !data.hasUpdate) {
      return null
    }
    
    return {
      version: data.package.version,
      downloadUrl: data.package.download_url,
      checksum: data.package.checksum,
      size: data.package.size,
      releaseDate: new Date(data.package.release_date),
      changelog: data.package.changelog || []
    }
  } catch (error) {
    logger.error('Error checking DLC updates', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return null
  }
}

/**
 * Download DLC content package
 */
export const downloadDLCContent = async (packageUrl: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get package info from server
    const { data, error } = await supabase.functions.invoke('get-dlc-content', {
      body: {}
    })

    if (error || !data?.package) {
      throw new Error('Failed to get package information')
    }

    const { downloadAndInstallDLC } = await import('./contentPackage')
    
    const result = await downloadAndInstallDLC(
      data.package.downloadUrl,
      data.package.checksum,
      (progress) => {
        logger.info('Download progress', { progress })
      }
    )

    if (result.success) {
      // Update license with new version
      const license = await getDLCLicense()
      if (license) {
        await supabase
          .from('dlc_licenses')
          .update({ content_version: data.package.version })
          .eq('id', license.id)
      }
    }

    return result
  } catch (error) {
    logger.error('Error downloading DLC content', {
      error: error instanceof Error ? error.message : 'Unknown error',
      packageUrl
    })
    return { success: false, error: 'Failed to download content' }
  }
}

/**
 * Get DLC status information
 */
export const getDLCStatus = async (): Promise<{
  hasLicense: boolean
  isActive: boolean
  version?: string
  expirationDate?: Date
  hasUpdate: boolean
}> => {
  const hasLicense = await hasDLCLicense()
  const license = hasLicense ? await getDLCLicense() : null
  const update = license ? await checkDLCUpdates() : null
  
  return {
    hasLicense: hasLicense,
    isActive: hasLicense && license?.isActive === true,
    version: license?.contentVersion,
    expirationDate: license?.expirationDate,
    hasUpdate: !!update
  }
}

