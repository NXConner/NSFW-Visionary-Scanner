/**
 * Feature Flags System
 * Manages app version detection and feature availability
 */

export type AppVersion = 'sfw' | 'nsfw' | 'hybrid'

/**
 * Get the current app version from environment variable
 */
export const getAppVersion = (): AppVersion => {
  const version = import.meta.env.VITE_APP_VERSION || 'nsfw'
  if (version === 'sfw' || version === 'nsfw' || version === 'hybrid') {
    return version
  }
  // Default to nsfw for backward compatibility
  return 'nsfw'
}

/**
 * Check if app is SFW version
 */
export const isSFW = (): boolean => {
  return getAppVersion() === 'sfw'
}

/**
 * Check if app is NSFW version
 */
export const isNSFW = (): boolean => {
  return getAppVersion() === 'nsfw'
}

/**
 * Check if app is hybrid version (SFW base + DLC unlockable)
 */
export const isHybrid = (): boolean => {
  return getAppVersion() === 'hybrid'
}

/**
 * Check if NSFW content should be available
 * For hybrid version, requires DLC license check
 */
export const hasNSFWContent = async (): Promise<boolean> => {
  const version = getAppVersion()
  
  if (version === 'nsfw') {
    return true
  }
  
  if (version === 'sfw') {
    return false
  }
  
  // Hybrid version - check DLC license
  if (version === 'hybrid') {
    try {
      const { hasDLCLicense } = await import('./dlcManager')
      return await hasDLCLicense()
    } catch (error) {
      console.warn('DLC manager not available, NSFW content disabled', error)
      return false
    }
  }
  
  return false
}

/**
 * Check if a specific feature is available
 */
export const isFeatureAvailable = async (feature: string): Promise<boolean> => {
  // Positions Gallery is NSFW-only
  if (feature === 'positionsGallery') {
    return await hasNSFWContent()
  }
  
  // Visual content system is NSFW-only
  if (feature === 'visualContent' || feature === 'visualContentSystem') {
    return await hasNSFWContent()
  }
  
  // All other features are available in all versions
  return true
}

/**
 * Get distribution channel (store or direct)
 */
export const getDistributionChannel = (): 'store' | 'direct' => {
  // Check if app was installed from store
  // This can be determined by checking app metadata or build configuration
  const channel = import.meta.env.VITE_DISTRIBUTION_CHANNEL || 'direct'
  return channel === 'store' ? 'store' : 'direct'
}

/**
 * Check if app is from store
 */
export const isStoreVersion = (): boolean => {
  return getDistributionChannel() === 'store'
}

/**
 * Check if app is direct download
 */
export const isDirectVersion = (): boolean => {
  return getDistributionChannel() === 'direct'
}

/**
 * Get feature flags configuration
 */
export const getFeatureFlags = (): Record<string, boolean> => {
  const flags = import.meta.env.VITE_FEATURE_FLAGS || ''
  const flagMap: Record<string, boolean> = {}
  
  if (flags) {
    flags.split(',').forEach(flag => {
      const [key, value] = flag.split('=')
      if (key) {
        flagMap[key.trim()] = value !== 'false'
      }
    })
  }
  
  return flagMap
}

/**
 * Check if a feature flag is enabled
 */
export const isFeatureFlagEnabled = (flag: string): boolean => {
  const flags = getFeatureFlags()
  return flags[flag] === true
}

