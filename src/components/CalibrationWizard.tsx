import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  CreditCard, Ruler, Check, ChevronRight, ChevronLeft, X, Target,
  Camera, Move, ZoomIn, RotateCcw, CheckCircle2, AlertCircle, Sparkles,
  Video, VideoOff, RefreshCw, Focus, Crosshair, Circle
} from 'lucide-react';

export interface CalibrationData {
  referenceType: 'credit-card' | 'ruler' | 'quarter' | 'nickel' | 'dime' | 'custom';
  referenceWidth: number; // in mm
  referenceHeight: number; // in mm
  pixelsPerMm: number;
  isCalibrated: boolean;
  calibrationDate: Date | null;
}

interface CalibrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCalibrationComplete: (data: CalibrationData) => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

const referenceObjects = {
  'credit-card': { name: 'Credit Card', width: 85.6, height: 53.98, icon: CreditCard },
  'ruler': { name: 'Ruler (cm)', width: 100, height: 30, icon: Ruler },
  'quarter': { name: 'US Quarter', width: 24.26, height: 24.26, icon: Circle },
  'nickel': { name: 'US Nickel', width: 21.21, height: 21.21, icon: Circle },
  'dime': { name: 'US Dime', width: 17.91, height: 17.91, icon: Circle },
  'custom': { name: 'Custom Object', width: 0, height: 0, icon: Target },
};

