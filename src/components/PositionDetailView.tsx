/**
 * Position Detail View Component
 * Displays detailed information about a position with images, videos, and educational content
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Heart,
  Star,
  Info,
  Sparkles,
  ChevronRight,
  Play,
  Image as ImageIcon,
  Video,
  BookOpen,
  Lightbulb,
  Users,
  Zap,
  X,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Position {
  id: string;
  name: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  description: string;
  instructions: string[];
  benefits: string[];
  tips: string[];
  tags: string[];
  stimulationType: string[];
  requiredFlexibility: 'low' | 'medium' | 'high';
  intimacyLevel: 'low' | 'medium' | 'high';
  images?: string[];
  videos?: string[];
  gifs?: string[];
  animations?: string[];
}

interface PositionDetailViewProps {
  position: Position | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  invertedColors?: boolean;
}

export const PositionDetailView: React.FC<PositionDetailViewProps> = ({
  position,
  isOpen,
  onClose,
  onToggleFavorite,
  isFavorite,
  invertedColors = true,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  if (!position) return null;

  const displayImages = position.images || [];
  const displayVideos = position.videos || [];
  const displayGifs = position.gifs || [];
  const allMedia = [...displayImages, ...displayGifs, ...displayVideos];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'hard': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'expert': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return '';
    }
  };

  const currentImage = displayImages[selectedImageIndex] || allMedia[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{position.name}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleFavorite(position.id)}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge className={getDifficultyColor(position.difficulty)}>
              {position.difficulty}
            </Badge>
            <Badge variant="secondary">{position.category.replace('-', ' ')}</Badge>
            <Badge variant="outline">Flexibility: {position.requiredFlexibility}</Badge>
            <Badge variant="outline">Intimacy: {position.intimacyLevel}</Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="instructions">How To</TabsTrigger>
              <TabsTrigger value="education">Learn</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div>
                <p className="text-muted-foreground">{position.description}</p>
              </div>

              {displayImages.length > 0 && (
                <Card className="overflow-hidden">
                  <div className="relative aspect-video bg-muted/30">
                    <img
                      src={invertedColors && position.images?.[selectedImageIndex] ? position.images[selectedImageIndex] : currentImage}
                      alt={position.name}
                      className="w-full h-full object-contain"
                    />
                    {displayImages.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2"
                          onClick={() => setSelectedImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length)}
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setSelectedImageIndex((prev) => (prev + 1) % displayImages.length)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => setIsImageFullscreen(true)}
                        >
                          <Maximize2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  {displayImages.length > 1 && (
                    <div className="flex gap-2 p-2 overflow-x-auto">
                      {displayImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 ${
                            selectedImageIndex === idx ? 'border-primary' : 'border-transparent'
                          }`}
                        >
                          <img src={img} alt={`${position.name} ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" /> Benefits
                    </h4>
                    <ul className="space-y-1">
                      {position.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ChevronRight className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" /> Tips
                    </h4>
                    <ul className="space-y-1">
                      {position.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Sparkles className="w-3 h-3 text-purple-400 mt-1 shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap gap-2">
                {position.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {displayImages.map((img, idx) => (
                  <Card key={idx} className="overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="aspect-square bg-muted/30">
                      <img src={img} alt={`${position.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  </Card>
                ))}
                {displayGifs.map((gif, idx) => (
                  <Card key={`gif-${idx}`} className="overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="aspect-square bg-muted/30 relative">
                      <img src={gif} alt={`${position.name} GIF ${idx + 1}`} className="w-full h-full object-cover" />
                      <Badge className="absolute top-2 right-2">GIF</Badge>
                    </div>
                  </Card>
                ))}
                {displayVideos.map((video, idx) => (
                  <Card key={`video-${idx}`} className="overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="aspect-square bg-muted/30 relative">
                      <video src={video} className="w-full h-full object-cover" />
                      <Badge className="absolute top-2 right-2">Video</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="instructions" className="space-y-4 mt-4">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" /> Step-by-Step Instructions
                </h4>
                <ol className="space-y-3">
                  {position.instructions.map((inst, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="bg-primary/20 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm shrink-0 font-semibold">
                        {i + 1}
                      </span>
                      <div className="flex-1 pt-1">
                        <p className="text-sm">{inst}</p>
                        {position.images?.[i] && (
                          <div className="mt-2 rounded overflow-hidden max-w-xs">
                            <img
                              src={position.images[i]}
                              alt={`Step ${i + 1}`}
                              className="w-full h-auto"
                            />
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="education" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" /> Educational Information
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium mb-2">Stimulation Types</h5>
                      <div className="flex flex-wrap gap-2">
                        {position.stimulationType.map((type, i) => (
                          <Badge key={i} variant="outline">{type}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Physical Requirements</h5>
                      <p className="text-sm text-muted-foreground">
                        Flexibility Level: <strong>{position.requiredFlexibility}</strong>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Intimacy Level: <strong>{position.intimacyLevel}</strong>
                      </p>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Best For</h5>
                      <p className="text-sm text-muted-foreground">
                        This position is ideal for {position.tags.join(', ')} experiences.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>

      {/* Fullscreen Image Modal */}
      {isImageFullscreen && currentImage && (
        <Dialog open={isImageFullscreen} onOpenChange={setIsImageFullscreen}>
          <DialogContent className="max-w-7xl max-h-[95vh] p-0">
            <div className="relative w-full h-[95vh] bg-black">
              <img
                src={currentImage}
                alt={position.name}
                className="w-full h-full object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={() => setIsImageFullscreen(false)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

