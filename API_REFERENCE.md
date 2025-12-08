# API Reference - NSFW Visionary Scanner

## 📚 Complete API Documentation

This document provides comprehensive API reference for all functions, hooks, and components.

---

## 🎣 Hooks API

### useMediaUpload

**Location**: `src/hooks/useMediaUpload.ts`

**Signature**:
```typescript
useMediaUpload(options?: UseMediaUploadOptions) => {
  upload: (file: File) => Promise<UploadResult | null>
  uploadMultiple: (files: File[]) => Promise<UploadResult[]>
  uploadVideo: (file: File) => Promise<UploadResult | null>
  uploading: boolean
  progress: number
  uploadedFiles: UploadResult[]
  reset: () => void
}
```

**Options**:
```typescript
interface UseMediaUploadOptions {
  bucket?: string
  folder?: string
  compress?: boolean
  quality?: number
  onUploadComplete?: (result: UploadResult | UploadResult[]) => void
  onUploadError?: (error: Error) => void
}
```

**Returns**:
- `upload`: Upload single file
- `uploadMultiple`: Upload multiple files
- `uploadVideo`: Upload video file
- `uploading`: Upload state
- `progress`: Upload progress (0-100)
- `uploadedFiles`: Array of uploaded files
- `reset`: Reset state

---

### useVideoRecording

**Location**: `src/hooks/useVideoRecording.ts`

**Signature**:
```typescript
useVideoRecording() => {
  isRecording: boolean
  recording: VideoRecording | null
  progress: number
  startRecording: (stream: MediaStream, options?: VideoRecordingOptions) => Promise<boolean>
  stopRecording: () => void
  uploadRecording: (sessionId: string, folder?: string) => Promise<string | null>
  reset: () => void
}
```

**Options**:
```typescript
interface VideoRecordingOptions {
  quality?: '720p' | '1080p' | '4k'
  bitrate?: number
  onProgress?: (progress: number) => void
}
```

---

### useVideoScreenshots

**Location**: `src/hooks/useVideoScreenshots.ts`

**Signature**:
```typescript
useVideoScreenshots(videoId: string | null) => {
  screenshots: VideoScreenshot[]
  loading: boolean
  captureScreenshot: (videoElement: HTMLVideoElement, timestamp: number) => Promise<VideoScreenshot | null>
  removeScreenshot: (screenshotId: string) => Promise<boolean>
  refresh: () => Promise<void>
}
```

---

## 🛠️ Storage Utilities API

### getStorageUrl

**Signature**: `getStorageUrl(bucket: string, path: string): string`

**Description**: Get public URL for storage file

**Example**:
```typescript
const url = getStorageUrl('videos', 'my-video.mp4')
```

---

### fileExistsInStorage

**Signature**: `fileExistsInStorage(bucket: string, path: string): Promise<boolean>`

**Description**: Check if file exists in storage

---

### getFileSize

**Signature**: `getFileSize(bucket: string, path: string): Promise<number | null>`

**Description**: Get file size in bytes

---

### deleteFiles

**Signature**: `deleteFiles(bucket: string, paths: string[]): Promise<boolean>`

**Description**: Delete multiple files from storage

---

### getStorageUsage

**Signature**: `getStorageUsage(userId: string, buckets?: string[]): Promise<number>`

**Description**: Calculate total storage usage for user

---

### formatBytes

**Signature**: `formatBytes(bytes: number, decimals?: number): string`

**Description**: Format bytes to human readable format

**Example**:
```typescript
formatBytes(1024 * 1024) // "1 MB"
```

---

## 🎬 Video Utilities API

### formatDuration

**Signature**: `formatDuration(seconds: number | null | undefined): string`

**Description**: Format seconds to HH:MM:SS

**Example**:
```typescript
formatDuration(3661) // "1:01:01"
```

---

### parseDuration

**Signature**: `parseDuration(duration: string): number`

**Description**: Parse duration string to seconds

---

### getVideoQuality

