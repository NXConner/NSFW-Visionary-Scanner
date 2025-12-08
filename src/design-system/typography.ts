import type { TypographyScale } from "./tokens";

export const typographyScale: TypographyScale = {
  display: {
    fontSize: "clamp(2.75rem, 4vw, 4.5rem)",
    lineHeight: "1.05",
    fontWeight: 700,
  },
  headline: {
    fontSize: "clamp(2rem, 3vw, 3rem)",
    lineHeight: "1.1",
    fontWeight: 600,
  },
  title: {
    fontSize: "clamp(1.5rem, 2vw, 2rem)",
    lineHeight: "1.2",
    fontWeight: 600,
  },
  subtitle: {
    fontSize: "1.125rem",
    lineHeight: "1.5",
    fontWeight: 500,
  },
  body: {
    fontSize: "1rem",
    lineHeight: "1.7",
    fontWeight: 400,
  },
  mono: {
    fontSize: "0.95rem",
    lineHeight: "1.4",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.01em",
  },
};
