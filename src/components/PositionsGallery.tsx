import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Search, Shuffle, Heart, Star, Filter, Grid, List,
  Flame, Sparkles, Users, Zap, ChevronRight, Info, Lock,
  Image as ImageIcon, Video, Loader2, RefreshCw, Moon, Sun
} from 'lucide-react';
import { useGenericStorage } from '@/hooks/useGenericStorage';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { usePositionImages } from '@/hooks/usePositionImages';
import { PositionDetailView } from '@/components/PositionDetailView';
import { allPositions } from '@/data/positionsData';
import { hasNSFWContent, isSFW } from '@/lib/featureFlags';

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

// Use positions from data file - they match the Position interface
const initialPositions: Position[] = allPositions;

const categories = [
  { id: 'all', label: 'All Positions', icon: Grid },
  { id: 'classic', label: 'Classic', icon: Heart },
  { id: 'partner-on-top', label: 'On Top', icon: Star },
  { id: 'rear-entry', label: 'Rear Entry', icon: Flame },
  { id: 'side-by-side', label: 'Side by Side', icon: Users },
  { id: 'standing', label: 'Standing', icon: Zap },
  { id: 'sitting', label: 'Sitting', icon: Sparkles },
  { id: 'oral', label: 'Oral', icon: Heart },
  { id: 'athletic', label: 'Athletic', icon: Flame },
  { id: 'tantric', label: 'Tantric', icon: Sparkles },
  { id: 'oral-variations', label: 'Oral Variations', icon: Heart },
  { id: 'furniture-assisted', label: 'Furniture Assisted', icon: Zap },
];

