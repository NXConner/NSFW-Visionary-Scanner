/**
 * Video Processing Utilities
 * Handles video recording, encoding, playback, processing, multi-camera sync, and WebRTC
 */

import { uploadVideo, getFileUrl, STORAGE_BUCKETS } from './mediaUpload'
import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

export interface VideoRecordingOptions {
  quality?: '720p' | '1080p' | '2k' | '4k'
  frameRate?: number
  audio?: boolean
  onProgress?: (progress: number) => void
}

export interface VideoRecording {
  id: string
  blob: Blob
  duration: number
  startTime: number
  endTime: number
}

export interface MultiCameraOptions {
  cameras: MediaStream[]
  syncMode: 'master' | 'independent'
  layout: 'grid' | 'pip' | 'sidebyside'
  onCameraError?: (cameraIndex: number, error: Error) => void
}

export interface WebRTCConfig {
  iceServers?: RTCIceServer[]
  signalingUrl?: string
  roomId?: string
}

export interface VideoChunk {
  id: string
  index: number
  blob: Blob
  timestamp: number
  duration: number
}

// Quality presets
const QUALITY_PRESETS = {
  '720p': { width: 1280, height: 720, bitrate: 4000000 },
  '1080p': { width: 1920, height: 1080, bitrate: 8000000 },
  '2k': { width: 2560, height: 1440, bitrate: 15000000 },
  '4k': { width: 3840, height: 2160, bitrate: 25000000 }
}

/**
 * Enhanced video recorder with chunking and error recovery
 */
export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private stream: MediaStream
  private options: VideoRecordingOptions
  private startTime: number = 0
  private chunkInterval: number
  private onChunk?: (chunk: VideoChunk) => void
  private chunkIndex: number = 0
  private isRecording: boolean = false
  private isPaused: boolean = false

  constructor(
    stream: MediaStream,
    options: VideoRecordingOptions = {},
    onChunk?: (chunk: VideoChunk) => void
  ) {
    this.stream = stream
    this.options = options
    this.onChunk = onChunk
    this.chunkInterval = 5000 // 5 second chunks for upload during recording
  }

  private getConstraints(): MediaRecorderOptions {
    const { quality = '1080p' } = this.options
    const preset = QUALITY_PRESETS[quality]

    // Try different codecs in order of preference
    const codecs = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ]

    let mimeType = codecs[0]
    for (const codec of codecs) {
      if (MediaRecorder.isTypeSupported(codec)) {
        mimeType = codec
        break
      }
    }

    return {
      mimeType,
      videoBitsPerSecond: preset.bitrate
    }
  }

  async start(): Promise<void> {
    if (this.isRecording) return

    try {
      const constraints = this.getConstraints()
      this.mediaRecorder = new MediaRecorder(this.stream, constraints)
      this.chunks = []
      this.chunkIndex = 0
      this.startTime = Date.now()
      this.isRecording = true

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data)
          
          // Emit chunk for real-time upload
          if (this.onChunk) {
            const chunk: VideoChunk = {
              id: `chunk-${this.chunkIndex}`,
              index: this.chunkIndex,
              blob: event.data,
              timestamp: Date.now(),
              duration: this.chunkInterval
            }
            this.onChunk(chunk)
            this.chunkIndex++
          }

          // Report progress
          this.options.onProgress?.(this.chunks.length)
        }
      }

      this.mediaRecorder.onerror = (event: any) => {
        logger.error('Recording error', { error: event.error })
        this.handleRecordingError(event.error)
      }

      // Start recording with chunk interval
      this.mediaRecorder.start(this.chunkInterval)
      logger.info('Recording started', { quality: this.options.quality })
    } catch (error) {
      logger.error('Failed to start recording', { error })
      throw error
    }
  }

  pause(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause()
      this.isPaused = true
      logger.info('Recording paused')
    }
  }

  resume(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume()
      this.isPaused = false
      logger.info('Recording resumed')
    }
  }

  async stop(): Promise<VideoRecording | null> {
    if (!this.mediaRecorder || !this.isRecording) return null

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const endTime = Date.now()
        const duration = (endTime - this.startTime) / 1000
        const blob = new Blob(this.chunks, { 
          type: this.mediaRecorder!.mimeType || 'video/webm' 
        })

        this.isRecording = false
        this.isPaused = false

        const recording: VideoRecording = {
          id: `recording-${Date.now()}`,
          blob,
          duration,
          startTime: this.startTime,
          endTime
        }

        logger.info('Recording stopped', { duration, size: blob.size })
        resolve(recording)
      }

      this.mediaRecorder!.stop()
    })
  }

  private handleRecordingError(error: Error): void {
    logger.error('Recording error occurred', { error })
    toast.error('Recording error. Attempting to recover...')

    // Attempt to restart recording
    try {
      if (this.mediaRecorder?.state === 'recording') {
        this.mediaRecorder.stop()
      }
      
      // Auto-restart after brief delay
      setTimeout(() => {
        if (this.isRecording) {
          this.start()
        }
      }, 1000)
    } catch (recoveryError) {
      logger.error('Recovery failed', { error: recoveryError })
    }
  }

  getState(): 'inactive' | 'recording' | 'paused' {
    return this.mediaRecorder?.state || 'inactive'
  }

  getDuration(): number {
    if (!this.isRecording) return 0
    return (Date.now() - this.startTime) / 1000
  }
}

