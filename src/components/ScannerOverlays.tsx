import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Settings2, X, Ruler, Target, Grid3X3, Eye, Sun, Hand,
  Move, Layers, Ghost, Zap, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  RotateCcw, Smartphone, Volume2, VolumeX, Camera, CheckCircle2
} from 'lucide-react';

// Scanner Settings Interface
export interface ScannerSettings {
  showPositioningGuide: boolean;
  showGrid: boolean;
  showQualityIndicators: boolean;
  showDistanceIndicator: boolean;
  showTiltIndicator: boolean;
  showEdgeDetection: boolean;
  showGhostOverlay: boolean;
  showVirtualRuler: boolean;
  showStepGuide: boolean;
  showObjectDetection: boolean;
  showMeasurementGuides: boolean;
  autoCapture: boolean;
  autoCaptureDelay: number;
  voiceGuidance: boolean;
  hapticFeedback: boolean;
}

export const defaultScannerSettings: ScannerSettings = {
  showPositioningGuide: true,
  showGrid: false,
  showQualityIndicators: false,
  showDistanceIndicator: false,
  showTiltIndicator: false,
  showEdgeDetection: false,
  showGhostOverlay: false,
  showVirtualRuler: false,
  showStepGuide: false,
  showObjectDetection: true,
  showMeasurementGuides: true,
  autoCapture: false,
  autoCaptureDelay: 3,
  voiceGuidance: false,
  hapticFeedback: true,
};

// Settings Panel Component
interface SettingsPanelProps {
  settings: ScannerSettings;
  onSettingsChange: (settings: ScannerSettings) => void;
  onClose: () => void;
}

