import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { 
  Layers, ArrowLeftRight, TrendingUp, TrendingDown, Minus,
  ChevronLeft, ChevronRight, ZoomIn, X, Calendar
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MeasurementDiff {
  label: string;
  before: number | null;
  after: number | null;
  diff: number;
  unit: string;
  improved: boolean | null;
}

export const ScanComparison = () => {
  const { scans } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [scan1Index, setScan1Index] = useState(1);
  const [scan2Index, setScan2Index] = useState(0);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay' | 'slider'>('side-by-side');
  const [sliderPosition, setSliderPosition] = useState(50);

  const scansWithImages = useMemo(() => 
    scans.filter(s => s.image_data), 
    [scans]
  );

  const scan1 = scansWithImages[scan1Index];
  const scan2 = scansWithImages[scan2Index];

  const measurements: MeasurementDiff[] = useMemo(() => {
    if (!scan1 || !scan2) return [];
    
    return [
      {
        label: 'Length',
        before: scan1.length,
        after: scan2.length,
        diff: (scan2.length || 0) - (scan1.length || 0),
        unit: 'cm',
        improved: scan2.length && scan1.length ? scan2.length > scan1.length : null
      },
      {
        label: 'Circumference',
        before: scan1.circumference,
        after: scan2.circumference,
        diff: (scan2.circumference || 0) - (scan1.circumference || 0),
        unit: 'cm',
        improved: scan2.circumference && scan1.circumference ? scan2.circumference > scan1.circumference : null
      },
      {
        label: 'Curvature',
        before: scan1.curvature_angle,
        after: scan2.curvature_angle,
        diff: (scan2.curvature_angle || 0) - (scan1.curvature_angle || 0),
        unit: '°',
        improved: scan2.curvature_angle !== null && scan1.curvature_angle !== null 
          ? scan2.curvature_angle < scan1.curvature_angle 
          : null
      }
    ];
  }, [scan1, scan2]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });
  };

  const getDiffIcon = (improved: boolean | null) => {
    if (improved === null) return <Minus className="w-4 h-4 text-muted-foreground" />;
    return improved 
      ? <TrendingUp className="w-4 h-4 text-success" />
      : <TrendingDown className="w-4 h-4 text-destructive" />;
  };

  const getDiffColor = (improved: boolean | null) => {
    if (improved === null) return 'text-muted-foreground';
    return improved ? 'text-success' : 'text-destructive';
  };

  if (scansWithImages.length < 2) {
    return (
      <Card variant="glass">
        <CardContent className="p-6 text-center">
          <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">
            Need at least 2 scans with images to compare
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {2 - scansWithImages.length} more scan(s) with images required
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card variant="interactive" className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Layers className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Compare Scans</h4>
                <p className="text-sm text-muted-foreground">
                  View {scansWithImages.length} scans side-by-side
                </p>
              </div>
              <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Scan Comparison
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scan Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Before (Older)</label>
              <Select 
                value={scan1Index.toString()} 
                onValueChange={(v) => setScan1Index(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scansWithImages.map((scan, idx) => (
                    <SelectItem key={scan.id} value={idx.toString()} disabled={idx === scan2Index}>
                      {formatDate(scan.created_at)} - {scan.curvature_angle}°
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">After (Newer)</label>
              <Select 
                value={scan2Index.toString()} 
                onValueChange={(v) => setScan2Index(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scansWithImages.map((scan, idx) => (
                    <SelectItem key={scan.id} value={idx.toString()} disabled={idx === scan1Index}>
                      {formatDate(scan.created_at)} - {scan.curvature_angle}°
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-center gap-2">
            <Button 
              variant={viewMode === 'side-by-side' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('side-by-side')}
            >
              Side by Side
            </Button>
            <Button 
              variant={viewMode === 'overlay' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('overlay')}
            >
              Overlay
            </Button>
            <Button 
              variant={viewMode === 'slider' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('slider')}
            >
              Slider
            </Button>
          </div>

          {/* Image Comparison */}
          {scan1 && scan2 && (
            <div className="relative rounded-xl overflow-hidden bg-secondary/30 border border-border/50">
              {viewMode === 'side-by-side' && (
                <div className="grid grid-cols-2 gap-1">
                  <div className="relative">
                    <img 
                      src={scan1.image_data!} 
                      alt="Before" 
                      className="w-full aspect-[4/3] object-cover"
                    />
                    <Badge className="absolute top-2 left-2 bg-background/80">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(scan1.created_at)}
                    </Badge>
                  </div>
                  <div className="relative">
                    <img 
                      src={scan2.image_data!} 
                      alt="After" 
                      className="w-full aspect-[4/3] object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-background/80">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(scan2.created_at)}
                    </Badge>
                  </div>
                </div>
              )}

              {viewMode === 'overlay' && (
                <div className="relative aspect-[4/3]">
                  <img 
                    src={scan1.image_data!} 
                    alt="Before" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <img 
                    src={scan2.image_data!} 
                    alt="After" 
                    className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-difference"
                  />
                  <div className="absolute bottom-2 left-2 right-2 text-center">
                    <Badge variant="secondary" className="bg-background/80">
                      Differences highlighted in white
                    </Badge>
                  </div>
                </div>
              )}

              {viewMode === 'slider' && (
                <div className="relative aspect-[4/3] select-none">
                  <img 
                    src={scan2.image_data!} 
                    alt="After" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div 
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img 
                      src={scan1.image_data!} 
                      alt="Before" 
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }}
                    />
                  </div>
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-primary cursor-ew-resize"
                    style={{ left: `${sliderPosition}%` }}
                    onMouseDown={(e) => {
                      const startX = e.clientX;
                      const startPos = sliderPosition;
                      const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                      if (!rect) return;
                      
                      const onMove = (moveE: MouseEvent) => {
                        const delta = ((moveE.clientX - startX) / rect.width) * 100;
                        setSliderPosition(Math.max(5, Math.min(95, startPos + delta)));
                      };
                      const onUp = () => {
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                      };
                      document.addEventListener('mousemove', onMove);
                      document.addEventListener('mouseup', onUp);
                    }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <ArrowLeftRight className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                  <Badge className="absolute top-2 left-2 bg-background/80">Before</Badge>
                  <Badge className="absolute top-2 right-2 bg-background/80">After</Badge>
                </div>
              )}
            </div>
          )}

          {/* Measurement Differences */}
          <div className="grid grid-cols-3 gap-4">
            {measurements.map((m) => (
              <Card key={m.label} variant="stat">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{m.label}</span>
                  {getDiffIcon(m.improved)}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{m.after ?? '-'}</span>
                  <span className="text-sm text-muted-foreground">{m.unit}</span>
                </div>
                <div className={`text-sm mt-1 ${getDiffColor(m.improved)}`}>
                  {m.diff > 0 ? '+' : ''}{m.diff.toFixed(1)}{m.unit} from {m.before ?? '-'}{m.unit}
                </div>
              </Card>
            ))}
          </div>

          {/* Time Between Scans */}
          {scan1 && scan2 && (
            <div className="text-center p-4 rounded-xl bg-secondary/30 border border-border/50">
              <p className="text-sm text-muted-foreground">
                Time between scans: <span className="font-semibold text-foreground">
                  {Math.round((new Date(scan2.created_at).getTime() - new Date(scan1.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
