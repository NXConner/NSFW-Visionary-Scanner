import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Camera,
  SkipBack,
  SkipForward,
} from "lucide-react";
import {
  captureVideoScreenshot,
  getVideoScreenshots,
  type VideoScreenshot,
} from "@/lib/videoScreenshots";
import { toast } from "sonner";

export type VideoPlayerProps = {
  videoUrl: string;
  /** For screenshots, this should be the recording id (video_recordings.id) */
  recordingId: string;
  title?: string;
  autoPlay?: boolean;
  showScreenshots?: boolean;
  onProgress?: (progress: number) => void;
};

function formatTime(seconds: number): string {
  const s = Number(seconds || 0);
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const VideoPlayer = ({
  videoUrl,
  recordingId,
  title,
  autoPlay = false,
  showScreenshots = true,
  onProgress,
}: VideoPlayerProps): JSX.Element => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [screenshots, setScreenshots] = useState<VideoScreenshot[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      const d = Number(video.duration || 0);
      setDuration(d);
      const prog = d > 0 ? (video.currentTime / d) * 100 : 0;
      setProgress(prog);
      onProgress?.(prog);
    };

    const handleLoadedMetadata = () => {
      setDuration(Number(video.duration || 0));
    };

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [onProgress]);

  useEffect(() => {
    const load = async () => {
      if (!showScreenshots || !recordingId) return;
      const shots = await getVideoScreenshots(recordingId);
      setScreenshots(shots);
    };
    void load();
  }, [recordingId, showScreenshots]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) video.pause();
    else void video.play();

    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const next = (Number(e.target.value) / 100) * duration;
    video.currentTime = next;
    setCurrentTime(next);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const next = Math.max(0, Math.min(1, Number(e.target.value)));
    video.volume = next;
    setVolume(next);
    setIsMuted(next === 0);
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) void video.requestFullscreen();
    } else {
      if (document.exitFullscreen) void document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleScreenshot = async () => {
    const video = videoRef.current;
    if (!video) return;

    const shot = await captureVideoScreenshot(video, currentTime, recordingId);
    if (shot) {
      setScreenshots(prev => [shot, ...prev]);
      toast.success("Screenshot saved");
    } else {
      toast.error("Failed to capture screenshot");
    }
  };

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
          >
            <track
              kind="captions"
              srcLang="en"
              label="English"
              src={"data:text/vtt,WEBVTT%0A%0A"}
              default
            />
          </video>

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="mb-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleSeek}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #fff 0%, #fff ${progress}%, rgba(255,255,255,0.2) ${progress}%, rgba(255,255,255,0.2) 100%)`,
                  }}
                  aria-label="Seek"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skip(-10)}
                  className="text-white hover:bg-white/20"
                  aria-label="Back 10 seconds"
                >
                  <SkipBack className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skip(10)}
                  className="text-white hover:bg-white/20"
                  aria-label="Forward 10 seconds"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>

                <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                    aria-label={isMuted ? "Unmute" : "Mute"}
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
                    className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    aria-label="Volume"
                  />
                </div>

                <span className="text-white text-sm tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {showScreenshots && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleScreenshot}
                    className="text-white hover:bg-white/20"
                    aria-label="Capture screenshot"
                  >
                    <Camera className="w-5 h-5" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                  aria-label="Toggle fullscreen"
                >
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {title && (
          <div className="p-4 border-t">
            <p className="font-medium">{title}</p>
          </div>
        )}

        {showScreenshots && screenshots.length > 0 && (
          <div className="p-4 border-t space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Screenshots</p>
              <p className="text-xs text-muted-foreground">{screenshots.length}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {screenshots.slice(0, 12).map(s => (
                <a
                  key={s.id}
                  href={s.image_url || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded border overflow-hidden bg-muted/20"
                >
                  {s.thumbnail_url || s.image_url ? (
                    <img
                      src={(s.thumbnail_url || s.image_url) as string}
                      alt={s.screenshot_name || "Screenshot"}
                      className="w-full h-20 object-cover"
                    />
                  ) : (
                    <div className="w-full h-20" />
                  )}
                </a>
              ))}
            </div>
            {screenshots.length > 12 && (
              <p className="text-xs text-muted-foreground">Showing latest 12</p>
            )}
          </div>
        )}

        {showScreenshots && screenshots.length === 0 && (
          <div className="p-4 border-t">
            <p className="text-xs text-muted-foreground">No screenshots yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
