/**
 * Enhanced Privacy Controls
 * Advanced privacy features including content locking, hidden mode, and privacy dashboard
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

export interface PrivacySettings {
  app_lock_enabled: boolean
  app_lock_method: 'pin' | 'biometric' | 'both'
  content_lock_enabled: boolean
  locked_content_ids: string[]
  hidden_mode_enabled: boolean
  private_browsing_enabled: boolean
  incognito_mode_enabled: boolean
  data_anonymization_enabled: boolean
  privacy_dashboard_enabled: boolean
}

/**
 * Get user privacy settings
 */
export async function getPrivacySettings(): Promise<PrivacySettings | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_privacy_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      logger.error('Error fetching privacy settings:', error)
      return null
    }

    return (data || getDefaultPrivacySettings()) as PrivacySettings
  } catch (error) {
    logger.error('Error getting privacy settings:', error)
    return getDefaultPrivacySettings()
  }
}

/**
 * Get default privacy settings
 */
function getDefaultPrivacySettings(): PrivacySettings {
  return {
    app_lock_enabled: false,
    app_lock_method: 'biometric',
    content_lock_enabled: false,
    locked_content_ids: [],
    hidden_mode_enabled: false,
    private_browsing_enabled: false,
    incognito_mode_enabled: false,
    data_anonymization_enabled: false,
    privacy_dashboard_enabled: true
  }
}

/**
 * Update privacy settings
 */
export async function updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to update privacy settings')
      return false
    }

    const { error } = await supabase
      .from('user_privacy_settings')
      .upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      logger.error('Error updating privacy settings:', error)
      toast.error('Failed to update privacy settings')
      return false
    }

    toast.success('Privacy settings updated')
    return true
  } catch (error) {
    logger.error('Error in updatePrivacySettings:', error)
    return false
  }
}

/**
 * Lock specific content
 */
export async function lockContent(contentId: string): Promise<boolean> {
  try {
    const settings = await getPrivacySettings()
    if (!settings) return false

    const lockedIds = [...(settings.locked_content_ids || []), contentId]
    return await updatePrivacySettings({ locked_content_ids: lockedIds })
  } catch (error) {
    logger.error('Error locking content:', error)
    return false
  }
}

/**
 * Unlock content
 */
export async function unlockContent(contentId: string): Promise<boolean> {
  try {
    const settings = await getPrivacySettings()
    if (!settings) return false

    const lockedIds = (settings.locked_content_ids || []).filter(id => id !== contentId)
    return await updatePrivacySettings({ locked_content_ids: lockedIds })
  } catch (error) {
    logger.error('Error unlocking content:', error)
    return false
  }
}

/**
 * Check if content is locked
 */
export async function isContentLocked(contentId: string): Promise<boolean> {
  try {
    const settings = await getPrivacySettings()
    if (!settings) return false

    return (settings.locked_content_ids || []).includes(contentId)
  } catch (error) {
    logger.error('Error checking content lock:', error)
    return false
  }
}

/**
 * Enable hidden mode (hide app completely)
 */
export async function enableHiddenMode(): Promise<boolean> {
  return await updatePrivacySettings({ hidden_mode_enabled: true })
}

/**
 * Disable hidden mode
 */
export async function disableHiddenMode(): Promise<boolean> {
  return await updatePrivacySettings({ hidden_mode_enabled: false })
}

/**
 * Enable private browsing mode
 */
export async function enablePrivateBrowsing(): Promise<boolean> {
  return await updatePrivacySettings({ private_browsing_enabled: true })
}

/**
 * Enable incognito mode (no history tracking)
 */
export async function enableIncognitoMode(): Promise<boolean> {
  return await updatePrivacySettings({ incognito_mode_enabled: true })
}

/**
 * Get privacy dashboard data
 */
export async function getPrivacyDashboardData(): Promise<{
  data_collected: Array<{ type: string; amount: number; last_accessed: string }>
  third_party_sharing: Array<{ service: string; purpose: string; shared: boolean }>
  data_retention: { policy: string; expiration: string | null }
  privacy_score: number
}> {
  try {
    // This would fetch actual privacy data
    return {
      data_collected: [],
      third_party_sharing: [],
      data_retention: { policy: 'User-controlled', expiration: null },
      privacy_score: 100
    }
  } catch (error) {
    logger.error('Error getting privacy dashboard data:', error)
    return {
      data_collected: [],
      third_party_sharing: [],
      data_retention: { policy: 'User-controlled', expiration: null },
      privacy_score: 0
    }
  }
}

