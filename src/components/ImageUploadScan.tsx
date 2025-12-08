import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';
import { 
  Upload, Image, Camera, Check, X, Ruler, Target, 
  RotateCcw, Save, AlertCircle
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

export const ImageUploadScan = () => {
  const { saveScan } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [measurements, setMeasurements] = useState({
    length: '',
    circumference: '',
    curvatureAngle: '',
    curvatureDirection: 'Dorsal (upward)'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
      simulateAnalysis();
    };
    reader.readAsDataURL(file);
  };

  const simulateAnalysis = () => {
    setIsProcessing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setMeasurements({
        length: (12 + Math.random() * 6).toFixed(1),
        circumference: (10 + Math.random() * 4).toFixed(1),
        curvatureAngle: Math.floor(Math.random() * 35).toString(),
        curvatureDirection: ['Dorsal (upward)', 'Ventral (downward)', 'Lateral (left)', 'Lateral (right)'][Math.floor(Math.random() * 4)]
      });
      setIsProcessing(false);
      toast.success('Image analyzed!', { description: 'Review and adjust measurements as needed' });
    }, 2000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        simulateAnalysis();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    await saveScan({
      scan_type: 'uploaded',
      length: parseFloat(measurements.length) || null,
      circumference: parseFloat(measurements.circumference) || null,
      curvature_angle: parseFloat(measurements.curvatureAngle) || null,
      curvature_direction: measurements.curvatureDirection,
      image_data: uploadedImage,
      notes: 'Uploaded from device gallery',
    });

    toast.success('Scan saved!', { description: 'Added to your health diary' });
    resetForm();
    setIsOpen(false);
  };

  const resetForm = () => {
    setUploadedImage(null);
    setMeasurements({
      length: '',
      circumference: '',
      curvatureAngle: '',
      curvatureDirection: 'Dorsal (upward)'
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <Upload className="w-4 h-4" />
          Upload Image
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            Upload Scan Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          {!uploadedImage ? (
            <div
              className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <p className="font-medium mb-1">Drag & drop an image</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <Badge variant="outline" className="text-xs">
                Supports JPG, PNG, HEIC up to 10MB
              </Badge>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative rounded-xl overflow-hidden border border-border/50">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded" 
                  className="w-full aspect-[4/3] object-cover"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Analyzing image...</p>
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-background/80"
                  onClick={resetForm}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Measurements Form */}
              {!isProcessing && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      AI-estimated measurements. Please verify and adjust if needed for accuracy.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-primary" />
                        Length (cm)
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={measurements.length}
                        onChange={(e) => setMeasurements({ ...measurements, length: e.target.value })}
                        placeholder="e.g., 14.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Circumference (cm)
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={measurements.circumference}
                        onChange={(e) => setMeasurements({ ...measurements, circumference: e.target.value })}
                        placeholder="e.g., 12.0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Curvature Angle (°)</Label>
                      <Input
                        type="number"
                        value={measurements.curvatureAngle}
                        onChange={(e) => setMeasurements({ ...measurements, curvatureAngle: e.target.value })}
                        placeholder="e.g., 15"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Curvature Direction</Label>
                      <Select 
                        value={measurements.curvatureDirection}
                        onValueChange={(v) => setMeasurements({ ...measurements, curvatureDirection: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dorsal (upward)">Dorsal (upward)</SelectItem>
                          <SelectItem value="Ventral (downward)">Ventral (downward)</SelectItem>
                          <SelectItem value="Lateral (left)">Lateral (left)</SelectItem>
                          <SelectItem value="Lateral (right)">Lateral (right)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="gradient" 
              className="flex-1 gap-2"
              onClick={handleSave}
              disabled={!uploadedImage || isProcessing}
            >
              <Save className="w-4 h-4" />
              Save Scan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
