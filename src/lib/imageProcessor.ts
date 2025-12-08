/**
 * Image Processing Utilities
 * Handles color inversion and other image transformations
 */

/**
 * Inverts the colors of an image
 * @param imageUrl - URL of the image to invert
 * @returns Promise resolving to a data URL of the inverted image
 */
export async function invertImageColors(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Invert colors (RGB)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];     // Red
        data[i + 1] = 255 - data[i + 1]; // Green
        data[i + 2] = 255 - data[i + 2]; // Blue
        // Alpha channel (data[i + 3]) remains unchanged
      }
      
      // Put inverted data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to data URL
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Batch invert multiple images
 * @param imageUrls - Array of image URLs to invert
 * @returns Promise resolving to an object mapping original URLs to inverted data URLs
 */
export async function batchInvertImages(
  imageUrls: string[]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  
  await Promise.allSettled(
    imageUrls.map(async (url) => {
      try {
        results[url] = await invertImageColors(url);
      } catch (error) {
        console.error(`Failed to invert image ${url}:`, error);
        // Fallback to original URL if inversion fails
        results[url] = url;
      }
    })
  );
  
  return results;
}

/**
 * Preload and cache inverted images
 * @param imageUrls - Array of image URLs to preload
 * @param onProgress - Optional progress callback
 */
export async function preloadInvertedImages(
  imageUrls: string[],
  onProgress?: (progress: number) => void
): Promise<Record<string, string>> {
  const total = imageUrls.length;
  let completed = 0;
  
  const results: Record<string, string> = {};
  
  for (const url of imageUrls) {
    try {
      results[url] = await invertImageColors(url);
      completed++;
      if (onProgress) {
        onProgress((completed / total) * 100);
      }
    } catch (error) {
      console.error(`Failed to preload image ${url}:`, error);
      results[url] = url; // Fallback
      completed++;
      if (onProgress) {
        onProgress((completed / total) * 100);
      }
    }
  }
  
  return results;
}

