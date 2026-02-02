function isSafeSegment(seg: string): boolean {
  if (!seg) return false;
  if (seg.includes("..")) return false;
  if (seg.includes("\\")) return false;
  if (seg.startsWith("/")) return false;
  return true;
}

export function sanitizeFileName(name: string): string {
  const base = String(name || "file").trim();
  // Keep extension if present.
  const cleaned = base
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^[-.]+/, "")
    .slice(0, 160);

  return cleaned || "file";
}

export function sanitizeFolder(folder?: string): string {
  if (!folder) return "";
  const raw = String(folder).trim().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!raw) return "";
  const parts = raw.split("/").filter(Boolean);
  const safe = parts.filter(p => isSafeSegment(p));
  return safe.join("/");
}

export function joinPath(...parts: Array<string | undefined | null>): string {
  return parts
    .filter((p): p is string => typeof p === "string" && p.length > 0)
    .map(p => String(p).replace(/^\/+/, "").replace(/\/+$/, ""))
    .filter(Boolean)
    .join("/");
}

export function randomId(len = 10): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  return out;
}
