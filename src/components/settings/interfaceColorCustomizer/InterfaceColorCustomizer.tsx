import React, { useCallback, useMemo, useState } from "react";
import { Droplets, Eye, Palette, RotateCcw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_CUSTOM_INTERFACE_COLORS } from "@/contexts/settings/constants";
import { triggerHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

import { ColorSwatch } from "./ColorSwatch";
import { colorPresets } from "./presets";
import type { ColorPreset, InterfaceColorCustomizerProps } from "./types";

export const InterfaceColorCustomizer = ({ value, onChange }: InterfaceColorCustomizerProps) => {
  const [activeCategory, setActiveCategory] = useState<ColorPreset["category"]>("neon");

  const updateColor = useCallback(
    (key: keyof typeof value, colorValue: string | null) => {
      onChange({ ...value, [key]: colorValue });
    },
    [value, onChange],
  );

  const applyPreset = useCallback(
    (preset: ColorPreset) => {
      const newColors = { ...DEFAULT_CUSTOM_INTERFACE_COLORS };
      Object.entries(preset.colors).forEach(([key, val]) => {
        if (key in newColors) {
          (newColors as Record<string, string | null>)[key] = val ?? null;
        }
      });
      onChange(newColors);
      triggerHaptic("success");
    },
    [onChange],
  );

  const resetAll = useCallback(() => {
    onChange(DEFAULT_CUSTOM_INTERFACE_COLORS);
    triggerHaptic("selection");
  }, [onChange]);

  const hasCustomColors = useMemo(() => Object.values(value).some(v => v !== null), [value]);
  const filteredPresets = useMemo(
    () => colorPresets.filter(p => p.category === activeCategory),
    [activeCategory],
  );

  const categories: { id: ColorPreset["category"]; label: string; icon: React.ReactNode }[] = [
    { id: "neon", label: "Neon", icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: "vibrant", label: "Vibrant", icon: <Palette className="w-3.5 h-3.5" /> },
    { id: "warm", label: "Warm", icon: <Droplets className="w-3.5 h-3.5" /> },
    { id: "cool", label: "Cool", icon: <Eye className="w-3.5 h-3.5" /> },
    { id: "minimal", label: "Minimal", icon: null },
    { id: "dark", label: "Dark", icon: null },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">Interface Colors</Label>
        {hasCustomColors && (
          <Button variant="ghost" size="sm" onClick={resetAll} className="h-7 text-xs">
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset All
          </Button>
        )}
      </div>

      <Tabs defaultValue="presets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="presets">Color Presets</TabsTrigger>
          <TabsTrigger value="custom">Custom Colors</TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="space-y-4 mt-4">
          {/* Category Filters */}
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    triggerHaptic("selection");
                  }}
                  className="shrink-0"
                >
                  {cat.icon}
                  <span className={cat.icon ? "ml-1" : ""}>{cat.label}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* Preset Grid */}
          <div className="grid grid-cols-2 gap-3">
            {filteredPresets.map(preset => {
              const previewColors = preset.colors;
              return (
                <Card
                  key={preset.id}
                  className={cn(
                    "p-3 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg",
                    "border-2 hover:border-primary/50",
                  )}
                  onClick={() => applyPreset(preset)}
                >
                  <div className="flex gap-1 mb-2">
                    {previewColors.primary && (
                      <div
                        className="w-6 h-6 rounded-full ring-1 ring-white/20"
                        style={{ backgroundColor: `hsl(${previewColors.primary})` }}
                      />
                    )}
                    {previewColors.accent && (
                      <div
                        className="w-6 h-6 rounded-full ring-1 ring-white/20"
                        style={{ backgroundColor: `hsl(${previewColors.accent})` }}
                      />
                    )}
                    {previewColors.secondary && (
                      <div
                        className="w-6 h-6 rounded-full ring-1 ring-white/20"
                        style={{ backgroundColor: `hsl(${previewColors.secondary})` }}
                      />
                    )}
                    {previewColors.background && (
                      <div
                        className="w-6 h-6 rounded-full ring-1 ring-white/20"
                        style={{ backgroundColor: `hsl(${previewColors.background})` }}
                      />
                    )}
                  </div>
                  <p className="text-sm font-semibold truncate">{preset.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{preset.description}</p>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Customize individual interface colors. Click the color circle to pick a new color.
          </p>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Primary Colors
            </Label>
            <div className="space-y-1 bg-muted/30 rounded-lg p-2">
              <ColorSwatch
                label="Primary"
                colorKey="primary"
                value={value.primary}
                onChange={updateColor}
                defaultHsl="187 100% 42%"
              />
              <ColorSwatch
                label="Secondary"
                colorKey="secondary"
                value={value.secondary}
                onChange={updateColor}
                defaultHsl="240 10% 12%"
              />
              <ColorSwatch
                label="Accent"
                colorKey="accent"
                value={value.accent}
                onChange={updateColor}
                defaultHsl="263 70% 50%"
              />
              <ColorSwatch
                label="Destructive"
                colorKey="destructive"
                value={value.destructive}
                onChange={updateColor}
                defaultHsl="0 84% 60%"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Background & Surface
            </Label>
            <div className="space-y-1 bg-muted/30 rounded-lg p-2">
              <ColorSwatch
                label="Background"
                colorKey="background"
                value={value.background}
                onChange={updateColor}
                defaultHsl="240 10% 4%"
              />
              <ColorSwatch
                label="Card"
                colorKey="card"
                value={value.card}
                onChange={updateColor}
                defaultHsl="240 10% 6%"
              />
              <ColorSwatch
                label="Muted"
                colorKey="muted"
                value={value.muted}
                onChange={updateColor}
                defaultHsl="240 10% 14%"
              />
              <ColorSwatch
                label="Border"
                colorKey="border"
                value={value.border}
                onChange={updateColor}
                defaultHsl="240 10% 16%"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Text Colors
            </Label>
            <div className="space-y-1 bg-muted/30 rounded-lg p-2">
              <ColorSwatch
                label="Foreground"
                colorKey="foreground"
                value={value.foreground}
                onChange={updateColor}
                defaultHsl="210 40% 98%"
              />
              <ColorSwatch
                label="Card Foreground"
                colorKey="cardForeground"
                value={value.cardForeground}
                onChange={updateColor}
                defaultHsl="210 40% 98%"
              />
              <ColorSwatch
                label="Muted Foreground"
                colorKey="mutedForeground"
                value={value.mutedForeground}
                onChange={updateColor}
                defaultHsl="215 20% 55%"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
