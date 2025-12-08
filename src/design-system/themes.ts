import type { ThemeCSSVariables } from "./tokens";

export type ThemePresetId = "obsidian" | "lumina" | "nebula" | "aurora" | "dusk" | "midnight" | "crimson" | "velvet" | "noir" | "cyberpunk";

export interface ThemeDefinition {
  id: ThemePresetId;
  label: string;
  mode: "light" | "dark";
  description: string;
  previewGradient: string;
  wallpaper: {
    fallback: string;
    blur: string;
    opacity: string;
  };
  tokens: ThemeCSSVariables;
}

const theme = (definition: ThemeDefinition): ThemeDefinition => definition;

export const themePresets: Record<ThemePresetId, ThemeDefinition> = {
  obsidian: theme({
    id: "obsidian",
    label: "Obsidian",
    mode: "dark",
    description: "Deep cyan glow with ultraviolet accents",
    previewGradient:
      "radial-gradient(circle at top, rgba(74,222,255,0.3), transparent 50%), radial-gradient(circle at 20% 20%, rgba(192,132,252,0.35), transparent 60%), radial-gradient(circle at bottom right, rgba(14,165,233,0.35), transparent 55%)",
    wallpaper: {
      fallback:
        "radial-gradient(circle at 15% 20%, rgba(59,130,246,0.55), transparent 50%), radial-gradient(circle at 80% 0%, rgba(236,72,153,0.4), transparent 45%), radial-gradient(circle at 60% 80%, rgba(8,145,178,0.35), transparent 40%), linear-gradient(135deg, rgba(2,6,23,0.9), rgba(2,8,23,0.6))",
      blur: "200px",
      opacity: "0.55",
    },
    tokens: {
      "--background": "240 10% 4%",
      "--foreground": "210 40% 98%",
      "--primary": "187 100% 52%",
      "--accent": "263 70% 55%",
      "--secondary": "240 10% 12%",
      "--muted": "240 10% 18%",
      "--muted-foreground": "215 20% 65%",
      "--border": "240 10% 18%",
    },
  }),
  lumina: theme({
    id: "lumina",
    label: "Lumina",
    mode: "light",
    description: "Soft neutrals with teal highlights",
    previewGradient:
      "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.35), transparent 55%), radial-gradient(circle at 80% 0%, rgba(236,72,153,0.25), transparent 55%), linear-gradient(135deg, rgba(255,255,255,0.95), rgba(226,232,240,0.95))",
    wallpaper: {
      fallback:
        "radial-gradient(circle at 10% 20%, rgba(56,189,248,0.35), transparent 55%), radial-gradient(circle at 60% 80%, rgba(14,165,233,0.25), transparent 50%), linear-gradient(135deg, rgba(249,250,251,0.95), rgba(226,232,240,0.9))",
      blur: "120px",
      opacity: "0.7",
    },
    tokens: {
      "--background": "0 0% 100%",
      "--foreground": "222 47% 11%",
      "--primary": "187 100% 40%",
      "--accent": "210 100% 60%",
      "--secondary": "210 40% 96%",
      "--muted": "210 25% 94%",
      "--muted-foreground": "215 20% 40%",
      "--border": "214 32% 91%",
    },
  }),
  nebula: theme({
    id: "nebula",
    label: "Nebula",
    mode: "dark",
    description: "Vibrant magenta & blue mesh gradients",
    previewGradient:
      "radial-gradient(circle at 15% 20%, rgba(244,63,94,0.45), transparent 50%), radial-gradient(circle at 80% 0%, rgba(192,132,252,0.35), transparent 45%), radial-gradient(circle at 60% 80%, rgba(59,130,246,0.35), transparent 40%)",
    wallpaper: {
      fallback:
        "radial-gradient(circle at 10% 20%, rgba(244,114,182,0.45), transparent 52%), radial-gradient(circle at 70% 0%, rgba(129,140,248,0.55), transparent 50%), radial-gradient(circle at 65% 75%, rgba(14,165,233,0.45), transparent 55%), linear-gradient(145deg, rgba(2,4,23,0.95), rgba(12,6,30,0.9))",
      blur: "260px",
      opacity: "0.65",
    },
    tokens: {
      "--background": "248 18% 6%",
      "--foreground": "215 32% 96%",
      "--primary": "316 74% 58%",
      "--accent": "215 100% 70%",
      "--secondary": "249 20% 18%",
      "--muted": "249 18% 16%",
      "--muted-foreground": "255 10% 70%",
      "--border": "248 20% 20%",
    },
  }),
  aurora: theme({
    id: "aurora",
    label: "Aurora",
    mode: "dark",
    description: "Emerald + amber sheen inspired by northern lights",
    previewGradient:
      "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.45), transparent 50%), radial-gradient(circle at 80% 0%, rgba(250,204,21,0.25), transparent 55%), linear-gradient(135deg, rgba(2,6,23,0.9), rgba(3,15,22,0.85))",
    wallpaper: {
      fallback:
        "radial-gradient(circle at 30% 20%, rgba(16,185,129,0.4), transparent 55%), radial-gradient(circle at 70% 0%, rgba(234,179,8,0.35), transparent 60%), radial-gradient(circle at 20% 80%, rgba(59,130,246,0.25), transparent 55%), linear-gradient(145deg, rgba(1,10,14,0.95), rgba(3,7,18,0.9))",
      blur: "220px",
      opacity: "0.6",
    },
    tokens: {
      "--background": "202 68% 4%",
      "--foreground": "155 30% 94%",
      "--primary": "155 82% 55%",
      "--accent": "43 96% 55%",
      "--secondary": "202 40% 16%",
      "--muted": "200 32% 18%",
      "--muted-foreground": "162 20% 70%",
      "--border": "202 32% 22%",
    },
  }),
  dusk: theme({
    id: "dusk",
    label: "Dusk",
    mode: "light",
    description: "Warm sunset gradients with deep ink accents",
    previewGradient:
      "radial-gradient(circle at 15% 30%, rgba(248,113,113,0.35), transparent 55%), radial-gradient(circle at 70% 0%, rgba(251,191,36,0.35), transparent 50%), linear-gradient(135deg, rgba(255,255,255,0.95), rgba(254,243,199,0.95))",
    wallpaper: {
      fallback:
        "radial-gradient(circle at 10% 30%, rgba(248,113,113,0.35), transparent 60%), radial-gradient(circle at 80% 5%, rgba(251,191,36,0.35), transparent 60%), radial-gradient(circle at 60% 80%, rgba(59,130,246,0.2), transparent 55%), linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,247,237,0.9))",
      blur: "140px",
      opacity: "0.75",
    },
    tokens: {
      "--background": "40 60% 98%",
      "--foreground": "15 25% 22%",
      "--primary": "16 94% 57%",
      "--accent": "20 94% 63%",
      "--secondary": "35 80% 92%",
      "--muted": "35 45% 90%",
      "--muted-foreground": "20 30% 40%",
      "--border": "28 50% 85%",
    },
  }),
  // NEW SEXY THEMES
  midnight: theme({
    id: "midnight",
    label: "Midnight Velvet",
    mode: "dark",
    description: "Seductive deep purple with gold shimmer",
    previewGradient:
      "radial-gradient(circle at 30% 20%, rgba(139,92,246,0.5), transparent 50%), radial-gradient(circle at 70% 80%, rgba(217,119,6,0.3), transparent 55%), linear-gradient(135deg, rgba(15,3,30,0.95), rgba(30,10,50,0.9))",
    wallpaper: {
      fallback:
        "radial-gradient(circle at 20% 30%, rgba(139,92,246,0.55), transparent 50%), radial-gradient(circle at 80% 20%, rgba(217,119,6,0.35), transparent 55%), radial-gradient(circle at 50% 90%, rgba(168,85,247,0.4), transparent 60%), linear-gradient(145deg, rgba(10,0,20,0.98), rgba(25,5,45,0.95))",
      blur: "280px",
      opacity: "0.7",
    },
    tokens: {
      "--background": "270 50% 5%",
      "--foreground": "45 90% 96%",
      "--primary": "263 70% 55%",
      "--accent": "38 92% 50%",
      "--secondary": "270 30% 15%",
      "--muted": "270 25% 12%",
      "--muted-foreground": "270 20% 60%",
      "--border": "270 30% 18%",
    },
  }),
  crimson: theme({
    id: "crimson",
    label: "Crimson Desire",
    mode: "dark",
    description: "Bold red passion with black elegance",
    previewGradient:
      "radial-gradient(circle at 25% 25%, rgba(220,38,38,0.5), transparent 50%), radial-gradient(circle at 75% 75%, rgba(190,18,60,0.4), transparent 55%), linear-gradient(135deg, rgba(10,0,0,0.95), rgba(30,5,10,0.9))",
    wallpaper: {
      fallback:
        "radial-gradient(circle at 15% 20%, rgba(220,38,38,0.5), transparent 55%), radial-gradient(circle at 85% 30%, rgba(190,18,60,0.45), transparent 50%), radial-gradient(circle at 50% 80%, rgba(127,29,29,0.4), transparent 60%), linear-gradient(145deg, rgba(5,0,0,0.98), rgba(20,2,8,0.95))",
      blur: "240px",
      opacity: "0.65",
    },
    tokens: {
      "--background": "0 40% 3%",
      "--foreground": "0 0% 98%",
      "--primary": "0 72% 51%",
      "--accent": "350 89% 60%",
      "--secondary": "0 30% 12%",
      "--muted": "0 25% 10%",
      "--muted-foreground": "0 15% 60%",
      "--border": "0 30% 15%",
    },
  }),
  velvet: theme({
    id: "velvet",
    label: "Rose Velvet",
    mode: "dark",
    description: "Romantic rose pink with soft blush",
    previewGradient:
      "radial-gradient(circle at 30% 30%, rgba(244,114,182,0.5), transparent 55%), radial-gradient(circle at 70% 70%, rgba(251,113,133,0.4), transparent 55%), linear-gradient(135deg, rgba(20,5,15,0.95), rgba(35,10,25,0.9))",
    wallpaper: {
      fallback:
        "radial-gradient(circle at 20% 25%, rgba(244,114,182,0.5), transparent 55%), radial-gradient(circle at 80% 40%, rgba(251,113,133,0.45), transparent 50%), radial-gradient(circle at 40% 85%, rgba(219,39,119,0.35), transparent 55%), linear-gradient(145deg, rgba(15,2,10,0.98), rgba(30,8,20,0.95))",
      blur: "260px",
      opacity: "0.6",
    },
    tokens: {
      "--background": "330 40% 5%",
      "--foreground": "330 20% 96%",
      "--primary": "330 81% 60%",
      "--accent": "350 80% 65%",
      "--secondary": "330 30% 14%",
      "--muted": "330 25% 11%",
      "--muted-foreground": "330 20% 60%",
      "--border": "330 30% 18%",
    },
  }),
  noir: theme({
    id: "noir",
    label: "Noir Elegance",
    mode: "dark",
    description: "Pure black sophistication with silver accents",
    previewGradient:
      "radial-gradient(circle at 50% 50%, rgba(100,100,100,0.2), transparent 55%), linear-gradient(135deg, rgba(0,0,0,0.98), rgba(15,15,15,0.95))",
    wallpaper: {
      fallback:
        "radial-gradient(circle at 30% 30%, rgba(80,80,80,0.15), transparent 50%), radial-gradient(circle at 70% 70%, rgba(60,60,60,0.1), transparent 55%), linear-gradient(145deg, rgba(0,0,0,0.99), rgba(10,10,10,0.98))",
      blur: "180px",
      opacity: "0.5",
    },
    tokens: {
      "--background": "0 0% 2%",
      "--foreground": "0 0% 95%",
      "--primary": "0 0% 70%",
      "--accent": "0 0% 50%",
      "--secondary": "0 0% 10%",
      "--muted": "0 0% 8%",
      "--muted-foreground": "0 0% 55%",
      "--border": "0 0% 15%",
    },
  }),
  cyberpunk: theme({
    id: "cyberpunk",
    label: "Cyberpunk",
    mode: "dark",
    description: "Neon electric with hot pink & cyan",
    previewGradient:
      "radial-gradient(circle at 20% 30%, rgba(236,72,153,0.6), transparent 50%), radial-gradient(circle at 80% 70%, rgba(6,182,212,0.5), transparent 55%), linear-gradient(135deg, rgba(5,0,15,0.98), rgba(15,5,30,0.95))",
    wallpaper: {
      fallback:
        "radial-gradient(circle at 10% 20%, rgba(236,72,153,0.6), transparent 50%), radial-gradient(circle at 90% 30%, rgba(6,182,212,0.55), transparent 55%), radial-gradient(circle at 50% 85%, rgba(168,85,247,0.45), transparent 60%), linear-gradient(145deg, rgba(2,0,10,0.99), rgba(10,2,25,0.97))",
      blur: "300px",
      opacity: "0.75",
    },
    tokens: {
      "--background": "280 60% 3%",
      "--foreground": "180 100% 95%",
      "--primary": "330 100% 60%",
      "--accent": "185 94% 48%",
      "--secondary": "280 40% 12%",
      "--muted": "280 35% 10%",
      "--muted-foreground": "280 30% 60%",
      "--border": "280 40% 18%",
    },
  }),
};

