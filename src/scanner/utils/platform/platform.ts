export type PlatformKind = "web" | "capacitor";

export function getPlatformKind(): PlatformKind {
  const w = window as any;
  if (w?.Capacitor?.isNativePlatform?.()) return "capacitor";
  if (w?.Capacitor) return "capacitor";
  return "web";
}
