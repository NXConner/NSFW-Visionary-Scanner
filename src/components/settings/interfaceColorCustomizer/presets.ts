import type { ColorPreset } from "./types";

export const colorPresets: ColorPreset[] = [
  // Neon
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