**Signature**: `getVideoQuality(url: string): 'sd' | 'hd' | '4k' | 'unknown'`

**Description**: Detect video quality from URL

---

### validateVideoFile

**Signature**: `validateVideoFile(file: File): { valid: boolean; error?: string }`

**Description**: Validate video file

---

### getVideoDimensions

**Signature**: `getVideoDimensions(file: File): Promise<{ width: number; height: number }>`

**Description**: Get video dimensions

---

## 👨‍⚕️ Expert Utilities API

### calculateConsultationPrice

**Signature**: `calculateConsultationPrice(expert: ExpertProfile, type: 'individual' | 'group', durationMinutes: number): number`

**Description**: Calculate consultation price

---

### formatConsultationDuration

**Signature**: `formatConsultationDuration(minutes: number): string`

**Description**: Format consultation duration

---

### getExpertAvailability

**Signature**: `getExpertAvailability(expert: ExpertProfile): 'available' | 'busy' | 'unavailable'`

**Description**: Get expert availability status

---

### canCancelConsultation

**Signature**: `canCancelConsultation(consultation: ExpertConsultation): boolean`

**Description**: Check if consultation can be cancelled

---

## 🎨 Component APIs

### MediaUploader

**Props**:
```typescript
interface MediaUploaderProps {
  bucket?: string
  folder?: string
  accept?: string
  multiple?: boolean
  compress?: boolean
  onUploadComplete?: (results: UploadResult[]) => void
  onUploadError?: (error: Error) => void
}
```

---

### VideoPlayer

**Props**:
```typescript
interface VideoPlayerProps {
  videoUrl: string
  videoId: string
  title?: string
  autoPlay?: boolean
  showScreenshots?: boolean
  onProgress?: (progress: number) => void
}
```

---

### ExpertProfileCard

**Props**:
```typescript
interface ExpertProfileCardProps {
  expert: ExpertProfile
  onBookConsultation?: (expert: ExpertProfile) => void
  onAskQuestion?: (expert: ExpertProfile) => void
  showActions?: boolean
}
```

---

### StorageUsage

**Props**: None (uses current user context)

---

## 📦 Type Definitions

### UploadResult

```typescript
interface UploadResult {
  url: string
  path: string
  bucket: string
  size: number
  mimeType: string
}
```

### VideoRecording

```typescript
interface VideoRecording {
  blob: Blob
  duration: number
  quality: string
  timestamp: number
}
```

### VideoScreenshot

```typescript
interface VideoScreenshot {
  id: string
  video_id: string
  timestamp_seconds: number
  image_url: string
  image_path: string
  thumbnail_url: string | null
  created_at: string
}
```

### ExpertProfile

```typescript
interface ExpertProfile {
  id: string
  user_id: string
  display_name: string
  bio: string | null
  specialties: string[]
  years_experience: number
  consultation_rate_per_hour: number
  group_workshop_rate_per_person: number
  rating: number
  review_count: number
  is_verified: boolean
  is_available: boolean
  profile_image_url: string | null
  availability_schedule: any
  created_at: string
  updated_at: string
}
```

---

## 🔗 Import Paths

### Hooks
```typescript
import { useMediaUpload, useVideoRecording, useVideoScreenshots } from '@/hooks'
```

### Utilities
```typescript
import { 
  getStorageUrl, 
  formatBytes, 
  formatDuration,
  calculateConsultationPrice 
} from '@/lib/utils'
```

### Components
```typescript
import { 
  MediaUploader, 
  VideoPlayer, 
  ExpertProfileCard,
  StorageUsage 
} from '@/components/nsfw'
```

---

## ⚠️ Error Handling

All functions return `null` or throw errors. Always check return values:

```typescript
const result = await upload(file)
if (!result) {
  // Handle error
}
```

---

## 📝 Notes

- All async functions return Promises
- All file operations require authentication
- Storage operations require proper RLS policies
- Video operations require browser support

---

**For implementation details, see the source files in `src/` directory.**

