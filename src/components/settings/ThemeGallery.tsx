import { themePresets, type ThemePresetId } from "@/design-system";
import { cn } from "@/lib/utils";

interface ThemeGalleryProps {
  currentPreset: ThemePresetId;
  onSelect: (preset: ThemePresetId) => void;
}

export const ThemeGallery = ({ currentPreset, onSelect }: ThemeGalleryProps) => {
  const presets = Object.values(themePresets);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {presets.map(preset => (
        <button
          key={preset.id}
          type="button"
          className={cn(
            "relative rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            currentPreset === preset.id
              ? "border-primary/70 shadow-[0_0_0_1px_hsl(var(--primary))]"
              : "border-border/60 hover:border-primary/40",
          )}
          aria-pressed={currentPreset === preset.id}
          aria-label={`Activate ${preset.label} theme`}
          onClick={() => onSelect(preset.id)}
        >
          <div
            aria-hidden
            className="mb-3 h-20 w-full rounded-xl"
            style={{ backgroundImage: preset.previewGradient }}
          />
          <p className="font-semibold text-sm">{preset.label}</p>
          <p className="text-xs text-muted-foreground">{preset.description}</p>
          <span
            className={cn(
              "absolute right-4 top-4 h-2 w-2 rounded-full",
              currentPreset === preset.id ? "bg-primary" : "bg-muted",
            )}
          />
        </button>
      ))}
    </div>
  );
};
