/**
 * Image Filters Library
 *
 * Provides 5 visual effects for scanner images:
 * 1. Cel-Shading (anime/cartoon style)
 * 2. Graphic Novel (high contrast comic book style)
 * 3. Concept Art (artistic sketch with color wash)
 * 4. Inked Concept Art (strong ink lines with paper texture)
 * 5. Sobel Filter (edge detection)
 */

// ============================================
// Filter Types and Interfaces
// ============================================

export interface CelShadingOptions {
  levels?: number; // Number of color levels (2-8)
  edgeThreshold?: number; // Edge detection threshold (0-1)
  edgeColor?: string; // Color for edges (hex)
}

export interface GraphicNovelOptions {
  contrast?: number; // Contrast multiplier (0-2)
  saturation?: number; // Saturation multiplier (0-2)
  halftone?: number; // Halftone pattern intensity (0-1)
}

export interface ConceptArtOptions {
  sketch?: number; // Sketch effect intensity (0-1)
  colorWash?: number; // Color overlay intensity (0-1)
  vignette?: number; // Vignette effect (0-1)
}

export interface InkedConceptArtOptions {
  inkThickness?: number; // Ink line thickness (1-5)
  inkColor?: string; // Ink color (hex)
  paperTexture?: number; // Paper texture intensity (0-1)
}

export interface SobelFilterOptions {
  threshold?: number; // Edge threshold (0-255)
  invert?: boolean; // Invert black/white
  blur?: number; // Pre-blur amount (0-10)
}

export type FilterOptions =
  | CelShadingOptions
  | GraphicNovelOptions
  | ConceptArtOptions
  | InkedConceptArtOptions
  | SobelFilterOptions;

// ============================================
// Utility Functions
// ============================================

/**
 * Create a canvas from an image element
 */
export function imageToCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  // IMPORTANT:
  // `HTMLImageElement.width/height` are layout attributes and may be 0 even after load.
  // For data-URL images (scanner captures), we must use the intrinsic dimensions.
  const w = Math.max(1, Number(image.naturalWidth || image.width || 0));
  const h = Math.max(1, Number(image.naturalHeight || image.height || 0));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.drawImage(image, 0, 0, w, h);
  return canvas;
}

/**
 * Convert canvas to data URL
 */
export function canvasToDataURL(canvas: HTMLCanvasElement, format: string = "image/png"): string {
  return canvas.toDataURL(format);
}

/**
 * Get image data from canvas
 */
export function getImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Put image data to canvas
 */
export function putImageData(canvas: HTMLCanvasElement, imageData: ImageData): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// ============================================
// Filter 1: Cel-Shading
// ============================================

/**
 * Apply cel-shading (anime/cartoon style) filter
 * Posterizes colors and adds edge detection
 */
export function applyCelShading(imageData: ImageData, options: CelShadingOptions = {}): ImageData {
  const { levels = 4, edgeThreshold = 0.3, edgeColor = "#000000" } = options;

  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new ImageData(width, height);
  const edge = hexToRgb(edgeColor);

  // Posterize colors
  const levelStep = 255 / (levels - 1);
  for (let i = 0; i < data.length; i += 4) {
    output.data[i] = Math.round(data[i] / levelStep) * levelStep;
    output.data[i + 1] = Math.round(data[i + 1] / levelStep) * levelStep;
    output.data[i + 2] = Math.round(data[i + 2] / levelStep) * levelStep;
    output.data[i + 3] = data[i + 3];
  }

  // Edge detection using Sobel operator
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // Sobel kernels
      let gx = 0,
        gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const kidx = ((y + ky) * width + (x + kx)) * 4;
          const gray = (data[kidx] + data[kidx + 1] + data[kidx + 2]) / 3;

          // Sobel X
          if (kx === -1) gx -= gray * (ky === 0 ? 2 : 1);
          if (kx === 1) gx += gray * (ky === 0 ? 2 : 1);

          // Sobel Y
          if (ky === -1) gy -= gray * (kx === 0 ? 2 : 1);
          if (ky === 1) gy += gray * (kx === 0 ? 2 : 1);
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy) / 255;

      if (magnitude > edgeThreshold) {
        output.data[idx] = edge.r;
        output.data[idx + 1] = edge.g;
        output.data[idx + 2] = edge.b;
      }
    }
  }

  return output;
}