export const ScannerSettingsPanel = ({ settings, onSettingsChange, onClose }: SettingsPanelProps) => {
  const updateSetting = <K extends keyof ScannerSettings>(key: K, value: ScannerSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const settingsGroups = [
    {
      title: 'Detection & Tracking',
      items: [
        { key: 'showObjectDetection', label: 'Object Detection', desc: 'Auto-detect & track subject', icon: Target },
        { key: 'showMeasurementGuides', label: 'Measurement Guides', desc: 'Rulers along detection edges', icon: Ruler },
        { key: 'showEdgeDetection', label: 'Edge Detection', desc: 'Highlight detected edges', icon: Layers },
      ]
    },
    {
      title: 'Visual Guides',
      items: [
        { key: 'showPositioningGuide', label: 'Positioning Guide', desc: 'Center alignment frame', icon: Target },
        { key: 'showGrid', label: 'Measurement Grid', desc: 'Overlay grid pattern', icon: Grid3X3 },
        { key: 'showVirtualRuler', label: 'Virtual Ruler', desc: 'Measurement scale overlay', icon: Ruler },
        { key: 'showGhostOverlay', label: 'Ghost Overlay', desc: 'Show previous scan position', icon: Ghost },
      ]
    },
    {
      title: 'Quality Feedback',
      items: [
        { key: 'showQualityIndicators', label: 'Quality Indicators', desc: 'Lighting, stability, focus', icon: Eye },
        { key: 'showDistanceIndicator', label: 'Distance Indicator', desc: 'Optimal distance guide', icon: Move },
        { key: 'showTiltIndicator', label: 'Tilt Indicator', desc: 'Device orientation level', icon: Smartphone },
      ]
    },
    {
      title: 'Assistance',
      items: [
        { key: 'showStepGuide', label: 'Step-by-Step Guide', desc: 'Preparation walkthrough', icon: CheckCircle2 },
        { key: 'autoCapture', label: 'Auto-Capture', desc: 'Capture when conditions optimal', icon: Zap },
        { key: 'voiceGuidance', label: 'Voice Guidance', desc: 'Audio instructions', icon: Volume2 },
        { key: 'hapticFeedback', label: 'Haptic Feedback', desc: 'Vibration feedback', icon: Hand },
      ]
    }
  ];

  return (
    <Card className="absolute inset-4 z-50 bg-background/98 backdrop-blur-xl border-primary/20 shadow-2xl overflow-auto animate-scale-in">
      <CardHeader className="pb-2 sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            Scanner Settings
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {settingsGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {group.title}
            </h4>
            <div className="space-y-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isEnabled = settings[item.key as keyof ScannerSettings] as boolean;
                return (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isEnabled ? 'bg-primary/5 border-primary/20' : 'bg-secondary/30 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => updateSetting(item.key as keyof ScannerSettings, checked)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Auto-capture delay slider */}
        {settings.autoCapture && (
          <div className="space-y-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Auto-Capture Delay</span>
              <span className="text-sm font-mono text-primary">{settings.autoCaptureDelay}s</span>
            </div>
            <Slider
              value={[settings.autoCaptureDelay]}
              min={1}
              max={5}
              step={1}
              onValueChange={([v]) => updateSetting('autoCaptureDelay', v)}
            />
          </div>
        )}

        {/* Quick Actions */}
        <Separator />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onSettingsChange(defaultScannerSettings)}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Defaults
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              const allOff = { ...settings };
              Object.keys(allOff).forEach(key => {
                if (typeof allOff[key as keyof ScannerSettings] === 'boolean') {
                  (allOff as any)[key] = false;
                }
              });
              onSettingsChange(allOff);
            }}
          >
            Disable All
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => {
              const allOn = { ...settings };
              Object.keys(allOn).forEach(key => {
                if (typeof allOn[key as keyof ScannerSettings] === 'boolean') {
                  (allOn as any)[key] = true;
                }
              });
              onSettingsChange(allOn);
            }}
          >
            Enable All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Distance Indicator Overlay
interface DistanceIndicatorProps {
  estimatedDistance: number; // in inches
  optimalMin: number;
  optimalMax: number;
  external?: boolean; // When true, renders without absolute positioning
}

export const DistanceIndicator = ({ estimatedDistance, optimalMin = 12, optimalMax = 18, external = false }: DistanceIndicatorProps) => {
  const isOptimal = estimatedDistance >= optimalMin && estimatedDistance <= optimalMax;
  const isTooClose = estimatedDistance < optimalMin;
  const isTooFar = estimatedDistance > optimalMax;

  const content = (
    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/90 backdrop-blur-md border border-border/50 shadow-lg">
      <div className="flex flex-col items-center gap-0.5">
        <ArrowUp className={`w-4 h-4 transition-colors ${isTooClose ? 'text-warning animate-bounce' : 'text-muted-foreground/30'}`} />
        <div className="h-16 w-2 rounded-full bg-muted overflow-hidden relative">
          <div 
            className={`absolute bottom-0 w-full rounded-full transition-all ${
              isOptimal ? 'bg-success' : isTooClose ? 'bg-warning' : 'bg-destructive'
            }`}
            style={{ 
              height: `${Math.min(Math.max((estimatedDistance / 24) * 100, 10), 100)}%`
            }}
          />
          {/* Optimal zone markers */}
          <div 
            className="absolute left-0 right-0 h-px bg-success/50"
            style={{ bottom: `${(optimalMin / 24) * 100}%` }}
          />
          <div 
            className="absolute left-0 right-0 h-px bg-success/50"
            style={{ bottom: `${(optimalMax / 24) * 100}%` }}
          />
        </div>
        <ArrowDown className={`w-4 h-4 transition-colors ${isTooFar ? 'text-destructive animate-bounce' : 'text-muted-foreground/30'}`} />
      </div>
      <span className={`text-[8px] ${isOptimal ? 'text-success' : 'text-warning'}`}>
        {isOptimal ? 'GOOD' : isTooClose ? 'CLOSER' : 'FARTHER'}
      </span>
    </div>
  );

  if (external) {
    return content;
  }

  return (
    <div className="absolute left-2 bottom-24 z-10">
      {content}
    </div>
  );
};

// Tilt Indicator Overlay
interface TiltIndicatorProps {
  tiltX: number; // -180 to 180 degrees
  tiltY: number;
  external?: boolean; // When true, renders without absolute positioning
}

export const TiltIndicator = ({ tiltX, tiltY, external = false }: TiltIndicatorProps) => {
  const isLevel = Math.abs(tiltX) < 5 && Math.abs(tiltY) < 5;

  const content = (
    <div className="p-2 rounded-lg bg-background/90 backdrop-blur-md border border-border/50 shadow-lg">
      <div className="w-12 h-12 rounded-full border-2 border-muted relative overflow-hidden">
        {/* Level lines */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-px bg-primary/20" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-px h-full bg-primary/20" />
        </div>
        {/* Bubble indicator */}
        <div
          className={`absolute w-3 h-3 rounded-full transition-all duration-200 ${
            isLevel ? 'bg-success' : 'bg-warning'
          }`}
          style={{
            left: `calc(50% + ${Math.min(Math.max(tiltX, -20), 20)}% - 6px)`,
            top: `calc(50% + ${Math.min(Math.max(tiltY, -20), 20)}% - 6px)`,
          }}
        />
        {/* Center target */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-4 h-4 rounded-full border-2 ${isLevel ? 'border-success' : 'border-muted'}`} />
        </div>
      </div>
      <span className={`text-[8px] block text-center mt-1 ${isLevel ? 'text-success' : 'text-warning'}`}>
        {isLevel ? 'LEVEL' : 'TILT'}
      </span>
    </div>
  );

  if (external) {
    return content;
  }

  return (
    <div className="absolute right-2 bottom-24 z-10">
      {content}
    </div>
  );
};

// Edge Detection Overlay (simulated)
export const EdgeDetectionOverlay = ({ intensity = 50 }: { intensity?: number }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <filter id="edgeDetect">
            <feConvolveMatrix
              order="3"
              kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1"
              preserveAlpha="true"
            />
          </filter>
        </defs>
        {/* Simulated edge detection pattern */}
        <g stroke="hsl(var(--accent))" strokeWidth="0.3" fill="none" opacity={intensity / 100}>
          {/* Body outline simulation */}
          <ellipse cx="50" cy="45" rx="12" ry="25" />
          <path d="M38 45 Q35 50 38 55" />
          <path d="M62 45 Q65 50 62 55" />
          {/* Additional edge hints */}
          <line x1="45" y1="30" x2="55" y2="30" strokeDasharray="2 2" />
          <line x1="45" y1="60" x2="55" y2="60" strokeDasharray="2 2" />
        </g>
      </svg>
      <Badge 
        variant="outline" 
        className="absolute bottom-2 right-2 text-[10px] bg-background/60 border-accent/30 text-accent"
      >
        Edge Detection Active
      </Badge>
    </div>
  );
};

// Ghost Overlay (previous scan position)
interface GhostOverlayProps {
  previousImage?: string | null;
  opacity?: number;
}

export const GhostOverlay = ({ previousImage, opacity = 30 }: GhostOverlayProps) => {
  if (!previousImage) {
    return (
      <div className="absolute inset-0 pointer-events-none z-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          {/* Ghost silhouette when no previous image */}
          <ellipse 
            cx="50" cy="50" rx="15" ry="30" 
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="0.5" 
            strokeDasharray="3 3"
            opacity={opacity / 100}
          />
          <text x="50" y="90" fontSize="3" fill="hsl(var(--muted-foreground))" textAnchor="middle" opacity="0.5">
            Position to match previous scan
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-5">
      <img 
        src={previousImage} 
        alt="Previous scan position"
        className="w-full h-full object-cover"
        style={{ opacity: opacity / 100, mixBlendMode: 'multiply' }}
      />
      <Badge 
        variant="outline" 
        className="absolute top-2 left-2 text-[10px] bg-background/60"
      >
        <Ghost className="w-3 h-3 mr-1" />
        Ghost: {opacity}%
      </Badge>
    </div>
  );
};

// Virtual Ruler Overlay
export const VirtualRulerOverlay = ({ unitSystem = 'cm' }: { unitSystem?: 'cm' | 'in' }) => {
  const marks = unitSystem === 'cm' ? [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20] : [0, 1, 2, 3, 4, 5, 6, 7, 8];
  
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Vertical ruler on left */}
      <div className="absolute left-1 top-[10%] bottom-[10%] w-6 flex flex-col justify-between">
        {marks.map((mark, i) => (
          <div key={i} className="flex items-center gap-0.5">
            <span className="text-[7px] font-mono text-primary/60 w-3 text-right">{mark}</span>
            <div className={`h-px bg-primary/40 ${i % 2 === 0 ? 'w-2' : 'w-1'}`} />
          </div>
        ))}
      </div>
      
      {/* Horizontal ruler on bottom */}
      <div className="absolute bottom-1 left-[10%] right-[10%] h-6 flex justify-between">
        {marks.map((mark, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div className={`w-px bg-primary/40 ${i % 2 === 0 ? 'h-2' : 'h-1'}`} />
            <span className="text-[7px] font-mono text-primary/60">{mark}</span>
          </div>
        ))}
      </div>
      
      {/* Unit indicator */}
      <Badge variant="outline" className="absolute bottom-1 left-1 text-[8px] px-1 py-0 bg-background/60">
        {unitSystem}
      </Badge>
    </div>
  );
};

// Auto-Capture Indicator
interface AutoCaptureIndicatorProps {
  isReady: boolean;
  countdown: number;
  onCancel: () => void;
}

export const AutoCaptureIndicator = ({ isReady, countdown, onCancel }: AutoCaptureIndicatorProps) => {
  if (!isReady && countdown === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
      {countdown > 0 ? (
        <div className="text-center animate-scale-in">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-primary/20">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="46%"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  strokeDasharray={`${(countdown / 5) * 289} 289`}
                  className="transition-all duration-1000"
                />
              </svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold gradient-text">{countdown}</span>
            </div>
          </div>
          <p className="text-sm font-medium text-primary mt-2">Auto-capturing...</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 pointer-events-auto"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      ) : isReady ? (
        <Badge className="bg-success/90 text-success-foreground animate-pulse">
          <Zap className="w-3 h-3 mr-1" />
          Conditions Optimal - Ready to Capture
        </Badge>
      ) : null}
    </div>
  );
};

// Comprehensive Quality Meter
interface QualityMeterProps {
  lighting: number;
  stability: number;
  focus: number;
  distance: number;
  tilt: number;
}

export const QualityMeter = ({ lighting, stability, focus, distance, tilt }: QualityMeterProps) => {
  const overall = Math.round((lighting + stability + focus + distance + tilt) / 5);
  
  const getColor = (value: number) => {
    if (value >= 80) return 'bg-success';
    if (value >= 50) return 'bg-warning';
    return 'bg-destructive';
  };

  const metrics = [
    { label: 'Light', value: lighting, icon: Sun },
    { label: 'Stable', value: stability, icon: Hand },
    { label: 'Focus', value: focus, icon: Eye },
    { label: 'Distance', value: distance, icon: Move },
    { label: 'Level', value: tilt, icon: Smartphone },
  ];

  return (
    <div className="absolute top-16 left-2 z-20">
      <Card className="bg-background/95 backdrop-blur-md border-border/50 w-32 shadow-lg">
        <CardContent className="p-2 space-y-2">
          {/* Overall score */}
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getColor(overall)} text-white`}>
              {overall}
            </div>
            <div>
              <p className="text-[10px] font-medium">Quality</p>
              <p className="text-[9px] text-muted-foreground">
                {overall >= 80 ? 'Excellent' : overall >= 50 ? 'Fair' : 'Poor'}
              </p>
            </div>
          </div>

          {/* Individual metrics */}
          <div className="space-y-1.5">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="flex items-center gap-2">
                  <Icon className="w-3 h-3 text-muted-foreground" />
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${getColor(metric.value)}`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono w-6 text-right">{metric.value}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
