/**
 * Video Filters Panel
 * Visual effect filters for the video editor
 */

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Layers, Palette, Pencil, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import type { FilterType } from "@/lib/imageFilters";

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
    description: "Anime/cartoon style",
    icon: <Sparkles className="w-4 h-4" />,
    options: {
      levels: { label: "Levels", min: 2, max: 8, step: 1, default: 4 },
      edgeThreshold: { label: "Edge", min: 0.1, max: 1, step: 0.1, default: 0.3 },
    },
  },
  {
    key: "graphicNovel",
    label: "Graphic Novel",
    description: "Comic book style",
    icon: <Layers className="w-4 h-4" />,
    options: {
      contrast: { label: "Contrast", min: 0.5, max: 2, step: 0.1, default: 1.5 },
      halftone: { label: "Halftone", min: 0, max: 1, step: 0.1, default: 0.3 },
    },
  },
  {
    key: "conceptArt",
    label: "Concept Art",
    description: "Artistic sketch",
    icon: <Pencil className="w-4 h-4" />,
    options: {
      sketch: { label: "Sketch", min: 0, max: 1, step: 0.1, default: 0.5 },
      colorWash: { label: "Wash", min: 0, max: 1, step: 0.1, default: 0.4 },
    },
  },
  {
    key: "inkedConceptArt",
    label: "Inked Art",
    description: "Ink lines",
    icon: <Pencil className="w-4 h-4" />,
    options: {
      inkThickness: { label: "Ink", min: 1, max: 5, step: 0.5, default: 2 },
      paperTexture: { label: "Paper", min: 0, max: 1, step: 0.1, default: 0.2 },
    },
  },
  {
    key: "sobel",
    label: "Edge Detect",
    description: "Sobel filter",
    icon: <Wand2 className="w-4 h-4" />,
    options: {
      threshold: { label: "Threshold", min: 10, max: 200, step: 10, default: 50 },
      blur: { label: "Blur", min: 0, max: 10, step: 1, default: 0 },
    },
  },
];

export interface VideoFilterState {
  enabled: boolean;
  filterType: FilterType | null;
  options: Record<string, number>;
}

export function VideoFiltersPanel(props: {
  filterState: VideoFilterState;
  onFilterChange: (state: VideoFilterState) => void;
}): JSX.Element {
  const { filterState, onFilterChange } = props;

  const handleToggle = useCallback((enabled: boolean) => {
    onFilterChange({ ...filterState, enabled });
  }, [filterState, onFilterChange]);

  const handleSelectFilter = useCallback((filterKey: FilterType) => {
    if (filterState.filterType === filterKey) {
      onFilterChange({ ...filterState, filterType: null, options: {} });
    } else {
      const config = FILTER_CONFIGS.find(f => f.key === filterKey);
      const defaults: Record<string, number> = {};
      if (config) {
        for (const [key, def] of Object.entries(config.options)) {
          defaults[key] = def.default;
        }
      }
      onFilterChange({ ...filterState, filterType: filterKey, options: defaults });
    }
  }, [filterState, onFilterChange]);

  const handleOptionChange = useCallback((key: string, value: number) => {
    onFilterChange({
      ...filterState,
      options: { ...filterState.options, [key]: value },
    });
  }, [filterState, onFilterChange]);

  const activeConfig = FILTER_CONFIGS.find(f => f.key === filterState.filterType);

  return (
    <Card className="p-3 border-border/50">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          <span className="text-sm font-medium">Video Filters</span>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="filter-toggle" className="text-xs">Enable</Label>
          <Switch
            id="filter-toggle"
            checked={filterState.enabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </div>

      {filterState.enabled && (
        <>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {FILTER_CONFIGS.map(filter => (
              <Button
                key={filter.key}
                variant={filterState.filterType === filter.key ? "default" : "outline"}
                size="sm"
                className="h-auto py-2 flex-col gap-0.5"
                onClick={() => handleSelectFilter(filter.key)}
              >
                {filter.icon}
                <span className="text-[10px]">{filter.label}</span>
              </Button>
            ))}
          </div>

          {activeConfig && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{activeConfig.label}</span>
                <Badge variant="secondary" className="text-[10px]">Preview</Badge>
              </div>
              
              {Object.entries(activeConfig.options).map(([key, opt]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-[10px]">{opt.label}</Label>
                    <span className="text-[10px] text-muted-foreground">
                      {(filterState.options[key] ?? opt.default).toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    value={[filterState.options[key] ?? opt.default]}
                    onValueChange={([v]) => handleOptionChange(key, v)}
                    min={opt.min}
                    max={opt.max}
                    step={opt.step}
                  />
                </div>
              ))}

              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => onFilterChange({ enabled: true, filterType: null, options: {} })}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Clear Filter
              </Button>
            </div>
          )}

          {!activeConfig && (
            <p className="text-[10px] text-muted-foreground text-center py-2">
              Select a filter to apply to the video preview
            </p>
          )}
        </>
      )}
    </Card>
  );
}