/**
 * Multi-camera recorder for synchronized multi-angle recording
 */
export class MultiCameraRecorder {
  private recorders: VideoRecorder[] = []
  private cameras: MediaStream[]
  private options: MultiCameraOptions
  private masterRecorder: VideoRecorder | null = null
  private isRecording: boolean = false

  constructor(options: MultiCameraOptions) {
    this.cameras = options.cameras
    this.options = options
  }

  async start(): Promise<void> {
    if (this.isRecording) return

    try {
      this.recorders = []

      for (let i = 0; i < this.cameras.length; i++) {
        const recorder = new VideoRecorder(
          this.cameras[i],
          { quality: '1080p', audio: i === 0 }, // Only first camera records audio
          (chunk) => this.handleChunk(i, chunk)
        )
        this.recorders.push(recorder)
      }

      // Start all recorders
      await Promise.all(this.recorders.map(r => r.start()))
      
      this.masterRecorder = this.recorders[0]
      this.isRecording = true

      logger.info('Multi-camera recording started', { 
        cameras: this.cameras.length,
        layout: this.options.layout 
      })
    } catch (error) {
      logger.error('Failed to start multi-camera recording', { error })
      throw error
    }
  }

  private handleChunk(cameraIndex: number, chunk: VideoChunk): void {
    logger.debug('Chunk received', { cameraIndex, chunkId: chunk.id })
    // Could upload chunks here for real-time backup
  }

  pause(): void {
    this.recorders.forEach(r => r.pause())
  }

  resume(): void {
    this.recorders.forEach(r => r.resume())
  }

  async stop(): Promise<VideoRecording[]> {
    if (!this.isRecording) return []

    const recordings = await Promise.all(
      this.recorders.map(r => r.stop())
    )

    this.isRecording = false
    
    return recordings.filter((r): r is VideoRecording => r !== null)
  }

  /**
   * Merge multiple camera recordings into a composite video
   */
  async mergeRecordings(
    recordings: VideoRecording[]
  ): Promise<VideoRecording | null> {
    if (recordings.length === 0) return null
    if (recordings.length === 1) return recordings[0]

    // Use Edge Function for server-side merging
    try {
      const { data, error } = await supabase.functions.invoke('merge-video-chunks', {
        body: {
          recordings: recordings.map(r => ({
            id: r.id,
            duration: r.duration
          })),
          layout: this.options.layout
        }
      })

      if (error) throw error

      return data?.recording || null
    } catch (error) {
      logger.error('Failed to merge recordings', { error })
      // Fallback: return first recording
      return recordings[0]
    }
  }

  getState(): 'inactive' | 'recording' | 'paused' {
    return this.masterRecorder?.getState() || 'inactive'
  }
}

/**
 * WebRTC Manager for partner synchronized recording
 */
