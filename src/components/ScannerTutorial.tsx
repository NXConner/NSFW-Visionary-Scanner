import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  X, ChevronRight, ChevronLeft, Play, Pause, SkipForward,
  Camera, Ruler, Target, Sun, Hand, Eye, Grid3X3, 
  CheckCircle2, AlertTriangle, Lightbulb, Sparkles, GraduationCap,
  Smartphone, Move, ZoomIn, Timer, RotateCcw
} from 'lucide-react';
import { VisualContentDisplay } from './VisualContentDisplay';
import { useVisualContent } from '@/hooks/useVisualContent';
import { VISUAL_CONTENT_CATEGORIES } from '@/lib/visualContentManager';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  animation: 'position' | 'lighting' | 'distance' | 'stability' | 'capture' | 'grid' | 'results';
  tips: string[];
  doList: string[];
  dontList: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'intro',
    title: 'Welcome to Scanner Tutorial',
    description: 'Learn how to get accurate measurements with our AI-powered scanner. This tutorial will guide you through best practices.',
    icon: GraduationCap,
    animation: 'position',
    tips: ['Complete this tutorial once to master scanning', 'You can revisit anytime from settings'],
    doList: ['Follow each step carefully', 'Practice with the interactive demos'],
    dontList: ['Skip steps if you\'re new', 'Rush through the tutorial']
  },
  {
    id: 'lighting',
    title: 'Proper Lighting',
    description: 'Good lighting is crucial for accurate measurements. The scanner needs clear visibility to detect edges and measure properly.',
    icon: Sun,
    animation: 'lighting',
    tips: ['Natural daylight works best', 'Avoid direct sunlight causing harsh shadows', 'Use diffused artificial light if needed'],
    doList: ['Use bright, even lighting', 'Position light source in front', 'Check the quality indicator'],
    dontList: ['Scan in dim conditions', 'Have light behind the subject', 'Create harsh shadows']
  },
  {
    id: 'positioning',
    title: 'Device Positioning',
    description: 'Hold your device correctly for the best scanning results. Position and angle matter for measurement accuracy.',
    icon: Smartphone,
    animation: 'position',
    tips: ['Use a tripod or stable surface when possible', 'The positioning guide shows optimal placement'],
    doList: ['Hold device parallel to subject', 'Keep camera perpendicular (90°)', 'Center subject in frame'],
    dontList: ['Tilt the device at angles', 'Hold too close or too far', 'Obstruct the camera lens']
  },
  {
    id: 'distance',
    title: 'Optimal Distance',
    description: 'Maintain the correct distance for accurate measurements. Too close or too far will affect precision.',
    icon: Move,
    animation: 'distance',
    tips: ['12-18 inches (30-45cm) is optimal', 'Watch the distance indicator', 'The subject should fill about 60% of frame'],
    doList: ['Stay within the green zone', 'Adjust based on feedback', 'Keep consistent distance'],
    dontList: ['Get too close (distortion)', 'Stand too far (loss of detail)', 'Move during capture']
  },
  {
    id: 'stability',
    title: 'Keeping Steady',
    description: 'A stable device ensures sharp images and accurate measurements. Movement causes blur and measurement errors.',
    icon: Hand,
    animation: 'stability',
    tips: ['Use both hands for stability', 'Brace against your body', 'Use the timer for hands-free capture'],
    doList: ['Hold device firmly', 'Wait for "Stable" indicator', 'Use timer delay feature'],
    dontList: ['Move while capturing', 'Hold with one hand', 'Rush the capture']
  },
  {
    id: 'guides',
    title: 'Using Visual Guides',
    description: 'The scanner provides visual overlays to help you position correctly. Learn to use them effectively.',
    icon: Grid3X3,
    animation: 'grid',
    tips: ['Toggle guides from the control panel', 'Different guides for different needs', 'Quality meter shows readiness'],
    doList: ['Align with positioning frame', 'Use grid for centering', 'Check quality indicators'],
    dontList: ['Ignore the visual guides', 'Proceed with poor quality score', 'Skip the calibration']
  },
  {
    id: 'capture',
    title: 'Capturing the Scan',
    description: 'When all conditions are right, capture your scan. The AI will process and provide measurements.',
    icon: Camera,
    animation: 'capture',
    tips: ['Wait for green quality indicators', 'Auto-capture triggers when ready', 'You can retake if needed'],
    doList: ['Ensure all indicators are green', 'Stay still during processing', 'Review results carefully'],
    dontList: ['Capture with warnings shown', 'Move before completion', 'Accept poor quality scans']
  },
  {
    id: 'complete',
    title: 'Tutorial Complete!',
    description: 'You\'re now ready to use the scanner effectively. Remember these tips for accurate measurements.',
    icon: CheckCircle2,
    animation: 'results',
    tips: ['Practice makes perfect', 'Calibrate with a reference object', 'Save scans to track progress'],
    doList: ['Start with a calibration', 'Take multiple scans for accuracy', 'Review and compare over time'],
    dontList: ['Expect perfect results immediately', 'Skip the calibration step', 'Forget to save your data']
  }
];

