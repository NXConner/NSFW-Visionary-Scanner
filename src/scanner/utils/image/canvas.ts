import { blobToDataUrl, dataUrlToBlob } from "./imageIO";

export type CanvasLike = HTMLCanvasElement | OffscreenCanvas;

export function createCanvas(width: number, height: number): CanvasLike {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  return c;
}

export function get2d(
  canvas: CanvasLike,
): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create 2D canvas context");
  return ctx as any;
}

export async function decodeDataUrlToImageBitmap(dataUrl: string): Promise<ImageBitmap> {
  const blob = await dataUrlToBlob(dataUrl);
  if (typeof createImageBitmap !== "function") {
    throw new Error("createImageBitmap is not available in this environment");
  }
  return await createImageBitmap(blob);
}

export function canvasToImageData(canvas: CanvasLike): ImageData {
  const ctx = get2d(canvas);
  const w = (canvas as any).width as number;
  const h = (canvas as any).height as number;
  return (ctx as any).getImageData(0, 0, w, h) as ImageData;
}

export async function canvasToDataUrl(
  canvas: CanvasLike,
  opts: { mimeType?: "image/jpeg" | "image/webp" | "image/png"; quality?: number } = {},
): Promise<string> {
  const mimeType = opts.mimeType ?? "image/jpeg";
  const quality = Math.max(0.4, Math.min(0.95, Number(opts.quality ?? 0.88)));

  if ("convertToBlob" in canvas) {
    const blob = await (canvas as OffscreenCanvas).convertToBlob({ type: mimeType, quality });
    return await blobToDataUrl(blob);
  }

  const htmlCanvas = canvas as HTMLCanvasElement;
  const blob = await new Promise<Blob>((resolve, reject) => {
    htmlCanvas.toBlob(
      b => (b ? resolve(b) : reject(new Error("Failed to encode canvas"))),
      mimeType,
      quality,
    );
  });
  return await blobToDataUrl(blob);
}

export async function resizeToMax(
  bitmap: ImageBitmap,
  maxDim: number,
): Promise<{ canvas: CanvasLike; scale: number }> {
  const srcW = bitmap.width;
  const srcH = bitmap.height;
  const scale = Math.min(1, maxDim / srcW, maxDim / srcH);
  const outW = Math.max(1, Math.round(srcW * scale));
  const outH = Math.max(1, Math.round(srcH * scale));
  const canvas = createCanvas(outW, outH);
  const ctx = get2d(canvas);
  (ctx as any).drawImage(bitmap, 0, 0, outW, outH);
  return { canvas, scale };
}

