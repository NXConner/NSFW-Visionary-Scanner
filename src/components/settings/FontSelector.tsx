import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type FontFamily =
  | "system"
  | "inter"
  | "playfair"
  | "space-grotesk"
  | "jetbrains"
  | "poppins"
  | "outfit"
  | "sora";

interface FontSelectorProps {
  value: FontFamily;
  onChange: (font: FontFamily) => void;
}

const fontOptions: { id: FontFamily; label: string; preview: string; description: string }[] = [
  {
    id: "system",
    label: "System Default",
    preview: "The quick brown fox",
    description: "Uses your device's default font",
  },
  {
    id: "inter",
    label: "Inter",
    preview: "The quick brown fox",
    description: "Clean and modern sans-serif",
  },
  {
    id: "playfair",
    label: "Playfair Display",
    preview: "The quick brown fox",
    description: "Elegant serif with style",
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    preview: "The quick brown fox",
    description: "Geometric sans-serif",
  },
  {
    id: "jetbrains",
    label: "JetBrains Mono",
    preview: "The quick brown fox",
    description: "Developer's monospace",
  },
  {
    id: "poppins",
    label: "Poppins",
    preview: "The quick brown fox",
    description: "Friendly and rounded",
  },
  {
    id: "outfit",
    label: "Outfit",
    preview: "The quick brown fox",
    description: "Contemporary variable font",
  },
  {
    id: "sora",
    label: "Sora",
    preview: "The quick brown fox",
    description: "Soft and approachable",
  },
];

const fontFamilyMap: Record<FontFamily, string> = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  inter: '"Inter", sans-serif',
  playfair: '"Playfair Display", serif',
  "space-grotesk": '"Space Grotesk", sans-serif',
  jetbrains: '"JetBrains Mono", monospace',
  poppins: '"Poppins", sans-serif',
  outfit: '"Outfit", sans-serif',
  sora: '"Sora", sans-serif',
};

export const FontSelector = ({ value, onChange }: FontSelectorProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-sm">Font Family</Label>

      <div className="grid gap-2">
        {fontOptions.map(font => {
          const isSelected = value === font.id;

          return (
            <button
              key={font.id}
              type="button"
              className={cn(
                "relative p-3 rounded-xl border text-left transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border/60 hover:border-primary/50 hover:bg-muted/50",
              )}
              onClick={() => onChange(font.id)}
              aria-label={`Select font: ${font.label}`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{font.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{font.description}</p>
                </div>
                <span
                  className="text-lg text-foreground/80"
                  style={{ fontFamily: fontFamilyMap[font.id] }}
                >
                  {font.preview}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
