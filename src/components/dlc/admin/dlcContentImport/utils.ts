export function splitPipeList(v: string): string[] {
  return String(v || "")
    .split("|")
    .map(x => x.trim())
    .filter(Boolean);
}

export function toBool(v: string): boolean {
  const s = String(v || "")
    .trim()
    .toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

export function sanitizeName(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function sanitizeFilename(fileName: string): string {
  return String(fileName || "asset.bin")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 128);
}