export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private dataChannel: RTCDataChannel | null = null
  private config: WebRTCConfig
  private onRemoteStream?: (stream: MediaStream) => void
  private onDataMessage?: (message: any) => void
  private signaling: WebSocket | null = null

  constructor(
    config: WebRTCConfig,
    onRemoteStream?: (stream: MediaStream) => void,
    onDataMessage?: (message: any) => void
  ) {
    this.config = config
    this.onRemoteStream = onRemoteStream
    this.onDataMessage = onDataMessage
  }

  async initialize(localStream: MediaStream): Promise<void> {
    this.localStream = localStream

    // Default ICE servers
    const iceServers = this.config.iceServers || [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]

    this.peerConnection = new RTCPeerConnection({ iceServers })

    // Add local stream tracks
    localStream.getTracks().forEach(track => {
      this.peerConnection!.addTrack(track, localStream)
    })

    // Handle incoming remote stream
    this.peerConnection.ontrack = (event) => {
      if (event.streams[0]) {
        this.remoteStream = event.streams[0]
        this.onRemoteStream?.(this.remoteStream)
        logger.info('Remote stream received')
      }
    }

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate
        })
      }
    }

    // Create data channel for sync messages
    this.dataChannel = this.peerConnection.createDataChannel('sync', {
      ordered: true
    })

    this.dataChannel.onopen = () => {
      logger.info('Data channel opened')
    }

    this.dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.onDataMessage?.(message)
      } catch (error) {
        logger.error('Failed to parse data channel message', { error })
      }
    }

    // Handle incoming data channel
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel
      channel.onmessage = (e) => {
        try {
          const message = JSON.parse(e.data)
          this.onDataMessage?.(message)
        } catch (error) {
          logger.error('Failed to parse incoming data', { error })
        }
      }
    }

    // Connect to signaling server
    if (this.config.signalingUrl) {
      await this.connectSignaling()
    }

    logger.info('WebRTC initialized')
  }

  private async connectSignaling(): Promise<void> {
    if (!this.config.signalingUrl) return

    return new Promise((resolve, reject) => {
      this.signaling = new WebSocket(this.config.signalingUrl!)

      this.signaling.onopen = () => {
        logger.info('Signaling connected')
        
        // Join room
        this.sendSignalingMessage({
          type: 'join',
          roomId: this.config.roomId
        })
        
        resolve()
      }

      this.signaling.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data)
          await this.handleSignalingMessage(message)
        } catch (error) {
          logger.error('Failed to handle signaling message', { error })
        }
      }

      this.signaling.onerror = (error) => {
        logger.error('Signaling error', { error })
        reject(error)
      }

      this.signaling.onclose = () => {
        logger.info('Signaling disconnected')
      }
    })
  }

  private sendSignalingMessage(message: any): void {
    if (this.signaling?.readyState === WebSocket.OPEN) {
      this.signaling.send(JSON.stringify(message))
    }
  }

  private async handleSignalingMessage(message: any): Promise<void> {
    if (!this.peerConnection) return

    switch (message.type) {
      case 'offer':
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(message.offer)
        )
        const answer = await this.peerConnection.createAnswer()
        await this.peerConnection.setLocalDescription(answer)
        this.sendSignalingMessage({ type: 'answer', answer })
        break

      case 'answer':
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(message.answer)
        )
        break

      case 'ice-candidate':
        if (message.candidate) {
          await this.peerConnection.addIceCandidate(
            new RTCIceCandidate(message.candidate)
          )
        }
        break

      case 'peer-joined':
        // Initiate connection to new peer
        await this.createOffer()
        break
    }
  }

  async createOffer(): Promise<void> {
    if (!this.peerConnection) return

    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)
    
    this.sendSignalingMessage({ type: 'offer', offer })
    logger.info('Offer created and sent')
  }

  sendSyncMessage(type: string, data: any): void {
    if (this.dataChannel?.readyState === 'open') {
      this.dataChannel.send(JSON.stringify({ type, data, timestamp: Date.now() }))
    }
  }

  sendRecordingSync(action: 'start' | 'stop' | 'pause' | 'resume'): void {
    this.sendSyncMessage('recording-sync', { action })
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  disconnect(): void {
    this.dataChannel?.close()
    this.peerConnection?.close()
    this.signaling?.close()
    
    this.peerConnection = null
    this.dataChannel = null
    this.signaling = null
    this.remoteStream = null

    logger.info('WebRTC disconnected')
  }
}

/**
 * Record video from MediaStream (legacy function for backward compatibility)
 */
export async function recordVideo(
  stream: MediaStream,
  options: VideoRecordingOptions = {}
): Promise<VideoRecording | null> {
  try {
    const recorder = new VideoRecorder(stream, options)
    await recorder.start()
    
    // This function needs to be called from outside to stop
    // Return a handle that includes the recorder
    return null // Caller should use VideoRecorder class directly
  } catch (error) {
    logger.error('Error in recordVideo:', error)
    toast.error('Failed to start recording')
    return null
  }
}