interface ScannerTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const ScannerTutorial = ({ isOpen, onClose, onComplete }: ScannerTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Load visual content for scanner tutorials
  const { content: tutorialVisuals } = useVisualContent({
    categories: [
      VISUAL_CONTENT_CATEGORIES.TUTORIALS,
      VISUAL_CONTENT_CATEGORIES.MEASUREMENT,
    ],
    autoLoad: true,
    autoInvert: true,
  });

  const step = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  // Animation loop
  useEffect(() => {
    if (isPlaying && isOpen) {
      const interval = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 4);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isPlaying, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setIsPlaying(true);
    }
  }, [isOpen]);

  const nextStep = () => {
    if (isLastStep) {
      onComplete();
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
      setAnimationPhase(0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setAnimationPhase(0);
    }
  };

  const skipTutorial = () => {
    onComplete();
    onClose();
  };

  if (!isOpen) return null;

  // Animation component based on step type
  const AnimationDemo = () => {
    switch (step.animation) {
      case 'lighting':
        return (
          <div className="relative w-full h-48 bg-gradient-to-b from-secondary to-secondary/50 rounded-xl overflow-hidden">
            {/* Sun representation */}
            <div 
              className={`absolute w-12 h-12 rounded-full bg-warning transition-all duration-1000 ${
                animationPhase === 0 ? 'top-4 left-4' :
                animationPhase === 1 ? 'top-4 left-1/2 -translate-x-1/2' :
                animationPhase === 2 ? 'top-4 right-4' :
                'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
              }`}
            >
              <Sun className="w-full h-full p-2 text-warning-foreground" />
            </div>
            {/* Subject */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-16 h-24 rounded-lg bg-primary/20 border-2 border-primary/40">
              <div 
                className={`absolute inset-0 transition-all duration-1000 ${
                  animationPhase === 1 || animationPhase === 3 ? 'bg-primary/10' : 'bg-black/20'
                }`}
              />
            </div>
            {/* Quality indicator */}
            <Badge 
              className={`absolute bottom-2 right-2 ${
                animationPhase === 1 ? 'bg-success' : 'bg-warning'
              }`}
            >
              {animationPhase === 1 ? 'Good Lighting' : 'Adjust Light'}
            </Badge>
          </div>
        );

      case 'position':
        return (
          <div className="relative w-full h-48 bg-secondary/30 rounded-xl overflow-hidden flex items-center justify-center">
            {/* Phone representation */}
            <div 
              className={`relative w-20 h-36 rounded-xl border-4 border-foreground/20 bg-background transition-all duration-1000 ${
                animationPhase === 0 ? 'rotate-0' :
                animationPhase === 1 ? 'rotate-12' :
                animationPhase === 2 ? '-rotate-12' :
                'rotate-0'
              }`}
            >
              <div className="absolute inset-2 rounded-lg bg-secondary flex items-center justify-center">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-foreground/20" />
            </div>
            {/* Arrow showing direction */}
            <div className={`absolute bottom-4 transition-opacity duration-500 ${animationPhase === 0 || animationPhase === 3 ? 'opacity-100' : 'opacity-50'}`}>
              <Badge variant={animationPhase === 0 || animationPhase === 3 ? 'default' : 'destructive'}>
                {animationPhase === 0 || animationPhase === 3 ? '✓ Correct' : '✗ Tilted'}
              </Badge>
            </div>
          </div>
        );

      case 'distance':
        return (
          <div className="relative w-full h-48 bg-secondary/30 rounded-xl overflow-hidden">
            {/* Distance visualization */}
            <div className="absolute inset-x-0 bottom-0 h-32 flex items-end justify-center">
              {/* Subject */}
              <div className="w-12 h-20 rounded-t-lg bg-primary/30 border-t-2 border-x-2 border-primary" />
            </div>
            {/* Camera moving */}
            <div 
              className={`absolute left-1/2 -translate-x-1/2 transition-all duration-1000 ${
                animationPhase === 0 ? 'top-2' :
                animationPhase === 1 ? 'top-8' :
                animationPhase === 2 ? 'top-16' :
                'top-8'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
            </div>
            {/* Distance indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 h-32 w-2 rounded-full bg-muted overflow-hidden">
              <div 
                className={`absolute bottom-0 w-full rounded-full transition-all duration-1000 ${
                  animationPhase === 1 || animationPhase === 3 ? 'h-1/2 bg-success' :
                  animationPhase === 0 ? 'h-1/4 bg-warning' :
                  'h-3/4 bg-destructive'
                }`}
              />
            </div>
            <Badge 
              className={`absolute bottom-2 left-2 ${
                animationPhase === 1 || animationPhase === 3 ? 'bg-success' :
                'bg-warning'
              }`}
            >
              {animationPhase === 1 || animationPhase === 3 ? '12-18 inches ✓' :
               animationPhase === 0 ? 'Too close' : 'Too far'}
            </Badge>
          </div>
        );

      case 'stability':
        return (
          <div className="relative w-full h-48 bg-secondary/30 rounded-xl overflow-hidden flex items-center justify-center">
            {/* Shaking/stable phone */}
            <div 
              className={`relative w-20 h-36 rounded-xl border-4 border-foreground/20 bg-background transition-all duration-200 ${
                animationPhase === 1 || animationPhase === 2 
                  ? 'translate-x-1 -translate-y-0.5' 
                  : animationPhase === 3 
                    ? '-translate-x-1 translate-y-0.5'
                    : ''
              } ${animationPhase === 0 ? '' : 'animate-pulse'}`}
            >
              <div className="absolute inset-2 rounded-lg bg-secondary flex items-center justify-center">
                <Hand className={`w-8 h-8 ${animationPhase === 0 ? 'text-success' : 'text-warning'}`} />
              </div>
            </div>
            <Badge 
              className={`absolute bottom-4 ${animationPhase === 0 ? 'bg-success' : 'bg-warning'}`}
            >
              {animationPhase === 0 ? '✓ Stable' : 'Stabilizing...'}
            </Badge>
          </div>
        );

      case 'grid':
        return (
          <div className="relative w-full h-48 bg-secondary/30 rounded-xl overflow-hidden">
            {/* Grid overlay */}
            <svg className="absolute inset-0 w-full h-full" style={{ opacity: animationPhase % 2 === 0 ? 0.6 : 0.2 }}>
              <line x1="33%" y1="0" x2="33%" y2="100%" stroke="hsl(var(--primary))" strokeWidth="1" />
              <line x1="66%" y1="0" x2="66%" y2="100%" stroke="hsl(var(--primary))" strokeWidth="1" />
              <line x1="0" y1="33%" x2="100%" y2="33%" stroke="hsl(var(--primary))" strokeWidth="1" />
              <line x1="0" y1="66%" x2="100%" y2="66%" stroke="hsl(var(--primary))" strokeWidth="1" />
            </svg>
            {/* Subject moving to align */}
            <div 
              className={`absolute w-16 h-24 rounded-lg bg-primary/30 border-2 border-primary transition-all duration-1000 ${
                animationPhase === 0 ? 'top-4 left-4' :
                animationPhase === 1 ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' :
                animationPhase === 2 ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' :
                'bottom-4 right-4'
              }`}
            />
            <Badge className={`absolute bottom-2 right-2 ${animationPhase === 1 || animationPhase === 2 ? 'bg-success' : 'bg-warning'}`}>
              {animationPhase === 1 || animationPhase === 2 ? '✓ Aligned' : 'Align to grid'}
            </Badge>
          </div>
        );

      case 'capture':
        return (
          <div className="relative w-full h-48 bg-secondary/30 rounded-xl overflow-hidden flex items-center justify-center">
            {/* Capture animation */}
            <div className={`relative transition-all duration-500 ${animationPhase === 2 ? 'scale-95' : 'scale-100'}`}>
              <div className="w-32 h-32 rounded-full border-4 border-primary/30 flex items-center justify-center">
                <div 
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                    animationPhase === 2 ? 'bg-primary scale-110' : 'bg-primary/20'
                  }`}
                >
                  <Camera className={`w-10 h-10 ${animationPhase === 2 ? 'text-primary-foreground' : 'text-primary'}`} />
                </div>
              </div>
              {/* Flash effect */}
              {animationPhase === 2 && (
                <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-50" />
              )}
            </div>
            {/* Processing indicator */}
            {animationPhase === 3 && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-sm">Processing...</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'results':
        return (
          <div className="relative w-full h-48 bg-gradient-to-br from-success/10 to-success/5 rounded-xl overflow-hidden flex items-center justify-center">
            <div className="text-center animate-scale-in">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-2" />
              <p className="font-semibold text-success">Ready to Scan!</p>
              <p className="text-sm text-muted-foreground">You've completed the tutorial</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto border-primary/20 shadow-2xl">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                Scanner Tutorial
              </CardTitle>
              <CardDescription className="mt-1">
                Step {currentStep + 1} of {tutorialSteps.length}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mt-4 h-2" />
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Step Title */}
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
            <p className="text-muted-foreground">{step.description}</p>
          </div>

          {/* Animation Demo */}
          <AnimationDemo />

          {/* Visual Content for Tutorial Step */}
          {tutorialVisuals.length > 0 && (
            <div className="mt-4">
              <VisualContentDisplay
                content={tutorialVisuals.filter(v =>
                  v.tags.some(tag => step.title.toLowerCase().includes(tag) || step.id.includes(tag))
                ).slice(0, 1)}
                title="Visual Reference"
                showThumbnails={false}
              />
            </div>
          )}

          {/* Tips, Do's and Don'ts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tips */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1">
                  {step.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-primary">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Do's */}
            <Card className="bg-success/5 border-success/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  Do
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1">
                  {step.doList.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-success">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Don'ts */}
            <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  Don't
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1">
                  {step.dontList.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-destructive">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-1">
            {tutorialSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStep ? 'w-6 bg-primary' : 
                  i < currentStep ? 'bg-success' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardContent>

        <CardFooter className="border-t border-border/50 flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button variant="ghost" onClick={skipTutorial}>
            <SkipForward className="w-4 h-4 mr-2" />
            Skip Tutorial
          </Button>
          
          <Button onClick={nextStep}>
            {isLastStep ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// Quick tip component for use within the scanner
export const QuickTip = ({ 
  tip, 
  onDismiss 
}: { 
  tip: string; 
  onDismiss: () => void;
}) => (
  <div className="absolute bottom-4 left-4 right-4 z-30 animate-fade-in">
    <Card className="bg-primary/10 border-primary/20">
      <CardContent className="p-3 flex items-center gap-3">
        <Lightbulb className="w-5 h-5 text-primary flex-shrink-0" />
        <p className="text-sm flex-1">{tip}</p>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  </div>
);
