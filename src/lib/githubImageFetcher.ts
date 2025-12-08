/**
 * GitHub Repository Image Fetcher
 * Fetches images from GitHub repositories
 */

interface GitHubFile {
  name: string;
  path: string;
  download_url: string;
  type: 'file' | 'dir';
  size: number;
}

interface GitHubRepoConfig {
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
}

/**
 * Fetches files from a GitHub repository
 * @param config - Repository configuration
 * @returns Promise resolving to array of file information
 */
export async function fetchGitHubFiles(
  config: GitHubRepoConfig
): Promise<GitHubFile[]> {
  const { owner, repo, branch = 'main', path = '' } = config;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle both single file and directory responses
    if (Array.isArray(data)) {
      return data;
    } else {
      return [data];
    }
  } catch (error) {
    console.error('Error fetching from GitHub:', error);
    throw error;
  }
}

/**
 * Fetches image files from GitHub repository
 * @param config - Repository configuration
 * @param imageExtensions - Array of image file extensions to filter (default: ['jpg', 'jpeg', 'png', 'gif', 'webp'])
 * @returns Promise resolving to array of image file information
 */
export async function fetchGitHubImages(
  config: GitHubRepoConfig,
  imageExtensions: string[] = ['jpg', 'jpeg', 'png', 'gif', 'webp']
): Promise<GitHubFile[]> {
  const files = await fetchGitHubFiles(config);
  
  return files.filter((file) => {
    if (file.type !== 'file') return false;
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension && imageExtensions.includes(extension);
  });
}

/**
 * Fetches all images recursively from a GitHub repository
 * @param config - Repository configuration
 * @returns Promise resolving to array of image file information
 */
export async function fetchGitHubImagesRecursive(
  config: GitHubRepoConfig
): Promise<GitHubFile[]> {
  const images: GitHubFile[] = [];
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  
  async function traverse(path: string = '') {
    const files = await fetchGitHubFiles({ ...config, path });
    
    for (const file of files) {
      if (file.type === 'dir') {
        // Recursively fetch from subdirectories
        await traverse(file.path);
      } else {
        // Check if it's an image
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension && imageExtensions.includes(extension)) {
          images.push(file);
        }
      }
    }
  }
  
  await traverse(config.path || '');
  return images;
}

/**
 * Fetches images from multiple GitHub repositories
 * @param configs - Array of repository configurations
 * @returns Promise resolving to array of image file information
 */
export async function fetchImagesFromMultipleRepos(
  configs: GitHubRepoConfig[]
): Promise<GitHubFile[]> {
  const allImages: GitHubFile[] = [];
  
  await Promise.allSettled(
    configs.map(async (config) => {
      try {
        const images = await fetchGitHubImagesRecursive(config);
        allImages.push(...images);
      } catch (error) {
        console.error(`Error fetching from ${config.owner}/${config.repo}:`, error);
      }
    })
  );
  
  return allImages;
}

/**
 * Creates a direct image URL from GitHub raw content
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param path - File path in repository
 * @param branch - Branch name (default: 'main')
 * @returns Direct image URL
 */
export function getGitHubImageUrl(
  owner: string,
  repo: string,
  path: string,
  branch: string = 'main'
): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

/**
 * Predefined repository configurations
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

