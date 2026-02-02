import { logger } from "@/lib/logger";

type CompressOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0..1 for jpeg/webp
};

function canCanvas(): boolean {
  return typeof document !== "undefined" && typeof HTMLCanvasElement !== "undefined";
}

function pickOutputMime(inputMime: string): "image/jpeg" | "image/webp" {
  // Prefer webp when possible, otherwise jpeg.
  if (inputMime === "image/webp") return "image/webp";
  return "image/jpeg";
}

export async function compressImageFile(
  file: File,
  opts: CompressOptions = {},
): Promise<{ blob: Blob; mimeType: string } | null> {
  try {
    if (!canCanvas()) return null;
    if (!file.type.startsWith("image/")) return null;
    // Don't compress animated gifs/svg.
    if (file.type === "image/gif" || file.type === "image/svg+xml") return null;

    // Support up to 4K images (3840x2160), with 2K (2560x1440) as a common middle ground
    const maxWidth = Math.max(256, Math.min(4096, Number(opts.maxWidth ?? 2560)));
    const maxHeight = Math.max(256, Math.min(4096, Number(opts.maxHeight ?? 2560)));
    const quality = Math.max(0.4, Math.min(0.95, Number(opts.quality ?? 0.85)));

    const bitmap = await createImageBitmap(file);

    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(bitmap, 0, 0, width, height);

    const outMime = pickOutputMime(file.type);

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(
        b => resolve(b),
        outMime,
        // ignored for png
        quality,
      ),
    );

    if (!blob) return null;

    // Only keep if smaller or scaling happened.
    if (blob.size >= file.size && scale === 1) return null;

    return { blob, mimeType: outMime };
  } catch (error) {
    logger.warn("compressImageFile failed", { error });
    return null;
  }
}
