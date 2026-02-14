/**
 * Visual Effects Settings Card
 *
 * Provides controls for multiple image filters with real-time preview integration.
 */

import React from "react";
import { Palette, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { VisualEffectsFilterKey, VisualEffectsScope } from "@/lib/visualEffectsSettings";

import { FilterTab } from "./FilterTab";
import { ColorRow, SliderRow, SwitchRow } from "./controls";
import { useVisualEffectsSettings } from "./useVisualEffectsSettings";

export function VisualEffectsCard(): JSX.Element {
  const { settings, setScope, setFilterEnabled, setFilterOptions, resetFilter, resetAll } =
    useVisualEffectsSettings();

  const scopeValue = settings.scope;

  const setEnabled = (key: VisualEffectsFilterKey) => (enabled: boolean) =>
    setFilterEnabled(key, enabled);

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
          <Select value={scopeValue} onValueChange={v => setScope(v as VisualEffectsScope)}>
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

          <TabsContent value="celShading">
            <FilterTab
              id="celShading"
              title="Enable Cel-Shading"
              enabled={settings.celShading.enabled}
              onEnabledChange={setEnabled("celShading")}
              onReset={() => resetFilter("celShading")}
              infoText="Cel-shading creates an anime/cartoon style with flat colors and bold outlines."
            >
              <SliderRow
                label="Color Levels"
                value={settings.celShading.options.levels || 4}
                displayValue={String(settings.celShading.options.levels || 4)}
                min={2}
                max={8}
                step={1}
                disabled={!settings.celShading.enabled}
                onChange={v => setFilterOptions("celShading", prev => ({ ...prev, levels: v }))}
              />
              <SliderRow
                label="Edge Threshold"
                value={settings.celShading.options.edgeThreshold || 0.3}
                displayValue={(settings.celShading.options.edgeThreshold ?? 0.3).toFixed(2)}
                min={0}
                max={1}
                step={0.05}
                disabled={!settings.celShading.enabled}
                onChange={v =>
                  setFilterOptions("celShading", prev => ({ ...prev, edgeThreshold: v }))
                }
              />
              <ColorRow
                label="Edge Color"
                value={settings.celShading.options.edgeColor || "#000000"}
                disabled={!settings.celShading.enabled}
                onChange={hex =>
                  setFilterOptions("celShading", prev => ({ ...prev, edgeColor: hex }))
                }
              />
            </FilterTab>
          </TabsContent>

          <TabsContent value="graphicNovel">
            <FilterTab
              id="graphicNovel"
              title="Enable Graphic Novel"
              enabled={settings.graphicNovel.enabled}
              onEnabledChange={setEnabled("graphicNovel")}
              onReset={() => resetFilter("graphicNovel")}
              infoText="Graphic Novel style with high contrast and halftone patterns for a comic book look."
            >
              <SliderRow
                label="Contrast"
                value={settings.graphicNovel.options.contrast || 1.5}
                displayValue={`${(settings.graphicNovel.options.contrast ?? 1.5).toFixed(1)}x`}
                min={0}
                max={2}
                step={0.1}
                disabled={!settings.graphicNovel.enabled}
                onChange={v => setFilterOptions("graphicNovel", prev => ({ ...prev, contrast: v }))}
              />
              <SliderRow
                label="Saturation"
                value={settings.graphicNovel.options.saturation || 1.2}
                displayValue={`${(settings.graphicNovel.options.saturation ?? 1.2).toFixed(1)}x`}
                min={0}
                max={2}
                step={0.1}
                disabled={!settings.graphicNovel.enabled}
                onChange={v =>
                  setFilterOptions("graphicNovel", prev => ({ ...prev, saturation: v }))
                }
              />
              <SliderRow
                label="Halftone"
                value={settings.graphicNovel.options.halftone || 0.3}
                displayValue={(settings.graphicNovel.options.halftone ?? 0.3).toFixed(2)}
                min={0}
                max={1}
                step={0.05}
                disabled={!settings.graphicNovel.enabled}
                onChange={v => setFilterOptions("graphicNovel", prev => ({ ...prev, halftone: v }))}
              />
            </FilterTab>
          </TabsContent>

          <TabsContent value="conceptArt">
            <FilterTab
              id="conceptArt"
              title="Enable Concept Art"
              enabled={settings.conceptArt.enabled}
              onEnabledChange={setEnabled("conceptArt")}
              onReset={() => resetFilter("conceptArt")}
              infoText="Concept Art style with artistic sketch lines and soft color overlay."
            >
              <SliderRow
                label="Sketch Intensity"
                value={settings.conceptArt.options.sketch || 0.5}
                displayValue={(settings.conceptArt.options.sketch ?? 0.5).toFixed(2)}
                min={0}
                max={1}
                step={0.05}
                disabled={!settings.conceptArt.enabled}
                onChange={v => setFilterOptions("conceptArt", prev => ({ ...prev, sketch: v }))}
              />
              <SliderRow
                label="Color Wash"
                value={settings.conceptArt.options.colorWash || 0.4}
                displayValue={(settings.conceptArt.options.colorWash ?? 0.4).toFixed(2)}
                min={0}
                max={1}
                step={0.05}
                disabled={!settings.conceptArt.enabled}
                onChange={v => setFilterOptions("conceptArt", prev => ({ ...prev, colorWash: v }))}
              />
              <SliderRow
                label="Vignette"
                value={settings.conceptArt.options.vignette || 0.3}
                displayValue={(settings.conceptArt.options.vignette ?? 0.3).toFixed(2)}
                min={0}
                max={1}
                step={0.05}
                disabled={!settings.conceptArt.enabled}
                onChange={v => setFilterOptions("conceptArt", prev => ({ ...prev, vignette: v }))}
              />
            </FilterTab>
          </TabsContent>

          <TabsContent value="inkedConceptArt">
            <FilterTab
              id="inkedConceptArt"
              title="Enable Inked Concept Art"
              enabled={settings.inkedConceptArt.enabled}
              onEnabledChange={setEnabled("inkedConceptArt")}
              onReset={() => resetFilter("inkedConceptArt")}
              infoText="Inked style with strong black lines on textured paper background."
            >
              <SliderRow
                label="Ink Thickness"
                value={settings.inkedConceptArt.options.inkThickness || 2}
                displayValue={`${settings.inkedConceptArt.options.inkThickness || 2}px`}
                min={1}
                max={5}
                step={0.5}
                disabled={!settings.inkedConceptArt.enabled}
                onChange={v =>
                  setFilterOptions("inkedConceptArt", prev => ({ ...prev, inkThickness: v }))
                }
              />
              <SliderRow
                label="Paper Texture"
                value={settings.inkedConceptArt.options.paperTexture || 0.2}
                displayValue={(settings.inkedConceptArt.options.paperTexture ?? 0.2).toFixed(2)}
                min={0}
                max={1}
                step={0.05}
                disabled={!settings.inkedConceptArt.enabled}
                onChange={v =>
                  setFilterOptions("inkedConceptArt", prev => ({ ...prev, paperTexture: v }))
                }
              />
              <ColorRow
                label="Ink Color"
                value={settings.inkedConceptArt.options.inkColor || "#000000"}
                disabled={!settings.inkedConceptArt.enabled}
                onChange={hex =>
                  setFilterOptions("inkedConceptArt", prev => ({ ...prev, inkColor: hex }))
                }
              />
            </FilterTab>
          </TabsContent>

          <TabsContent value="sobel">
            <FilterTab
              id="sobel"
              title="Enable Sobel Edge Detection"
              enabled={settings.sobel.enabled}
              onEnabledChange={setEnabled("sobel")}
              onReset={() => resetFilter("sobel")}
              infoText="Sobel edge detection creates a black and white outline drawing."
            >
              <SliderRow
                label="Edge Threshold"
                value={settings.sobel.options.threshold || 50}
                displayValue={String(settings.sobel.options.threshold || 50)}
                min={0}
                max={255}
                step={5}
                disabled={!settings.sobel.enabled}
                onChange={v => setFilterOptions("sobel", prev => ({ ...prev, threshold: v }))}
              />
              <SliderRow
                label="Pre-blur"
                value={settings.sobel.options.blur || 0}
                displayValue={`${settings.sobel.options.blur || 0}px`}
                min={0}
                max={10}
                step={1}
                disabled={!settings.sobel.enabled}
                onChange={v => setFilterOptions("sobel", prev => ({ ...prev, blur: v }))}
              />
              <SwitchRow
                id="sobel-invert"
                label="Invert Colors"
                checked={settings.sobel.options.invert || false}
                disabled={!settings.sobel.enabled}
                onCheckedChange={checked =>
                  setFilterOptions("sobel", prev => ({ ...prev, invert: checked }))
                }
              />
            </FilterTab>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
