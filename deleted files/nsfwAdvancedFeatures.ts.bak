/**
 * NSFW Advanced Features
 * Handles pornmd.com integration, multi-camera recording, partner sync video, intimate date planning, and seductive AI chat
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== PornMD Integration ====================

export interface PornMDIntegration {
  id: string
  user_id: string
  is_enabled: boolean
  is_partner: boolean
  partner_tier: 'sponsor' | 'premium' | 'standard' | null
  api_key_encrypted: string | null
  api_secret_encrypted: string | null
  content_preferences: any
  sync_enabled: boolean
  last_sync_at: string | null
  sync_count: number
  created_at: string
  updated_at: string
}

export async function enablePornMDIntegration(
  apiKey: string,
  apiSecret: string,
  preferences: any
): Promise<PornMDIntegration | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to enable PornMD integration')
      return null
    }

    // Encrypt credentials via Edge Function
    const { data: encryptedData, error: encryptError } = await supabase.functions.invoke('encrypt-credentials', {
      body: {
        api_key: apiKey,
        api_secret: apiSecret
      }
    })

    if (encryptError || !encryptedData) {
      logger.error('Error encrypting credentials:', encryptError)
      toast.error('Failed to encrypt credentials')
      return null
    }

    const { data, error } = await supabase
      .from('pornmd_integration')
      .upsert({
        user_id: user.id,
        is_enabled: true,
        api_key_encrypted: encryptedData.api_key_encrypted,
        api_secret_encrypted: encryptedData.api_secret_encrypted,
        content_preferences: preferences,
        sync_enabled: true
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      logger.error('Error enabling PornMD integration:', error)
      toast.error('Failed to enable integration')
      return null
    }

    toast.success('PornMD integration enabled!')
    return data as PornMDIntegration
  } catch (error) {
    logger.error('Error in enablePornMDIntegration:', error)
    return null
  }
}

export async function getPornMDIntegration(): Promise<PornMDIntegration | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('pornmd_integration')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      logger.error('Error fetching PornMD integration:', error)
      return null
    }

    return (data || null) as PornMDIntegration | null
  } catch (error) {
    logger.error('Error in getPornMDIntegration:', error)
    return null
  }
}

// ==================== Multi-Camera Recording ====================

export interface MultiCameraSession {
  id: string
  user_id: string
  partner_id: string | null
  session_name: string
  session_type: 'solo' | 'partner_sync' | 'multi_camera'
  recording_status: 'draft' | 'recording' | 'paused' | 'completed' | 'editing' | 'published'
  camera_count: number
  sync_enabled: boolean
  quality: '720p' | '1080p' | '4k'
  started_at: string | null
  completed_at: string | null
  duration_seconds: number | null
  is_private: boolean
  share_with_partner: boolean
  created_at: string
  updated_at: string
}

export async function createMultiCameraSession(
  sessionName: string,
  sessionType: MultiCameraSession['session_type'],
  partnerId: string | null = null,
  quality: MultiCameraSession['quality'] = '1080p'
): Promise<MultiCameraSession | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create session')
      return null
    }

    const { data, error } = await supabase
      .from('multi_camera_sessions')
      .insert({
        user_id: user.id,
        partner_id: partnerId,
        session_name: sessionName,
        session_type: sessionType,
        quality,
        sync_enabled: partnerId !== null
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating session:', error)
      toast.error('Failed to create session')
      return null
    }

    toast.success('Recording session created!')
    return data as MultiCameraSession
  } catch (error) {
    logger.error('Error in createMultiCameraSession:', error)
    return null
  }
}

export async function startRecording(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('multi_camera_sessions')
      .update({
        recording_status: 'recording',
        started_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) {
      logger.error('Error starting recording:', error)
      toast.error('Failed to start recording')
      return false
    }

    toast.success('Recording started!')
    return true
  } catch (error) {
    logger.error('Error in startRecording:', error)
    return false
  }
}

export async function stopRecording(sessionId: string, durationSeconds: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('multi_camera_sessions')
      .update({
        recording_status: 'completed',
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds
      })
      .eq('id', sessionId)

    if (error) {
      logger.error('Error stopping recording:', error)
      toast.error('Failed to stop recording')
      return false
    }

    toast.success('Recording completed!')
    return true
  } catch (error) {
    logger.error('Error in stopRecording:', error)
    return false
  }
}

// ==================== Intimate Date Proposals ====================

export interface IntimateDateProposal {
  id: string
  creator_id: string
  partner_id: string
  proposal_title: string
  proposal_type: 'template' | 'custom' | 'quick'
  template_id: string | null
  proposed_date: string
  proposed_time: string
  duration_minutes: number | null
  location_name: string | null
  location_address: string | null
  location_type: 'home' | 'hotel' | 'outdoor' | 'other' | null
  is_location_private: boolean
  activities: any
  specialty_intimacy: string[] | null
  special_requests: string | null
  voice_message_url: string | null
  voice_message_duration_seconds: number | null
  images_urls: string[] | null
  gifs_urls: string[] | null
  videos_urls: string[] | null
  links: string[] | null
  text_message: string | null
  adult_emojis: string[] | null
  proposal_status: 'pending' | 'reviewed' | 'accepted' | 'declined' | 'modified' | 'resubmitted'
  partner_response: string | null
  partner_modified_date: string | null
  partner_modified_time: string | null
  partner_suggestions: string | null
  partner_media_urls: string[] | null
  reviewed_at: string | null
  responded_at: string | null
  accepted_at: string | null
  created_at: string
  updated_at: string
}

export async function createIntimateDateProposal(
  partnerId: string,
  proposalData: {
    title: string
    date: string
    time: string
    location?: string
    locationType?: IntimateDateProposal['location_type']
    activities: any
    positions?: string[]
    message?: string
    voiceMessageUrl?: string
    images?: string[]
    gifs?: string[]
    videos?: string[]
    emojis?: string[]
  }
): Promise<IntimateDateProposal | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create proposal')
      return null
    }

    const { data, error } = await supabase
      .from('intimate_date_proposals')
      .insert({
        creator_id: user.id,
        partner_id: partnerId,
        proposal_title: proposalData.title,
        proposed_date: proposalData.date,
        proposed_time: proposalData.time,
        location_name: proposalData.location,
        location_type: proposalData.locationType || 'home',
        activities: proposalData.activities,
        specialty_intimacy: proposalData.positions,
        text_message: proposalData.message,
        voice_message_url: proposalData.voiceMessageUrl,
        images_urls: proposalData.images,
        gifs_urls: proposalData.gifs,
        videos_urls: proposalData.videos,
        adult_emojis: proposalData.emojis
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating proposal:', error)
      toast.error('Failed to create proposal')
      return null
    }

    // Send notification to partner
    await supabase.functions.invoke('send-notification', {
      body: {
        user_id: partnerId,
        type: 'intimate_date_proposal',
        title: 'New Intimate Date Proposal',
        message: `${user.email} has sent you an intimate date proposal`,
        data: { proposal_id: data.id }
      }
    })

    toast.success('Proposal sent to partner!')
    return data as IntimateDateProposal
  } catch (error) {
    logger.error('Error in createIntimateDateProposal:', error)
    return null
  }
}

export async function respondToProposal(
  proposalId: string,
  response: 'accepted' | 'declined' | 'modified',
  modifications?: {
    date?: string
    time?: string
    location?: string
    suggestions?: string
    media?: string[]
  }
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in')
      return false
    }

    const updateData: any = {
      proposal_status: response,
      responded_at: new Date().toISOString()
    }

    if (response === 'accepted') {
      updateData.accepted_at = new Date().toISOString()
    } else if (response === 'modified' && modifications) {
      updateData.proposal_status = 'resubmitted'
      updateData.partner_modified_date = modifications.date
      updateData.partner_modified_time = modifications.time
      updateData.partner_suggestions = modifications.suggestions
      updateData.partner_media_urls = modifications.media
    }

    const { error } = await supabase
      .from('intimate_date_proposals')
      .update(updateData)
      .eq('id', proposalId)
      .eq('partner_id', user.id)

    if (error) {
      logger.error('Error responding to proposal:', error)
      toast.error('Failed to respond')
      return false
    }

    toast.success(`Proposal ${response}!`)
    return true
  } catch (error) {
    logger.error('Error in respondToProposal:', error)
    return false
  }
}

// ==================== Seductive AI Chat ====================

export interface SeductiveAISession {
  id: string
  user_id: string
  partner_id: string | null
  session_name: string | null
  session_type: 'solo' | 'partner' | 'group'
  ai_personality: 'seductive' | 'flirty' | 'dirty' | 'nasty' | 'romantic' | 'kinky' | 'custom'
  ai_intensity: 'light' | 'medium' | 'strong' | 'extreme'
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function createSeductiveAISession(
  personality: SeductiveAISession['ai_personality'] = 'seductive',
  intensity: SeductiveAISession['ai_intensity'] = 'medium',
  partnerId: string | null = null
): Promise<SeductiveAISession | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in')
      return null
    }

    const { data, error } = await supabase
      .from('seductive_ai_sessions')
      .insert({
        user_id: user.id,
        partner_id: partnerId,
        session_type: partnerId ? 'partner' : 'solo',
        ai_personality: personality,
        ai_intensity: intensity
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating AI session:', error)
      toast.error('Failed to create session')
      return null
    }

    return data as SeductiveAISession
  } catch (error) {
    logger.error('Error in createSeductiveAISession:', error)
    return null
  }
}

export async function sendSeductiveAIMessage(
  sessionId: string,
  message: string,
  media?: {
    images?: string[]
    gifs?: string[]
    videos?: string[]
    voiceMessage?: string
    emojis?: string[]
  }
): Promise<{ userMessage: any; aiResponse: any } | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Save user message
    const { data: userMessage, error: userError } = await supabase
      .from('seductive_ai_messages')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        message_type: 'user',
        message_content: message,
        images_urls: media?.images,
        gifs_urls: media?.gifs,
        videos_urls: media?.videos,
        voice_message_url: media?.voiceMessage,
        adult_emojis: media?.emojis
      })
      .select()
      .single()

    if (userError) {
      logger.error('Error saving user message:', userError)
      return null
    }

    // Get AI response via Edge Function
    const { data: aiResponseData, error: aiError } = await supabase.functions.invoke('seductive-ai-chat', {
      body: {
        session_id: sessionId,
        user_message: message,
        media: media
      }
    })

    if (aiError || !aiResponseData) {
      logger.error('Error getting AI response:', aiError)
      return null
    }

    // Save AI response
    const { data: aiMessage, error: aiMessageError } = await supabase
      .from('seductive_ai_messages')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        message_type: 'ai',
        message_content: aiResponseData.message,
        ai_confidence: aiResponseData.confidence,
        ai_sentiment: aiResponseData.sentiment,
        ai_suggestions: aiResponseData.suggestions,
        context_data: aiResponseData.context
      })
      .select()
      .single()

    if (aiMessageError) {
      logger.error('Error saving AI message:', aiMessageError)
      return null
    }

    return {
      userMessage: userMessage,
      aiResponse: aiMessage
    }
  } catch (error) {
    logger.error('Error in sendSeductiveAIMessage:', error)
    return null
  }
}

// ==================== Sex Positions Library ====================

export interface SexPosition {
  id: string
  position_name: string
  position_category: 'basic' | 'advanced' | 'kinky' | 'romantic' | 'adventurous' | 'acrobatic'
  difficulty_level: 'easy' | 'medium' | 'hard' | 'expert'
  description: string | null
  instructions: string[] | null
  tips: string[] | null
  image_url: string | null
  video_url: string | null
  gif_url: string | null
  popularity_score: number
  is_featured: boolean
  created_at: string
  updated_at: string
}

export async function getSexPositions(
  category?: SexPosition['position_category'],
  difficulty?: SexPosition['difficulty_level']
): Promise<SexPosition[]> {
  try {
    let query = supabase
      .from('sex_positions_library')
      .select('*')
      .order('popularity_score', { ascending: false })

    if (category) {
      query = query.eq('position_category', category)
    }
    if (difficulty) {
      query = query.eq('difficulty_level', difficulty)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching positions:', error)
      return []
    }

    return (data || []) as SexPosition[]
  } catch (error) {
    logger.error('Error in getSexPositions:', error)
    return []
  }
}

export async function savePosition(positionId: string, notes?: string, favorite?: boolean): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in')
      return false
    }

    const { error } = await supabase
      .from('user_saved_positions')
      .upsert({
        user_id: user.id,
        position_id: positionId,
        personal_notes: notes,
        favorite: favorite || false
      }, {
        onConflict: 'user_id,position_id'
      })

    if (error) {
      logger.error('Error saving position:', error)
      toast.error('Failed to save position')
      return false
    }

    toast.success('Position saved!')
    return true
  } catch (error) {
    logger.error('Error in savePosition:', error)
    return false
  }
}

