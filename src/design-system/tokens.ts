export type ThemeCSSVariables = Record<string, string>;

export const spacingScale = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  xxl: "2rem",
} as const;

export const radiusScale = {
  sm: "0.65rem",
  md: "0.85rem",
  lg: "1.15rem",
  pill: "999px",
} as const;

export const shadowTokens = {
  focus: "0 0 0 3px hsl(var(--ring) / 0.5)",
  glow: "0 30px 120px -50px hsl(var(--primary) / 0.55)",
  card: "0 20px 60px -40px hsl(var(--foreground) / 0.25)",
} as const;

export const baseColorTokens: ThemeCSSVariables = {
  "--background": "240 10% 4%",
  "--foreground": "210 40% 98%",
  "--card": "240 10% 6%",
  "--card-foreground": "210 40% 98%",
  "--popover": "240 10% 6%",
  "--popover-foreground": "210 40% 98%",
  "--primary": "187 100% 42%",
  "--primary-foreground": "240 10% 4%",
  "--secondary": "240 10% 12%",
  "--secondary-foreground": "210 40% 98%",
  "--muted": "240 10% 14%",
  "--muted-foreground": "215 20% 55%",
  "--accent": "263 70% 50%",
  "--accent-foreground": "210 40% 98%",
  "--destructive": "0 84% 60%",
  "--destructive-foreground": "210 40% 98%",
  "--border": "240 10% 16%",
  "--input": "240 10% 16%",
  "--ring": "187 100% 42%",
  "--radius": "0.75rem",
};

export type TypographyScale = Record<
  "display" | "headline" | "title" | "subtitle" | "body" | "mono",
  {
    fontSize: string;
    lineHeight: string;
    letterSpacing?: string;
    fontWeight?: number;
    fontFamily?: string;
  }
>;