/**
 * Stop video recording
 */
export function stopRecording(recorder: MediaRecorder): void {
  if (recorder.state === 'recording') {
    recorder.stop()
  }
}

/**
 * Upload recorded video
 */
export async function uploadRecordedVideo(
  recording: VideoRecording,
  sessionId: string,
  folder?: string
): Promise<string | null> {
  try {
    // Convert blob to file
    const file = new File(
      [recording.blob],
      `recording-${recording.id}.webm`,
      { type: recording.blob.type }
    )

    // Upload video
    const result = await uploadVideo(file, {
      bucket: STORAGE_BUCKETS.RECORDINGS,
      folder: folder || `sessions/${sessionId}`,
      maxSize: 500 * 1024 * 1024, // 500MB
      onProgress: (progress) => {
        // Progress handled by uploadVideo
      }
    })

    if (!result) {
      return null
    }

    // Update database with video URL
    const { error } = await supabase
      .from('video_recordings')
      .update({
        video_file_url: result.url,
        video_file_path: result.path,
        duration_seconds: recording.duration,
        file_size_bytes: recording.blob.size
      })
      .eq('session_id', sessionId)

    if (error) {
      logger.error('Error updating video recording:', error)
    }

    return result.url
  } catch (error) {
    logger.error('Error in uploadRecordedVideo:', error)
    toast.error('Failed to upload video')
    return null
  }
}

/**
 * Get video playback URL
 */
export function getVideoUrl(path: string): string {
  return getFileUrl(path, STORAGE_BUCKETS.VIDEOS)
}

/**
 * Create video thumbnail
 */
export async function createVideoThumbnail(
  videoFile: File | Blob,
  time: number = 0
): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      resolve(null)
      return
    }

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(time, video.duration)
    }

    video.onseeked = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null)
          return
        }

        // Upload thumbnail
        const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' })
        resolve(URL.createObjectURL(blob))
      }, 'image/jpeg', 0.8)
    }

    video.onerror = () => resolve(null)

    const url = URL.createObjectURL(videoFile)
    video.src = url
  })
}

/**
 * Get video duration
 */
export async function getVideoDuration(videoFile: File | Blob): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.onloadedmetadata = () => {
      resolve(video.duration)
      URL.revokeObjectURL(video.src)
    }
    video.onerror = () => resolve(0)
    const url = URL.createObjectURL(videoFile)
    video.src = url
  })
}

/**
 * Extract video frames
 */
export async function extractVideoFrames(
  videoFile: File | Blob,
  frameCount: number = 10
): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const frames: string[] = []

    if (!ctx) {
      resolve([])
      return
    }

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const interval = video.duration / frameCount

      let currentFrame = 0
      const extractFrame = () => {
        if (currentFrame >= frameCount) {
          resolve(frames)
          URL.revokeObjectURL(video.src)
          return
        }

        video.currentTime = currentFrame * interval
      }

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        frames.push(canvas.toDataURL('image/jpeg', 0.8))
        currentFrame++
        extractFrame()
      }

      extractFrame()
    }

    video.onerror = () => resolve([])

    const url = URL.createObjectURL(videoFile)
    video.src = url
  })
}

/**
 * Compress video using browser APIs
 */
export async function compressVideo(
  blob: Blob,
  targetSize: number
): Promise<Blob> {
  // Calculate compression ratio
  const ratio = targetSize / blob.size
  if (ratio >= 1) return blob

  // For now, return original - proper compression would require server-side processing
  // or WebCodecs API which has limited browser support
  logger.warn('Video compression not fully implemented', { 
    originalSize: blob.size, 
    targetSize 
  })
  
  return blob
}

/**
 * Check if video format is supported
 */
export function isVideoFormatSupported(mimeType: string): boolean {
  const video = document.createElement('video')
  return video.canPlayType(mimeType) !== ''
}

/**
 * Get supported video formats
 */
export function getSupportedVideoFormats(): string[] {
  const formats = [
    'video/webm',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/mp4',
    'video/mp4;codecs=avc1',
    'video/ogg'
  ]
  
  return formats.filter(isVideoFormatSupported)
}
