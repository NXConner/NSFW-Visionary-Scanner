import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hexToHsl } from "@/lib/color/colorConversions";
import { cn } from "@/lib/utils";
import { Check, RotateCcw } from "lucide-react";
import { useState } from "react";

interface AccentColorPickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
}

// Predefined accent colors (HSL values)
const presetColors = [
  { id: "cyan", label: "Cyan", hsl: "187 100% 42%", hex: "#00b8d4" },
  { id: "purple", label: "Purple", hsl: "263 70% 55%", hex: "#8b5cf6" },
  { id: "pink", label: "Pink", hsl: "330 81% 60%", hex: "#ec4899" },
  { id: "rose", label: "Rose", hsl: "350 89% 60%", hex: "#f43f5e" },
  { id: "red", label: "Red", hsl: "0 72% 51%", hex: "#dc2626" },
  { id: "orange", label: "Orange", hsl: "25 95% 53%", hex: "#f97316" },
  { id: "amber", label: "Amber", hsl: "38 92% 50%", hex: "#f59e0b" },
  { id: "yellow", label: "Yellow", hsl: "48 96% 53%", hex: "#eab308" },
  { id: "lime", label: "Lime", hsl: "84 81% 44%", hex: "#84cc16" },
  { id: "green", label: "Green", hsl: "142 71% 45%", hex: "#22c55e" },
  { id: "emerald", label: "Emerald", hsl: "160 84% 39%", hex: "#10b981" },
  { id: "teal", label: "Teal", hsl: "172 66% 50%", hex: "#14b8a6" },
  { id: "blue", label: "Blue", hsl: "217 91% 60%", hex: "#3b82f6" },
  { id: "indigo", label: "Indigo", hsl: "239 84% 67%", hex: "#6366f1" },
  { id: "violet", label: "Violet", hsl: "258 90% 66%", hex: "#8b5cf6" },
  { id: "silver", label: "Silver", hsl: "0 0% 70%", hex: "#a3a3a3" },
];

export const AccentColorPicker = ({ value, onChange }: AccentColorPickerProps) => {
  const [customHex, setCustomHex] = useState("");

  const handleCustomColor = () => {
    const hsl = hexToHsl(customHex);
    if (hsl) {
      onChange(hsl);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Accent Color</Label>
        {value && (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)} className="h-7 text-xs">
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset to theme
          </Button>
        )}
      </div>

      {/* Preset Colors Grid */}
      <div className="grid grid-cols-8 gap-2">
        {presetColors.map(color => {
          const isSelected = value === color.hsl;
          return (
            <button
              key={color.id}
              type="button"
              className={cn(
                "w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center",
                "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "ring-2 ring-offset-2 ring-foreground scale-110"
                  : "hover:scale-110 hover:ring-2 hover:ring-primary/50",
              )}
              style={{ backgroundColor: color.hex }}
              onClick={() => onChange(color.hsl)}
              title={color.label}
            >
              {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md" />}
            </button>
          );
        })}
      </div>

      {/* Custom Color Input */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-2">
          <Input
            type="text"
            placeholder="#FF5733"
            value={customHex}
            onChange={e => setCustomHex(e.target.value)}
            className="flex-1"
          />
          <Input
            type="color"
            value={customHex || "#00b8d4"}
            onChange={e => setCustomHex(e.target.value)}
            className="w-12 p-1 h-10 cursor-pointer"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleCustomColor} disabled={!customHex}>
          Apply
        </Button>
      </div>
    </div>
  );
};