export const CalibrationWizard = ({
  isOpen,
  onClose,
  onCalibrationComplete,
  videoRef: externalVideoRef
}: CalibrationWizardProps) => {
  const [step, setStep] = useState(1);
  const [referenceType, setReferenceType] = useState<'credit-card' | 'ruler' | 'quarter' | 'nickel' | 'dime' | 'custom'>('credit-card');
  const [customWidth, setCustomWidth] = useState(50);
  const [customHeight, setCustomHeight] = useState(30);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cornerPoints, setCornerPoints] = useState<{ x: number; y: number }[]>([]);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationResult, setCalibrationResult] = useState<CalibrationData | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [streamRef, setStreamRef] = useState<MediaStream | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  
  // Use external video ref if provided, otherwise use internal
  const videoRef = externalVideoRef || internalVideoRef;

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const referenceData = referenceType === 'custom' 
    ? { width: customWidth, height: customHeight }
    : referenceObjects[referenceType];

  // Start internal camera for calibration
  const startCamera = useCallback(async () => {
    if (externalVideoRef?.current) {
      // External video is already active
      setCameraActive(true);
      return;
    }

    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      });
      
      if (internalVideoRef.current) {
        internalVideoRef.current.srcObject = stream;
        await internalVideoRef.current.play();
        setStreamRef(stream);
        setCameraActive(true);
        toast.success('Camera ready for calibration');
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Unable to access camera. Please grant camera permissions.');
      toast.error('Camera access denied');
    }
  }, [externalVideoRef]);

  // Stop internal camera
  const stopCamera = useCallback(() => {
    if (streamRef) {
      streamRef.getTracks().forEach(track => track.stop());
      setStreamRef(null);
    }
    setCameraActive(false);
  }, [streamRef]);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setCapturedImage(null);
      setCornerPoints([]);
      setCalibrationResult(null);
      setCameraError(null);
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  // Auto-start camera when reaching step 2
  useEffect(() => {
    if (isOpen && step === 2 && !cameraActive && !capturedImage) {
      startCamera();
    }
  }, [isOpen, step, cameraActive, capturedImage, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef) {
        streamRef.getTracks().forEach(track => track.stop());
      }
    };
  }, [streamRef]);

  const captureImage = useCallback(() => {
    const video = videoRef?.current;
    if (!video || !canvasRef.current) {
      toast.error('Camera not ready');
      return;
    }
    
    setIsCapturing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.95));
      setCornerPoints([]);
      
      // Stop internal camera after capture
      if (!externalVideoRef) {
        stopCamera();
      }
      
      toast.success('Image captured! Mark the corners.');
    } else {
      toast.error('Camera not initialized');
    }
    
    setTimeout(() => setIsCapturing(false), 500);
  }, [videoRef, externalVideoRef, stopCamera]);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (cornerPoints.length >= 4) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setCornerPoints([...cornerPoints, { x, y }]);
  };

  const calculateCalibration = () => {
    if (cornerPoints.length !== 4) return;
    
    setIsCalibrating(true);
    
    // Calculate pixel distance between corners
    const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
      return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };
    
    // Calculate average width and height in percentage units
    const width1 = getDistance(cornerPoints[0], cornerPoints[1]);
    const width2 = getDistance(cornerPoints[3], cornerPoints[2]);
    const height1 = getDistance(cornerPoints[0], cornerPoints[3]);
    const height2 = getDistance(cornerPoints[1], cornerPoints[2]);
    
    const avgWidthPercent = (width1 + width2) / 2;
    const avgHeightPercent = (height1 + height2) / 2;
    
    // Calculate pixels per mm (assuming image is 100% = actual pixels)
    const pixelsPerMmWidth = avgWidthPercent / referenceData.width;
    const pixelsPerMmHeight = avgHeightPercent / (referenceData as any).height || referenceData.width;
    const pixelsPerMm = (pixelsPerMmWidth + pixelsPerMmHeight) / 2;
    
    setTimeout(() => {
      const result: CalibrationData = {
        referenceType,
        referenceWidth: referenceData.width,
        referenceHeight: (referenceData as any).height || referenceData.width,
        pixelsPerMm,
        isCalibrated: true,
        calibrationDate: new Date(),
      };
      
      setCalibrationResult(result);
      setIsCalibrating(false);
      setStep(4);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto border-primary/20 shadow-2xl">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                Calibration Wizard
              </CardTitle>
              <CardDescription className="mt-1">
                Calibrate for accurate real-world measurements
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <Progress value={progress} className="mt-4 h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Step 1: Select Reference Object */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Select Reference Object</h3>
                <p className="text-sm text-muted-foreground">
                  Choose an object with known dimensions to calibrate measurements
                </p>
              </div>

              <Tabs value={referenceType} onValueChange={(v) => setReferenceType(v as any)}>
                <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full h-auto flex-wrap gap-1">
                  <TabsTrigger value="credit-card" className="flex items-center gap-1 text-xs px-2 py-1.5">
                    <CreditCard className="w-3 h-3" />
                    <span className="hidden sm:inline">Card</span>
                  </TabsTrigger>
                  <TabsTrigger value="ruler" className="flex items-center gap-1 text-xs px-2 py-1.5">
                    <Ruler className="w-3 h-3" />
                    <span className="hidden sm:inline">Ruler</span>
                  </TabsTrigger>
                  <TabsTrigger value="quarter" className="flex items-center gap-1 text-xs px-2 py-1.5">
                    <Circle className="w-3 h-3" />
                    <span className="hidden sm:inline">Quarter</span>
                  </TabsTrigger>
                  <TabsTrigger value="nickel" className="flex items-center gap-1 text-xs px-2 py-1.5">
                    <Circle className="w-3 h-3" />
                    <span className="hidden sm:inline">Nickel</span>
                  </TabsTrigger>
                  <TabsTrigger value="dime" className="flex items-center gap-1 text-xs px-2 py-1.5">
                    <Circle className="w-3 h-3" />
                    <span className="hidden sm:inline">Dime</span>
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="flex items-center gap-1 text-xs px-2 py-1.5">
                    <Target className="w-3 h-3" />
                    <span className="hidden sm:inline">Custom</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="credit-card" className="mt-4">
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-20 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                          <CreditCard className="w-12 h-12 text-primary-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Standard Credit Card</h4>
                          <p className="text-sm text-muted-foreground">ISO/IEC 7810 ID-1 standard</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span><strong>Width:</strong> 85.6mm</span>
                            <span><strong>Height:</strong> 53.98mm</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ruler" className="mt-4">
                  <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-8 rounded bg-gradient-to-r from-accent to-accent/60 flex items-center justify-between px-2 shadow-lg">
                          {[...Array(10)].map((_, i) => (
                            <div key={i} className="w-px h-4 bg-accent-foreground/50" />
                          ))}
                        </div>
                        <div>
                          <h4 className="font-semibold">10cm Ruler Section</h4>
                          <p className="text-sm text-muted-foreground">Mark first 10cm on any ruler</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span><strong>Width:</strong> 100mm</span>
                            <span><strong>Height:</strong> ~30mm</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="quarter" className="mt-4">
                  <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-xs">25¢</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">US Quarter</h4>
                          <p className="text-sm text-muted-foreground">Standard US quarter dollar coin</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span><strong>Diameter:</strong> 24.26mm</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="nickel" className="mt-4">
                  <Card className="bg-gradient-to-br from-slate-400/5 to-slate-400/10 border-slate-400/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-xs">5¢</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">US Nickel</h4>
                          <p className="text-sm text-muted-foreground">Standard US five cent coin</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span><strong>Diameter:</strong> 21.21mm</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="dime" className="mt-4">
                  <Card className="bg-gradient-to-br from-zinc-400/5 to-zinc-400/10 border-zinc-400/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-500 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-[10px]">10¢</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">US Dime</h4>
                          <p className="text-sm text-muted-foreground">Standard US ten cent coin</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span><strong>Diameter:</strong> 17.91mm</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="custom" className="mt-4">
                  <Card className="border-border/50">
                    <CardContent className="p-6 space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Enter the exact dimensions of your reference object
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="customWidth">Width (mm)</Label>
                          <Input
                            id="customWidth"
                            type="number"
                            value={customWidth}
                            onChange={(e) => setCustomWidth(Number(e.target.value))}
                            min={10}
                            max={300}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customHeight">Height (mm)</Label>
                          <Input
                            id="customHeight"
                            type="number"
                            value={customHeight}
                            onChange={(e) => setCustomHeight(Number(e.target.value))}
                            min={10}
                            max={300}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Step 2: Position and Capture */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Position & Capture</h3>
                <p className="text-sm text-muted-foreground">
                  Place the {referenceObjects[referenceType].name.toLowerCase()} flat and capture an image
                </p>
              </div>

              <div className="space-y-4">
                {/* Instructions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { icon: Move, text: 'Place object flat on surface' },
                    { icon: Camera, text: 'Hold camera directly above' },
                    { icon: ZoomIn, text: 'Fill frame with object' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                      <item.icon className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>

                {/* Preview/Capture Area */}
                <div className="relative aspect-video bg-secondary/30 rounded-xl overflow-hidden border-2 border-dashed border-primary/30">
                  {capturedImage ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={capturedImage} 
                        alt="Captured" 
                        className="w-full h-full object-contain"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setCapturedImage(null);
                          startCamera();
                        }}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Retake
                      </Button>
                    </div>
                  ) : cameraActive ? (
                    <div className="relative w-full h-full">
                      {/* Live camera preview */}
                      <video 
                        ref={internalVideoRef}
                        autoPlay 
                        playsInline 
                        muted
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Alignment guides */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Center crosshair */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <Crosshair className="w-12 h-12 text-primary/50" />
                        </div>
                        {/* Corner guides */}
                        <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-primary/60" />
                        <div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-primary/60" />
                        <div className="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-primary/60" />
                        <div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-primary/60" />
                        {/* Reference box indicator */}
                        <div className="absolute inset-16 border-2 border-dashed border-accent/40 rounded-lg" />
                      </div>

                      {/* Camera status */}
                      <Badge className="absolute top-2 left-2 bg-success/80">
                        <Video className="w-3 h-3 mr-1" />
                        LIVE
                      </Badge>

                      {/* Capture button */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        <Button 
                          onClick={captureImage} 
                          disabled={isCapturing}
                          size="lg"
                          className="shadow-lg"
                        >
                          <Focus className={`w-5 h-5 mr-2 ${isCapturing ? 'animate-pulse' : ''}`} />
                          {isCapturing ? 'Capturing...' : 'Capture'}
                        </Button>
                      </div>
                    </div>
                  ) : cameraError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <div className="p-4 rounded-full bg-destructive/10 mb-4">
                        <VideoOff className="w-10 h-10 text-destructive" />
                      </div>
                      <p className="text-destructive font-medium mb-2">Camera Access Error</p>
                      <p className="text-sm text-muted-foreground mb-4">{cameraError}</p>
                      <Button onClick={startCamera} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Camera
                      </Button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4" />
                      <p className="text-muted-foreground">Starting camera...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Mark Corners */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Mark Reference Corners</h3>
                <p className="text-sm text-muted-foreground">
                  Tap the 4 corners of your reference object in order: top-left, top-right, bottom-right, bottom-left
                </p>
              </div>

              {/* Corner indicator */}
              <div className="flex justify-center gap-2">
                {['TL', 'TR', 'BR', 'BL'].map((corner, i) => (
                  <Badge
                    key={corner}
                    variant={cornerPoints.length > i ? 'default' : 'outline'}
                    className={cornerPoints.length > i ? 'bg-success' : ''}
                  >
                    {cornerPoints.length > i ? <Check className="w-3 h-3 mr-1" /> : null}
                    {corner}
                  </Badge>
                ))}
              </div>

              {/* Image with clickable corners */}
              <div className="relative aspect-video bg-secondary/30 rounded-xl overflow-hidden border border-border">
                {capturedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      ref={imageRef}
                      src={capturedImage}
                      alt="Reference"
                      className="w-full h-full object-contain cursor-crosshair"
                      onClick={handleImageClick}
                    />
                    {/* Corner markers */}
                    {cornerPoints.map((point, i) => (
                      <div
                        key={i}
                        className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                      >
                        <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow-lg" />
                        <span className="absolute -top-5 text-xs font-bold text-primary">{i + 1}</span>
                      </div>
                    ))}
                    {/* Connection lines */}
                    {cornerPoints.length >= 2 && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {cornerPoints.map((point, i) => {
                          const nextPoint = cornerPoints[(i + 1) % cornerPoints.length];
                          if (i >= cornerPoints.length - 1 && cornerPoints.length < 4) return null;
                          return (
                            <line
                              key={i}
                              x1={`${point.x}%`}
                              y1={`${point.y}%`}
                              x2={`${nextPoint.x}%`}
                              y2={`${nextPoint.y}%`}
                              stroke="hsl(var(--primary))"
                              strokeWidth="2"
                              strokeDasharray="4 4"
                            />
                          );
                        })}
                      </svg>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No image captured</p>
                  </div>
                )}
              </div>

              {cornerPoints.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCornerPoints([])}
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Corners
                </Button>
              )}
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in text-center">
              {isCalibrating ? (
                <div className="py-12">
                  <div className="w-16 h-16 mx-auto rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
                  <h3 className="text-lg font-semibold">Calculating...</h3>
                  <p className="text-sm text-muted-foreground">Processing calibration data</p>
                </div>
              ) : calibrationResult ? (
                <>
                  <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-success" />
                  </div>
                  <h3 className="text-xl font-semibold text-success">Calibration Complete!</h3>
                  <p className="text-muted-foreground">
                    Your scanner is now calibrated for accurate measurements
                  </p>

                  <Card className="bg-secondary/30 border-border/50 text-left">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reference Object</span>
                        <span className="font-medium">{referenceObjects[referenceType].name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reference Size</span>
                        <span className="font-medium">
                          {calibrationResult.referenceWidth} × {calibrationResult.referenceHeight} mm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Scale Factor</span>
                        <span className="font-medium font-mono">
                          {calibrationResult.pixelsPerMm.toFixed(4)} px/mm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Calibrated</span>
                        <span className="font-medium">
                          {calibrationResult.calibrationDate?.toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-border/50 flex justify-between">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : onClose}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          {step < 4 ? (
            <Button
              onClick={() => {
                if (step === 3 && cornerPoints.length === 4) {
                  calculateCalibration();
                } else if (step === 2 && capturedImage) {
                  setStep(step + 1);
                } else if (step === 1) {
                  setStep(step + 1);
                }
              }}
              disabled={
                (step === 2 && !capturedImage) ||
                (step === 3 && cornerPoints.length < 4)
              }
            >
              {step === 3 ? 'Calibrate' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (calibrationResult) {
                  onCalibrationComplete(calibrationResult);
                }
                onClose();
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Done
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
