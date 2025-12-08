/**
 * Hook for managing position images from GitHub repositories
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchImagesFromMultipleRepos, REPOSITORY_CONFIGS, getGitHubImageUrl } from '@/lib/githubImageFetcher';
import { preloadInvertedImages } from '@/lib/imageProcessor';
import type { GitHubFile } from '@/lib/githubImageFetcher';

interface PositionImage {
  id: string;
  name: string;
  originalUrl: string;
  invertedUrl?: string;
  category?: string;
  tags?: string[];
}

interface UsePositionImagesReturn {
  images: PositionImage[];
  isLoading: boolean;
  error: string | null;
  progress: number;
  refresh: () => Promise<void>;
}

/**
 * Extracts position name and category from image filename
 */
function parseImageMetadata(file: GitHubFile): { name: string; category?: string; tags?: string[] } {
  const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
  
  // Try to extract category from path or filename
  const pathParts = file.path.split('/');
  const category = pathParts.length > 1 ? pathParts[pathParts.length - 2] : undefined;
  
  // Extract tags from filename (e.g., "missionary-intimate-beginner.jpg")
  const tags = nameWithoutExt.split('-').filter(part => part.length > 2);
  
  // Clean up name (capitalize, remove dashes)
  const name = nameWithoutExt
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return { name, category, tags };
}

/**
 * Hook for fetching and managing position images
 */
export function usePositionImages(
  autoLoad: boolean = true,
  autoInvert: boolean = true
): UsePositionImagesReturn {
  const [images, setImages] = useState<PositionImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const loadImages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Fetch images from both repositories
      const githubFiles = await fetchImagesFromMultipleRepos([
        REPOSITORY_CONFIGS.RANDOM_SEX_POSITION,
        REPOSITORY_CONFIGS.SEX_POSITIONS,
      ]);

      // Convert to PositionImage format
      const positionImages: PositionImage[] = githubFiles.map((file, index) => {
        const { name, category, tags } = parseImageMetadata(file);
        const originalUrl = getGitHubImageUrl(
          file.path.includes('raminr77') ? 'raminr77' : 'adminlove520',
          file.path.includes('raminr77') ? 'random-sex-position' : 'Sex-Positions',
          file.path,
          'main'
        );

        return {
          id: `position-${index}-${file.name}`,
          name,
          originalUrl: file.download_url || originalUrl,
          category,
          tags,
        };
      });

      setImages(positionImages);
      setProgress(50);

      // Invert images if requested
      if (autoInvert && positionImages.length > 0) {
        const imageUrls = positionImages.map(img => img.originalUrl);
        const invertedImages = await preloadInvertedImages(imageUrls, (prog) => {
          setProgress(50 + (prog / 2));
        });

        // Update images with inverted URLs
        setImages(prevImages =>
          prevImages.map(img => ({
            ...img,
            invertedUrl: invertedImages[img.originalUrl] || img.originalUrl,
          }))
        );
      }

      setProgress(100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load images';
      setError(errorMessage);
      console.error('Error loading position images:', err);
    } finally {
      setIsLoading(false);
    }
  }, [autoInvert]);

  useEffect(() => {
    if (autoLoad) {
      loadImages();
    }
  }, [autoLoad, loadImages]);

  return {
    images,
    isLoading,
    error,
    progress,
    refresh: loadImages,
  };
}

