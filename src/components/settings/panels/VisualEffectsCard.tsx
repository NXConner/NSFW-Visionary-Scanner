/**
 * Visual Effects Settings Card
 *
 * Provides controls for 5 image filters with real-time preview
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette, RotateCcw, Info } from "lucide-react";
import { toast } from "sonner";
import type { VisualEffectsFilterKey, VisualEffectsSettings } from "@/lib/visualEffectsSettings";
import { defaultSettings, loadSettings, saveSettings } from "@/lib/visualEffectsSettings";

// ============================================
// Component
// ============================================

export function VisualEffectsCard() {
  const [settings, setSettings] = useState<VisualEffectsSettings>(loadSettings);

  const updateSettings = (newSettings: VisualEffectsSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const resetFilter = (filterKey: VisualEffectsFilterKey) => {
    const newSettings = {
      ...settings,
      [filterKey]: defaultSettings[filterKey],
    };
    updateSettings(newSettings);
    toast.success(`${filterKey} reset to defaults`);
  };

  const resetAll = () => {
    updateSettings(defaultSettings);
    toast.success("All filters reset to defaults");
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" />
            <CardTitle>Visual Effects</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={resetAll}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset All
          </Button>
        </div>
        <CardDescription>
          Apply artistic filters to captured images and/or images rendered throughout the UI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <Label className="text-sm font-medium">Apply to</Label>
          <Select
            value={settings.scope}
            onValueChange={value => {
              updateSettings({
                ...settings,
                scope: value as VisualEffectsSettings["scope"],
              });
              toast.success("Visual effects scope updated");
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="capture">Camera/Scanner capture only</SelectItem>
              <SelectItem value="ui">UI images only</SelectItem>
              <SelectItem value="both">Capture + UI images</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Tip: set to <span className="font-medium">Capture + UI</span> to see filters across
            progress photos and other image views without re-capturing.
          </p>
        </div>

        <Tabs defaultValue="celShading" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="celShading">Cel</TabsTrigger>
            <TabsTrigger value="graphicNovel">Comic</TabsTrigger>
            <TabsTrigger value="conceptArt">Sketch</TabsTrigger>
            <TabsTrigger value="inkedConceptArt">Ink</TabsTrigger>
            <TabsTrigger value="sobel">Edges</TabsTrigger>
          </TabsList>

          {/* Cel-Shading Filter */}
          <TabsContent value="celShading" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="celShading-enabled" className="text-sm font-medium">
                Enable Cel-Shading
              </Label>
              <Switch
                id="celShading-enabled"
                checked={settings.celShading.enabled}
                onCheckedChange={checked => {
                  updateSettings({
                    ...settings,
                    celShading: { ...settings.celShading, enabled: checked },
                  });
                }}
              />
            </div>

            <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Color Levels</Label>
                  <span className="text-xs text-muted-foreground">
                    {settings.celShading.options.levels}
                  </span>
                </div>
                <Slider
                  value={[settings.celShading.options.levels || 4]}
                  onValueChange={([value]) => {
                    updateSettings({
                      ...settings,
                      celShading: {
                        ...settings.celShading,
                        options: { ...settings.celShading.options, levels: value },
                      },
                    });
                  }}
                  min={2}
                  max={8}
                  step={1}
                  disabled={!settings.celShading.enabled}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Edge Threshold</Label>
                  <span className="text-xs text-muted-foreground">
                    {settings.celShading.options.edgeThreshold?.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[settings.celShading.options.edgeThreshold || 0.3]}
                  onValueChange={([value]) => {
                    updateSettings({
                      ...settings,
                      celShading: {
                        ...settings.celShading,
                        options: { ...settings.celShading.options, edgeThreshold: value },
                      },
                    });
                  }}
                  min={0}
                  max={1}
                  step={0.05}
                  disabled={!settings.celShading.enabled}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => resetFilter("celShading")}
                className="w-full"
              >
                <RotateCcw className="w-3 h-3 mr-2" />
                Reset
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Cel-shading creates an anime/cartoon style with flat colors and bold outlines.
              </p>
            </div>
          </TabsContent>

          {/* Graphic Novel Filter */}
          <TabsContent value="graphicNovel" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="graphicNovel-enabled" className="text-sm font-medium">
                Enable Graphic Novel
              </Label>
              <Switch
                id="graphicNovel-enabled"
                checked={settings.graphicNovel.enabled}
                onCheckedChange={checked => {
                  updateSettings({
                    ...settings,
                    graphicNovel: { ...settings.graphicNovel, enabled: checked },
                  });
                }}
              />
            </div>

            <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Contrast</Label>
                  <span className="text-xs text-muted-foreground">
                    {settings.graphicNovel.options.contrast?.toFixed(1)}x
                  </span>
                </div>
                <Slider
                  value={[settings.graphicNovel.options.contrast || 1.5]}
                  onValueChange={([value]) => {
                    updateSettings({
                      ...settings,
                      graphicNovel: {
                        ...settings.graphicNovel,
                        options: { ...settings.graphicNovel.options, contrast: value },
                      },
                    });
                  }}
                  min={0}
                  max={2}
                  step={0.1}
                  disabled={!settings.graphicNovel.enabled}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Saturation</Label>
                  <span className="text-xs text-muted-foreground">
                    {settings.graphicNovel.options.saturation?.toFixed(1)}x
                  </span>
                </div>
                <Slider
                  value={[settings.graphicNovel.options.saturation || 1.2]}
                  onValueChange={([value]) => {
                    updateSettings({
                      ...settings,
                      graphicNovel: {
                        ...settings.graphicNovel,
                        options: { ...settings.graphicNovel.options, saturation: value },
                      },
                    });
                  }}
                  min={0}
                  max={2}
                  step={0.1}
                  disabled={!settings.graphicNovel.enabled}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Halftone</Label>
                  <span className="text-xs text-muted-foreground">
                    {settings.graphicNovel.options.halftone?.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[settings.graphicNovel.options.halftone || 0.3]}
                  onValueChange={([value]) => {
                    updateSettings({
                      ...settings,
                      graphicNovel: {
                        ...settings.graphicNovel,
                        options: { ...settings.graphicNovel.options, halftone: value },
                      },
                    });
                  }}
                  min={0}
                  max={1}
                  step={0.05}
                  disabled={!settings.graphicNovel.enabled}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => resetFilter("graphicNovel")}
                className="w-full"
              >
                <RotateCcw className="w-3 h-3 mr-2" />
                Reset
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Graphic Novel style with high contrast and halftone patterns for a comic book look.
              </p>
            </div>
          </TabsContent>

          {/* Concept Art Filter */}
          <TabsContent value="conceptArt" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="conceptArt-enabled" className="text-sm font-medium">
                Enable Concept Art
              </Label>
              <Switch
                id="conceptArt-enabled"
                checked={settings.conceptArt.enabled}
                onCheckedChange={checked => {
                  updateSettings({
                    ...settings,
                    conceptArt: { ...settings.conceptArt, enabled: checked },
                  });
                }}
              />
            </div>

            <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Sketch Intensity</Label>
                  <span className="text-xs text-muted-foreground">
                    {settings.conceptArt.options.sketch?.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[settings.conceptArt.options.sketch || 0.5]}
                  onValueChange={([value]) => {
                    updateSettings({
                      ...settings,
                      conceptArt: {
                        ...settings.conceptArt,
                        options: { ...settings.conceptArt.options, sketch: value },
                      },
                    });
                  }}
                  min={0}
                  max={1}
                  step={0.05}
                  disabled={!settings.conceptArt.enabled}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Color Wash</Label>
                  <span className="text-xs text-muted-foreground">
                    {settings.conceptArt.options.colorWash?.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[settings.conceptArt.options.colorWash || 0.4]}
                  onValueChange={([value]) => {
                    updateSettings({
                      ...settings,
                      conceptArt: {
                        ...settings.conceptArt,
                        options: { ...settings.conceptArt.options, colorWash: value },
                      },
                    });
                  }}
                  min={0}
                  max={1}
                  step={0.05}
                  disabled={!settings.conceptArt.enabled}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Vignette</Label>
                  <span className="text-xs text-muted-foreground">
                    {settings.conceptArt.options.vignette?.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[settings.conceptArt.options.vignette || 0.3]}
                  onValueChange={([value]) => {
                    updateSettings({
                      ...settings,
                      conceptArt: {
                        ...settings.conceptArt,
                        options: { ...settings.conceptArt.options, vignette: value },
                      },
                    });
                  }}
                  min={0}
                  max={1}
                  step={0.05}
                  disabled={!settings.conceptArt.enabled}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => resetFilter("conceptArt")}
                className="w-full"
              >
                <RotateCcw className="w-3 h-3 mr-2" />
                Reset
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Concept Art style with artistic sketch lines and soft color overlay.
              </p>
            </div>
          </TabsContent>

          {/* Inked Concept Art Filter */}
          <TabsContent value="inkedConceptArt" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="inkedConceptArt-enabled" className="text-sm font-medium">
                Enable Inked Concept Art
              </Label>
              <Switch
                id="inkedConceptArt-enabled"
                checked={settings.inkedConceptArt.enabled}
                onCheckedChange={checked => {
                  updateSettings({
                    ...settings,
                    inkedConceptArt: { ...settings.inkedConceptArt, enabled: checked },
                  });
                }}
              />
            </div>

            <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Ink Thickness</Label>
                  <span className="text-xs text-muted-foreground">
                    {settings.inkedConceptArt.options.inkThickness}px
                  </span>
                </div>
                <Slider
                  value={[settings.inkedConceptArt.options.inkThickness || 2]}
                  onValueChange={([value]) => {
                    updateSettings({
                      ...settings,
                      inkedConceptArt: {
                        ...settings.inkedConceptArt,
                        options: { ...settings.inkedConceptArt.options, inkThickness: value },
                      },
                    });
                  }}
                  min={1}
                  max={5}
                  step={0.5}
                  disabled={!settings.inkedConceptArt.enabled}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Paper Texture</Label>
                  <span className="text-xs text-muted-foreground">
                    {settings.inkedConceptArt.options.paperTexture?.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[settings.inkedConceptArt.options.paperTexture || 0.2]}
                  onValueChange={([value]) => {
                    updateSettings({
                      ...settings,
                      inkedConceptArt: {
                        ...settings.inkedConceptArt,
                        options: { ...settings.inkedConceptArt.options, paperTexture: value },
                      },
                    });
                  }}
                  min={0}
                  max={1}
                  step={0.05}
                  disabled={!settings.inkedConceptArt.enabled}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => resetFilter("inkedConceptArt")}
                className="w-full"
              >
                <RotateCcw className="w-3 h-3 mr-2" />
                Reset
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Inked style with strong black lines on textured paper background.
              </p>
            </div>
          </TabsContent>

          {/* Sobel Filter */}
          <TabsContent value="sobel" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sobel-enabled" className="text-sm font-medium">
                Enable Sobel Edge Detection
              </Label>
              <Switch
                id="sobel-enabled"
                checked={settings.sobel.enabled}
                onCheckedChange={checked => {
                  updateSettings({
                    ...settings,
                    sobel: { ...settings.sobel, enabled: checked },
                  });
                }}
              />
            </div>

            <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Edge Threshold</Label>
                  <span className="text-xs text-muted-foreground">
                    {settings.sobel.options.threshold}
                  </span>
                </div>
                <Slider
                  value={[settings.sobel.options.threshold || 50]}
                  onValueChange={([value]) => {
                    updateSettings({
                      ...settings,
                      sobel: {
                        ...settings.sobel,
                        options: { ...settings.sobel.options, threshold: value },
                      },
                    });
                  }}
                  min={0}
                  max={255}
                  step={5}
                  disabled={!settings.sobel.enabled}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Pre-blur</Label>
                  <span className="text-xs text-muted-foreground">
                    {settings.sobel.options.blur}px
                  </span>
                </div>
                <Slider
                  value={[settings.sobel.options.blur || 0]}
                  onValueChange={([value]) => {
                    updateSettings({
                      ...settings,
                      sobel: {
                        ...settings.sobel,
                        options: { ...settings.sobel.options, blur: value },
                      },
                    });
                  }}
                  min={0}
                  max={10}
                  step={1}
                  disabled={!settings.sobel.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sobel-invert" className="text-sm">
                  Invert Colors
                </Label>
                <Switch
                  id="sobel-invert"
                  checked={settings.sobel.options.invert || false}
                  onCheckedChange={checked => {
                    updateSettings({
                      ...settings,
                      sobel: {
                        ...settings.sobel,
                        options: { ...settings.sobel.options, invert: checked },
                      },
                    });
                  }}
                  disabled={!settings.sobel.enabled}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => resetFilter("sobel")}
                className="w-full"
              >
                <RotateCcw className="w-3 h-3 mr-2" />
                Reset
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Sobel edge detection creates a black and white outline drawing.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
