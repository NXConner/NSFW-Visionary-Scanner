/**
 * Visual Content Display Component
 * Displays images, GIFs, videos, and animations with controls
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Image as ImageIcon,
  Video,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { VisualContent } from '@/lib/visualContentManager';

interface VisualContentDisplayProps {
  content: VisualContent[];
  title?: string;
  showThumbnails?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  className?: string;
}

export const VisualContentDisplay: React.FC<VisualContentDisplayProps> = ({
  content,
  title,
  showThumbnails = true,
  autoPlay = false,
  loop = true,
  className = '',
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  if (content.length === 0) return null;

  const currentItem = content[selectedIndex];

  const handlePrevious = () => {
    setSelectedIndex(prev => (prev - 1 + content.length) % content.length);
  };

  const handleNext = () => {
    setSelectedIndex(prev => (prev + 1) % content.length);
  };

  const togglePlayPause = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef) {
      videoRef.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
      )}

      {/* Main Display */}
      <Card className="overflow-hidden">
        <div className="relative aspect-video bg-muted/30">
          {currentItem.type === 'image' && (
            <img
              src={currentItem.url}
              alt={currentItem.title || 'Visual content'}
              className="w-full h-full object-contain"
            />
          )}

          {currentItem.type === 'gif' && (
            <img
              src={currentItem.url}
              alt={currentItem.title || 'GIF'}
              className="w-full h-full object-contain"
            />
          )}

          {currentItem.type === 'video' && (
            <>
              <video
                ref={setVideoRef}
                src={currentItem.url}
                className="w-full h-full object-contain"
                loop={loop}
                muted={isMuted}
                autoPlay={autoPlay}
                playsInline
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={togglePlayPause}
                  className="bg-background/80 backdrop-blur-sm"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={toggleMute}
                  className="bg-background/80 backdrop-blur-sm"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            </>
          )}

          {/* Navigation */}
          {content.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                onClick={handlePrevious}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                onClick={handleNext}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}

          {/* Fullscreen Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsFullscreen(true)}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>

          {/* Type Badge */}
          <Badge className="absolute top-2 left-2">
            {currentItem.type === 'gif' && 'GIF'}
            {currentItem.type === 'video' && <Video className="w-3 h-3 mr-1" />}
            {currentItem.type === 'image' && <ImageIcon className="w-3 h-3 mr-1" />}
            {currentItem.type}
          </Badge>

          {/* Counter */}
          {content.length > 1 && (
            <Badge variant="secondary" className="absolute bottom-2 left-2">
              {selectedIndex + 1} / {content.length}
            </Badge>
          )}
        </div>

        {/* Info */}
        {(currentItem.title || currentItem.description) && (
          <CardContent className="pt-4">
            {currentItem.title && (
              <h4 className="font-semibold mb-1">{currentItem.title}</h4>
            )}
            {currentItem.description && (
              <p className="text-sm text-muted-foreground">{currentItem.description}</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Thumbnails */}
      {showThumbnails && content.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {content.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setSelectedIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 transition-all ${
                index === selectedIndex
                  ? 'border-primary scale-105'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                  {item.type === 'video' ? (
                    <Video className="w-6 h-6 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-7xl max-h-[95vh] p-0">
          <div className="relative w-full h-[95vh] bg-black">
            {currentItem.type === 'image' && (
              <img
                src={currentItem.url}
                alt={currentItem.title || 'Visual content'}
                className="w-full h-full object-contain"
              />
            )}

            {currentItem.type === 'gif' && (
              <img
                src={currentItem.url}
                alt={currentItem.title || 'GIF'}
                className="w-full h-full object-contain"
              />
            )}

            {currentItem.type === 'video' && (
              <video
                ref={setVideoRef}
                src={currentItem.url}
                className="w-full h-full object-contain"
                loop={loop}
                muted={isMuted}
                autoPlay={autoPlay}
                controls
              />
            )}

            {/* Controls */}
            <div className="absolute top-4 right-4 flex gap-2">
              {content.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handlePrevious}
                    className="bg-background/80 backdrop-blur-sm"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleNext}
                    className="bg-background/80 backdrop-blur-sm"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsFullscreen(false)}
                className="bg-background/80 backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Counter */}
            {content.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded">
                <span className="text-sm">
                  {selectedIndex + 1} / {content.length}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

