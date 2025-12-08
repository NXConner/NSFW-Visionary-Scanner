/**
 * useVideoRecording Hook
 * React hook for video recording with MediaRecorder
 */

import { useState, useRef, useCallback } from 'react'
import { recordVideo, uploadRecordedVideo, type VideoRecording, type VideoRecordingOptions } from '@/lib/videoProcessing'
import { toast } from 'sonner'

export const useVideoRecording = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [recording, setRecording] = useState<VideoRecording | null>(null)
  const [progress, setProgress] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)

  const startRecording = useCallback(async (
    mediaStream: MediaStream,
    options: VideoRecordingOptions = {}
  ) => {
    try {
      if (!mediaStream) {
        toast.error('No media stream available')
        return false
      }

      setStream(mediaStream)
      setIsRecording(true)

      const recordingResult = await recordVideo(mediaStream, {
        ...options,
        onProgress: setProgress
      })

      if (recordingResult) {
        setRecording(recordingResult)
        return true
      }

      return false
    } catch (error) {
      toast.error('Failed to start recording')
      setIsRecording(false)
      return false
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsRecording(false)
    setProgress(0)
  }, [stream])

  const uploadRecording = useCallback(async (sessionId: string, folder?: string) => {
    if (!recording) {
      toast.error('No recording to upload')
      return null
    }

    const url = await uploadRecordedVideo(recording, sessionId, folder)
    if (url) {
      setRecording(null)
    }
    return url
  }, [recording])

  const reset = useCallback(() => {
    stopRecording()
    setRecording(null)
    setProgress(0)
  }, [stopRecording])

  return {
    isRecording,
    recording,
    progress,
    startRecording,
    stopRecording,
    uploadRecording,
    reset
  }
}

