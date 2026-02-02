/**
 * Videos Module Types
 */

export interface Video {
  id: string;
  title: string;
  description: string;
  category: VideoCategory;
  duration: number; // seconds
  thumbnail: string;
  previewUrl?: string;
  streamUrl?: string;
  downloadUrl?: string;
  quality: VideoQuality[];
  tags: string[];
  instructor?: string;
  dateAdded: Date;
  viewCount: number;
  rating: number;
  ratingCount: number;
}

export type VideoCategory =
  | "educational"
  | "technique"
  | "wellness"
  | "tantric"
  | "communication"
  | "exercise"
  | "relationship";

export type VideoQuality = "480p" | "720p" | "1080p" | "2k" | "4k";

export interface VideoProgress {
  videoId: string;
  currentTime: number;
  duration: number;
  completed: boolean;
  lastWatched: Date;
}

export interface VideoPlaylist {
  id: string;
  name: string;
  description?: string;
  videoIds: string[];
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}

export interface VideoDownload {
  videoId: string;
  quality: VideoQuality;
  status: "pending" | "downloading" | "completed" | "failed";
  progress: number;
  filePath?: string;
  fileSize?: number;
  downloadedAt?: Date;
}

export interface VideosState {
  videos: Video[];
  progress: Record<string, VideoProgress>;
  playlists: VideoPlaylist[];
  downloads: VideoDownload[];
  currentVideo?: Video;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface VideoFilter {
  category?: VideoCategory[];
  minDuration?: number;
  maxDuration?: number;
  quality?: VideoQuality[];
  search?: string;
  sortBy?: "newest" | "popular" | "rating" | "duration";
}
