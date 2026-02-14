import type { CustomInterfaceColors } from "@/contexts/settings/types";

export type ColorPresetCategory = "vibrant" | "minimal" | "warm" | "cool" | "dark" | "neon";

export interface ColorPreset {
  id: string;
  name: string;
  description: string;
  colors: Partial<CustomInterfaceColors>;
  category: ColorPresetCategory;
}

export interface InterfaceColorCustomizerProps {
  value: CustomInterfaceColors;
  onChange: (colors: CustomInterfaceColors) => void;
}

export interface ColorSwatchProps {
  label: string;
  colorKey: keyof CustomInterfaceColors;
  value: string | null;
  onChange: (key: keyof CustomInterfaceColors, value: string | null) => void;
  defaultHsl?: string;
}
