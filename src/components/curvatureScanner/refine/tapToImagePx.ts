export type ImageTapMappingInput = {
  containerRect: DOMRect;
  naturalWidth: number;
  naturalHeight: number;
  clientX: number;
  clientY: number;
};

export type ImageTapMappingResult =
  | {
      kind: "hit";
      xPx: number;
      yPx: number;
      xPct: number;
      yPct: number;
    }
  | { kind: "miss" };

/**
 * Maps a pointer tap inside an object-contain container to intrinsic image pixels.
 * Returns miss when the user taps inside the letterbox (outside the rendered image content).
 */
export function mapObjectContainTapToImagePx(input: ImageTapMappingInput): ImageTapMappingResult {
  const { containerRect, naturalWidth, naturalHeight, clientX, clientY } = input;

  if (!Number.isFinite(naturalWidth) || !Number.isFinite(naturalHeight) || naturalWidth <= 0 || naturalHeight <= 0) {
    return { kind: "miss" };
  }

  const W = containerRect.width;
  const H = containerRect.height;
  if (!Number.isFinite(W) || !Number.isFinite(H) || W <= 0 || H <= 0) return { kind: "miss" };

  const x = clientX - containerRect.left;
  const y = clientY - containerRect.top;

  const scale = Math.min(W / naturalWidth, H / naturalHeight);
  const dispW = naturalWidth * scale;
  const dispH = naturalHeight * scale;
  const offsetX = (W - dispW) / 2;
  const offsetY = (H - dispH) / 2;

  const inX = x - offsetX;
  const inY = y - offsetY;

  if (inX < 0 || inY < 0 || inX > dispW || inY > dispH) return { kind: "miss" };

  const xPx = inX / scale;
  const yPx = inY / scale;

  const clampedX = Math.max(0, Math.min(naturalWidth, xPx));
  const clampedY = Math.max(0, Math.min(naturalHeight, yPx));

  return {
    kind: "hit",
    xPx: clampedX,
    yPx: clampedY,
    xPct: (clampedX / naturalWidth) * 100,
    yPct: (clampedY / naturalHeight) * 100,
  };
}

