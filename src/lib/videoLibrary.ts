/**
 * Video Library System
 * Manages educational videos, tutorials, playlists, progress tracking, and offline downloads
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'

export interface Video {
  id?: string
  title: string
  description?: string
  category: 'education' | 'exercise' | 'technique' | 'expert_interview' | 'webinar' | 'tutorial' | 'nsfw_instructional'
  video_url: string
  thumbnail_url?: string
  duration_seconds?: number
  file_size_bytes?: number
  instructor_name?: string
  instructor_credentials?: string
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
  tags?: string[]
  is_featured?: boolean
  is_premium?: boolean
  is_nsfw?: boolean
  order_index?: number
  view_count?: number
  like_count?: number
  rating_average?: number
  rating_count?: number
  created_at?: string
  updated_at?: string
}

export interface VideoPlaylist {
  id?: string
  user_id?: string
  name: string
  description?: string
  is_public?: boolean
  is_featured?: boolean
  video_count?: number
  view_count?: number
  created_at?: string
  updated_at?: string
}

export interface VideoProgress {
  id?: string
  user_id?: string
  video_id: string
  progress_seconds?: number
  progress_percentage?: number
  is_completed?: boolean
  completed_at?: string
  watch_count?: number
  last_watched_at?: string
  created_at?: string
  updated_at?: string
}

export interface VideoBookmark {
  id?: string
  user_id?: string
  video_id: string
  notes?: string
  created_at?: string
}

export interface VideoDownload {
  id?: string
  user_id?: string
  video_id: string
  download_status?: 'pending' | 'downloading' | 'completed' | 'failed'
  download_progress?: number
  local_file_path?: string
  file_size_bytes?: number
  downloaded_at?: string
  expires_at?: string
  created_at?: string
  updated_at?: string
}

export interface VideoRating {
  id?: string
  user_id?: string
  video_id: string
  rating: number
  review_text?: string
  created_at?: string
  updated_at?: string
}

/**
 * Get videos
 */
export async function getVideos(
  category?: string,
  featured?: boolean,
  premiumOnly?: boolean
): Promise<Video[]> {
  try {
    let query = supabase
      .from('video_library')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }
    if (featured) {
      query = query.eq('is_featured', true)
    }
    if (premiumOnly !== undefined) {
      query = query.eq('is_premium', premiumOnly)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get videos', { error })
    throw error
  }
}

/**
 * Get a single video
 */
export async function getVideo(videoId: string): Promise<Video | null> {
  try {
    const { data, error } = await supabase
      .from('video_library')
      .select('*')
      .eq('id', videoId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    logger.error('Failed to get video', { error, videoId })
    return null
  }
}

/**
 * Update video progress
 */
export async function updateVideoProgress(
  videoId: string,
  progressSeconds: number,
  durationSeconds?: number
): Promise<VideoProgress> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const progressPercentage = durationSeconds
      ? (progressSeconds / durationSeconds) * 100
      : 0

    const isCompleted = progressPercentage >= 90 // Consider 90% as completed

    const { data, error } = await supabase
      .from('video_progress')
      .upsert({
        user_id: user.id,
        video_id: videoId,
        progress_seconds: progressSeconds,
        progress_percentage: progressPercentage,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        watch_count: 1, // Will be incremented by trigger
        last_watched_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,video_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) throw error

    // Increment watch count if this is a new viewing session
    if (data.watch_count === 1) {
      await supabase.rpc('increment_video_watch_count', { video_id: videoId })
    }

    return data
  } catch (error) {
    logger.error('Failed to update video progress', { error, videoId })
    throw error
  }
}

/**
 * Get user's video progress
 */
