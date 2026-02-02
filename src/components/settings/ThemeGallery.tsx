import { themePresets, type ThemePresetId } from "@/design-system";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ThemeGalleryProps {
  currentPreset: ThemePresetId;
  onSelect: (preset: ThemePresetId) => void;
}

export const ThemeGallery = ({ currentPreset, onSelect }: ThemeGalleryProps) => {
  const presets = Object.values(themePresets);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {presets.map(preset => {
        const isSelected = currentPreset === preset.id;

        return (
          <button
            key={preset.id}
            type="button"
            className={cn(
              "group relative rounded-2xl border overflow-hidden transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isSelected
                ? "border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/20"
                : "border-border/60 hover:border-primary/50 hover:shadow-md",
            )}
            aria-pressed={isSelected}
            aria-label={`Activate ${preset.label} theme`}
            onClick={() => onSelect(preset.id)}
          >
            {/* Preview Area */}
            <div className="relative h-28 w-full overflow-hidden">
              {/* Wallpaper Background */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: preset.wallpaper.fallback,
                  backgroundSize: "cover",
                  filter: `blur(${preset.wallpaper.blur})`,
                  opacity: parseFloat(preset.wallpaper.opacity),
                }}
              />

              {/* Theme Preview Card */}
              <div
                className="absolute inset-4 rounded-lg backdrop-blur-md flex flex-col items-center justify-center gap-2 border border-white/10"
                style={{
                  backgroundColor: `hsl(${preset.tokens["--background"]} / 0.85)`,
                }}
              >
                {/* Color Swatches */}
                <div className="flex gap-1.5">
                  <div
                    className="w-6 h-6 rounded-full ring-1 ring-white/20"
                    style={{ backgroundColor: `hsl(${preset.tokens["--primary"]})` }}
                    title="Primary"
                  />
                  <div
                    className="w-6 h-6 rounded-full ring-1 ring-white/20"
                    style={{ backgroundColor: `hsl(${preset.tokens["--accent"]})` }}
                    title="Accent"
                  />
                  <div
                    className="w-6 h-6 rounded-full ring-1 ring-white/20"
                    style={{ backgroundColor: `hsl(${preset.tokens["--secondary"]})` }}
                    title="Secondary"
                  />
                </div>

                {/* Text Preview */}
                <div className="flex flex-col items-center">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: `hsl(${preset.tokens["--foreground"]})` }}
                  >
                    {preset.label}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ color: `hsl(${preset.tokens["--muted-foreground"]})` }}
                  >
                    {preset.mode}
                  </span>
                </div>
              </div>

              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Info Area */}
            <div
              className="p-3 text-left transition-colors"
              style={{
                backgroundColor: isSelected ? "hsl(var(--primary) / 0.1)" : "hsl(var(--card))",
              }}
            >
              <p className="font-semibold text-sm text-foreground">{preset.label}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{preset.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
