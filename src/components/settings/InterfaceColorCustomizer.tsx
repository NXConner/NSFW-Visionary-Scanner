import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Check, RotateCcw, Sparkles, Palette, Droplets, Eye } from "lucide-react";
import { useState, useCallback } from "react";
import { triggerHaptic } from "@/lib/haptics";

export interface CustomInterfaceColors {
  primary: string | null;
  secondary: string | null;
  accent: string | null;
  background: string | null;
  foreground: string | null;
  muted: string | null;
  mutedForeground: string | null;
  border: string | null;
  card: string | null;
  cardForeground: string | null;
  destructive: string | null;
}

export const DEFAULT_CUSTOM_COLORS: CustomInterfaceColors = {
  primary: null,
  secondary: null,
  accent: null,
  background: null,
  foreground: null,
  muted: null,
  mutedForeground: null,
  border: null,
  card: null,
  cardForeground: null,
  destructive: null,
};

interface ColorPreset {
  id: string;
  name: string;
  description: string;
  colors: Partial<CustomInterfaceColors>;
  category: "vibrant" | "minimal" | "warm" | "cool" | "dark" | "neon";
}

const colorPresets: ColorPreset[] = [
  // Vibrant
  {
    id: "electric-dreams",
    name: "Electric Dreams",
    description: "Neon pink & electric blue",
    category: "neon",
    colors: {
      primary: "330 100% 60%",
      accent: "195 100% 50%",
      secondary: "280 40% 15%",
    },
  },
  {
    id: "synthwave",
    name: "Synthwave",
    description: "Purple sunset vibes",
    category: "neon",
    colors: {
      primary: "280 100% 65%",
      accent: "330 100% 55%",
      secondary: "260 50% 12%",
      background: "270 50% 5%",
    },
  },
  {
    id: "matrix",
    name: "Matrix",
    description: "Green code cascade",
    category: "neon",
    colors: {
      primary: "120 100% 45%",
      accent: "140 80% 40%",
      background: "0 0% 2%",
      foreground: "120 100% 70%",
    },
  },
  {
    id: "tron",
    name: "Tron Legacy",
    description: "Ice blue glow",
    category: "neon",
    colors: {
      primary: "195 100% 55%",
      accent: "180 100% 45%",
      background: "200 30% 5%",
      border: "195 80% 25%",
    },
  },
  // Vibrant combinations
  {
    id: "sunset-blaze",
    name: "Sunset Blaze",
    description: "Orange & coral energy",
    category: "vibrant",
    colors: {
      primary: "25 95% 55%",
      accent: "350 90% 60%",
      secondary: "15 60% 15%",
    },
  },
  {
    id: "tropical-fusion",
    name: "Tropical Fusion",
    description: "Teal & mango punch",
    category: "vibrant",
    colors: {
      primary: "175 85% 45%",
      accent: "45 95% 55%",
      secondary: "180 40% 12%",
    },
  },
  {
    id: "berry-blast",
    name: "Berry Blast",
    description: "Purple & magenta pop",
    category: "vibrant",
    colors: {
      primary: "290 85% 55%",
      accent: "330 90% 60%",
      secondary: "280 40% 15%",
    },
  },
  // Minimal
  {
    id: "clean-slate",
    name: "Clean Slate",
    description: "Pure grayscale elegance",
    category: "minimal",
    colors: {
      primary: "0 0% 45%",
      accent: "0 0% 60%",
      secondary: "0 0% 12%",
      muted: "0 0% 18%",
    },
  },
  {
    id: "ink-wash",
    name: "Ink Wash",
    description: "Subtle blue-gray tones",
    category: "minimal",
    colors: {
      primary: "220 15% 50%",
      accent: "220 20% 65%",
      secondary: "220 10% 14%",
      muted: "220 8% 20%",
    },
  },
  {
    id: "paper-cut",
    name: "Paper Cut",
    description: "Warm off-white & charcoal",
    category: "minimal",
    colors: {
      primary: "30 10% 40%",
      accent: "25 15% 55%",
      background: "40 20% 96%",
      foreground: "30 15% 15%",
    },
  },
  // Warm
  {
    id: "golden-hour",
    name: "Golden Hour",
    description: "Amber & bronze warmth",
    category: "warm",
    colors: {
      primary: "38 95% 50%",
      accent: "25 90% 55%",
      secondary: "30 40% 12%",
      muted: "35 30% 18%",
    },
  },
  {
    id: "terracotta",
    name: "Terracotta",
    description: "Earthy reds & browns",
    category: "warm",
    colors: {
      primary: "15 70% 50%",
      accent: "25 60% 45%",
      secondary: "20 35% 15%",
      background: "20 25% 8%",
    },
  },
  {
    id: "autumn-fire",
    name: "Autumn Fire",
    description: "Red & orange leaves",
    category: "warm",
    colors: {
      primary: "10 80% 55%",
      accent: "35 90% 50%",
      secondary: "15 45% 12%",
    },
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    description: "Elegant pink & gold",
    category: "warm",
    colors: {
      primary: "350 70% 65%",
      accent: "35 85% 55%",
      secondary: "345 30% 15%",
    },
  },
  // Cool
  {
    id: "arctic-frost",
    name: "Arctic Frost",
    description: "Icy blues & whites",
    category: "cool",
    colors: {
      primary: "200 90% 55%",
      accent: "190 85% 45%",
      secondary: "205 40% 15%",
      muted: "200 25% 22%",
    },
  },
  {
    id: "ocean-depth",
    name: "Ocean Depth",
    description: "Deep sea blues & teals",
    category: "cool",
    colors: {
      primary: "210 85% 50%",
      accent: "175 80% 45%",
      background: "215 50% 6%",
      secondary: "210 45% 14%",
    },
  },
  {
    id: "lavender-mist",
    name: "Lavender Mist",
    description: "Soft purple serenity",
    category: "cool",
    colors: {
      primary: "270 60% 60%",
      accent: "280 50% 70%",
      secondary: "270 25% 18%",
      muted: "270 20% 22%",
    },
  },
  {
    id: "mint-fresh",
    name: "Mint Fresh",
    description: "Cool greens & aqua",
    category: "cool",
    colors: {
      primary: "160 65% 50%",
      accent: "175 70% 45%",
      secondary: "165 35% 14%",
    },
  },
  // Dark
  {
    id: "void-black",
    name: "Void Black",
    description: "Deepest black with silver",
    category: "dark",
    colors: {
      primary: "0 0% 65%",
      accent: "0 0% 50%",
      background: "0 0% 1%",
      secondary: "0 0% 6%",
      muted: "0 0% 8%",
      border: "0 0% 12%",
    },
  },
  {
    id: "obsidian-glow",
    name: "Obsidian Glow",
    description: "Black with cyan accent",
    category: "dark",
    colors: {
      primary: "185 100% 45%",
      accent: "200 90% 55%",
      background: "200 30% 3%",
      secondary: "200 25% 8%",
    },
  },
  {
    id: "midnight-purple",
    name: "Midnight Purple",
    description: "Deep violet mystery",
    category: "dark",
    colors: {
      primary: "270 80% 55%",
      accent: "280 70% 65%",
      background: "275 50% 4%",
      secondary: "275 40% 10%",
    },
  },
  {
    id: "blood-moon",
    name: "Blood Moon",
    description: "Dark red & black drama",
    category: "dark",
    colors: {
      primary: "0 75% 45%",
      accent: "350 80% 50%",
      background: "0 40% 3%",
      secondary: "0 35% 8%",
    },
  },
];