export interface WallpaperPreset {
  id: string;
  label: string;
  value: string;
  description: string;
  animated?: boolean;
  category?: 'gradient' | 'animated' | 'seasonal';
}

export const wallpaperPresets: WallpaperPreset[] = [
  // Classic Gradients
  {
    id: "mesh-cyan",
    label: "Cyan Mesh",
    description: "High-energy cyan + magenta mesh gradient",
    category: "gradient",
    value:
      "radial-gradient(circle at 15% 20%, rgba(59,130,246,0.45), transparent 55%), radial-gradient(circle at 80% 0%, rgba(236,72,153,0.35), transparent 50%), radial-gradient(circle at 60% 80%, rgba(14,165,233,0.45), transparent 60%), linear-gradient(135deg, rgba(2,4,23,0.95), rgba(2,6,32,0.8))",
  },
  {
    id: "sunset",
    label: "Sunset Glow",
    description: "Amber + coral gradients for golden hour",
    category: "gradient",
    value:
      "radial-gradient(circle at 20% 30%, rgba(248,113,113,0.45), transparent 50%), radial-gradient(circle at 80% 0%, rgba(251,191,36,0.4), transparent 55%), linear-gradient(135deg, rgba(255,255,255,0.95), rgba(254,243,199,0.9))",
  },
  {
    id: "forest",
    label: "Deep Forest",
    description: "Emerald haze with teal highlights",
    category: "gradient",
    value:
      "radial-gradient(circle at 25% 25%, rgba(16,185,129,0.4), transparent 55%), radial-gradient(circle at 75% 10%, rgba(59,130,246,0.25), transparent 60%), linear-gradient(135deg, rgba(2,10,14,0.95), rgba(3,17,25,0.9))",
  },
  {
    id: "desert",
    label: "Desert Mirage",
    description: "Soft beige + mauve gradients",
    category: "gradient",
    value:
      "radial-gradient(circle at 10% 30%, rgba(244,114,182,0.25), transparent 55%), radial-gradient(circle at 80% 0%, rgba(245,158,11,0.25), transparent 50%), linear-gradient(135deg, rgba(252,251,244,0.95), rgba(250,245,229,0.95))",
  },
  // Sexy/Stylistic
  {
    id: "passion",
    label: "Passion",
    description: "Deep reds with sensual undertones",
    category: "gradient",
    value:
      "radial-gradient(circle at 20% 20%, rgba(220,38,38,0.5), transparent 50%), radial-gradient(circle at 80% 80%, rgba(190,18,60,0.4), transparent 55%), radial-gradient(circle at 50% 50%, rgba(127,29,29,0.3), transparent 60%), linear-gradient(145deg, rgba(5,0,0,0.98), rgba(20,2,8,0.95))",
  },
  {
    id: "seduction",
    label: "Seduction",
    description: "Purple velvet with gold shimmer",
    category: "gradient",
    value:
      "radial-gradient(circle at 30% 25%, rgba(139,92,246,0.55), transparent 50%), radial-gradient(circle at 70% 75%, rgba(217,119,6,0.35), transparent 55%), radial-gradient(circle at 90% 10%, rgba(168,85,247,0.3), transparent 45%), linear-gradient(145deg, rgba(10,0,20,0.98), rgba(25,5,45,0.95))",
  },
  {
    id: "rose-gold",
    label: "Rose Gold",
    description: "Elegant rose with golden highlights",
    category: "gradient",
    value:
      "radial-gradient(circle at 25% 30%, rgba(244,114,182,0.5), transparent 50%), radial-gradient(circle at 75% 60%, rgba(217,119,6,0.35), transparent 55%), linear-gradient(145deg, rgba(20,5,15,0.95), rgba(35,15,25,0.9))",
  },
  {
    id: "neon-nights",
    label: "Neon Nights",
    description: "Electric pink & cyan cyberpunk vibes",
    category: "gradient",
    value:
      "radial-gradient(circle at 15% 25%, rgba(236,72,153,0.6), transparent 50%), radial-gradient(circle at 85% 75%, rgba(6,182,212,0.55), transparent 55%), radial-gradient(circle at 50% 50%, rgba(168,85,247,0.35), transparent 60%), linear-gradient(145deg, rgba(2,0,10,0.99), rgba(10,2,25,0.97))",
  },
  // Seasonal Themes
  {
    id: "winter-frost",
    label: "Winter Frost",
    description: "Icy blues with crystalline shimmer",
    category: "seasonal",
    value:
      "radial-gradient(circle at 20% 20%, rgba(147,197,253,0.5), transparent 55%), radial-gradient(circle at 80% 30%, rgba(165,243,252,0.4), transparent 50%), radial-gradient(circle at 50% 80%, rgba(224,242,254,0.3), transparent 60%), linear-gradient(145deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))",
  },
  {
    id: "spring-bloom",
    label: "Spring Bloom",
    description: "Fresh greens with cherry blossom pink",
    category: "seasonal",
    value:
      "radial-gradient(circle at 30% 25%, rgba(134,239,172,0.45), transparent 55%), radial-gradient(circle at 70% 70%, rgba(251,207,232,0.4), transparent 50%), radial-gradient(circle at 50% 50%, rgba(167,243,208,0.3), transparent 60%), linear-gradient(145deg, rgba(240,253,244,0.95), rgba(254,242,242,0.9))",
  },
  {
    id: "summer-heat",
    label: "Summer Heat",
    description: "Hot oranges with tropical vibes",
    category: "seasonal",
    value:
      "radial-gradient(circle at 25% 30%, rgba(251,146,60,0.5), transparent 50%), radial-gradient(circle at 75% 60%, rgba(251,191,36,0.45), transparent 55%), radial-gradient(circle at 50% 80%, rgba(248,113,113,0.35), transparent 60%), linear-gradient(145deg, rgba(255,247,237,0.95), rgba(254,243,199,0.9))",
  },
  {
    id: "autumn-leaves",
    label: "Autumn Leaves",
    description: "Rich browns with orange and gold",
    category: "seasonal",
    value:
      "radial-gradient(circle at 20% 25%, rgba(194,65,12,0.45), transparent 55%), radial-gradient(circle at 80% 70%, rgba(217,119,6,0.4), transparent 50%), radial-gradient(circle at 45% 50%, rgba(161,98,7,0.35), transparent 60%), linear-gradient(145deg, rgba(28,25,23,0.95), rgba(41,37,36,0.9))",
  },
  // Animated Gradients (CSS animation)
  {
    id: "aurora-borealis",
    label: "Aurora Borealis",
    description: "Animated northern lights effect",
    category: "animated",
    animated: true,
    value:
      "linear-gradient(45deg, rgba(16,185,129,0.4), rgba(59,130,246,0.4), rgba(168,85,247,0.4), rgba(16,185,129,0.4))",
  },
  {
    id: "lava-flow",
    label: "Lava Flow",
    description: "Animated molten lava gradient",
    category: "animated",
    animated: true,
    value:
      "linear-gradient(45deg, rgba(220,38,38,0.5), rgba(251,146,60,0.5), rgba(217,119,6,0.5), rgba(220,38,38,0.5))",
  },
  {
    id: "ocean-waves",
    label: "Ocean Waves",
    description: "Animated deep sea gradient",
    category: "animated",
    animated: true,
    value:
      "linear-gradient(45deg, rgba(6,182,212,0.5), rgba(59,130,246,0.5), rgba(14,165,233,0.5), rgba(6,182,212,0.5))",
  },
];

