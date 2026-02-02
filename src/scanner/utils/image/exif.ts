import { createCanvas, get2d } from "./canvas";
import { dataUrlToBlob } from "./imageIO";

export type ExifOrientation =
  | 1 // upright
  | 2 // flip horizontal
  | 3 // rotate 180
  | 4 // flip vertical
  | 5 // transpose
  | 6 // rotate 90 CW
  | 7 // transverse
  | 8; // rotate 270 CW

export type NormalizedOrientation =
  | "upright"
  | "rotated-90"
  | "rotated-180"
  | "rotated-270"
  | "unknown";

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function readUint16(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint16(offset, littleEndian);
}

function readUint32(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint32(offset, littleEndian);
}

/**
 * Best-effort EXIF orientation reader for JPEG.
 * Returns 1 (upright) when orientation is missing or not parseable.
 */
export function readJpegExifOrientation(bytes: Uint8Array): ExifOrientation | 1 {
  try {
    if (!isJpeg(bytes)) return 1;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    // Walk JPEG segments.
    let offset = 2; // after SOI 0xFFD8
    while (offset + 4 < bytes.length) {
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1]!;
      offset += 2;

      // Standalone markers.
      if (marker === 0xd9 || marker === 0xda) break; // EOI or SOS

      const size = view.getUint16(offset, false);
      if (size < 2) break;

      if (marker === 0xe1) {
        // APP1
        const app1Start = offset + 2;
        const app1End = offset + size;
        if (app1End > bytes.length) break;

        // "Exif\0\0"
        if (
          bytes[app1Start] === 0x45 &&
          bytes[app1Start + 1] === 0x78 &&
          bytes[app1Start + 2] === 0x69 &&
          bytes[app1Start + 3] === 0x66 &&
          bytes[app1Start + 4] === 0x00 &&
          bytes[app1Start + 5] === 0x00
        ) {
          const tiffStart = app1Start + 6;
          if (tiffStart + 8 > app1End) return 1;

          const byteOrder = readUint16(view, tiffStart, false);
          const littleEndian = byteOrder === 0x4949; // 'II'
          if (!littleEndian && byteOrder !== 0x4d4d) return 1; // 'MM'

          const magic = readUint16(view, tiffStart + 2, littleEndian);
          if (magic !== 0x002a) return 1;

          const ifd0Offset = readUint32(view, tiffStart + 4, littleEndian);
          const ifd0 = tiffStart + ifd0Offset;
          if (ifd0 + 2 > app1End) return 1;

          const entries = readUint16(view, ifd0, littleEndian);
          const eoff = ifd0 + 2;
          for (let i = 0; i < entries; i++) {
            const entry = eoff + i * 12;
            if (entry + 12 > app1End) break;
            const tag = readUint16(view, entry, littleEndian);
            if (tag !== 0x0112) continue; // Orientation
            const type = readUint16(view, entry + 2, littleEndian);
            const count = readUint32(view, entry + 4, littleEndian);
            // SHORT (3), count 1
            if (type !== 3 || count !== 1) return 1;
            const value = readUint16(view, entry + 8, littleEndian);
            if (value >= 1 && value <= 8) return value as ExifOrientation;
            return 1;
          }
        }
      }

      offset += size;
    }
  } catch {
    // ignore
  }
  return 1;
}

export function orientationLabelFromExif(o: ExifOrientation | 1): NormalizedOrientation {
  switch (o) {
    case 6:
      return "rotated-90";
    case 3:
      return "rotated-180";
    case 8:
      return "rotated-270";
    case 1:
      return "upright";
    default:
      // mirrored/transposed cases are handled by normalization but label as unknown for now.
      return "unknown";
  }
}

/**
 * Normalize image orientation based on EXIF metadata.
 *
 * - If EXIF orientation indicates rotation/mirroring, we re-render onto a canvas and return a new Blob.
 * - If image is already upright or not a JPEG/EXIF is missing, returns original Blob.
 */
export async function normalizeImageBlobOrientation(
  blob: Blob,
): Promise<{ blob: Blob; orientation: NormalizedOrientation; changed: boolean }> {
  try {
    const mime = blob.type || "image/jpeg";
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (!mime.includes("jpeg") && !mime.includes("jpg")) {
      return { blob, orientation: "unknown", changed: false };
    }

    const exif = readJpegExifOrientation(bytes);
    const label = orientationLabelFromExif(exif);
    if (exif === 1) return { blob, orientation: "upright", changed: false };

    if (typeof createImageBitmap !== "function") {
      // Can't normalize without bitmap decode; best-effort.
      return { blob, orientation: label, changed: false };
    }

    const bitmap = await createImageBitmap(blob);
    const srcW = bitmap.width;
    const srcH = bitmap.height;

    const rotated = exif === 6 || exif === 8 || exif === 5 || exif === 7;
    const outW = rotated ? srcH : srcW;
    const outH = rotated ? srcW : srcH;

    const canvas = createCanvas(outW, outH);
    const ctx = get2d(canvas) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

    // Apply transform for common EXIF orientations.
    // Reference: EXIF orientation definitions (1..8)
    switch (exif) {
      case 2: // flip horizontal
        ctx.translate(outW, 0);
        ctx.scale(-1, 1);
        break;
      case 3: // rotate 180
        ctx.translate(outW, outH);
        ctx.rotate(Math.PI);
        break;
      case 4: // flip vertical
        ctx.translate(0, outH);
        ctx.scale(1, -1);
        break;
      case 5: // transpose
        ctx.rotate(0.5 * Math.PI);
        ctx.scale(1, -1);
        break;
      case 6: // rotate 90 CW
        ctx.translate(outW, 0);
        ctx.rotate(0.5 * Math.PI);
        break;
      case 7: // transverse
        ctx.translate(outW, outH);
        ctx.rotate(0.5 * Math.PI);
        ctx.scale(-1, 1);
        break;
      case 8: // rotate 270 CW
        ctx.translate(0, outH);
        ctx.rotate(-0.5 * Math.PI);
        break;
    }

    ctx.drawImage(bitmap, 0, 0);

    const normalizedBlob: Blob =
      "convertToBlob" in canvas
        ? await (canvas as OffscreenCanvas).convertToBlob({ type: "image/jpeg", quality: 0.9 })
        : await new Promise<Blob>((resolve, reject) => {
            (canvas as HTMLCanvasElement).toBlob(
              b => (b ? resolve(b) : reject(new Error("Failed to encode normalized image"))),
              "image/jpeg",
              0.9,
            );
          });

    return { blob: normalizedBlob, orientation: label, changed: true };
  } catch {
    return { blob, orientation: "unknown", changed: false };
  }
}

export async function normalizeImageDataUrlOrientation(
  dataUrl: string,
): Promise<{ dataUrl: string; orientation: NormalizedOrientation; changed: boolean }> {
  const blob = await dataUrlToBlob(dataUrl);
  const normalized = await normalizeImageBlobOrientation(blob);
  if (!normalized.changed) return { dataUrl, orientation: normalized.orientation, changed: false };
  const { blobToDataUrl } = await import("./imageIO");
  const out = await blobToDataUrl(normalized.blob);
  return { dataUrl: out || dataUrl, orientation: normalized.orientation, changed: true };
}
