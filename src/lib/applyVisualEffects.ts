/**
 * Apply Visual Effects to Images
 *
 * Utility to apply enabled visual filters to captured scanner images
 */

import {
  applyFilter,
  imageToCanvas,
  getImageData,
  putImageData,
  canvasToDataURL,
  type FilterType,
} from "./imageFilters";
import { getEnabledFilters } from "./visualEffectsSettings";

/**
 * Apply all enabled visual effects to a data URL image
 * Returns the filtered image as a data URL
 */
export async function applyVisualEffectsToDataURL(dataURL: string): Promise<string> {
  try {
    const enabledFilters = getEnabledFilters();

    // If no filters enabled, return original
    if (enabledFilters.length === 0) {
      return dataURL;
    }

    // Load image from data URL
    const img = await loadImageFromDataURL(dataURL);

    // Convert to canvas
    const canvas = imageToCanvas(img);

    // Get image data
    let imageData = getImageData(canvas);

    // Apply each enabled filter sequentially
    for (const filter of enabledFilters) {
      const filterType = convertFilterKeyToType(filter.type);
      if (filterType) {
        imageData = applyFilter(imageData, filterType, filter.options);
      }
    }

    // Put filtered image data back to canvas
    putImageData(canvas, imageData);

    // Convert to data URL
    return canvasToDataURL(canvas, "image/jpeg");
  } catch (error) {
    // If any error occurs, return original image
    console.error("Error applying visual effects:", error);
    return dataURL;
  }
}

/**
 * Load an image from a data URL
 */
function loadImageFromDataURL(dataURL: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Allows canvas readback for CORS-enabled images (no-op for data: URLs).
    img.crossOrigin = "anonymous";
    // Hint to decode off the main thread when possible.
    (img as any).decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataURL;
  });
}

/**
 * Convert filter settings key to filter type
 */
function convertFilterKeyToType(key: string): FilterType | null {
  const mapping: Record<string, FilterType> = {
    celShading: "celShading",
    graphicNovel: "graphicNovel",
    conceptArt: "conceptArt",
    inkedConceptArt: "inkedConceptArt",
    sobel: "sobel",
  };
  return mapping[key] || null;
}

/**
 * Check if any visual effects are enabled
 */
export function hasEnabledVisualEffects(): boolean {
  const enabledFilters = getEnabledFilters();
  return enabledFilters.length > 0;
}