interface ColorSwatchProps {
  label: string;
  colorKey: keyof CustomInterfaceColors;
  value: string | null;
  onChange: (key: keyof CustomInterfaceColors, value: string | null) => void;
  defaultHsl?: string;
}

const ColorSwatch = ({ label, colorKey, value, onChange, defaultHsl }: ColorSwatchProps) => {
  const [hexInput, setHexInput] = useState("");

  const hslToHex = (hsl: string): string => {
    const parts = hsl.split(" ");
    if (parts.length < 3) return "#888888";
    const h = parseFloat(parts[0]) / 360;
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const hexToHsl = (hex: string): string | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;

    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const displayHsl = value || defaultHsl || "0 0% 50%";
  const displayHex = hslToHex(displayHsl);

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="relative">
        <input
          type="color"
          value={displayHex}
          onChange={e => {
            const hsl = hexToHsl(e.target.value);
            if (hsl) {
              onChange(colorKey, hsl);
              triggerHaptic("selection");
            }
          }}
          className="w-10 h-10 rounded-full cursor-pointer border-2 border-border appearance-none overflow-hidden"
          style={{ backgroundColor: displayHex }}
        />
        {value && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-primary-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        <p className="text-xs text-muted-foreground font-mono">{displayHsl}</p>
      </div>
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => {
            onChange(colorKey, null);
            triggerHaptic("selection");
          }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
};

interface InterfaceColorCustomizerProps {
  value: CustomInterfaceColors;
  onChange: (colors: CustomInterfaceColors) => void;
}

export const InterfaceColorCustomizer = ({ value, onChange }: InterfaceColorCustomizerProps) => {
  const [activeCategory, setActiveCategory] = useState<ColorPreset["category"]>("neon");

  const updateColor = useCallback(
    (key: keyof CustomInterfaceColors, colorValue: string | null) => {
      onChange({ ...value, [key]: colorValue });
    },
    [value, onChange],
  );

  const applyPreset = useCallback(
    (preset: ColorPreset) => {
      const newColors = { ...DEFAULT_CUSTOM_COLORS };
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
    onChange(DEFAULT_CUSTOM_COLORS);
    triggerHaptic("selection");
  }, [onChange]);

  const hasCustomColors = Object.values(value).some(v => v !== null);

  const filteredPresets = colorPresets.filter(p => p.category === activeCategory);

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
                  {/* Color Preview */}
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
