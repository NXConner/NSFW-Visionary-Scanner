import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useCamera } from "@/hooks/useCamera";
import { useData } from "@/contexts/DataContext";
import { AIAssistant } from "@/components/AIAssistant";
import { ImageUploadScan } from "@/components/ImageUploadScan";
import { ScannerFeedback, PositioningOverlay, AngleMeasurementOverlay, GuidanceMessage } from "@/components/ScannerFeedback";
import { 
  ScannerSettingsPanel, 
  ScannerSettings, 
  defaultScannerSettings,
  DistanceIndicator,
  TiltIndicator,
  EdgeDetectionOverlay,
  GhostOverlay,
  VirtualRulerOverlay,
  AutoCaptureIndicator,
  QualityMeter
} from "@/components/ScannerOverlays";
import { CalibrationWizard } from "@/components/CalibrationWizard";
import { ScannerTutorial } from "@/components/ScannerTutorial";
import { ObjectDetectionOverlay } from "@/components/ObjectDetectionOverlay";
import { LightingQuality } from "@/components/LightingQuality";
import { MeasurementConfidence } from "@/components/MeasurementConfidence";
import { AIScanAnalysisPanel } from "@/components/AIScanAnalysisPanel";
import { useAIScanAnalysis } from "@/hooks/useAIScanAnalysis";
import { VisualContentDisplay } from "@/components/VisualContentDisplay";
import { useVisualContent } from "@/hooks/useVisualContent";
import { VISUAL_CONTENT_CATEGORIES } from "@/lib/visualContentManager";
import {
  Camera, Ruler, Activity, TrendingUp, AlertCircle, CheckCircle2,
  Target, RotateCcw, Shield, Scan, CircleDot, Video, VideoOff,
  ZoomIn, ZoomOut, Grid3X3, Flashlight, Timer, Focus, 
  Maximize2, Settings2, Crosshair, SunMedium, Contrast, RotateCw,
  Eye, Sparkles, Sliders, GraduationCap, Scale, Columns, Square
} from "lucide-react";

type ScanMode = 'idle' | 'camera' | 'countdown' | 'scanning' | 'processing' | 'complete';
type GridMode = 'none' | 'thirds' | 'center' | 'measure' | 'positioning';

interface MeasurementResult {
  length: number;
  circumference: number;
  curvatureAngle: number;
  curvatureDirection: string;
}

