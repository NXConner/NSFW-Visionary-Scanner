/**
 * Visual Content Management System
 * Manages NSFW images, GIFs, videos, and animations for educational and demonstrational content
 * Supports SFW filtering for store-compliant versions
 */

import { isSFW, hasNSFWContent } from './featureFlags'

export interface VisualContent {
  id: string;
  type: 'image' | 'gif' | 'video' | 'animation';
  url: string;
  thumbnail?: string;
  category: string;
  tags: string[];
  title?: string;
  description?: string;
  duration?: number; // for videos
  inverted?: boolean; // if colors are inverted
}

export interface VisualContentCollection {
  id: string;
  name: string;
  description: string;
  category: string;
  items: VisualContent[];
}

/**
 * Repository configurations for fetching visual content
 */
export const REPOSITORY_CONFIGS = {
  RANDOM_SEX_POSITION: {
    owner: 'raminr77',
    repo: 'random-sex-position',
    branch: 'main',
  },
  SEX_POSITIONS: {
    owner: 'adminlove520',
    repo: 'Sex-Positions',
    branch: 'main',
  },
} as const;

/**
 * Fetches visual content from GitHub repositories
 */
export async function fetchVisualContentFromGitHub(
  owner: string,
  repo: string,
  path: string = '',
  branch: string = 'main'
): Promise<VisualContent[]> {
  // Check if NSFW content is available before fetching
  const nsfwAvailable = await hasNSFWContent()
  if (isSFW() || !nsfwAvailable) {
    return []
  }
  
  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const files = await response.json();
    const content: VisualContent[] = [];

    for (const file of Array.isArray(files) ? files : [files]) {
      if (file.type === 'file') {
        const extension = file.name.split('.').pop()?.toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(extension || '');
        const isGif = extension === 'gif';
        const isVideo = ['mp4', 'webm', 'mov'].includes(extension || '');

        if (isImage || isGif || isVideo) {
          content.push({
            id: `github-${file.sha}`,
            type: isGif ? 'gif' : isVideo ? 'video' : 'image',
            url: file.download_url,
            category: path.split('/').pop() || 'general',
            tags: file.name.toLowerCase().replace(/\.[^/.]+$/, '').split(/[-_\s]+/),
            title: file.name.replace(/\.[^/.]+$/, ''),
          });
        }
      } else if (file.type === 'dir') {
        // Recursively fetch from subdirectories
        const subContent = await fetchVisualContentFromGitHub(owner, repo, file.path, branch);
        content.push(...subContent);
      }
    }

    return content;
  } catch (error) {
    console.error('Error fetching visual content from GitHub:', error);
    return [];
  }
}

/**
 * Gets visual content for a specific feature/component
 * Returns empty array if SFW mode and content is NSFW
 */
export async function getVisualContentForFeature(
  featureId: string,
  category?: string
): Promise<VisualContent[]> {
  // Check if NSFW content is available
  const nsfwAvailable = await hasNSFWContent()
  
  // If SFW mode and this is NSFW content, return empty
  if (isSFW() || !nsfwAvailable) {
    // Check if this feature requires NSFW content
    const nsfwFeatures = ['positions-gallery', 'positions', 'visual-content']
    if (nsfwFeatures.includes(featureId.toLowerCase())) {
      return []
    }
  }
  
  // This would typically fetch from a database or API
  // For now, returns empty array - will be populated by GitHub fetcher
  return []
}

/**
 * Categorizes visual content by feature area
 */
export const VISUAL_CONTENT_CATEGORIES = {
  POSITIONS: 'positions',
  EDUCATIONAL: 'educational',
  HEALTH_CONDITIONS: 'health-conditions',
  EXERCISES: 'exercises',
  EQUIPMENT: 'equipment',
  TECHNIQUES: 'techniques',
  TUTORIALS: 'tutorials',
  ANATOMY: 'anatomy',
  SYMPTOMS: 'symptoms',
  TREATMENT: 'treatment',
  PROGRESS: 'progress',
  MEASUREMENT: 'measurement',
  SAFETY: 'safety',
} as const;

/**
 * Maps features to visual content categories
 */
export const FEATURE_VISUAL_MAP: Record<string, string[]> = {
  'positions-gallery': [VISUAL_CONTENT_CATEGORIES.POSITIONS],
  'educational-content': [
    VISUAL_CONTENT_CATEGORIES.EDUCATIONAL,
    VISUAL_CONTENT_CATEGORIES.ANATOMY,
    VISUAL_CONTENT_CATEGORIES.HEALTH_CONDITIONS,
  ],
  'education-center': [
    VISUAL_CONTENT_CATEGORIES.HEALTH_CONDITIONS,
    VISUAL_CONTENT_CATEGORIES.SYMPTOMS,
    VISUAL_CONTENT_CATEGORIES.TREATMENT,
  ],
  'mens-health-guide': [
    VISUAL_CONTENT_CATEGORIES.EXERCISES,
    VISUAL_CONTENT_CATEGORIES.EQUIPMENT,
    VISUAL_CONTENT_CATEGORIES.TECHNIQUES,
  ],
  'pe-routine-builder': [
    VISUAL_CONTENT_CATEGORIES.EXERCISES,
    VISUAL_CONTENT_CATEGORIES.TUTORIALS,
  ],
  'pumping-section': [
    VISUAL_CONTENT_CATEGORIES.EQUIPMENT,
    VISUAL_CONTENT_CATEGORIES.TECHNIQUES,
    VISUAL_CONTENT_CATEGORIES.SAFETY,
  ],
  'scanner-section': [
    VISUAL_CONTENT_CATEGORIES.MEASUREMENT,
    VISUAL_CONTENT_CATEGORIES.TUTORIALS,
  ],
  'scanner-tutorial': [
    VISUAL_CONTENT_CATEGORIES.TUTORIALS,
    VISUAL_CONTENT_CATEGORIES.MEASUREMENT,
  ],
  'onboarding-tutorial': [VISUAL_CONTENT_CATEGORIES.TUTORIALS],
  'ar-measurement-guides': [
    VISUAL_CONTENT_CATEGORIES.MEASUREMENT,
    VISUAL_CONTENT_CATEGORIES.TUTORIALS,
  ],
  'emergency-guidance': [
    VISUAL_CONTENT_CATEGORIES.SAFETY,
    VISUAL_CONTENT_CATEGORIES.SYMPTOMS,
  ],
  'progress-photos': [VISUAL_CONTENT_CATEGORIES.PROGRESS],
  'pe-progress-photos': [VISUAL_CONTENT_CATEGORIES.PROGRESS],
  'ai-scan-analysis': [
    VISUAL_CONTENT_CATEGORIES.ANATOMY,
    VISUAL_CONTENT_CATEGORIES.HEALTH_CONDITIONS,
  ],
} as const;