export const isMediaUrl = (url: string): boolean => {
  if (!url) return false;
  if (url.startsWith('data:image/') || url.startsWith('data:video/')) return true;
  const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov'];
  return mediaExtensions.some(ext => url.toLowerCase().includes(ext));
};

export const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  if (url.startsWith('data:video/')) return true;
  const videoExtensions = ['.mp4', '.webm', '.mov'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

export const isAnimatedWallpaper = (wallpaperId: string): boolean => {
  const preset = wallpaperPresets.find(p => p.id === wallpaperId);
  return preset?.animated ?? false;
};

export const applyThemeToDocument = (
  presetId: ThemePresetId,
  customWallpaper?: string | null,
  customBlur?: number,
  customOpacity?: number,
) => {
  if (typeof document === "undefined") return;
  const preset = themePresets[presetId] ?? themePresets.obsidian;
  const root = document.documentElement;
  root.dataset.themePreset = presetId;

  Object.entries(preset.tokens).forEach(([variable, value]) => {
    root.style.setProperty(variable, value);
  });

  const wallpaper = customWallpaper ?? preset.wallpaper.fallback;
  
  const isMedia = isMediaUrl(wallpaper);
  const isVideo = isVideoUrl(wallpaper);
  
  // Check if it's an animated gradient preset
  const animatedPreset = wallpaperPresets.find(p => p.value === wallpaper && p.animated);
  
  root.dataset.wallpaperType = isVideo ? 'video' : (isMedia ? 'image' : (animatedPreset ? 'animated' : 'gradient'));
  
  if (isMedia && !isVideo) {
    root.style.setProperty("--app-wallpaper-image", `url(${wallpaper})`);
  } else if (!isVideo) {
    root.style.setProperty("--app-wallpaper-image", wallpaper);
  }
  
  root.style.setProperty("--app-wallpaper-url", wallpaper);
  
  // Apply custom or default blur/opacity
  const blur = customBlur !== undefined ? `${customBlur}px` : preset.wallpaper.blur;
  const opacity = customOpacity !== undefined ? customOpacity.toString() : preset.wallpaper.opacity;
  
  root.style.setProperty("--app-wallpaper-blur", blur);
  root.style.setProperty("--app-wallpaper-opacity", opacity);
  
  // Handle video wallpaper
  let videoEl = document.getElementById('video-wallpaper') as HTMLVideoElement | null;
  
  if (isVideo) {
    if (!videoEl) {
      videoEl = document.createElement('video');
      videoEl.id = 'video-wallpaper';
      videoEl.autoplay = true;
      videoEl.loop = true;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        object-fit: cover;
        z-index: -1;
        opacity: var(--app-wallpaper-opacity, 0.5);
        pointer-events: none;
      `;
      document.body.prepend(videoEl);
    }
    videoEl.src = wallpaper;
    videoEl.style.display = 'block';
  } else if (videoEl) {
    videoEl.style.display = 'none';
    videoEl.src = '';
  }
};
