/**
 * Health App Integrations
 * Handles Apple Health, Google Fit, Fitbit, MyFitnessPal, nutrition tracking, and sleep tracking integrations
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Health App Integrations ====================

export interface HealthAppIntegration {
  id: string
  user_id: string
  integration_type: 'apple_health' | 'google_fit' | 'fitbit' | 'myfitnesspal' | 'nutrition_app' | 'sleep_app' | 'other'
  integration_name: string
  access_token_encrypted: string | null
  refresh_token_encrypted: string | null
  api_key_encrypted: string | null
  is_connected: boolean
  connection_status: 'connected' | 'disconnected' | 'error' | 'expired'
  last_sync_at: string | null
  last_sync_status: 'success' | 'partial' | 'failed' | null
  last_error: string | null
  auto_sync_enabled: boolean
  sync_frequency_minutes: number
  sync_data_types: string[]
  permissions_granted: string[] | null
  permissions_required: string[] | null
  created_at: string
  updated_at: string
}

export async function connectHealthApp(
  integrationType: HealthAppIntegration['integration_type'],
  integrationName: string,
  syncDataTypes: string[]
): Promise<HealthAppIntegration | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to connect health app')
      return null
    }

    // Call OAuth Edge Function to initiate connection
    const { data: oauthData, error: oauthError } = await supabase.functions.invoke('oauth-health-app', {
      body: {
        integration_type: integrationType,
        integration_name: integrationName
      }
    })

    if (oauthError) {
      logger.error('Error initiating OAuth:', oauthError)
      toast.error('Failed to connect health app')
      return null
    }

    // Redirect to OAuth URL if provided
    if (oauthData.auth_url) {
      window.location.href = oauthData.auth_url
      return null
    }

    // If tokens provided directly, save integration
    const { data, error } = await supabase
      .from('health_app_integrations')
      .upsert({
        user_id: user.id,
        integration_type: integrationType,
        integration_name: integrationName,
        sync_data_types: syncDataTypes,
        is_connected: true,
        connection_status: 'connected'
      }, {
        onConflict: 'user_id,integration_type'
      })
      .select()
      .single()

    if (error) {
      logger.error('Error saving integration:', error)
      return null
    }

    toast.success('Health app connected!')
    return data as HealthAppIntegration
  } catch (error) {
    logger.error('Error in connectHealthApp:', error)
    return null
  }
}

export async function getHealthAppIntegrations(): Promise<HealthAppIntegration[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('health_app_integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching integrations:', error)
      return []
    }

    return (data || []) as HealthAppIntegration[]
  } catch (error) {
    logger.error('Error in getHealthAppIntegrations:', error)
    return []
  }
}

export async function syncHealthAppData(integrationId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to sync data')
      return false
    }

    // Call sync Edge Function
    const { data, error } = await supabase.functions.invoke('sync-health-data', {
      body: {
        integration_id: integrationId
      }
    })

    if (error) {
      logger.error('Error syncing data:', error)
      toast.error('Failed to sync data')
      return false
    }

    toast.success('Data sync completed!')
    return true
  } catch (error) {
    logger.error('Error in syncHealthAppData:', error)
    return false
  }
}

export async function disconnectHealthApp(integrationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('health_app_integrations')
      .update({
        is_connected: false,
        connection_status: 'disconnected'
      })
      .eq('id', integrationId)

    if (error) {
      logger.error('Error disconnecting:', error)
      toast.error('Failed to disconnect')
      return false
    }

    toast.success('Health app disconnected')
    return true
  } catch (error) {
    logger.error('Error in disconnectHealthApp:', error)
    return false
  }
}

