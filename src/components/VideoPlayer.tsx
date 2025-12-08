/**
 * Video Player Component with Screenshot Capture
 * Enhanced video player with screenshot, playback controls, and progress tracking
 */

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Camera, 
  Download,
  SkipBack,
  SkipForward
} from 'lucide-react'
import { captureVideoScreenshot, getVideoScreenshots, type VideoScreenshot } from '@/lib/videoScreenshots'
import { toast } from 'sonner'

interface VideoPlayerProps {
  videoUrl: string
  videoId: string
  title?: string
  autoPlay?: boolean
  showScreenshots?: boolean
  onProgress?: (progress: number) => void
}

export const VideoPlayer = ({
  videoUrl,
  videoId,
  title,
  autoPlay = false,
  showScreenshots = true,
  onProgress
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)
  const [screenshots, setScreenshots] = useState<VideoScreenshot[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => {
      setCurrentTime(video.currentTime)
      setDuration(video.duration)
      const prog = (video.currentTime / video.duration) * 100
      setProgress(prog)
      onProgress?.(prog)
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [onProgress])

  useEffect(() => {
    if (showScreenshots && videoId) {
      loadScreenshots()
    }
  }, [videoId, showScreenshots])

  const loadScreenshots = async () => {
    const shots = await getVideoScreenshots(videoId)
    setScreenshots(shots)
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newTime = (parseFloat(e.target.value) / 100) * duration
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = parseFloat(e.target.value)
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const skip = (seconds: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds))
  }

  const handleScreenshot = async () => {
    const video = videoRef.current
    if (!video) return

    const screenshot = await captureVideoScreenshot(video, currentTime, videoId)
    if (screenshot) {
      setScreenshots(prev => [...prev, screenshot])
    }
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative bg-black rounded-t-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full aspect-video"
            autoPlay={autoPlay}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          
          {/* Video Overlay Controls */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {/* Progress Bar */}
              <div className="mb-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleSeek}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #fff 0%, #fff ${progress}%, rgba(255,255,255,0.2) ${progress}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skip(-10)}
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skip(10)}
                  className="text-white hover:bg-white/20"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>

                <div className="flex items-center gap-2 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {showScreenshots && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleScreenshot}
                    className="text-white hover:bg-white/20"
                    title="Capture Screenshot"
                  >
                    <Camera className="w-5 h-5" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {title && (
          <div className="p-4">
            <h3 className="font-semibold">{title}</h3>
          </div>
        )}

        {showScreenshots && screenshots.length > 0 && (
          <div className="p-4 border-t">
            <h4 className="text-sm font-medium mb-2">Screenshots</h4>
            <div className="grid grid-cols-4 gap-2">
              {screenshots.map(screenshot => (
                <div
                  key={screenshot.id}
                  className="relative aspect-video rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = screenshot.timestamp_seconds
                    }
                  }}
                >
                  <img
                    src={screenshot.thumbnail_url || screenshot.image_url}
                    alt={`Screenshot at ${screenshot.timestamp_seconds}s`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                    {Math.floor(screenshot.timestamp_seconds)}s
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

