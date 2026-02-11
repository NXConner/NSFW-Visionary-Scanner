/**
 * Image Enhancement Panel
 * UI for image enhancement controls with before/after comparison
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Sun,
  Contrast,
  Droplets,
  Focus,
  Palette,
  RotateCcw,
  Undo2,
  Redo2,
  Download,
  Eye,
  EyeOff,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useImageEnhancement } from "@/hooks/useImageEnhancement";
import type { EnhancementPreset, NoiseReductionLevel } from "@/lib/imageEnhancement";

export interface ImageEnhancementPanelProps {
  imageSource?: HTMLImageElement | HTMLCanvasElement | ImageData | string;
  onEnhancementApplied?: (imageData: ImageData) => void;
  onExport?: (blob: Blob) => void;
  className?: string;
  compact?: boolean;
}

interface EnhancementControls {
  brightness: number;
  contrast: number;
  exposure: number;
  highlights: number;
  shadows: number;
  saturation: number;
  vibrance: number;
  temperature: number;
  noiseReduction: NoiseReductionLevel;
  sharpening: number;
}

const defaultControls: EnhancementControls = {
  brightness: 0,
  contrast: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  noiseReduction: "none",
  sharpening: 0,
};

const presets: { value: EnhancementPreset; label: string; description: string }[] = [
  { value: "auto", label: "Auto", description: "Intelligent enhancement" },
  { value: "portrait", label: "Portrait", description: "Optimized for skin tones" },
  { value: "medical", label: "Medical", description: "High detail clarity" },
  { value: "detailed", label: "Detailed", description: "Maximum sharpness" },
  { value: "natural", label: "Natural", description: "Subtle improvements" },
  { value: "vivid", label: "Vivid", description: "Enhanced colors" },
];

export function ImageEnhancementPanel({
  imageSource,
  onEnhancementApplied,
  onExport,
  className,
  compact = false,
}: ImageEnhancementPanelProps) {
  const {
    currentImage,
    originalImage,
    analysis,
    isProcessing,
    canUndo,
    canRedo,
    loadImage,
    applyColorCorrection,
    applyNoiseReduction,
    applySharpening,
    applyAutoEnhance,
    undo,
    redo,
    reset,
    exportImage,
    getSuggestions,
    getComparisonData,
  } = useImageEnhancement();

  const [controls, setControls] = useState<EnhancementControls>(defaultControls);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const [activeTab, setActiveTab] = useState("quick");
  const [expandedSection, setExpandedSection] = useState<string | null>("basic");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const comparisonCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load image when source changes
  useEffect(() => {
    if (imageSource) {
      loadImage(imageSource);
    }
  }, [imageSource, loadImage]);

  // Update suggestions when analysis changes
  useEffect(() => {
    const suggestionData = getSuggestions();
    if (suggestionData) {
      setSuggestions(suggestionData.suggestions);
    }
  }, [analysis, getSuggestions]);

  // Render current image to canvas
  useEffect(() => {
    if (currentImage && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = currentImage.width;
      canvas.height = currentImage.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.putImageData(currentImage, 0, 0);
      }
    }
  }, [currentImage]);

  // Render comparison view
  useEffect(() => {
    if (showComparison && comparisonCanvasRef.current && originalImage && currentImage) {
      const canvas = comparisonCanvasRef.current;
      canvas.width = currentImage.width;
      canvas.height = currentImage.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw original on left, enhanced on right
        const splitX = Math.floor(canvas.width * (comparisonPosition / 100));

        // Draw original
        const origCanvas = document.createElement("canvas");
        origCanvas.width = originalImage.width;
        origCanvas.height = originalImage.height;
        const origCtx = origCanvas.getContext("2d")!;
        origCtx.putImageData(originalImage, 0, 0);
        ctx.drawImage(origCanvas, 0, 0, splitX, canvas.height, 0, 0, splitX, canvas.height);

        // Draw enhanced
        const enhCanvas = document.createElement("canvas");
        enhCanvas.width = currentImage.width;
        enhCanvas.height = currentImage.height;
        const enhCtx = enhCanvas.getContext("2d")!;
        enhCtx.putImageData(currentImage, 0, 0);
        ctx.drawImage(
          enhCanvas,
          splitX,
          0,
          canvas.width - splitX,
          canvas.height,
          splitX,
          0,
          canvas.width - splitX,
          canvas.height,
        );

        // Draw split line
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(splitX, 0);
        ctx.lineTo(splitX, canvas.height);
        ctx.stroke();
      }
    }
  }, [showComparison, comparisonPosition, originalImage, currentImage]);

  const handleQuickEnhance = async (preset: EnhancementPreset) => {
    const result = await applyAutoEnhance({ preset, intensity: 50 });
    onEnhancementApplied?.(result.enhancedImage);
  };

  const handleControlChange = async (key: keyof EnhancementControls, value: number | string) => {
    setControls(prev => ({ ...prev, [key]: value }));

    // Apply the change
    if (key === "noiseReduction") {
      await applyNoiseReduction({ level: value as NoiseReductionLevel });
    } else if (key === "sharpening") {
      await applySharpening({ intensity: value as number });
    } else {
      await applyColorCorrection({ [key]: value as number });
    }

    if (currentImage) {
      onEnhancementApplied?.(currentImage);
    }
  };

  const handleExport = async () => {
    const blob = await exportImage("png");
    onExport?.(blob);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const qualityCategory = analysis?.overall.category || "unknown";
  const qualityScore = analysis?.overall.quality || 0;

  return (
    <div className={cn("bg-background rounded-lg border p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Image Enhancement</h3>
          {isProcessing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo || isProcessing}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo || isProcessing}>
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={reset}
            disabled={!originalImage || isProcessing}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quality Indicator */}
      {analysis && (
        <div className="mb-4 p-3 rounded-md bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Image Quality</span>
            <Badge
              variant={
                qualityCategory === "excellent"
                  ? "default"
                  : qualityCategory === "good"
                    ? "secondary"
                    : "outline"
              }
            >
              {qualityCategory.charAt(0).toUpperCase() + qualityCategory.slice(1)}
            </Badge>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                qualityScore >= 80
                  ? "bg-green-500"
                  : qualityScore >= 60
                    ? "bg-yellow-500"
                    : qualityScore >= 40
                      ? "bg-orange-500"
                      : "bg-red-500",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${qualityScore}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{Math.round(qualityScore)}%</span>
            <span>{analysis.sharpness.current.toFixed(0)}% sharpness</span>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Suggestions</span>
          </div>
          <div className="space-y-1">
            {suggestions.slice(0, 3).map((suggestion, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {showComparison ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <Label htmlFor="comparison-toggle" className="text-sm">
            Before/After
          </Label>
        </div>
        <Switch
          id="comparison-toggle"
          checked={showComparison}
          onCheckedChange={setShowComparison}
        />
      </div>

      {/* Comparison Slider */}
      <AnimatePresence>
        {showComparison && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 overflow-hidden"
          >
            <canvas
              ref={comparisonCanvasRef}
              className="w-full h-40 object-contain rounded-md bg-black/10"
            />
            <Slider
              value={[comparisonPosition]}
              onValueChange={([val]) => setComparisonPosition(val)}
              min={0}
              max={100}
              step={1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Original</span>
              <span>Enhanced</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quick">Quick</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Quick Enhancement */}
        <TabsContent value="quick" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-2">
            {presets.map(preset => (
              <Button
                key={preset.value}
                variant="outline"
                size="sm"
                className="flex flex-col h-auto py-2"
                onClick={() => handleQuickEnhance(preset.value)}
                disabled={isProcessing || !currentImage}
              >
                <span className="text-xs font-medium">{preset.label}</span>
                <span className="text-[10px] text-muted-foreground">{preset.description}</span>
              </Button>
            ))}
          </div>
        </TabsContent>

        {/* Advanced Controls */}
        <TabsContent value="advanced" className="space-y-2 mt-4">
          {/* Basic Adjustments */}
          <div className="border rounded-md">
            <button
              className="w-full flex items-center justify-between p-3 text-sm font-medium"
              onClick={() => toggleSection("basic")}
            >
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <span>Basic Adjustments</span>
              </div>
              {expandedSection === "basic" ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <AnimatePresence>
              {expandedSection === "basic" && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">Brightness</Label>
                        <span className="text-xs text-muted-foreground">{controls.brightness}</span>
                      </div>
                      <Slider
                        value={[controls.brightness]}
                        onValueChange={([val]) => handleControlChange("brightness", val)}
                        min={-100}
                        max={100}
                        step={1}
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">Contrast</Label>
                        <span className="text-xs text-muted-foreground">{controls.contrast}</span>
                      </div>
                      <Slider
                        value={[controls.contrast]}
                        onValueChange={([val]) => handleControlChange("contrast", val)}
                        min={-100}
                        max={100}
                        step={1}
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">Exposure</Label>
                        <span className="text-xs text-muted-foreground">{controls.exposure}</span>
                      </div>
                      <Slider
                        value={[controls.exposure]}
                        onValueChange={([val]) => handleControlChange("exposure", val)}
                        min={-100}
                        max={100}
                        step={1}
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Color Adjustments */}
          <div className="border rounded-md">
            <button
              className="w-full flex items-center justify-between p-3 text-sm font-medium"
              onClick={() => toggleSection("color")}
            >
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span>Color</span>
              </div>
              {expandedSection === "color" ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <AnimatePresence>
              {expandedSection === "color" && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">Saturation</Label>
                        <span className="text-xs text-muted-foreground">{controls.saturation}</span>
                      </div>
                      <Slider
                        value={[controls.saturation]}
                        onValueChange={([val]) => handleControlChange("saturation", val)}
                        min={-100}
                        max={100}
                        step={1}
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">Vibrance</Label>
                        <span className="text-xs text-muted-foreground">{controls.vibrance}</span>
                      </div>
                      <Slider
                        value={[controls.vibrance]}
                        onValueChange={([val]) => handleControlChange("vibrance", val)}
                        min={-100}
                        max={100}
                        step={1}
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">Temperature</Label>
                        <span className="text-xs text-muted-foreground">
                          {controls.temperature}
                        </span>
                      </div>
                      <Slider
                        value={[controls.temperature]}
                        onValueChange={([val]) => handleControlChange("temperature", val)}
                        min={-100}
                        max={100}
                        step={1}
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Detail Adjustments */}
          <div className="border rounded-md">
            <button
              className="w-full flex items-center justify-between p-3 text-sm font-medium"
              onClick={() => toggleSection("detail")}
            >
              <div className="flex items-center gap-2">
                <Focus className="h-4 w-4" />
                <span>Detail</span>
              </div>
              {expandedSection === "detail" ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <AnimatePresence>
              {expandedSection === "detail" && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Noise Reduction</Label>
                      <Select
                        value={controls.noiseReduction}
                        onValueChange={val => handleControlChange("noiseReduction", val)}
                        disabled={isProcessing}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="heavy">Heavy</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">Sharpening</Label>
                        <span className="text-xs text-muted-foreground">
                          {controls.sharpening}%
                        </span>
                      </div>
                      <Slider
                        value={[controls.sharpening]}
                        onValueChange={([val]) => handleControlChange("sharpening", val)}
                        min={0}
                        max={100}
                        step={1}
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Button */}
      <div className="mt-4">
        <Button className="w-full" onClick={handleExport} disabled={!currentImage || isProcessing}>
          <Download className="h-4 w-4 mr-2" />
          Export Enhanced Image
        </Button>
      </div>
    </div>
  );
}

export default ImageEnhancementPanel;
