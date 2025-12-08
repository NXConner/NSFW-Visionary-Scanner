/**
 * API & Webhooks
 * Handles public API, webhook system, API key management, rate limiting, and usage analytics
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== API Keys ====================

export interface APIKey {
  id: string
  user_id: string
  key_name: string
  api_key_hash: string
  api_key_prefix: string
  access_tier: 'basic' | 'pro' | 'enterprise'
  rate_limit_per_minute: number
  rate_limit_per_hour: number
  rate_limit_per_day: number
  allowed_endpoints: string[] | null
  allowed_methods: string[]
  is_active: boolean
  expires_at: string | null
  last_used_at: string | null
  total_requests: number
  last_request_at: string | null
  created_at: string
  updated_at: string
}

export async function createAPIKey(
  keyName: string,
  accessTier: APIKey['access_tier'] = 'basic'
): Promise<{ api_key: string; apiKeyRecord: APIKey } | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create API key')
      return null
    }

    // Generate API key via Edge Function
    const { data: keyData, error: keyError } = await supabase.functions.invoke('generate-api-key', {
      body: {
        key_name: keyName,
        access_tier: accessTier
      }
    })

    if (keyError) {
      logger.error('Error generating API key:', keyError)
      toast.error('Failed to create API key')
      return null
    }

    // Save API key record
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        key_name: keyName,
        api_key_hash: keyData.key_hash,
        api_key_prefix: keyData.key_prefix,
        access_tier: accessTier
      })
      .select()
      .single()

    if (error) {
      logger.error('Error saving API key:', error)
      return null
    }

    toast.success('API key created! Save it securely - it won\'t be shown again.')
    return {
      api_key: keyData.api_key, // Only shown once
      apiKeyRecord: data as APIKey
    }
  } catch (error) {
    logger.error('Error in createAPIKey:', error)
    return null
  }
}

export async function getAPIKeys(): Promise<APIKey[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching API keys:', error)
      return []
    }

    return (data || []) as APIKey[]
  } catch (error) {
    logger.error('Error in getAPIKeys:', error)
    return []
  }
}

export async function revokeAPIKey(apiKeyId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', apiKeyId)

    if (error) {
      logger.error('Error revoking API key:', error)
      toast.error('Failed to revoke API key')
      return false
    }

    toast.success('API key revoked')
    return true
  } catch (error) {
    logger.error('Error in revokeAPIKey:', error)
    return false
  }
}

// ==================== Webhooks ====================

export interface Webhook {
  id: string
  user_id: string
  webhook_name: string
  webhook_url: string
  webhook_secret: string | null
  subscribed_events: string[]
  is_active: boolean
  is_verified: boolean
  verification_token: string | null
  max_retries: number
  retry_delay_seconds: number
  total_deliveries: number
  successful_deliveries: number
  failed_deliveries: number
  last_delivery_at: string | null
  created_at: string
  updated_at: string
}

export async function createWebhook(
  webhookName: string,
  webhookUrl: string,
  subscribedEvents: string[]
): Promise<Webhook | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create webhook')
      return null
    }

    const { data, error } = await supabase
      .from('webhooks')
      .insert({
        user_id: user.id,
        webhook_name: webhookName,
        webhook_url: webhookUrl,
        subscribed_events: subscribedEvents
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating webhook:', error)
      toast.error('Failed to create webhook')
      return null
    }

    toast.success('Webhook created! Verify it to activate.')
    return data as Webhook
  } catch (error) {
    logger.error('Error in createWebhook:', error)
    return null
  }
}

export async function getWebhooks(): Promise<Webhook[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching webhooks:', error)
      return []
    }

    return (data || []) as Webhook[]
  } catch (error) {
    logger.error('Error in getWebhooks:', error)
    return []
  }
}

export async function verifyWebhook(webhookId: string, verificationToken: string): Promise<boolean> {
  try {
    const { data: webhook } = await supabase
      .from('webhooks')
      .select('verification_token')
      .eq('id', webhookId)
      .single()

    if (!webhook || webhook.verification_token !== verificationToken) {
      toast.error('Invalid verification token')
      return false
    }

    const { error } = await supabase
      .from('webhooks')
      .update({ is_verified: true })
      .eq('id', webhookId)

    if (error) {
      logger.error('Error verifying webhook:', error)
      return false
    }

    toast.success('Webhook verified!')
    return true
  } catch (error) {
    logger.error('Error in verifyWebhook:', error)
    return false
  }
}