export async function getUserVideoProgress(videoId?: string): Promise<VideoProgress[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('video_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('last_watched_at', { ascending: false })

    if (videoId) {
      query = query.eq('video_id', videoId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get user video progress', { error })
    throw error
  }
}

/**
 * Create a playlist
 */
export async function createPlaylist(
  playlist: Omit<VideoPlaylist, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'video_count' | 'view_count'>
): Promise<VideoPlaylist> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('video_playlists')
      .insert({
        ...playlist,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error

    logger.info('Playlist created', { playlistId: data.id })
    return data
  } catch (error) {
    logger.error('Failed to create playlist', { error, playlist })
    throw error
  }
}

/**
 * Get playlists
 */
export async function getPlaylists(userId?: string): Promise<VideoPlaylist[]> {
  try {
    let query = supabase
      .from('video_playlists')
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      query = query.eq('is_public', true)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get playlists', { error })
    throw error
  }
}

/**
 * Add video to playlist
 */
export async function addVideoToPlaylist(
  playlistId: string,
  videoId: string,
  orderIndex?: number
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('playlist_videos')
      .insert({
        playlist_id: playlistId,
        video_id: videoId,
        order_index: orderIndex || 0,
      })

    if (error) throw error
  } catch (error) {
    logger.error('Failed to add video to playlist', { error, playlistId, videoId })
    throw error
  }
}

/**
 * Get playlist videos
 */
export async function getPlaylistVideos(playlistId: string): Promise<Video[]> {
  try {
    const { data, error } = await supabase
      .from('playlist_videos')
      .select(`
        video_id,
        order_index,
        video:video_library(*)
      `)
      .eq('playlist_id', playlistId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return (data || []).map((item: any) => item.video).filter(Boolean)
  } catch (error) {
    logger.error('Failed to get playlist videos', { error, playlistId })
    throw error
  }
}

/**
 * Bookmark a video
 */
export async function bookmarkVideo(videoId: string, notes?: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('video_bookmarks')
      .upsert({
        user_id: user.id,
        video_id: videoId,
        notes,
      }, {
        onConflict: 'user_id,video_id',
        ignoreDuplicates: false
      })

    if (error) throw error
  } catch (error) {
    logger.error('Failed to bookmark video', { error, videoId })
    throw error
  }
}

/**
 * Get bookmarked videos
 */
export async function getBookmarkedVideos(): Promise<Video[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('video_bookmarks')
      .select(`
        video_id,
        notes,
        video:video_library(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map((item: any) => item.video).filter(Boolean)
  } catch (error) {
    logger.error('Failed to get bookmarked videos', { error })
    throw error
  }
}

/**
 * Rate a video
 */
export async function rateVideo(
  videoId: string,
  rating: number,
  reviewText?: string
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    const { error } = await supabase
      .from('video_ratings')
      .upsert({
        user_id: user.id,
        video_id: videoId,
        rating,
        review_text: reviewText,
      }, {
        onConflict: 'user_id,video_id',
        ignoreDuplicates: false
      })

    if (error) throw error
  } catch (error) {
    logger.error('Failed to rate video', { error, videoId, rating })
    throw error
  }
}

/**
 * Get user's rating for a video
 */
export async function getUserVideoRating(videoId: string): Promise<VideoRating | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('video_ratings')
      .select('*')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  } catch (error) {
    logger.error('Failed to get user video rating', { error, videoId })
    return null
  }
}

/**
 * Initiate video download (for offline viewing)
 */
export async function initiateVideoDownload(videoId: string): Promise<VideoDownload> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('video_downloads')
      .insert({
        user_id: user.id,
        video_id: videoId,
        download_status: 'pending',
        download_progress: 0,
      })
      .select()
      .single()

    if (error) throw error

    // In a real implementation, this would trigger a background job to download the video
    logger.info('Video download initiated', { videoId, downloadId: data.id })
    return data
  } catch (error) {
    logger.error('Failed to initiate video download', { error, videoId })
    throw error
  }
}

/**
 * Get user's video downloads
 */
export async function getUserVideoDownloads(): Promise<VideoDownload[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('video_downloads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get user video downloads', { error })
    throw error
  }
}


