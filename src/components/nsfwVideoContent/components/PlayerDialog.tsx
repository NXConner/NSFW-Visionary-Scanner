import React, { useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2, X } from "lucide-react";
import type { VideoQuality } from "@/lib/offlineMedia/videoCache";
import type { VideoPlaybackMode } from "@/lib/nsfwVideoDelivery";

export type PlayerDialogProps = {
  open: boolean;
  title: string;
  videoId: string | null;
  playerUrl: string | null;
  loading: boolean;
  playerMode: VideoPlaybackMode;
  setPlayerMode: (mode: VideoPlaybackMode) => void;
  playerQuality: VideoQuality;
  setPlayerQuality: (q: VideoQuality) => void;
  onClose: () => void;
  onSaveOffline: () => void;
  onProgress?: (payload: {
    videoId: string;
    currentTime: number;
    duration: number;
    ended?: boolean;
  }) => void;
  onPlaybackEnded?: () => void;
};

export function PlayerDialog(props: PlayerDialogProps): JSX.Element {
  const {
    open,
    title,
    videoId,
    playerUrl,
    loading,
    playerMode,
    setPlayerMode,
    playerQuality,
    setPlayerQuality,
    onClose,
    onSaveOffline,
    onProgress,
    onPlaybackEnded,
  } = props;
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const emitProgress = useCallback(
    (ended?: boolean) => {
      if (!videoRef.current || !videoId) return;
      const currentTime = videoRef.current.currentTime || 0;
      const duration = videoRef.current.duration || 0;
      onProgress?.({ videoId, currentTime, duration, ended });
    },
    [onProgress, videoId],
  );

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="truncate">{title}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={playerMode} onValueChange={v => setPlayerMode(v as VideoPlaybackMode)}>
                <SelectTrigger className="h-9 w-[170px]">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stream">Stream</SelectItem>
                  <SelectItem value="cache_first">Offline (if available)</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={playerQuality}
                onValueChange={v => setPlayerQuality(v as VideoQuality)}
              >
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sd">SD</SelectItem>
                  <SelectItem value="hd">HD</SelectItem>
                  <SelectItem value="4k">4K</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={onSaveOffline}>
                <Download className="w-4 h-4 mr-2" />
                Save offline
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">{videoId ? `ID: ${videoId}` : null}</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : playerUrl ? (
            <video
              key={`${videoId}:${playerMode}:${playerQuality}:${playerUrl}`}
              className="w-full rounded-md bg-black"
              controls
              playsInline
              src={playerUrl}
              ref={videoRef}
              onTimeUpdate={() => emitProgress(false)}
              onPause={() => emitProgress(false)}
              onEnded={() => {
                emitProgress(true);
                onPlaybackEnded?.();
              }}
            >
              <track
                kind="captions"
                srcLang="en"
                label="English"
                src={"data:text/vtt,WEBVTT%0A%0A"}
                default
              />
            </video>
          ) : (
            <div className="text-center py-16 text-muted-foreground">Unable to load video.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
