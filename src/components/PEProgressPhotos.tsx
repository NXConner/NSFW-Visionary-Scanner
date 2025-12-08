import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/contexts/DataContext';
import { format } from 'date-fns';
import { 
  Camera, ImageIcon, ArrowLeftRight, Calendar, TrendingUp, TrendingDown, 
  Minus, ZoomIn, Ruler, Plus, Trash2, Download, Grid, Layers
} from 'lucide-react';
import { useGenericStorage } from '@/hooks/useGenericStorage';
import { useAuditLog } from '@/hooks/useAuditLog';
import { toast } from 'sonner';
import { VisualContentDisplay } from './VisualContentDisplay';
import { useVisualContent } from '@/hooks/useVisualContent';
import { VISUAL_CONTENT_CATEGORIES } from '@/lib/visualContentManager';

interface PEProgressEntry {
  id: string;
  date: string;
  imageData: string;
  lengthBPEL: number; // Bone-pressed erect length
  lengthNBPEL: number; // Non-bone-pressed erect length
  lengthFlaccid: number;
  girthBase: number;
  girthMid: number;
  girthHead: number;
  notes: string;
  routine: string;
}

export const PEProgressPhotos = () => {
  const [entries, setEntries] = useGenericStorage<PEProgressEntry[]>('pe_progress_photos', []);
  const [selectedLeft, setSelectedLeft] = useState<string>('');
  const [selectedRight, setSelectedRight] = useState<string>('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'compare' | 'timeline' | 'overlay'>('compare');
  const { logActivity } = useAuditLog();

  // Load visual content for PE progress tracking
  const { content: peProgressVisuals } = useVisualContent({
    categories: [
      VISUAL_CONTENT_CATEGORIES.PROGRESS,
      VISUAL_CONTENT_CATEGORIES.EXERCISES,
    ],
    autoLoad: true,
    autoInvert: true,
  });

  const [newEntry, setNewEntry] = useState<Partial<PEProgressEntry>>({
    lengthBPEL: 0,
    lengthNBPEL: 0,
    lengthFlaccid: 0,
    girthBase: 0,
    girthMid: 0,
    girthHead: 0,
    notes: '',
    routine: ''
  });

  const leftEntry = entries.find(e => e.id === selectedLeft);
  const rightEntry = entries.find(e => e.id === selectedRight);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEntry(prev => ({ ...prev, imageData: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEntry = () => {
    if (!newEntry.imageData) {
      toast.error('Please capture or upload an image');
      return;
    }

    const entry: PEProgressEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      imageData: newEntry.imageData!,
      lengthBPEL: newEntry.lengthBPEL || 0,
      lengthNBPEL: newEntry.lengthNBPEL || 0,
      lengthFlaccid: newEntry.lengthFlaccid || 0,
      girthBase: newEntry.girthBase || 0,
      girthMid: newEntry.girthMid || 0,
      girthHead: newEntry.girthHead || 0,
      notes: newEntry.notes || '',
      routine: newEntry.routine || ''
    };

    setEntries([...entries, entry]);
    logActivity('PE progress entry added', 'data', `Entry ID: ${entry.id}`);
    toast.success('Progress entry added!');
    setShowAddForm(false);
    setNewEntry({
      lengthBPEL: 0,
      lengthNBPEL: 0,
      lengthFlaccid: 0,
      girthBase: 0,
      girthMid: 0,
      girthHead: 0,
      notes: '',
      routine: ''
    });
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    logActivity('PE progress entry deleted', 'data', `Entry ID: ${id}`);
    toast.success('Entry deleted');
  };

  const getComparison = () => {
    if (!leftEntry || !rightEntry) return null;
    
    return {
      bpelDiff: rightEntry.lengthBPEL - leftEntry.lengthBPEL,
      nbpelDiff: rightEntry.lengthNBPEL - leftEntry.lengthNBPEL,
      flaccidDiff: rightEntry.lengthFlaccid - leftEntry.lengthFlaccid,
      girthBaseDiff: rightEntry.girthBase - leftEntry.girthBase,
      girthMidDiff: rightEntry.girthMid - leftEntry.girthMid,
      girthHeadDiff: rightEntry.girthHead - leftEntry.girthHead,
    };
  };

  const comparison = getComparison();

  const TrendIcon = ({ value, inverse = false }: { value: number; inverse?: boolean }) => {
    const isPositive = inverse ? value < 0 : value > 0;
    if (value > 0) return <TrendingUp className={`w-4 h-4 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />;
    if (value < 0) return <TrendingDown className={`w-4 h-4 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const MeasurementRow = ({ label, value, unit = 'cm' }: { label: string; value: number; unit?: string }) => (
    <div className="flex justify-between items-center py-1">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-semibold">{value} {unit}</span>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">PE Progress Tracker</h2>
        <p className="text-muted-foreground mb-4">Track your PE journey with photos and measurements</p>
        {/* Visual examples for PE progress tracking */}
        {peProgressVisuals.length > 0 && (
          <div className="mt-4 max-w-2xl mx-auto">
            <VisualContentDisplay
              content={peProgressVisuals.slice(0, 3)}
              title="Progress Tracking Examples"
              showThumbnails={true}
              className="max-h-32"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Progress Entry
        </Button>
        <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
          <Button 
            variant={viewMode === 'compare' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setViewMode('compare')}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === 'timeline' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setViewMode('timeline')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === 'overlay' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setViewMode('overlay')}
          >
            <Layers className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {entries.length < 2 && viewMode === 'compare' && (
        <Card className="glass-card border-border/50 mb-6">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Start Tracking Your Progress</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Add at least 2 progress entries with photos and measurements to compare your PE journey.
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add First Entry
            </Button>
          </CardContent>
        </Card>
      )}

      {viewMode === 'compare' && entries.length >= 2 && (
        <>
          <Card className="glass-card border-border/50 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
                Select Entries to Compare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Earlier Entry</label>
                  <Select value={selectedLeft} onValueChange={setSelectedLeft}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select earlier entry" />
                    </SelectTrigger>
                    <SelectContent>
                      {entries.map(entry => (
                        <SelectItem key={entry.id} value={entry.id}>
                          {format(new Date(entry.date), 'MMM d, yyyy')} - BPEL: {entry.lengthBPEL}cm
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium">Later Entry</label>
                  <Select value={selectedRight} onValueChange={setSelectedRight}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select later entry" />
                    </SelectTrigger>
                    <SelectContent>
                      {entries.map(entry => (
                        <SelectItem key={entry.id} value={entry.id}>
                          {format(new Date(entry.date), 'MMM d, yyyy')} - BPEL: {entry.lengthBPEL}cm
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {leftEntry && rightEntry && (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {[leftEntry, rightEntry].map((entry, idx) => (
                  <Card key={entry.id} className="glass-card border-border/50 overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={idx === 0 ? 'border-primary/30' : 'border-accent/30'}>
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(entry.date), 'MMM d, yyyy')}
                        </Badge>
                        <Button size="sm" variant="ghost" onClick={() => setZoomedImage(entry.imageData)}>
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted/20 mb-4 relative">
                        <img src={entry.imageData} alt="Progress" className="w-full h-full object-cover" />
                        {/* Measurement overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 px-2 py-1 rounded text-xs">
                            <Ruler className="w-3 h-3 inline mr-1" />
                            {entry.lengthBPEL} cm
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <MeasurementRow label="BPEL" value={entry.lengthBPEL} />
                        <MeasurementRow label="NBPEL" value={entry.lengthNBPEL} />
                        <MeasurementRow label="Flaccid" value={entry.lengthFlaccid} />
                        <MeasurementRow label="Girth (Base)" value={entry.girthBase} />
                        <MeasurementRow label="Girth (Mid)" value={entry.girthMid} />
                        <MeasurementRow label="Girth (Head)" value={entry.girthHead} />
                      </div>
                      {entry.routine && (
                        <p className="text-xs text-muted-foreground mt-2">Routine: {entry.routine}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {comparison && (
                <Card className="glass-card border-border/50">
                  <CardHeader>
                    <CardTitle>Change Analysis</CardTitle>
                    <CardDescription>
                      {format(new Date(leftEntry.date), 'MMM d')} to {format(new Date(rightEntry.date), 'MMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { label: 'BPEL', diff: comparison.bpelDiff },
                        { label: 'NBPEL', diff: comparison.nbpelDiff },
                        { label: 'Flaccid', diff: comparison.flaccidDiff },
                        { label: 'Girth (Base)', diff: comparison.girthBaseDiff },
                        { label: 'Girth (Mid)', diff: comparison.girthMidDiff },
                        { label: 'Girth (Head)', diff: comparison.girthHeadDiff },
                      ].map(item => (
                        <div key={item.label} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-muted-foreground text-xs">{item.label}</span>
                            <TrendIcon value={item.diff} />
                          </div>
                          <p className={`text-lg font-bold ${item.diff > 0 ? 'text-green-400' : item.diff < 0 ? 'text-red-400' : ''}`}>
                            {item.diff > 0 ? '+' : ''}{item.diff.toFixed(2)} cm
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {viewMode === 'timeline' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {entries.map(entry => (
            <Card key={entry.id} className="glass-card border-border/50 overflow-hidden group">
              <div className="aspect-square relative">
                <img src={entry.imageData} alt="Progress" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2 text-xs">
                    <p className="font-semibold">{format(new Date(entry.date), 'MMM d, yyyy')}</p>
                    <p className="text-muted-foreground">BPEL: {entry.lengthBPEL}cm</p>
                  </div>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                  onClick={() => handleDeleteEntry(entry.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {viewMode === 'overlay' && leftEntry && rightEntry && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Overlay Comparison</CardTitle>
            <CardDescription>Images overlaid with transparency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-square relative max-w-lg mx-auto rounded-lg overflow-hidden">
              <img src={leftEntry.imageData} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
              <img src={rightEntry.imageData} alt="After" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-difference" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Progress Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Photo</label>
              {newEntry.imageData ? (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/20">
                  <img src={newEntry.imageData} alt="Preview" className="w-full h-full object-cover" />
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="absolute bottom-2 right-2"
                    onClick={() => setNewEntry(prev => ({ ...prev, imageData: undefined }))}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:bg-muted/20">
                  <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Capture or upload photo</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">BPEL (cm)</label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={newEntry.lengthBPEL || ''} 
                  onChange={e => setNewEntry(prev => ({ ...prev, lengthBPEL: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">NBPEL (cm)</label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={newEntry.lengthNBPEL || ''} 
                  onChange={e => setNewEntry(prev => ({ ...prev, lengthNBPEL: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Flaccid (cm)</label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={newEntry.lengthFlaccid || ''} 
                  onChange={e => setNewEntry(prev => ({ ...prev, lengthFlaccid: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Girth Base (cm)</label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={newEntry.girthBase || ''} 
                  onChange={e => setNewEntry(prev => ({ ...prev, girthBase: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Girth Mid (cm)</label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={newEntry.girthMid || ''} 
                  onChange={e => setNewEntry(prev => ({ ...prev, girthMid: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Girth Head (cm)</label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={newEntry.girthHead || ''} 
                  onChange={e => setNewEntry(prev => ({ ...prev, girthHead: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Current Routine</label>
              <Input 
                placeholder="e.g., Beginner routine - week 4"
                value={newEntry.routine || ''} 
                onChange={e => setNewEntry(prev => ({ ...prev, routine: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea 
                placeholder="Any observations or notes..."
                value={newEntry.notes || ''} 
                onChange={e => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <Button onClick={handleAddEntry} className="w-full">
              Save Progress Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Zoom Dialog */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Photo Detail</DialogTitle>
          </DialogHeader>
          {zoomedImage && (
            <img src={zoomedImage} alt="Zoomed" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PEProgressPhotos;