// ============================================
// Filter 2: Graphic Novel
// ============================================

/**
 * Apply graphic novel (comic book) filter
 * High contrast with halftone pattern
 */
export function applyGraphicNovel(
  imageData: ImageData,
  options: GraphicNovelOptions = {},
): ImageData {
  const { contrast = 1.5, saturation = 1.2, halftone = 0.3 } = options;

  const data = imageData.data;
  const output = new ImageData(imageData.width, imageData.height);

  for (let i = 0; i < data.length; i += 4) {
    // Apply contrast
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r = clamp(((r / 255 - 0.5) * contrast + 0.5) * 255, 0, 255);
    g = clamp(((g / 255 - 0.5) * contrast + 0.5) * 255, 0, 255);
    b = clamp(((b / 255 - 0.5) * contrast + 0.5) * 255, 0, 255);

    // Apply saturation
    const gray = (r + g + b) / 3;
    r = clamp(gray + (r - gray) * saturation, 0, 255);
    g = clamp(gray + (g - gray) * saturation, 0, 255);
    b = clamp(gray + (b - gray) * saturation, 0, 255);

    // Apply halftone pattern
    const x = (i / 4) % imageData.width;
    const y = Math.floor(i / 4 / imageData.width);
    const pattern = (Math.sin(x / 3) + Math.sin(y / 3)) / 2;
    const halftoneEffect = 1 - halftone * pattern * 0.5;

    output.data[i] = r * halftoneEffect;
    output.data[i + 1] = g * halftoneEffect;
    output.data[i + 2] = b * halftoneEffect;
    output.data[i + 3] = data[i + 3];
  }

  return output;
}

// ============================================
// Filter 3: Concept Art
// ============================================

/**
 * Apply concept art filter
 * Sketch effect with color wash
 */
export function applyConceptArt(imageData: ImageData, options: ConceptArtOptions = {}): ImageData {
  const { sketch = 0.5, colorWash = 0.4, vignette = 0.3 } = options;

  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new ImageData(width, height);

  // Edge detection for sketch effect
  const edges = new Uint8Array(data.length / 4);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const pidx = idx * 4;

      let gx = 0,
        gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const kidx = ((y + ky) * width + (x + kx)) * 4;
          const gray = (data[kidx] + data[kidx + 1] + data[kidx + 2]) / 3;

          if (kx === -1) gx -= gray;
          if (kx === 1) gx += gray;
          if (ky === -1) gy -= gray;
          if (ky === 1) gy += gray;
        }
      }

      edges[idx] = Math.sqrt(gx * gx + gy * gy) / 255;
    }
  }

  // Apply sketch and color wash
  for (let i = 0; i < data.length; i += 4) {
    const idx = i / 4;
    const x = idx % width;
    const y = Math.floor(idx / width);

    const edge = edges[idx] || 0;
    const sketchIntensity = edge * sketch * 255;

    // Color wash
    const r = data[i] * (1 - colorWash) + 255 * colorWash;
    const g = data[i + 1] * (1 - colorWash) + 240 * colorWash;
    const b = data[i + 2] * (1 - colorWash) + 220 * colorWash;

    // Vignette
    const cx = width / 2;
    const cy = height / 2;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    const maxDist = Math.sqrt(cx ** 2 + cy ** 2);
    const vignetteEffect = 1 - (dist / maxDist) * vignette;

    output.data[i] = Math.max(0, r * vignetteEffect - sketchIntensity);
    output.data[i + 1] = Math.max(0, g * vignetteEffect - sketchIntensity);
    output.data[i + 2] = Math.max(0, b * vignetteEffect - sketchIntensity);
    output.data[i + 3] = data[i + 3];
  }

  return output;
}

// ============================================
// Filter 4: Inked Concept Art
// ============================================

/**
 * Apply inked concept art filter
 * Strong ink lines with paper texture
 */