export const PositionsGallery = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [favorites, setFavorites] = useGenericStorage<string[]>('favorite_positions', []);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [invertedColors, setInvertedColors] = useState(true);
  const { features, hasFeature } = useFeatureAccess();
  const [nsfwAvailable, setNsfwAvailable] = useState(false);
  const [isCheckingNsfw, setIsCheckingNsfw] = useState(true);

  // Check NSFW content availability
  useEffect(() => {
    const checkNsfw = async () => {
      setIsCheckingNsfw(true);
      const available = await hasNSFWContent();
      setNsfwAvailable(available);
      setIsCheckingNsfw(false);
    };
    checkNsfw();
  }, []);

  // Fetch images from GitHub repositories
  const { images: positionImages, isLoading: imagesLoading, error: imagesError, progress, refresh: refreshImages } = usePositionImages(true, invertedColors);

  // State for positions with images
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  
  // Map GitHub images to positions
  useEffect(() => {
    if (positionImages.length > 0) {
      // Match images to positions by name similarity
      const updatedPositions = initialPositions.map(pos => {
        const matchingImages = positionImages.filter(img => {
          const imgName = img.name.toLowerCase();
          const posName = pos.name.toLowerCase();
          return imgName.includes(posName) || posName.includes(imgName) || 
                 img.tags?.some(tag => pos.tags.some(pt => pt.toLowerCase().includes(tag.toLowerCase()))) ||
                 img.category === pos.category;
        });
        
        return {
          ...pos,
          images: matchingImages.map(img => invertedColors && img.invertedUrl ? img.invertedUrl : img.originalUrl),
        };
      });
      
      setPositions(updatedPositions);
    } else {
      setPositions(initialPositions);
    }
  }, [positionImages, invertedColors]);

  const filteredPositions = useMemo(() => {
    return positions.filter(pos => {
      const matchesSearch = pos.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pos.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pos.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || pos.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || pos.difficulty === selectedDifficulty;
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [positions, searchTerm, selectedCategory, selectedDifficulty]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const getRandomPosition = () => {
    const random = filteredPositions[Math.floor(Math.random() * filteredPositions.length)];
    if (random) setSelectedPosition(random);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'hard': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'expert': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return '';
    }
  };

  // Check if feature is available and NSFW content is accessible
  if (isCheckingNsfw) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Hide in SFW mode or if NSFW content not available
  if (isSFW() || !nsfwAvailable) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Lock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">NSFW Content Not Available</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              The Positions Gallery contains adult content and is only available in the NSFW version or with a DLC upgrade.
            </p>
            <Badge variant="secondary">Requires NSFW Version or DLC</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasFeature('positionsGallery')) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Lock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Premium Feature</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              The Positions Gallery is available for Premium and Pro subscribers. 
              Upgrade to access 100+ positions with detailed instructions.
            </p>
            <Badge variant="secondary">Requires Premium or Pro</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">Positions Gallery</h2>
        <p className="text-muted-foreground">Explore and learn new intimate positions</p>
      </div>

      {/* Search and Filters */}
      <Card className="glass-card border-border/50 mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search positions..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={getRandomPosition} variant="outline" className="gap-2">
              <Shuffle className="w-4 h-4" /> Random
            </Button>
            <Button 
              onClick={() => setInvertedColors(!invertedColors)} 
              variant="outline" 
              size="icon"
              title={invertedColors ? "Disable color inversion" : "Enable color inversion"}
            >
              {invertedColors ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {imagesLoading && (
              <Button onClick={refreshImages} variant="outline" size="icon" disabled>
                <Loader2 className="w-4 h-4 animate-spin" />
              </Button>
            )}
            {!imagesLoading && imagesError && (
              <Button onClick={refreshImages} variant="outline" size="icon" title="Retry loading images">
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'ghost'} 
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <ScrollArea className="w-full mb-6">
        <div className="flex gap-2 pb-2">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="gap-2 whitespace-nowrap"
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Loading Progress */}
      {imagesLoading && progress > 0 && (
        <Card className="glass-card border-border/50 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Loading images...</p>
                <Progress value={progress} className="h-2" />
              </div>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {imagesError && (
        <Card className="glass-card border-border/50 mb-6 border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-destructive/20">
                <Info className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Failed to load images</p>
                <p className="text-xs text-muted-foreground mt-1">{imagesError}</p>
              </div>
              <Button onClick={refreshImages} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Positions Grid */}
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
        : 'space-y-4'
      }>
        {filteredPositions.map(position => (
          <Card 
            key={position.id} 
            className={`glass-card border-border/50 cursor-pointer hover-lift ${
              viewMode === 'list' ? 'flex flex-row' : ''
            }`}
            onClick={() => setSelectedPosition(position)}
          >
            {viewMode === 'grid' && position.images && position.images.length > 0 && (
              <div className="relative aspect-video bg-muted/30 overflow-hidden rounded-t-lg">
                <img
                  src={position.images[0]}
                  alt={position.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {position.images.length > 1 && (
                  <Badge className="absolute top-2 right-2 bg-black/50 text-white">
                    +{position.images.length - 1}
                  </Badge>
                )}
                {position.videos && position.videos.length > 0 && (
                  <div className="absolute bottom-2 left-2">
                    <Video className="w-4 h-4 text-white drop-shadow-lg" />
                  </div>
                )}
              </div>
            )}
            <CardHeader className={viewMode === 'list' ? 'flex-1 pb-2' : 'pb-2'}>
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{position.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mt-1 -mr-2"
                  onClick={e => {
                    e.stopPropagation();
                    toggleFavorite(position.id);
                  }}
                >
                  <Heart className={`w-4 h-4 ${favorites.includes(position.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge className={getDifficultyColor(position.difficulty)} variant="outline">
                  {position.difficulty}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {position.category.replace('-', ' ')}
                </Badge>
                {position.images && position.images.length > 0 && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <ImageIcon className="w-3 h-3" />
                    {position.images.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            {viewMode === 'grid' && (
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2">{position.description}</p>
              </CardContent>
            )}
            {viewMode === 'list' && (
              <CardContent className="flex items-center gap-4 py-4">
                {position.images && position.images.length > 0 && (
                  <div className="w-20 h-20 rounded overflow-hidden bg-muted/30 flex-shrink-0">
                    <img
                      src={position.images[0]}
                      alt={position.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <p className="text-sm text-muted-foreground flex-1 line-clamp-1">{position.description}</p>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredPositions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No positions found matching your criteria</p>
        </div>
      )}

      {/* Position Detail Dialog */}
      <PositionDetailView
        position={selectedPosition}
        isOpen={!!selectedPosition}
        onClose={() => setSelectedPosition(null)}
        onToggleFavorite={toggleFavorite}
        isFavorite={selectedPosition ? favorites.includes(selectedPosition.id) : false}
        invertedColors={invertedColors}
      />
    </div>
  );
};

export default PositionsGallery;
