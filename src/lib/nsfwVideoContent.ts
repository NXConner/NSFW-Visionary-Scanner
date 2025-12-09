/**
 * NSFW Video Content System
 * Handles NSFW educational videos, technique demonstrations, expert interviews, tutorials, playlists, downloads, and recommendations
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== NSFW Video Content ====================

export interface NSFWVideoContent {
  id: string
  title: string
  description: string
  category: 'technique' | 'tutorial' | 'expert_interview' | 'educational' | 'demonstration' | 'advanced' | 'beginner'
  video_url_sd: string | null
  video_url_hd: string | null
  video_url_2k: string | null
  video_url_4k: string | null
  video_duration_seconds: number | null
  thumbnail_url: string | null
  preview_gif_url: string | null
  tags: string[] | null
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
  content_rating: 'educational' | 'demonstrative' | 'explicit' | null
  expert_id: string | null
  expert_name: string | null
  expert_credentials: string | null
  step_by_step_guide: any
  key_points: string[] | null
  warnings: string[] | null
  prerequisites: string[] | null
  view_count: number
  like_count: number
  favorite_count: number
  share_count: number
  average_rating: number | null
  rating_count: number
  is_premium: boolean
  is_featured: boolean
  requires_dlc: boolean
  dlc_pack_id: string | null
  is_approved: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getNSFWVideos(
  category?: NSFWVideoContent['category'],
  difficultyLevel?: NSFWVideoContent['difficulty_level']
): Promise<NSFWVideoContent[]> {
  try {
    let query = supabase
      .from('nsfw_video_content')
      .select('*')
      .eq('is_approved', true)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('view_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }
    if (difficultyLevel) {
      query = query.eq('difficulty_level', difficultyLevel)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching videos:', error)
      return []
    }

    return (data || []) as NSFWVideoContent[]
  } catch (error) {
    logger.error('Error in getNSFWVideos:', error)
    return []
  }
}

// ==================== Video Playlists ====================

export interface NSFWVideoPlaylist {
  id: string
  user_id: string | null
  playlist_name: string
  description: string | null
  category: string | null
  video_ids: string[]
  video_count: number
  total_duration_seconds: number | null
  is_public: boolean
  is_featured: boolean
  is_curated: boolean
  view_count: number
  like_count: number
  copy_count: number
  auto_play_next: boolean
  shuffle_enabled: boolean
  created_at: string
  updated_at: string
}

export async function createVideoPlaylist(
  playlistName: string,
  videoIds: string[],
  description?: string,
  isPublic: boolean = false
): Promise<NSFWVideoPlaylist | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create playlist')
      return null
    }

    const { data, error } = await supabase
      .from('nsfw_video_playlists')
      .insert({
        user_id: user.id,
        playlist_name: playlistName,
        description: description || null,
        video_ids: videoIds,
        video_count: videoIds.length,
        is_public: isPublic
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating playlist:', error)
      toast.error('Failed to create playlist')
      return null
    }

    toast.success('Playlist created!')
    return data as NSFWVideoPlaylist
  } catch (error) {
    logger.error('Error in createVideoPlaylist:', error)
    return null
  }
}

// ==================== Video Progress Tracking ====================

export interface NSFWVideoProgress {
  id: string
  video_id: string
  user_id: string
  current_position_seconds: number
  watched_duration_seconds: number
  completion_percentage: number
  is_completed: boolean
  playback_speed: number
  quality_preference: 'sd' | 'hd' | '2k' | '4k' | 'auto'
  watched_at: string
  completed_at: string | null
  last_position_updated_at: string
  created_at: string
  updated_at: string
}

export async function updateVideoProgress(
  videoId: string,
  currentPositionSeconds: number,
  watchedDurationSeconds: number
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const completionPercentage = watchedDurationSeconds > 0
      ? Math.min(100, (watchedDurationSeconds / (watchedDurationSeconds + currentPositionSeconds)) * 100)
      : 0

    const { error } = await supabase
      .from('nsfw_video_progress')
      .upsert({
        video_id: videoId,
        user_id: user.id,
        current_position_seconds: currentPositionSeconds,
        watched_duration_seconds: watchedDurationSeconds,
        completion_percentage: completionPercentage,
        is_completed: completionPercentage >= 90,
        last_position_updated_at: new Date().toISOString()
      }, {
        onConflict: 'video_id,user_id'
      })

    if (error) {
      logger.error('Error updating progress:', error)
      return false
    }

    return true
  } catch (error) {
    logger.error('Error in updateVideoProgress:', error)
    return false
  }
}

// ==================== Video Downloads ====================

export interface NSFWVideoDownload {
  id: string
  video_id: string
  user_id: string
  quality: 'sd' | 'hd' | '2k' | '4k'
  file_path: string
  file_size_bytes: number | null
  download_status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused'
  downloaded_bytes: number
  download_progress: number
  downloaded_at: string | null
  completed_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export async function requestVideoDownload(
  videoId: string,
  quality: NSFWVideoDownload['quality']
): Promise<NSFWVideoDownload | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to download video')
      return null
    }

    // Call download Edge Function
    const { data: downloadData, error: downloadError } = await supabase.functions.invoke('download-nsfw-video', {
      body: {
        video_id: videoId,
        quality
      }
    })

    if (downloadError) {
      logger.error('Error requesting download:', downloadError)
      toast.error('Failed to start download')
      return null
    }

    // Create download record
    const { data, error } = await supabase
      .from('nsfw_video_downloads')
      .insert({
        video_id: videoId,
        user_id: user.id,
        quality,
        file_path: downloadData.file_path,
        file_size_bytes: downloadData.file_size,
        download_status: 'downloading'
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating download record:', error)
      return null
    }

    toast.success('Download started!')
    return data as NSFWVideoDownload
  } catch (error) {
    logger.error('Error in requestVideoDownload:', error)
    return null
  }
}

export async function getVideoDownloads(): Promise<NSFWVideoDownload[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('nsfw_video_downloads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching downloads:', error)
      return []
    }

    return (data || []) as NSFWVideoDownload[]
  } catch (error) {
    logger.error('Error in getVideoDownloads:', error)
    return []
  }
}

