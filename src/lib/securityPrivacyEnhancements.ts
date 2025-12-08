/**
 * Advanced Security & Privacy Enhancements
 * Handles 2FA, biometric auth, session management, device management, security alerts, E2E encryption, and privacy controls
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Two-Factor Authentication ====================

export interface TwoFactorAuthentication {
  id: string
  user_id: string
  method: 'totp' | 'sms' | 'email' | 'backup_codes'
  totp_secret_encrypted: string | null
  totp_backup_codes_encrypted: string[] | null
  phone_number_encrypted: string | null
  email_address: string | null
  is_enabled: boolean
  is_verified: boolean
  verified_at: string | null
  recovery_codes_encrypted: string[] | null
  recovery_codes_used: string[] | null
  created_at: string
  updated_at: string
}

export async function enable2FA(method: TwoFactorAuthentication['method']): Promise<{ qr_code?: string; backup_codes?: string[] } | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to enable 2FA')
      return null
    }

    // Call 2FA Edge Function
    const { data: twoFactorData, error: twoFactorError } = await supabase.functions.invoke('setup-2fa', {
      body: {
        method
      }
    })

    if (twoFactorError) {
      logger.error('Error setting up 2FA:', twoFactorError)
      toast.error('Failed to set up 2FA')
      return null
    }

    // Save 2FA configuration
    const { error: saveError } = await supabase
      .from('two_factor_authentication')
      .upsert({
        user_id: user.id,
        method,
        is_enabled: false, // Not enabled until verified
        is_verified: false
      }, {
        onConflict: 'user_id,method'
      })

    if (saveError) {
      logger.error('Error saving 2FA config:', saveError)
      return null
    }

    toast.success('2FA setup initiated!')
    return {
      qr_code: twoFactorData.qr_code,
      backup_codes: twoFactorData.backup_codes
    }
  } catch (error) {
    logger.error('Error in enable2FA:', error)
    return null
  }
}

export async function verify2FA(method: TwoFactorAuthentication['method'], code: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in')
      return false
    }

    // Verify code via Edge Function
    const { data, error } = await supabase.functions.invoke('verify-2fa', {
      body: {
        method,
        code
      }
    })

    if (error || !data.verified) {
      toast.error('Invalid verification code')
      return false
    }

    // Enable 2FA
    const { error: updateError } = await supabase
      .from('two_factor_authentication')
      .update({
        is_enabled: true,
        is_verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('method', method)

    if (updateError) {
      logger.error('Error enabling 2FA:', updateError)
      return false
    }

    toast.success('2FA enabled successfully!')
    return true
  } catch (error) {
    logger.error('Error in verify2FA:', error)
    return false
  }
}

export async function get2FAStatus(): Promise<TwoFactorAuthentication[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('two_factor_authentication')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      logger.error('Error fetching 2FA status:', error)
      return []
    }

    return (data || []) as TwoFactorAuthentication[]
  } catch (error) {
    logger.error('Error in get2FAStatus:', error)
    return []
  }
}

// ==================== Active Sessions ====================

export interface ActiveSession {
  id: string
  user_id: string
  session_token_hash: string
  device_name: string | null
  device_type: 'desktop' | 'mobile' | 'tablet' | 'wearable' | 'other' | null
  platform: string | null
  browser: string | null
  ip_address: string | null
  location_country: string | null
  location_city: string | null
  is_active: boolean
  is_current_session: boolean
  created_at: string
  last_activity_at: string
  expires_at: string | null
  revoked_at: string | null
}

export async function getActiveSessions(): Promise<ActiveSession[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('active_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('last_activity_at', { ascending: false })

    if (error) {
      logger.error('Error fetching sessions:', error)
      return []
    }

    return (data || []) as ActiveSession[]
  } catch (error) {
    logger.error('Error in getActiveSessions:', error)
    return []
  }
}

export async function revokeSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('active_sessions')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) {
      logger.error('Error revoking session:', error)
      toast.error('Failed to revoke session')
      return false
    }

    toast.success('Session revoked')
    return true
  } catch (error) {
    logger.error('Error in revokeSession:', error)
    return false
  }
}

// ==================== Security Alerts ====================

export interface SecurityAlert {
  id: string
  user_id: string
  alert_type: 'login_attempt' | 'password_change' | 'device_added' | 'suspicious_activity' | 'data_export' | 'permission_change' | 'other'
  alert_severity: 'low' | 'medium' | 'high' | 'critical'
  alert_title: string
  alert_message: string
  ip_address: string | null
  device_id: string | null
  location_country: string | null
  location_city: string | null
  is_read: boolean
  read_at: string | null
  is_acknowledged: boolean
  acknowledged_at: string | null
  action_taken: string | null
  action_data: any
  created_at: string
}

export async function getSecurityAlerts(): Promise<SecurityAlert[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('security_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      logger.error('Error fetching alerts:', error)
      return []
    }

    return (data || []) as SecurityAlert[]
  } catch (error) {
    logger.error('Error in getSecurityAlerts:', error)
    return []
  }
}

export async function markAlertAsRead(alertId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('security_alerts')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', alertId)

    if (error) {
      logger.error('Error marking alert as read:', error)
      return false
    }

    return true
  } catch (error) {
    logger.error('Error in markAlertAsRead:', error)
    return false
  }
}

// ==================== Privacy Controls ====================

export interface PrivacyControls {
  id: string
  user_id: string
  share_analytics: boolean
  share_usage_data: boolean
  share_location_data: boolean
  anonymize_data: boolean
  anonymization_level: 'none' | 'partial' | 'full'
  auto_delete_enabled: boolean
  retention_period_days: number | null
  profile_visibility: 'public' | 'friends' | 'private'
  show_in_search: boolean
  gdpr_consent_given: boolean
  gdpr_consent_date: string | null
  data_processing_consent: boolean
  created_at: string
  updated_at: string
}

export async function getPrivacyControls(): Promise<PrivacyControls | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('privacy_controls')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      logger.error('Error fetching privacy controls:', error)
      return null
    }

    if (!data) {
      // Create default privacy controls
      const { data: newData, error: createError } = await supabase
        .from('privacy_controls')
        .insert({
          user_id: user.id
        })
        .select()
        .single()

      if (createError) {
        logger.error('Error creating privacy controls:', createError)
        return null
      }

      return newData as PrivacyControls
    }

    return data as PrivacyControls
  } catch (error) {
    logger.error('Error in getPrivacyControls:', error)
    return null
  }
}

export async function updatePrivacyControls(
  updates: Partial<PrivacyControls>
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in')
      return false
    }

    const { error } = await supabase
      .from('privacy_controls')
      .upsert({
        user_id: user.id,
        ...updates
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      logger.error('Error updating privacy controls:', error)
      toast.error('Failed to update privacy settings')
      return false
    }

    toast.success('Privacy settings updated!')
    return true
  } catch (error) {
    logger.error('Error in updatePrivacyControls:', error)
    return false
  }
}

// ==================== Login History ====================

export interface LoginHistory {
  id: string
  user_id: string
  login_method: 'password' | 'biometric' | '2fa' | 'oauth' | 'magic_link'
  login_status: 'success' | 'failed' | 'blocked'
  device_id: string | null
  ip_address: string | null
  user_agent: string | null
  location_country: string | null
  location_city: string | null
  is_suspicious: boolean
  suspicious_reasons: string[] | null
  failure_reason: string | null
  logged_at: string
}

export async function getLoginHistory(limit: number = 50): Promise<LoginHistory[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('login_history')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error fetching login history:', error)
      return []
    }

    return (data || []) as LoginHistory[]
  } catch (error) {
    logger.error('Error in getLoginHistory:', error)
    return []
  }
}

