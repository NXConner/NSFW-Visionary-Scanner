export type UploadResult = {
  bucket: string;
  path: string;
  publicUrl?: string;
  sizeBytes: number;
  mimeType: string;
  originalName: string;
  createdAt: string;
};

export type UploadOptions = {
  /** Supabase Storage bucket (defaults to VITE_USER_MEDIA_BUCKET or "user-media") */
  bucket?: string;
  /** Folder under the user's namespace (no leading slash). Example: "recordings/abc" */
  folder?: string;
  /** Max file size in bytes */
  maxSize?: number;
  /** Allowed MIME types (e.g. ["image/png", "image/jpeg"]). If omitted, any type allowed. */
  allowedTypes?: string[];
  /** Compress images (client-side) when possible */
  compress?: boolean;
  /** Upsert behavior for storage upload */
  upsert?: boolean;
  /** Cache-Control header, e.g. "3600" */
  cacheControl?: string;
  /** Optional override file name (sanitized) */
  fileName?: string;
  /** If true (default), storage path is prefixed with "<userId>/" */
  userScoped?: boolean;
  /** Progress callback (0..100). Chunk uploads report granular progress. */
  onProgress?: (progress: number) => void;
};
