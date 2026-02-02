import type { Vec2 } from "@/scanner/utils/math/geometry";
import {
  blobToDataUrl,
  createCanvas,
  decodeDataUrlToImageBitmap,
  get2d,
} from "@/scanner/utils/image";

export interface AnnotationOptions {
  strokeWidth?: number;
}

type AnnotateBaseArgs = {
  centerline: Vec2[];
  curvatureAngleDeg: number;
  lengthLabel: string;
  girthLabel?: string;
  confidence: number;
  opts?: AnnotationOptions;
};

export async function annotateImageToBlob({
  originalImageDataUrl,
  originalBitmap,
  centerline,
  curvatureAngleDeg,
  lengthLabel,
  girthLabel,
  confidence,
  opts,
}: {
  originalImageDataUrl?: string;
  originalBitmap?: ImageBitmap;
} & AnnotateBaseArgs): Promise<Blob> {
  const bitmap =
    originalBitmap ??
    (originalImageDataUrl ? await decodeDataUrlToImageBitmap(originalImageDataUrl) : null);
  if (!bitmap) throw new Error("annotateImageToBlob: missing source image");
  const canvas = createCanvas(bitmap.width, bitmap.height);
  const ctx = get2d(canvas);

  (ctx as any).drawImage(bitmap, 0, 0);

  // Render centerline (scaled to original coords if needed is handled by caller).
  const sw = Math.max(2, Math.min(8, opts?.strokeWidth ?? 4));
  (ctx as any).lineWidth = sw;
  (ctx as any).lineJoin = "round";
  (ctx as any).lineCap = "round";
  (ctx as any).strokeStyle = "rgba(56, 189, 248, 0.92)"; // cyan-ish

  if (centerline.length >= 2) {
    (ctx as any).beginPath();
    (ctx as any).moveTo(centerline[0]!.x, centerline[0]!.y);
    for (let i = 1; i < centerline.length; i++) {
      (ctx as any).lineTo(centerline[i]!.x, centerline[i]!.y);
    }
    (ctx as any).stroke();

    const p0 = centerline[0]!;
    const p1 = centerline[centerline.length - 1]!;
    (ctx as any).fillStyle = "rgba(255,255,255,0.95)";
    (ctx as any).strokeStyle = "rgba(0,0,0,0.5)";
    (ctx as any).lineWidth = Math.max(1, sw * 0.6);

    for (const p of [p0, p1]) {
      (ctx as any).beginPath();
      (ctx as any).arc(p.x, p.y, sw * 1.4, 0, Math.PI * 2);
      (ctx as any).fill();
      (ctx as any).stroke();
    }
  }

  // Label box
  const pad = 10;
  const girthPart = girthLabel ? `   Girth: ${girthLabel}` : "";
  const text = `Curvature: ${curvatureAngleDeg.toFixed(0)}°   Length: ${lengthLabel}${girthPart}   Confidence: ${Math.round(
    confidence,
  )}%`;
  (ctx as any).font = "600 18px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
  const metrics = (ctx as any).measureText(text);
  const boxW = Math.min(bitmap.width - 24, Math.ceil(metrics.width) + pad * 2);
  const boxH = 44;
  const x = 12;
  const y = 12;
  (ctx as any).fillStyle = "rgba(0,0,0,0.55)";
  (ctx as any).fillRect(x, y, boxW, boxH);
  (ctx as any).strokeStyle = "rgba(255,255,255,0.18)";
  (ctx as any).strokeRect(x, y, boxW, boxH);
  (ctx as any).fillStyle = "rgba(255,255,255,0.95)";
  (ctx as any).fillText(text, x + pad, y + 28);

  const outBlob: Blob =
    "convertToBlob" in canvas
      ? await (canvas as OffscreenCanvas).convertToBlob({ type: "image/jpeg", quality: 0.9 })
      : await new Promise<Blob>((resolve, reject) => {
          (canvas as HTMLCanvasElement).toBlob(
            b => (b ? resolve(b) : reject(new Error("Failed to encode annotated image"))),
            "image/jpeg",
            0.9,
          );
        });

  return outBlob;
}

export async function annotateImage(
  args: { originalImageDataUrl: string } & AnnotateBaseArgs,
): Promise<string> {
  const blob = await annotateImageToBlob({
    ...args,
    originalImageDataUrl: args.originalImageDataUrl,
  });
  return await blobToDataUrl(blob);
}
