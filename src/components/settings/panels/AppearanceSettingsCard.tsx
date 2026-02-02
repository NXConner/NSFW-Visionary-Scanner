import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeGallery } from "@/components/settings/ThemeGallery";
import { WallpaperPicker } from "@/components/settings/WallpaperPicker";
import { AccentColorPicker } from "@/components/settings/AccentColorPicker";
import { InterfaceColorCustomizer } from "@/components/settings/InterfaceColorCustomizer";
import { FontSelector } from "@/components/settings/FontSelector";
import { VisualEffectsToggles } from "@/components/settings/VisualEffectsToggles";
import { useSettings } from "@/contexts/SettingsContext";
import { triggerHaptic } from "@/lib/haptics";
import { themePresets } from "@/design-system";
import { Moon, Palette, Sun, Type } from "lucide-react";

export function AppearanceSettingsCard() {
  const {
    theme,
    setTheme,
    themePreset,
    setThemePreset,
    customWallpaper,
    setCustomWallpaper,
    setCustomWallpaperFromFile,
    wallpaperBlur,
    setWallpaperBlur,
    wallpaperOpacity,
    setWallpaperOpacity,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    customAccentColor,
    setCustomAccentColor,
    customInterfaceColors,
    setCustomInterfaceColors,
    measurementUnits,
    setMeasurementUnits,
    pressureUnits,
    setPressureUnits,
  } = useSettings();

  const activeWallpaper = customWallpaper ?? themePresets[themePreset].wallpaper.fallback;

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          Appearance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Theme</Label>
            <p className="text-sm text-muted-foreground">Choose light or dark mode</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTheme("light");
                triggerHaptic("selection");
              }}
            >
              <Sun className="w-4 h-4 mr-1" />
              Light
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTheme("dark");
                triggerHaptic("selection");
              }}
            >
              <Moon className="w-4 h-4 mr-1" />
              Dark
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-base">Theme Presets</Label>
          <p className="text-sm text-muted-foreground">
            Curated color palettes tailored for different lighting environments.
          </p>
          <ThemeGallery
            currentPreset={themePreset}
            onSelect={preset => {
              setThemePreset(preset);
              triggerHaptic("selection");
            }}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-base">Wallpaper</Label>
          <p className="text-sm text-muted-foreground">
            Select a mesh gradient, upload a custom background, or use videos for live wallpapers.
          </p>
          <WallpaperPicker
            activeWallpaper={activeWallpaper}
            onUploadFile={file => {
              setCustomWallpaperFromFile(file);
              triggerHaptic("selection");
            }}
            blur={wallpaperBlur}
            opacity={wallpaperOpacity}
            onBlurChange={v => {
              setWallpaperBlur(v);
              triggerHaptic("selection");
            }}
            onOpacityChange={v => {
              setWallpaperOpacity(v);
              triggerHaptic("selection");
            }}
            onChange={value => {
              setCustomWallpaper(value);
              triggerHaptic("selection");
            }}
          />
        </div>

        <VisualEffectsToggles />

        {/* Font Size */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base flex items-center gap-2">
              <Type className="w-4 h-4" />
              Font Size
            </Label>
            <p className="text-sm text-muted-foreground">Adjust text size</p>
          </div>
          <Select
            value={fontSize}
            onValueChange={value => {
              setFontSize(value as typeof fontSize);
              triggerHaptic("selection");
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
              <SelectItem value="xlarge">X-Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Units */}
        <div className="space-y-4">
          <div>
            <Label className="text-base">Units</Label>
            <p className="text-sm text-muted-foreground">
              Choose how measurements and pressure are displayed across the app.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Length & Girth</Label>
              <Select
                value={measurementUnits}
                onValueChange={value => {
                  setMeasurementUnits(value as typeof measurementUnits);
                  triggerHaptic("selection");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dual">Both (cm + in)</SelectItem>
                  <SelectItem value="metric">Metric (cm)</SelectItem>
                  <SelectItem value="imperial">Imperial (in)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Pump / Vacuum Pressure</Label>
              <Select
                value={pressureUnits}
                onValueChange={value => {
                  setPressureUnits(value as typeof pressureUnits);
                  triggerHaptic("selection");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dual">Both (inHg + kPa)</SelectItem>
                  <SelectItem value="imperial">Imperial (inHg)</SelectItem>
                  <SelectItem value="metric">Metric (kPa)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Font Family */}
        <div className="space-y-2">
          <Label className="text-base flex items-center gap-2">
            <Type className="w-4 h-4" />
            Typography
          </Label>
          <p className="text-sm text-muted-foreground">Choose your preferred font style</p>
          <FontSelector
            value={fontFamily}
            onChange={font => {
              setFontFamily(font);
              triggerHaptic("selection");
            }}
          />
        </div>

        <Separator />

        {/* Custom Accent Color */}
        <div className="space-y-2">
          <Label className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Custom Accent
          </Label>
          <p className="text-sm text-muted-foreground">Personalize your primary accent color</p>
          <AccentColorPicker
            value={customAccentColor}
            onChange={color => {
              setCustomAccentColor(color);
              triggerHaptic("selection");
            }}
          />
        </div>

        <Separator />

        {/* Interface Color Customizer */}
        <InterfaceColorCustomizer
          value={customInterfaceColors}
          onChange={colors => {
            setCustomInterfaceColors(colors);
            triggerHaptic("selection");
          }}
        />
      </CardContent>
    </Card>
  );
}
