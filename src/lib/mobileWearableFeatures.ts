/**
 * Advanced Mobile Features & Wearable Integration
 * Handles mobile widgets, app shortcuts, haptic feedback, background processing, and wearable device integration
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Mobile Widgets ====================

export interface MobileWidgetConfiguration {
  id: string
  user_id: string
  widget_type: 'scanner_quick' | 'health_summary' | 'progress_tracker' | 'routine_reminder' | 'custom'
  widget_name: string
  platform: 'ios' | 'android' | 'both'
  widget_config: any
  refresh_frequency_minutes: number
  is_active: boolean
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export async function createMobileWidget(
  widgetType: MobileWidgetConfiguration['widget_type'],
  widgetName: string,
  platform: MobileWidgetConfiguration['platform'],
  widgetConfig: any
): Promise<MobileWidgetConfiguration | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create widget')
      return null
    }

    const { data, error } = await supabase
      .from('mobile_widget_configurations')
      .insert({
        user_id: user.id,
        widget_type: widgetType,
        widget_name: widgetName,
        platform,
        widget_config: widgetConfig
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating widget:', error)
      toast.error('Failed to create widget')
      return null
    }

    toast.success('Widget created!')
    return data as MobileWidgetConfiguration
  } catch (error) {
    logger.error('Error in createMobileWidget:', error)
    return null
  }
}

export async function getMobileWidgets(): Promise<MobileWidgetConfiguration[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('mobile_widget_configurations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching widgets:', error)
      return []
    }

    return (data || []) as MobileWidgetConfiguration[]
  } catch (error) {
    logger.error('Error in getMobileWidgets:', error)
    return []
  }
}

// ==================== App Shortcuts ====================

export interface AppShortcut {
  id: string
  user_id: string
  shortcut_type: 'scan' | 'diary_entry' | 'routine_start' | 'quick_action' | 'custom'
  shortcut_name: string
  shortcut_icon: string | null
  shortcut_action: any
  platform: 'ios' | 'android' | 'both'
  usage_count: number
  last_used_at: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export async function createAppShortcut(
  shortcutType: AppShortcut['shortcut_type'],
  shortcutName: string,
  shortcutAction: any,
  platform: AppShortcut['platform'] = 'both'
): Promise<AppShortcut | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create shortcut')
      return null
    }

    const { data, error } = await supabase
      .from('app_shortcuts')
      .insert({
        user_id: user.id,
        shortcut_type: shortcutType,
        shortcut_name: shortcutName,
        shortcut_action: shortcutAction,
        platform
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating shortcut:', error)
      toast.error('Failed to create shortcut')
      return null
    }

    toast.success('Shortcut created!')
    return data as AppShortcut
  } catch (error) {
    logger.error('Error in createAppShortcut:', error)
    return null
  }
}

export async function getAppShortcuts(): Promise<AppShortcut[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('app_shortcuts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      logger.error('Error fetching shortcuts:', error)
      return []
    }

    return (data || []) as AppShortcut[]
  } catch (error) {
    logger.error('Error in getAppShortcuts:', error)
    return []
  }
}

// ==================== Haptic Feedback ====================

export interface HapticFeedbackPreferences {
  id: string
  user_id: string
  haptic_enabled: boolean
  haptic_intensity: 'light' | 'medium' | 'strong'
  haptic_patterns: any
  disable_on_low_battery: boolean
  created_at: string
  updated_at: string
}

export async function getHapticPreferences(): Promise<HapticFeedbackPreferences | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('haptic_feedback_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is OK
      logger.error('Error fetching haptic preferences:', error)
      return null
    }

    if (!data) {
      // Create default preferences
      const { data: newData, error: createError } = await supabase
        .from('haptic_feedback_preferences')
        .insert({
          user_id: user.id,
          haptic_patterns: {}
        })
        .select()
        .single()

      if (createError) {
        logger.error('Error creating haptic preferences:', createError)
        return null
      }

      return newData as HapticFeedbackPreferences
    }

    return data as HapticFeedbackPreferences
  } catch (error) {
    logger.error('Error in getHapticPreferences:', error)
    return null
  }
}

export async function updateHapticPreferences(
  preferences: Partial<HapticFeedbackPreferences>
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in')
      return false
    }

    const { error } = await supabase
      .from('haptic_feedback_preferences')
      .upsert({
        user_id: user.id,
        ...preferences
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      logger.error('Error updating haptic preferences:', error)
      toast.error('Failed to update preferences')
      return false
    }

    toast.success('Haptic preferences updated!')
    return true
  } catch (error) {
    logger.error('Error in updateHapticPreferences:', error)
    return false
  }
}

// ==================== Wearable Devices ====================

export interface WearableDevice {
  id: string
  user_id: string
  device_type: 'apple_watch' | 'wear_os' | 'fitbit' | 'other'
  device_name: string
  device_model: string | null
  device_identifier: string
  is_connected: boolean
  connection_status: 'connected' | 'disconnected' | 'error'
  last_connected_at: string | null
  last_sync_at: string | null
  capabilities: any | null
  auto_sync_enabled: boolean
  sync_frequency_minutes: number
  created_at: string
  updated_at: string
}

export async function connectWearableDevice(
  deviceType: WearableDevice['device_type'],
  deviceName: string,
  deviceIdentifier: string
): Promise<WearableDevice | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to connect device')
      return null
    }

    const { data, error } = await supabase
      .from('wearable_devices')
      .upsert({
        user_id: user.id,
        device_type: deviceType,
        device_name: deviceName,
        device_identifier: deviceIdentifier,
        is_connected: true,
        connection_status: 'connected',
        last_connected_at: new Date().toISOString()
      }, {
        onConflict: 'device_identifier'
      })
      .select()
      .single()

    if (error) {
      logger.error('Error connecting device:', error)
      toast.error('Failed to connect device')
      return null
    }

    toast.success('Wearable device connected!')
    return data as WearableDevice
  } catch (error) {
    logger.error('Error in connectWearableDevice:', error)
    return null
  }
}

export async function getWearableDevices(): Promise<WearableDevice[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('wearable_devices')
      .select('*')
      .eq('user_id', user.id)
      .order('last_connected_at', { ascending: false, nullsLast: true })

    if (error) {
      logger.error('Error fetching devices:', error)
      return []
    }

    return (data || []) as WearableDevice[]
  } catch (error) {
    logger.error('Error in getWearableDevices:', error)
    return []
  }
}

