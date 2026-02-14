import React from "react";
import { Check, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { hslToHex, hexToHsl } from "@/lib/color/colorConversions";
import { triggerHaptic } from "@/lib/haptics";

import type { ColorSwatchProps } from "./types";

export const ColorSwatch = ({
  label,
  colorKey,
  value,
  onChange,
  defaultHsl,
}: ColorSwatchProps): JSX.Element => {
  const displayHsl = value || defaultHsl || "0 0% 50%";
  const displayHex = hslToHex(displayHsl, "#888888");

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="relative">
        <input
          aria-label={`${label} color`}
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
          aria-label={`Reset ${label} color`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
};
