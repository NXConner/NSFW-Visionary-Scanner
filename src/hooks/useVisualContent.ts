/**
 * Hook for managing visual content (images, GIFs, videos, animations)
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchVisualContentFromGitHub, type VisualContent, VISUAL_CONTENT_CATEGORIES, REPOSITORY_CONFIGS } from '@/lib/visualContentManager';
import { preloadInvertedImages } from '@/lib/imageProcessor';

interface UseVisualContentOptions {
  featureId?: string;
  categories?: string[];
  autoLoad?: boolean;
  autoInvert?: boolean;
  limit?: number;
}

interface UseVisualContentReturn {
  content: VisualContent[];
  isLoading: boolean;
  error: string | null;
  progress: number;
  refresh: () => Promise<void>;
}

export function useVisualContent(
  options: UseVisualContentOptions = {}
): UseVisualContentReturn {
  const {
    featureId,
    categories = [],
    autoLoad = true,
    autoInvert = true,
    limit,
  } = options;

  const [content, setContent] = useState<VisualContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Fetch from both repositories
      const [repo1Content, repo2Content] = await Promise.allSettled([
        fetchVisualContentFromGitHub(
          REPOSITORY_CONFIGS.RANDOM_SEX_POSITION.owner,
          REPOSITORY_CONFIGS.RANDOM_SEX_POSITION.repo,
          '',
          REPOSITORY_CONFIGS.RANDOM_SEX_POSITION.branch || 'main'
        ),
        fetchVisualContentFromGitHub(
          REPOSITORY_CONFIGS.SEX_POSITIONS.owner,
          REPOSITORY_CONFIGS.SEX_POSITIONS.repo,
          '',
          REPOSITORY_CONFIGS.SEX_POSITIONS.branch || 'main'
        ),
      ]);

      let allContent: VisualContent[] = [];

      if (repo1Content.status === 'fulfilled') {
        allContent.push(...repo1Content.value);
      }
      if (repo2Content.status === 'fulfilled') {
        allContent.push(...repo2Content.value);
      }

      // Filter by categories if provided
      if (categories.length > 0) {
        allContent = allContent.filter(item =>
          categories.some(cat => item.category.includes(cat) || item.tags.some(tag => tag.includes(cat)))
        );
      }

      // Apply limit
      if (limit) {
        allContent = allContent.slice(0, limit);
      }

      setProgress(50);
      setContent(allContent);

      // Invert images if requested
      if (autoInvert) {
        const imageUrls = allContent
          .filter(item => item.type === 'image')
          .map(item => item.url);

        if (imageUrls.length > 0) {
          const invertedImages = await preloadInvertedImages(imageUrls, (prog) => {
            setProgress(50 + (prog / 2));
          });

          // Update content with inverted URLs
          setContent(prevContent =>
            prevContent.map(item => {
              if (item.type === 'image' && invertedImages[item.url]) {
                return {
                  ...item,
                  url: invertedImages[item.url],
                  inverted: true,
                };
              }
              return item;
            })
          );
        }
      }

      setProgress(100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load visual content';
      setError(errorMessage);
      console.error('Error loading visual content:', err);
    } finally {
      setIsLoading(false);
    }
  }, [categories, autoInvert, limit]);

  useEffect(() => {
    if (autoLoad) {
      loadContent();
    }
  }, [autoLoad, loadContent]);

  return {
    content,
    isLoading,
    error,
    progress,
    refresh: loadContent,
  };
}

