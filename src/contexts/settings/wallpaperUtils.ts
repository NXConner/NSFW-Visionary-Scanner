export function getWallpaperExtHintFromFile(file: File): string | undefined {
  const name = file.name || "";
  const ext = name.split(".").pop();
  return ext ? ext.toLowerCase() : undefined;
}

export function inferExtFromBlobType(blob: Blob): string {
  const t = blob.type || "";
  if (t.includes("webm")) return "webm";
  if (t.includes("mp4")) return "mp4";
  if (t.includes("quicktime")) return "mov";
  if (t.includes("png")) return "png";
  if (t.includes("gif")) return "gif";
  if (t.includes("webp")) return "webp";
  if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
  return "bin";
}
