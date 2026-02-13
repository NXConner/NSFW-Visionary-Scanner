/**
 * Photo Editor Tab
 * Photo editing with filters, annotations, and AI enhancement
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Crop,
  Download,
  FlipHorizontal,
  ImageIcon,
  Layers,
  Maximize2,
  Minus,
  Move,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Save,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Type,
  Upload,
  Wand2,
  ZoomIn,
  ZoomOut,
  Focus,
  Film,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { FilterType } from "@/lib/imageFilters";

// New panels
import { CropRotatePanel, type CropRotateState } from "./CropRotatePanel";
import { ColorGradingPanel, type ColorGradingState, defaultColorGrading } from "./ColorGradingPanel";
import { BlurFocusPanel, type BlurFocusState, defaultBlurFocus } from "./BlurFocusPanel";
import { OverlaysPanel, type OverlayState, defaultOverlays } from "./OverlaysPanel";
import { PresetsFiltersPanel, type PresetState, defaultPresetState } from "./PresetsFiltersPanel";
import { AIEnhancementPanel, type AIEnhancementState, defaultAIEnhancement } from "./AIEnhancementPanel";

interface FilterConfig {
  key: FilterType;
  label: string;
  description: string;
  icon: React.ReactNode;
  options: Record<string, { label: string; min: number; max: number; step: number; default: number }>;
}

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: "celShading",
    label: "Cel Shading",
    description: "Anime/cartoon style with posterized colors",
    icon: <Sparkles className="w-4 h-4" />,
    options: {
      levels: { label: "Color Levels", min: 2, max: 8, step: 1, default: 4 },
      edgeThreshold: { label: "Edge Threshold", min: 0.1, max: 1, step: 0.1, default: 0.3 },
    },
  },
  {
    key: "graphicNovel",
    label: "Graphic Novel",
    description: "High contrast comic book style",
    icon: <Layers className="w-4 h-4" />,
    options: {
      contrast: { label: "Contrast", min: 0.5, max: 2, step: 0.1, default: 1.5 },
      saturation: { label: "Saturation", min: 0.5, max: 2, step: 0.1, default: 1.2 },
      halftone: { label: "Halftone", min: 0, max: 1, step: 0.1, default: 0.3 },
    },
  },
  {
    key: "conceptArt",
    label: "Concept Art",
    description: "Artistic sketch with color wash",
    icon: <Pencil className="w-4 h-4" />,
    options: {
      sketch: { label: "Sketch Intensity", min: 0, max: 1, step: 0.1, default: 0.5 },
      colorWash: { label: "Color Wash", min: 0, max: 1, step: 0.1, default: 0.4 },
      vignette: { label: "Vignette", min: 0, max: 1, step: 0.1, default: 0.3 },
    },
  },
  {
    key: "inkedConceptArt",
    label: "Inked Art",
    description: "Strong ink lines with paper texture",
    icon: <Pencil className="w-4 h-4" />,
    options: {
      inkThickness: { label: "Ink Thickness", min: 1, max: 5, step: 0.5, default: 2 },
      paperTexture: { label: "Paper Texture", min: 0, max: 1, step: 0.1, default: 0.2 },
    },
  },
  {
    key: "sobel",
    label: "Edge Detection",
    description: "Sobel edge detection filter",
    icon: <Wand2 className="w-4 h-4" />,
    options: {
      threshold: { label: "Threshold", min: 10, max: 200, step: 10, default: 50 },
      blur: { label: "Pre-Blur", min: 0, max: 10, step: 1, default: 0 },
    },
  },
];

export function PhotoEditorTab() {
  const [activeTab, setActiveTab] = useState("edit");
  const [hasImage, setHasImage] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [filteredSrc, setFilteredSrc] = useState<string | null>(null);
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [saturation, setSaturation] = useState([100]);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState([100]);
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [filterOptions, setFilterOptions] = useState<Record<string, number>>({});
  const [applyingFilter, setApplyingFilter] = useState(false);

  // New panel states
  const [cropState, setCropState] = useState<CropRotateState>({
    rotation: 0,
    flipH: false,
    flipV: false,
    aspectRatio: null,
    cropRect: null,
  });
  const [colorGrading, setColorGrading] = useState<ColorGradingState>(defaultColorGrading);
  const [blurFocus, setBlurFocus] = useState<BlurFocusState>(defaultBlurFocus);
  const [overlays, setOverlays] = useState<OverlayState>(defaultOverlays);
  const [presetState, setPresetState] = useState<PresetState>(defaultPresetState);
  const [aiEnhancement, setAIEnhancement] = useState<AIEnhancementState>(defaultAIEnhancement);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageSrc(dataUrl);
      setFilteredSrc(null);
      setHasImage(true);
      setActiveFilter(null);
      toast.success("Image loaded");
    };
    reader.onerror = () => toast.error("Failed to load image");
    reader.readAsDataURL(file);
  }, []);

  const handleReset = useCallback(() => {
    setBrightness([100]);
    setContrast([100]);
    setSaturation([100]);
    setRotation(0);
    setZoom([100]);
    setActiveFilter(null);
    setFilteredSrc(null);
    setFilterOptions({});
  }, []);

  const applySelectedFilter = useCallback(async () => {
    if (!imageSrc || !activeFilter) return;
    
    setApplyingFilter(true);
    try {
      const { applyFilterToImage } = await import("@/lib/imageFilters");
      
      // Load image
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageSrc;
      });
      
      // Apply filter with current options
      const config = FILTER_CONFIGS.find(f => f.key === activeFilter);
      const opts: Record<string, number> = {};
      if (config) {
        for (const [key, def] of Object.entries(config.options)) {
          opts[key] = filterOptions[key] ?? def.default;
        }
      }
      
      const result = applyFilterToImage(img, activeFilter, opts);
      setFilteredSrc(result);
    } catch (err) {
      console.error("Filter error:", err);
      toast.error("Failed to apply filter");
    } finally {
      setApplyingFilter(false);
    }
  }, [imageSrc, activeFilter, filterOptions]);

  // Auto-apply filter when options change
  useEffect(() => {
    if (activeFilter && imageSrc) {
      const timeout = setTimeout(() => {
        void applySelectedFilter();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [activeFilter, filterOptions, applySelectedFilter, imageSrc]);

  const handleDownload = useCallback(() => {
    const src = filteredSrc || imageSrc;
    if (!src) return;
    
    const link = document.createElement("a");
    link.href = src;
    link.download = `edited-photo-${Date.now()}.jpg`;
    link.click();
    toast.success("Image downloaded");
  }, [filteredSrc, imageSrc]);

  const handleSelectFilter = useCallback((filterKey: FilterType) => {
    if (activeFilter === filterKey) {
      setActiveFilter(null);
      setFilteredSrc(null);
      setFilterOptions({});
    } else {
      setActiveFilter(filterKey);
      // Reset to defaults for new filter
      const config = FILTER_CONFIGS.find(f => f.key === filterKey);
      if (config) {
        const defaults: Record<string, number> = {};
        for (const [key, def] of Object.entries(config.options)) {
          defaults[key] = def.default;
        }
        setFilterOptions(defaults);
      }
    }
  }, [activeFilter]);

  const displaySrc = filteredSrc || imageSrc;
  const activeConfig = FILTER_CONFIGS.find(f => f.key === activeFilter);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-6 h-6" />
          Photo Editor
        </CardTitle>
        <CardDescription>
          Edit, filter, and enhance your progress photos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Editor Canvas */}
          <div className="lg:col-span-2 space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              className="aspect-video bg-muted/30 rounded-lg border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden"
            >
              {hasImage && displaySrc ? (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    transform: `rotate(${rotation}deg) scale(${zoom[0] / 100})`,
                    transition: "transform 0.2s",
                  }}
                >
                  <img
                    src={displaySrc}
                    alt="Editing"
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: !filteredSrc
                        ? `brightness(${brightness[0]}%) contrast(${contrast[0]}%) saturate(${saturation[0]}%)`
                        : undefined,
                    }}
                  />
                  {applyingFilter && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Drop an image here or click to upload
                  </p>
                  <Button onClick={handleUpload} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Upload Photo
                  </Button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {hasImage && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation(r => r - 90)}
                  className="gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  Rotate Left
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation(r => r + 90)}
                  className="gap-1"
                >
                  <RotateCw className="w-4 h-4" />
                  Rotate Right
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
                  <FlipHorizontal className="w-4 h-4" />
                  Flip
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
                  <Crop className="w-4 h-4" />
                  Crop
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset} className="gap-1">
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </Button>
                <div className="flex-1" />
                <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button size="sm" className="gap-1">
                  <Save className="w-4 h-4" />
                  Save
                </Button>
              </div>
            )}
          </div>

          {/* Tools Panel */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="edit" className="text-[10px] px-1">
                  <SlidersHorizontal className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="crop" className="text-[10px] px-1">
                  <Crop className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="color" className="text-[10px] px-1">
                  <Palette className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="blur" className="text-[10px] px-1">
                  <Focus className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="overlays" className="text-[10px] px-1">
                  <Film className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="filters" className="text-[10px] px-1">
                  <Sparkles className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="ai" className="text-[10px] px-1">
                  <Wand2 className="w-3 h-3" />
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[400px] mt-4">
                <TabsContent value="edit" className="space-y-4 mt-0">
                  {/* Brightness */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        Brightness
                      </Label>
                      <span className="text-sm text-muted-foreground">{brightness[0]}%</span>
                    </div>
                    <Slider
                      value={brightness}
                      onValueChange={setBrightness}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  {/* Contrast */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Contrast
                      </Label>
                      <span className="text-sm text-muted-foreground">{contrast[0]}%</span>
                    </div>
                    <Slider
                      value={contrast}
                      onValueChange={setContrast}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  {/* Saturation */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Saturation</Label>
                      <span className="text-sm text-muted-foreground">{saturation[0]}%</span>
                    </div>
                    <Slider
                      value={saturation}
                      onValueChange={setSaturation}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  {/* Zoom */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="flex items-center gap-2">
                        <Maximize2 className="w-4 h-4" />
                        Zoom
                      </Label>
                      <span className="text-sm text-muted-foreground">{zoom[0]}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setZoom([Math.max(10, zoom[0] - 10)])}
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <Slider
                        value={zoom}
                        onValueChange={setZoom}
                        min={10}
                        max={300}
                        step={1}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setZoom([Math.min(300, zoom[0] + 10)])}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Presets */}
                  <PresetsFiltersPanel
                    state={presetState}
                    onChange={setPresetState}
                  />
                </TabsContent>

                <TabsContent value="crop" className="mt-0">
                  <CropRotatePanel
                    state={cropState}
                    onChange={setCropState}
                  />
                </TabsContent>

                <TabsContent value="color" className="mt-0">
                  <ColorGradingPanel
                    state={colorGrading}
                    onChange={setColorGrading}
                  />
                </TabsContent>

                <TabsContent value="blur" className="mt-0">
                  <BlurFocusPanel
                    state={blurFocus}
                    onChange={setBlurFocus}
                  />
                </TabsContent>

                <TabsContent value="overlays" className="mt-0">
                  <OverlaysPanel
                    state={overlays}
                    onChange={setOverlays}
                  />
                </TabsContent>

                <TabsContent value="filters" className="space-y-4 mt-0">
                  {!hasImage ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Palette className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Upload an image to apply filters</p>
                    </div>
                  ) : (
                    <>
                      {/* Filter Selection */}
                      <div className="grid grid-cols-2 gap-2">
                        {FILTER_CONFIGS.map(filter => (
                          <Button
                            key={filter.key}
                            variant={activeFilter === filter.key ? "default" : "outline"}
                            className="h-auto py-3 flex-col gap-1"
                            onClick={() => handleSelectFilter(filter.key)}
                            disabled={applyingFilter}
                          >
                            {filter.icon}
                            <span className="text-xs">{filter.label}</span>
                          </Button>
                        ))}
                      </div>

                      {/* Filter Options */}
                      {activeConfig && (
                        <div className="space-y-3 pt-3 border-t border-border">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">{activeConfig.label} Options</Label>
                            <Badge variant="secondary" className="text-xs">
                              {applyingFilter ? "Processing..." : "Live Preview"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{activeConfig.description}</p>
                          
                          {Object.entries(activeConfig.options).map(([key, opt]) => (
                            <div key={key} className="space-y-2">
                              <div className="flex justify-between">
                                <Label className="text-xs">{opt.label}</Label>
                                <span className="text-xs text-muted-foreground">
                                  {(filterOptions[key] ?? opt.default).toFixed(1)}
                                </span>
                              </div>
                              <Slider
                                value={[filterOptions[key] ?? opt.default]}
                                onValueChange={([v]) => setFilterOptions(prev => ({ ...prev, [key]: v }))}
                                min={opt.min}
                                max={opt.max}
                                step={opt.step}
                              />
                            </div>
                          ))}

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setActiveFilter(null);
                              setFilteredSrc(null);
                              setFilterOptions({});
                            }}
                          >
                            <RefreshCw className="w-3 h-3 mr-2" />
                            Remove Filter
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="ai" className="mt-0">
                  <AIEnhancementPanel
                    state={aiEnhancement}
                    onChange={setAIEnhancement}
                    isProcessing={applyingFilter}
                    onApply={() => toast.info("AI enhancement would be applied")}
                  />
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PhotoEditorTab;