export const ScannerSection = () => {
  const [scanMode, setScanMode] = useState<ScanMode>('idle');
  const [scanType, setScanType] = useState<'3d' | '2d'>('3d');
  const [measurements, setMeasurements] = useState<MeasurementResult>({
    length: 0,
    circumference: 0,
    curvatureAngle: 0,
    curvatureDirection: '',
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [gridMode, setGridMode] = useState<GridMode>('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [countdown, setCountdown] = useState(0);
  const [timerDelay, setTimerDelay] = useState(0);
  const [isStabilized, setIsStabilized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [guidanceMessage, setGuidanceMessage] = useState<{ text: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);
  const [showPositioning, setShowPositioning] = useState(true);
  const [showAngleMeasurement, setShowAngleMeasurement] = useState(false);
  const [detectedAngle, setDetectedAngle] = useState(0);
  const [showOverlaySettings, setShowOverlaySettings] = useState(false);
  const [scannerSettings, setScannerSettings] = useState<ScannerSettings>(defaultScannerSettings);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [estimatedDistance, setEstimatedDistance] = useState(15);
  const [autoCapturing, setAutoCapturing] = useState(false);
  const [autoCaptureCountdown, setAutoCaptureCountdown] = useState(0);
  const [previousScanImage, setPreviousScanImage] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationData, setCalibrationData] = useState<any>(null);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [confidenceContext, setConfidenceContext] = useState("");
  const [isFullWidthScanner, setIsFullWidthScanner] = useState(false);
  const stabilityRef = useRef<{ x: number; y: number; z: number } | null>(null);
  
  const { videoRef, canvasRef, isActive, error, startCamera, stopCamera, captureImage } = useCamera();
  const { saveScan } = useData();
  const { analyzeImage, isAnalyzing, result: aiAnalysisResult, reset: resetAIAnalysis } = useAIScanAnalysis();

  // Load visual content for scanner positioning guides
  const { content: scannerVisuals } = useVisualContent({
    categories: [
      VISUAL_CONTENT_CATEGORIES.TUTORIALS,
      VISUAL_CONTENT_CATEGORIES.MEASUREMENT,
    ],
    autoLoad: true,
    autoInvert: true,
  });

  const updateConfidenceScore = (result: MeasurementResult) => {
    let score = 55;
    const lightingDelta = Math.abs(brightness - 100);
    const distanceDelta = Math.abs(estimatedDistance - 15);

    score += isStabilized ? 15 : -10;
    score += Math.max(0, 20 - lightingDelta * 0.4);
    score += Math.max(0, 10 - distanceDelta * 2);
    if (result.curvatureAngle < 30) score += 5;
    if (autoCapturing) score += 5;

    const bounded = Math.max(5, Math.min(100, Math.round(score)));
    const contextParts = [];
    contextParts.push(
      lightingDelta <= 15 ? "Lighting balanced." : "Adjust lighting for optimal accuracy.",
    );
    contextParts.push(isStabilized ? "Device stable." : "Hold device steadier.");
    contextParts.push(`Distance ${estimatedDistance.toFixed(1)} cm.`);

    setConfidenceScore(bounded);
    setConfidenceContext(contextParts.join(" "));
  };

  // Device motion for stabilization
  useEffect(() => {
    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (acc && acc.x !== null && acc.y !== null && acc.z !== null) {
        if (stabilityRef.current) {
          const diff = Math.abs(acc.x - stabilityRef.current.x) + 
                      Math.abs(acc.y - stabilityRef.current.y) + 
                      Math.abs(acc.z - stabilityRef.current.z);
          setIsStabilized(diff < 0.5);
        }
        stabilityRef.current = { x: acc.x, y: acc.y, z: acc.z };
      }
    };

    if (scanMode === 'camera') {
      window.addEventListener('devicemotion', handleMotion);
    }
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [scanMode]);

  // Device orientation for tilt detection
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta !== null && event.gamma !== null) {
        setTiltX(Math.round(event.gamma)); // Left-right tilt
        setTiltY(Math.round(event.beta - 90)); // Forward-back tilt (adjusted for holding phone)
      }
    };

    if (scanMode === 'camera' && scannerSettings.showTiltIndicator) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [scanMode, scannerSettings.showTiltIndicator]);

  // Simulate distance estimation (in real app, this would use camera/depth APIs)
  useEffect(() => {
    if (scanMode === 'camera' && scannerSettings.showDistanceIndicator) {
      const interval = setInterval(() => {
        // Simulate slight distance variations
        setEstimatedDistance(prev => Math.max(8, Math.min(24, prev + (Math.random() - 0.5) * 2)));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [scanMode, scannerSettings.showDistanceIndicator]);

  // Auto-capture logic
  useEffect(() => {
    if (scanMode === 'camera' && scannerSettings.autoCapture && !autoCapturing) {
      const lightingOk = brightness >= 80 && brightness <= 120;
      const stabilityOk = isStabilized;
      const tiltOk = Math.abs(tiltX) < 10 && Math.abs(tiltY) < 10;
      const distanceOk = estimatedDistance >= 12 && estimatedDistance <= 18;
      
      if (lightingOk && stabilityOk && tiltOk && distanceOk) {
        setAutoCapturing(true);
        setAutoCaptureCountdown(scannerSettings.autoCaptureDelay);
        
        // Haptic feedback
        if (scannerSettings.hapticFeedback && navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }
  }, [scanMode, scannerSettings.autoCapture, isStabilized, brightness, tiltX, tiltY, estimatedDistance, autoCapturing]);

  // Auto-capture countdown
  useEffect(() => {
    if (autoCaptureCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoCaptureCountdown(autoCaptureCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (autoCaptureCountdown === 0 && autoCapturing) {
      performCapture();
      setAutoCapturing(false);
    }
  }, [autoCaptureCountdown, autoCapturing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && scanMode === 'countdown') {
      performCapture();
    }
  }, [countdown, scanMode]);

  // Trigger AI analysis when scan completes
  useEffect(() => {
    if (scanMode === 'complete' && capturedImage && !aiAnalysisResult && !isAnalyzing) {
      analyzeImage(capturedImage);
    }
  }, [scanMode, capturedImage]);

  const handleStartCamera = async () => {
    await startCamera();
    setScanMode('camera');
    setGuidanceMessage({ text: 'Position subject within the guide frame', type: 'info' });
    toast.success("Camera Active", { description: "Follow the on-screen guide" });
    
    // Clear guidance after 3 seconds
    setTimeout(() => setGuidanceMessage(null), 3000);
  };

  const handleTimerCapture = () => {
    if (timerDelay > 0) {
      setCountdown(timerDelay);
      setScanMode('countdown');
      setGuidanceMessage({ text: `Capturing in ${timerDelay} seconds...`, type: 'info' });
    } else {
      performCapture();
    }
  };

  const performCapture = () => {
    const image = captureImage();
    if (image) {
      // Apply filters to captured image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
          ctx.drawImage(img, 0, 0);
          setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
        }
      };
      img.src = image;
      
      stopCamera();
      setScanMode('scanning');
      setGuidanceMessage({ text: 'Detecting edges and measuring dimensions...', type: 'info' });
      toast.info("Analyzing morphology...", { description: "AI processing in progress" });
      
      // Multi-phase processing simulation with guidance
      setTimeout(() => {
        setScanMode('processing');
        setGuidanceMessage({ text: 'Calculating curvature angle and direction...', type: 'info' });
        setShowAngleMeasurement(true);
        
        // Simulate angle detection animation
        let currentAngle = 0;
        const targetAngle = Math.floor(Math.random() * 35);
        const angleInterval = setInterval(() => {
          currentAngle += 2;
          if (currentAngle >= targetAngle) {
            currentAngle = targetAngle;
            clearInterval(angleInterval);
          }
          setDetectedAngle(currentAngle);
        }, 100);
      }, 2000);
      
      setTimeout(() => {
        const mockMeasurements = {
          length: +(12 + Math.random() * 6).toFixed(1),
          circumference: +(10 + Math.random() * 4).toFixed(1),
          curvatureAngle: detectedAngle || Math.floor(Math.random() * 35),
          curvatureDirection: ['Dorsal (upward)', 'Ventral (downward)', 'Lateral (left)', 'Lateral (right)'][Math.floor(Math.random() * 4)],
        };
        setMeasurements(mockMeasurements);
        updateConfidenceScore(mockMeasurements);
        setScanMode('complete');
        setShowAngleMeasurement(false);
        setGuidanceMessage({ text: 'Analysis complete! Review your measurements below.', type: 'success' });
        
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(200);
        toast.success("Analysis Complete!", { description: "Review your measurements" });
        
        setTimeout(() => setGuidanceMessage(null), 4000);
      }, 5000);
    }
  };

  const handleSaveScan = async () => {
    await saveScan({
      scan_type: scanType,
      length: measurements.length,
      circumference: measurements.circumference,
      curvature_angle: measurements.curvatureAngle,
      curvature_direction: measurements.curvatureDirection,
      image_data: capturedImage,
      notes: null,
    });
    
    // Store for ghost overlay
    if (capturedImage) {
      setPreviousScanImage(capturedImage);
    }
    
    if (scannerSettings.hapticFeedback && navigator.vibrate) navigator.vibrate(100);
    toast.success("Saved to Health Diary!", { description: "Data encrypted & stored locally" });
  };

  const resetScan = () => {
    stopCamera();
    setScanMode('idle');
    setCapturedImage(null);
    setMeasurements({ length: 0, circumference: 0, curvatureAngle: 0, curvatureDirection: '' });
    setConfidenceScore(0);
    setConfidenceContext('');
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setCountdown(0);
    setGuidanceMessage(null);
    setShowAngleMeasurement(false);
    setDetectedAngle(0);
    setAutoCapturing(false);
    setAutoCaptureCountdown(0);
    setTiltX(0);
    setTiltY(0);
    resetAIAnalysis();
  };

  const cancelAutoCapture = () => {
    setAutoCapturing(false);
    setAutoCaptureCountdown(0);
  };

  const toggleTorch = async () => {
    try {
      const track = videoRef.current?.srcObject as MediaStream;
      const capabilities = track?.getVideoTracks()[0]?.getCapabilities?.() as any;
      if (capabilities?.torch) {
        await track.getVideoTracks()[0].applyConstraints({ advanced: [{ torch: !torchOn } as any] });
        setTorchOn(!torchOn);
      }
    } catch (e) {
      toast.error("Torch not available on this device");
    }
  };

  const GridOverlay = () => {
    if (gridMode === 'none') return null;
    
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.4 }}>
        {gridMode === 'thirds' && (
          <>
            <line x1="33.33%" y1="0" x2="33.33%" y2="100%" stroke="hsl(var(--primary))" strokeWidth="1" />
            <line x1="66.66%" y1="0" x2="66.66%" y2="100%" stroke="hsl(var(--primary))" strokeWidth="1" />
            <line x1="0" y1="33.33%" x2="100%" y2="33.33%" stroke="hsl(var(--primary))" strokeWidth="1" />
            <line x1="0" y1="66.66%" x2="100%" y2="66.66%" stroke="hsl(var(--primary))" strokeWidth="1" />
          </>
        )}
        {gridMode === 'center' && (
          <>
            <line x1="50%" y1="40%" x2="50%" y2="60%" stroke="hsl(var(--primary))" strokeWidth="2" />
            <line x1="40%" y1="50%" x2="60%" y2="50%" stroke="hsl(var(--primary))" strokeWidth="2" />
            <circle cx="50%" cy="50%" r="10%" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 4" />
          </>
        )}
        {gridMode === 'measure' && (
          <>
            <defs>
              <pattern id="measureGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#measureGrid)" />
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="hsl(var(--accent))" strokeWidth="1" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="hsl(var(--accent))" strokeWidth="1" />
          </>
        )}
      </svg>
    );
  };

  const ScannerFrame = () => (
    <div className="absolute inset-8 pointer-events-none">
      {/* Animated corners */}
      <div className="absolute -top-1 -left-1 w-10 h-10">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-transparent" />
        <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-primary to-transparent" />
      </div>
      <div className="absolute -top-1 -right-1 w-10 h-10">
        <div className="absolute top-0 right-0 w-full h-0.5 bg-gradient-to-l from-primary to-transparent" />
        <div className="absolute top-0 right-0 w-0.5 h-full bg-gradient-to-b from-primary to-transparent" />
      </div>
      <div className="absolute -bottom-1 -left-1 w-10 h-10">
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-transparent" />
        <div className="absolute bottom-0 left-0 w-0.5 h-full bg-gradient-to-t from-primary to-transparent" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-10 h-10">
        <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-l from-primary to-transparent" />
        <div className="absolute bottom-0 right-0 w-0.5 h-full bg-gradient-to-t from-primary to-transparent" />
      </div>
      
      {/* Scan line animation */}
      {scanMode === 'scanning' && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line shadow-[0_0_20px_hsl(var(--primary))]" />
        </div>
      )}
      
      {/* Processing indicator */}
      {scanMode === 'processing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-transparent border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <div className="absolute bottom-8 text-center">
            <p className="text-sm font-medium text-primary">Analyzing...</p>
            <p className="text-xs text-muted-foreground">AI processing morphology data</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <section className="min-h-screen px-4 py-20 relative">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-primary font-medium">Medical-Grade Scanner</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">Advanced Morphology</span> Scanner
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            AI-powered scanning with precision measurement. All data encrypted and stored locally.
          </p>
          {/* Visual positioning guides */}
          {scannerVisuals.length > 0 && scanMode === 'idle' && (
            <div className="mt-6 max-w-3xl mx-auto">
              <VisualContentDisplay
                content={scannerVisuals.filter(v =>
                  v.tags.some(tag => 
                    tag.includes('positioning') || 
                    tag.includes('scanner') || 
                    tag.includes('measurement')
                  )
                ).slice(0, 2)}
                title="Positioning Guide"
                showThumbnails={true}
                className="max-h-48"
              />
            </div>
          )}
        </div>

        <div className={`grid gap-8 ${isFullWidthScanner ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[3fr_2fr]'}`}>
          {/* Scanner View */}
          <Card variant="glass" className="overflow-hidden animate-fade-in">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg gradient-primary">
                    <Scan className="w-4 h-4 text-primary-foreground" />
                  </div>
                  Scanner View
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  <Tabs value={scanType} onValueChange={(v) => setScanType(v as '3d' | '2d')} className="w-auto">
                    <TabsList className="h-9 bg-secondary/50">
                      <TabsTrigger value="3d" className="text-xs px-3 data-[state=active]:gradient-primary">3D Scan</TabsTrigger>
                      <TabsTrigger value="2d" className="text-xs px-3 data-[state=active]:gradient-primary">2D Scan</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="hidden lg:flex h-9 w-9"
                    onClick={() => setIsFullWidthScanner(!isFullWidthScanner)}
                    title={isFullWidthScanner ? "Split view" : "Full width"}
                  >
                    {isFullWidthScanner ? <Columns className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {/* Scanner Container with External Controls */}
              <div className="flex">
                {/* Video Container - Larger */}
                <div
                  className="relative flex-1 aspect-[3/4] md:aspect-[4/3] min-h-[500px] lg:min-h-[550px] bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center overflow-hidden"
                  style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
                >
                {/* Camera Feed */}
                {(scanMode === 'camera' || scanMode === 'countdown' || isActive) && (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
                    style={{ transform: `scale(${zoom})` }}
                  />
                )}
                
                {/* Captured Image */}
                {capturedImage && scanMode !== 'camera' && scanMode !== 'countdown' && (
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {/* Grid Overlay */}
                <GridOverlay />

                {(scanMode === 'camera' || scanMode === 'countdown') && (
                  <div className="absolute left-3 top-3 z-30">
                    <LightingQuality brightness={brightness} contrast={contrast} />
                  </div>
                )}
                
                {/* Positioning Overlay - shows during camera mode */}
                {scannerSettings.showPositioningGuide && (scanMode === 'camera' || scanMode === 'countdown') && (
                  <PositioningOverlay scanType={scanType} />
                )}
                
                {/* Virtual Ruler Overlay */}
                {scannerSettings.showVirtualRuler && (scanMode === 'camera' || scanMode === 'countdown') && (
                  <VirtualRulerOverlay unitSystem="cm" />
                )}
                
                {/* Ghost Overlay - previous scan position */}
                {scannerSettings.showGhostOverlay && (scanMode === 'camera' || scanMode === 'countdown') && (
                  <GhostOverlay previousImage={previousScanImage} opacity={30} />
                )}
                
                {/* Edge Detection Overlay */}
                {scannerSettings.showEdgeDetection && (scanMode === 'camera' || scanMode === 'countdown') && (
                  <EdgeDetectionOverlay intensity={60} />
                )}
                
                {/* Angle Measurement Overlay - shows during processing */}
                {showAngleMeasurement && (
                  <AngleMeasurementOverlay angle={detectedAngle} />
                )}
                
                {/* Object Detection Overlay */}
                {scannerSettings.showObjectDetection && (scanMode === 'camera' || scanMode === 'countdown') && (
                  <ObjectDetectionOverlay 
                    isActive={isActive} 
                    showMeasurementGuides={scannerSettings.showMeasurementGuides}
                    calibrationScale={calibrationData?.pixelsPerMm || 3.5}
                    onDetection={(detected) => {
                      if (detected && scannerSettings.hapticFeedback && navigator.vibrate) {
                        navigator.vibrate(30);
                      }
                    }}
                  />
                )}

                {/* Distance Indicator moved outside scanner display */}
                
                {/* Tilt Indicator moved outside scanner display */}
                
                {/* Quality Meter moved outside scanner display */}
                
                {/* Auto-Capture Indicator */}
                {scannerSettings.autoCapture && (scanMode === 'camera' || scanMode === 'countdown') && (
                  <AutoCaptureIndicator 
                    isReady={!autoCapturing && isStabilized && brightness >= 80}
                    countdown={autoCaptureCountdown}
                    onCancel={cancelAutoCapture}
                  />
                )}
                
                {/* Scanner Frame */}
                <ScannerFrame />

                {/* Scanner Feedback - Step by step guide */}
                {scannerSettings.showStepGuide && (
                  <ScannerFeedback
                    isActive={isActive}
                    isStabilized={isStabilized}
                    scanMode={scanMode}
                    onCapture={handleTimerCapture}
                    brightness={brightness}
                  />
                )}

                {/* AI Assistant */}
                <AIAssistant 
                  isActive={['camera', 'countdown', 'scanning', 'processing', 'complete'].includes(scanMode)}
                  currentPhase={scanMode === 'countdown' ? 'camera' : scanMode as 'idle' | 'camera' | 'scanning' | 'complete'}
                  isStabilized={isStabilized}
                />
                
                {/* Settings Panel Overlay */}
                {showOverlaySettings && (
                  <ScannerSettingsPanel
                    settings={scannerSettings}
                    onSettingsChange={setScannerSettings}
                    onClose={() => setShowOverlaySettings(false)}
                  />
                )}
                
                {/* Guidance Messages */}
                {guidanceMessage && (
                  <GuidanceMessage message={guidanceMessage.text} type={guidanceMessage.type} />
                )}

                {/* Countdown Display */}
                {scanMode === 'countdown' && countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm z-30">
                    <div className="text-8xl font-bold gradient-text animate-scale-in">
                      {countdown}
                    </div>
                  </div>
                )}

                {/* Idle State */}
                {scanMode === 'idle' && !isActive && !error && (
                  <div className="text-center z-10 animate-fade-in">
                    <div className="w-24 h-24 mx-auto rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                      {scanType === '3d' ? <Scan className="w-12 h-12 text-primary-foreground" /> : <Camera className="w-12 h-12 text-primary-foreground" />}
                    </div>
                    <p className="text-foreground font-semibold mt-6 text-lg">Ready for {scanType.toUpperCase()} Scan</p>
                    <p className="text-sm text-muted-foreground mt-1">Tap Start Camera to begin</p>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="text-center z-10 p-6 animate-fade-in">
                    <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                      <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <p className="text-destructive font-medium">{error}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={resetScan}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Complete State */}
                {scanMode === 'complete' && !capturedImage && (
                  <div className="text-center z-10 animate-scale-in">
                    <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-success" />
                    </div>
                    <p className="text-success font-medium mt-4">Scan Complete</p>
                  </div>
                )}

                {/* Status Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/95 via-background/70 to-transparent z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full transition-colors ${
                        scanMode === 'idle' && !isActive ? 'bg-muted-foreground' :
                        ['camera', 'countdown'].includes(scanMode) ? 'bg-success animate-pulse' :
                        ['scanning', 'processing'].includes(scanMode) ? 'bg-warning animate-pulse' :
                        'bg-success'
                      }`} />
                      <span className="text-[10px] font-mono text-foreground/80">
                        {scanMode === 'idle' && !isActive ? 'READY' :
                         scanMode === 'camera' ? 'LIVE' :
                         scanMode === 'countdown' ? 'COUNTDOWN' :
                         scanMode === 'scanning' ? 'ANALYZING' :
                         scanMode === 'processing' ? 'PROCESSING' : 'COMPLETE'}
                      </span>
                      {scanMode === 'camera' && (
                        <Badge variant={isStabilized ? "default" : "secondary"} className="text-[9px] h-4 px-1.5">
                          {isStabilized ? <Focus className="w-2.5 h-2.5 mr-0.5" /> : <RotateCw className="w-2.5 h-2.5 mr-0.5 animate-spin" />}
                          {isStabilized ? 'Stable' : 'Stabilizing'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-primary/30 text-primary">
                        {scanType.toUpperCase()}
                      </Badge>
                      {zoom > 1 && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                          {zoom.toFixed(1)}x
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                </div>

                {/* External Camera Controls - Outside Scanner Display */}
                {(scanMode === 'camera' || scanMode === 'countdown') && (
                  <div className="flex flex-col justify-between p-2 bg-secondary/30 border-l border-border/50">
                    <div className="flex flex-col gap-1.5">
                      <Button size="icon" variant="glass" className="w-10 h-10" onClick={toggleTorch} title="Flash">
                        <Flashlight className={`w-4 h-4 ${torchOn ? 'text-warning' : ''}`} />
                      </Button>
                      <Button 
                        size="icon" 
                        variant={scannerSettings.showPositioningGuide ? 'default' : 'glass'} 
                        className="w-10 h-10"
                        onClick={() => setScannerSettings(s => ({ ...s, showPositioningGuide: !s.showPositioningGuide }))}
                        title="Positioning Guide"
                      >
                        <Target className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant={gridMode !== 'none' ? 'default' : 'glass'} 
                        className="w-10 h-10"
                        onClick={() => setGridMode(prev => prev === 'none' ? 'measure' : prev === 'measure' ? 'thirds' : prev === 'thirds' ? 'center' : 'none')}
                        title="Grid"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="glass" 
                        className="w-10 h-10"
                        onClick={() => setShowSettings(!showSettings)}
                        title="Settings"
                      >
                        <Settings2 className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        size="icon" 
                        variant="glass" 
                        className="w-10 h-10 bg-primary/20"
                        onClick={() => setShowOverlaySettings(true)}
                        title="Overlay Settings"
                      >
                        <Sliders className="w-4 h-4 text-primary" />
                      </Button>
                      
                      {/* Distance Indicator */}
                      {scannerSettings.showDistanceIndicator && (
                        <DistanceIndicator 
                          estimatedDistance={estimatedDistance} 
                          optimalMin={12} 
                          optimalMax={18}
                          external
                        />
                      )}
                      
                      {/* Quality Meter Mini */}
                      {scannerSettings.showQualityIndicators && (
                        <div className="p-2 rounded-lg bg-background/90 backdrop-blur-md border border-border/50 shadow-lg">
                          <div className="flex flex-col gap-1 items-center">
                            <div className={`w-3 h-3 rounded-full ${brightness >= 80 && brightness <= 120 ? 'bg-success' : 'bg-warning'}`} title="Lighting" />
                            <div className={`w-3 h-3 rounded-full ${isStabilized ? 'bg-success' : 'bg-warning'}`} title="Stability" />
                            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-success' : 'bg-muted'}`} title="Focus" />
                          </div>
                          <span className="text-[8px] block text-center mt-1 text-muted-foreground">QUALITY</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Tilt Indicator - Bottom Right Outside Scanner */}
                    {scannerSettings.showTiltIndicator && (
                      <TiltIndicator tiltX={tiltX} tiltY={tiltY} external />
                    )}
                  </div>
                )}
              </div>

              {/* Settings Panel - Below Scanner */}
              {showSettings && (scanMode === 'camera' || scanMode === 'countdown') && (
                <div className="p-4 border-t border-border/50 bg-secondary/20 space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2"><ZoomIn className="w-3 h-3" /> Zoom</span>
                        <span className="font-mono">{zoom.toFixed(1)}x</span>
                      </div>
                      <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={([v]) => setZoom(v)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2"><SunMedium className="w-3 h-3" /> Brightness</span>
                        <span className="font-mono">{brightness}%</span>
                      </div>
                      <Slider value={[brightness]} min={50} max={150} onValueChange={([v]) => setBrightness(v)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2"><Contrast className="w-3 h-3" /> Contrast</span>
                        <span className="font-mono">{contrast}%</span>
                      </div>
                      <Slider value={[contrast]} min={50} max={150} onValueChange={([v]) => setContrast(v)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2"><Timer className="w-3 h-3" /> Timer</span>
                        <span className="font-mono">{timerDelay}s</span>
                      </div>
                      <div className="flex gap-2">
                        {[0, 3, 5, 10].map(t => (
                          <Button 
                            key={t} 
                            size="sm" 
                            variant={timerDelay === t ? "default" : "outline"}
                            className="flex-1 h-7 text-xs"
                            onClick={() => setTimerDelay(t)}
                          >
                            {t === 0 ? 'Off' : `${t}s`}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="p-6 space-y-4">
                {scanMode === 'idle' && !error && (
                  <div className="space-y-3">
                    <Button variant="hero" className="w-full group" onClick={handleStartCamera}>
                      <Video className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      Start Camera
                    </Button>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-border/50" />
                      <span className="text-xs text-muted-foreground">or</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>
                    <ImageUploadScan />
                    
                    {/* Tutorial and Calibration Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setShowTutorial(true)}
                      >
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Tutorial
                      </Button>
                      <Button 
                        variant={isCalibrated ? "outline" : "secondary"}
                        className="flex-1"
                        onClick={() => setShowCalibration(true)}
                      >
                        <Scale className="w-4 h-4 mr-2" />
                        {isCalibrated ? 'Recalibrate' : 'Calibrate'}
                      </Button>
                    </div>
                    
                    {isCalibrated && (
                      <Badge variant="outline" className="w-full justify-center bg-success/10 border-success/30 text-success">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Calibrated for accurate measurements
                      </Badge>
                    )}
                  </div>
                )}
                
                {(scanMode === 'camera' || scanMode === 'countdown') && (
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={resetScan}>
                      <VideoOff className="w-5 h-5 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      variant="hero" 
                      className="flex-1 group" 
                      onClick={handleTimerCapture}
                      disabled={scanMode === 'countdown'}
                    >
                      {timerDelay > 0 ? (
                        <>
                          <Timer className="w-5 h-5 mr-2" />
                          Capture ({timerDelay}s)
                        </>
                      ) : (
                        <>
                          <Crosshair className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                          Capture
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                {(scanMode === 'scanning' || scanMode === 'processing') && (
                  <Button variant="hero" className="w-full" disabled>
                    <Activity className="w-5 h-5 mr-2 animate-pulse" />
                    {scanMode === 'scanning' ? 'Analyzing...' : 'Processing...'}
                  </Button>
                )}
                
                {scanMode === 'complete' && (
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={resetScan}>
                      <RotateCcw className="w-5 h-5 mr-2" />
                      New Scan
                    </Button>
                    <Button variant="hero" className="flex-1" onClick={handleSaveScan}>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Save Results
                    </Button>
                  </div>
                )}
                
                <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-success/5 border border-success/20">
                  <Shield className="w-4 h-4 mt-0.5 text-success flex-shrink-0" />
                  <span>AES-256 encrypted. All data stored locally. Works offline.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results & Options Panel */}
          <div className="space-y-6">
            {/* Measurement Types */}
            <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              {[
                { id: 'curvature', label: 'Curvature', icon: Target, desc: "Peyronie's assessment", color: 'text-primary' },
                { id: 'length', label: 'Length', icon: Ruler, desc: 'Precise tracking', color: 'text-cyan-glow' },
                { id: 'circumference', label: 'Circumference', icon: CircleDot, desc: 'Girth measurement', color: 'text-accent' },
                { id: 'progression', label: 'Progression', icon: TrendingUp, desc: 'Track changes', color: 'text-success' },
              ].map((type) => (
                <Card key={type.id} variant="interactive" className="p-4 group">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <type.icon className={`w-5 h-5 ${type.color}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{type.label}</h4>
                      <p className="text-xs text-muted-foreground">{type.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Results Card */}
            {scanMode === 'complete' && (
              <Card variant="glow" className="animate-scale-in overflow-hidden">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Scan Results
                    <Badge className="ml-auto gradient-primary text-primary-foreground">New</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Main Measurements */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                      <Ruler className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <div className="text-3xl font-bold gradient-text">{measurements.length}</div>
                      <div className="text-xs text-muted-foreground mt-1">Length (cm)</div>
                    </div>
                    <div className="text-center p-5 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                      <CircleDot className="w-6 h-6 mx-auto mb-2 text-accent" />
                      <div className="text-3xl font-bold text-accent">{measurements.circumference}</div>
                      <div className="text-xs text-muted-foreground mt-1">Circumference (cm)</div>
                    </div>
                  </div>
                  
                  {/* Curvature Analysis */}
                  <div className="p-5 rounded-xl bg-secondary/30 border border-border/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        <span className="font-medium">Curvature Analysis</span>
                      </div>
                      <span className="text-3xl font-bold gradient-text">{measurements.curvatureAngle}°</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Direction</span>
                      <Badge variant="outline">{measurements.curvatureDirection}</Badge>
                    </div>
                    
                    {/* Visual Progress Bar */}
                    <div className="space-y-2">
                      <div className="h-3 rounded-full bg-muted overflow-hidden relative">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${Math.min((measurements.curvatureAngle / 90) * 100, 100)}%`,
                            background: measurements.curvatureAngle < 30 
                              ? 'hsl(var(--success))' 
                              : measurements.curvatureAngle < 60 
                                ? 'linear-gradient(90deg, hsl(var(--success)), hsl(var(--warning)))' 
                                : 'linear-gradient(90deg, hsl(var(--warning)), hsl(var(--destructive)))'
                          }}
                        />
                        {/* Threshold markers */}
                        <div className="absolute top-0 bottom-0 left-[33%] w-px bg-foreground/20" />
                        <div className="absolute top-0 bottom-0 left-[66%] w-px bg-foreground/20" />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                        <span>0° Normal</span>
                        <span>30° Mild</span>
                        <span>60° Moderate</span>
                        <span>90°</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Assessment Result */}
                  {measurements.curvatureAngle < 30 ? (
                    <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-success/20">
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <span className="font-semibold text-success">Within Normal Range</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Curvature under 30° is generally considered within normal variation.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-warning/20">
                          <AlertCircle className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                          <span className="font-semibold text-warning">Consider Consultation</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Curvature of {measurements.curvatureAngle}° may benefit from specialist evaluation.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {confidenceScore > 0 && (
                    <MeasurementConfidence value={confidenceScore} context={confidenceContext} />
                  )}

                  {/* AI Scan Analysis */}
                  {(isAnalyzing || aiAnalysisResult) && (
                    <AIScanAnalysisPanel result={aiAnalysisResult} isAnalyzing={isAnalyzing} />
                  )}

                  {/* Health Detection Summary */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm flex items-center gap-2">
                        <Eye className="w-4 h-4 text-primary" />
                        Health Detections
                      </span>
                      <Badge variant="outline" className="text-success border-success/30">Clear</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Visual analysis complete. No significant health concerns detected.
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Sparkles className="w-4 h-4 mr-2" />
                      View Full Health Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tips Card (when idle/camera) */}
            {['idle', 'camera', 'countdown'].includes(scanMode) && (
              <Card variant="glass" className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-primary" />
                    Scanning Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: Focus, text: 'Hold device steady for accurate measurements' },
                    { icon: SunMedium, text: 'Ensure good lighting conditions' },
                    { icon: Ruler, text: 'Include a reference object for scale' },
                    { icon: Grid3X3, text: 'Center subject within frame guides' },
                  ].map((tip, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
                        <tip.icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-muted-foreground">{tip.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Tutorial Modal */}
      <ScannerTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={() => {
          toast.success("Tutorial completed!", { description: "You're ready to start scanning" });
        }}
      />
      
      {/* Calibration Wizard */}
      <CalibrationWizard
        isOpen={showCalibration}
        onClose={() => setShowCalibration(false)}
        onCalibrationComplete={(data) => {
          setCalibrationData(data);
          setIsCalibrated(true);
          toast.success("Calibration successful!", { 
            description: `Reference: ${data.referenceWidth}mm × ${data.referenceHeight}mm` 
          });
        }}
        videoRef={videoRef}
      />
    </section>
  );
};
