export interface PresetFilter {
  key: string;
  label: string;
  icon: React.ReactNode;
  category: "basic" | "artistic" | "mood";
}

export interface PresetState {
  activePreset: string | null;
  intensity: number;
}

export const defaultPresetState: PresetState = {
  activePreset: null,
  intensity: 100,
};