export function applyInkedConceptArt(
  imageData: ImageData,
  options: InkedConceptArtOptions = {},
): ImageData {
  const { inkThickness = 2, inkColor = "#000000", paperTexture = 0.2 } = options;

  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new ImageData(width, height);
  const ink = hexToRgb(inkColor);

  // Strong edge detection for ink lines
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      let gx = 0,
        gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const kidx = ((y + ky) * width + (x + kx)) * 4;
          const gray = (data[kidx] + data[kidx + 1] + data[kidx + 2]) / 3;

          const kxWeight = kx === 0 ? 2 : 1;
          const kyWeight = ky === 0 ? 2 : 1;

          if (kx === -1) gx -= gray * kxWeight;
          if (kx === 1) gx += gray * kxWeight;
          if (ky === -1) gy -= gray * kyWeight;
          if (ky === 1) gy += gray * kyWeight;
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy) / 255;
      const threshold = 0.1 / inkThickness;

      if (magnitude > threshold) {
        // Ink lines
        output.data[idx] = ink.r;
        output.data[idx + 1] = ink.g;
        output.data[idx + 2] = ink.b;
      } else {
        // Paper with texture
        const noise = (Math.random() - 0.5) * paperTexture * 50;
        const paper = 245 + noise;
        output.data[idx] = paper;
        output.data[idx + 1] = paper;
        output.data[idx + 2] = paper;
      }
      output.data[idx + 3] = data[idx + 3];
    }
  }

  return output;
}

// ============================================
// Filter 5: Sobel Filter
// ============================================

/**
 * Apply Sobel edge detection filter
 */
export function applySobelFilter(
  imageData: ImageData,
  options: SobelFilterOptions = {},
): ImageData {
  const { threshold = 50, invert = false, blur = 0 } = options;

  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  let workingData = new Uint8ClampedArray(data);

  // Apply blur if needed
  if (blur > 0) {
    const blurred = new Uint8ClampedArray(data.length);
    const radius = Math.floor(blur);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0,
          count = 0;

        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const px = x + kx;
            const py = y + ky;

            if (px >= 0 && px < width && py >= 0 && py < height) {
              const idx = (py * width + px) * 4;
              r += data[idx];
              g += data[idx + 1];
              b += data[idx + 2];
              count++;
            }
          }
        }

        const idx = (y * width + x) * 4;
        blurred[idx] = r / count;
        blurred[idx + 1] = g / count;
        blurred[idx + 2] = b / count;
        blurred[idx + 3] = data[idx + 3];
      }
    }

    workingData = blurred;
  }

  const output = new ImageData(width, height);

  // Sobel edge detection
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      let gx = 0,
        gy = 0;

      // Sobel kernels
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const kidx = ((y + ky) * width + (x + kx)) * 4;
          const gray = (workingData[kidx] + workingData[kidx + 1] + workingData[kidx + 2]) / 3;

          // X gradient
          if (kx === -1) gx -= gray * (ky === 0 ? 2 : 1);
          if (kx === 1) gx += gray * (ky === 0 ? 2 : 1);

          // Y gradient
          if (ky === -1) gy -= gray * (kx === 0 ? 2 : 1);
          if (ky === 1) gy += gray * (kx === 0 ? 2 : 1);
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const edge = magnitude > threshold ? 255 : 0;
      const value = invert ? 255 - edge : edge;

      output.data[idx] = value;
      output.data[idx + 1] = value;
      output.data[idx + 2] = value;
      output.data[idx + 3] = data[idx + 3];
    }
  }

  return output;
}

// ============================================
// Filter Application Helper
// ============================================

export type FilterType = "celShading" | "graphicNovel" | "conceptArt" | "inkedConceptArt" | "sobel";

/**
 * Apply a filter by name with options
 */
export function applyFilter(
  imageData: ImageData,
  filterType: FilterType,
  options: FilterOptions = {},
): ImageData {
  switch (filterType) {
    case "celShading":
      return applyCelShading(imageData, options as CelShadingOptions);
    case "graphicNovel":
      return applyGraphicNovel(imageData, options as GraphicNovelOptions);
    case "conceptArt":
      return applyConceptArt(imageData, options as ConceptArtOptions);
    case "inkedConceptArt":
      return applyInkedConceptArt(imageData, options as InkedConceptArtOptions);
    case "sobel":
      return applySobelFilter(imageData, options as SobelFilterOptions);
    default:
      return imageData;
  }
}

/**
 * Apply filter to an image element
 */
export function applyFilterToImage(
  image: HTMLImageElement,
  filterType: FilterType,
  options: FilterOptions = {},
): string {
  const canvas = imageToCanvas(image);
  const imageData = getImageData(canvas);
  const filtered = applyFilter(imageData, filterType, options);
  putImageData(canvas, filtered);
  return canvasToDataURL(canvas);
}
