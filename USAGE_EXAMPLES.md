# Usage Examples - NSFW Visionary Scanner

## 📚 Complete Code Examples

This document provides practical examples for using all the new features, hooks, and utilities.

---

## 🎣 Hooks Usage

### useMediaUpload Hook

```typescript
import { useMediaUpload } from '@/hooks'

function MyComponent() {
  const { upload, uploadMultiple, uploading, progress, uploadedFiles } = useMediaUpload({
    bucket: 'user-uploads',
    folder: 'my-folder',
    compress: true,
    onUploadComplete: (result) => {
      console.log('Upload complete:', result.url)
    },
    onUploadError: (error) => {
      console.error('Upload failed:', error)
    }
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await upload(file)
    }
  }

  return (
    <div>
      <input type="file" onChange={handleFileSelect} />
      {uploading && (
        <div>
          <p>Uploading... {progress}%</p>
          <progress value={progress} max={100} />
        </div>
      )}
      {uploadedFiles.map(file => (
        <img key={file.path} src={file.url} alt="Uploaded" />
      ))}
    </div>
  )
}
```

### useVideoRecording Hook

```typescript
import { useVideoRecording } from '@/hooks'

function VideoRecorder() {
  const { 
    startRecording, 
    stopRecording, 
    isRecording, 
    recording,
    uploadRecording 
  } = useVideoRecording()

  const handleStart = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    })
    await startRecording(stream, { quality: '1080p' })
  }

  const handleStop = async () => {
    stopRecording()
    if (recording) {
      const url = await uploadRecording('session-123', 'recordings')
      console.log('Video uploaded:', url)
    }
  }

  return (
    <div>
      <button onClick={handleStart} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={handleStop} disabled={!isRecording}>
        Stop Recording
      </button>
      {isRecording && <p>Recording in progress...</p>}
    </div>
  )
}
```

### useVideoScreenshots Hook

```typescript
import { useVideoScreenshots } from '@/hooks'

function VideoPlayerWithScreenshots({ videoId }: { videoId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { 
    screenshots, 
    captureScreenshot, 
    removeScreenshot,
    loading 
  } = useVideoScreenshots(videoId)

  const handleCapture = async () => {
    if (videoRef.current) {
      const timestamp = videoRef.current.currentTime
      await captureScreenshot(videoRef.current, timestamp)
    }
  }

  return (
    <div>
      <video ref={videoRef} src="video-url" />
      <button onClick={handleCapture}>Capture Screenshot</button>
      <div>
        {screenshots.map(screenshot => (
          <div key={screenshot.id}>
            <img src={screenshot.thumbnail_url} alt="Screenshot" />
            <button onClick={() => removeScreenshot(screenshot.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 🛠️ Utilities Usage

### Storage Utilities

```typescript
import { 
  getStorageUrl, 
  fileExistsInStorage, 
  getStorageUsage,
  formatBytes,
  deleteFiles 
} from '@/lib/utils'

// Get public URL
const url = getStorageUrl('videos', 'my-video.mp4')

// Check if file exists
const exists = await fileExistsInStorage('images', 'photo.jpg')

// Get storage usage
const usage = await getStorageUsage(userId)
console.log(`Using ${formatBytes(usage)}`)

// Delete multiple files
await deleteFiles('user-uploads', ['file1.jpg', 'file2.jpg'])
```

### Video Utilities

```typescript
import { 
  formatDuration, 
  getVideoQuality,
  validateVideoFile,
  getVideoDimensions 
} from '@/lib/utils'

// Format duration
const formatted = formatDuration(3661) // "1:01:01"

// Get quality from URL
const quality = getVideoQuality('video-1080p.mp4') // "hd"

// Validate file
const validation = validateVideoFile(file)
if (!validation.valid) {
  console.error(validation.error)
}

// Get dimensions
const { width, height } = await getVideoDimensions(file)
```

### Expert Utilities

```typescript
import { 
  calculateConsultationPrice,
  formatConsultationDuration,
  getExpertAvailability,
  canCancelConsultation 
} from '@/lib/utils'

// Calculate price
const price = calculateConsultationPrice(expert, 'individual', 60)

// Format duration
const duration = formatConsultationDuration(90) // "1h 30m"

// Check availability
const status = getExpertAvailability(expert) // "available" | "busy" | "unavailable"

// Check if can cancel
const canCancel = canCancelConsultation(consultation)
```

---

## 🎨 Component Usage

### MediaUploader Component

```typescript
import { MediaUploader } from '@/components/nsfw'

function MyUploadPage() {
  return (
    <MediaUploader
      bucket="user-uploads"
      folder="my-folder"
      accept="image/*,video/*"
      multiple
      onUploadComplete={(results) => {
        console.log('Uploaded:', results)
      }}
    />
  )
}
```

### VideoPlayer Component

```typescript
import { VideoPlayer } from '@/components/nsfw'

function VideoPage() {
  return (
    <VideoPlayer
      videoUrl="https://example.com/video.mp4"
      videoId="video-123"
      title="My Video"
      showScreenshots={true}
      onProgress={(progress) => {
        console.log(`Progress: ${progress}%`)
      }}
    />
  )
}
```

### ExpertProfileCard Component

```typescript
import { ExpertProfileCard } from '@/components/nsfw'

function ExpertsList({ experts }) {
  return (
    <div>
      {experts.map(expert => (
        <ExpertProfileCard
          key={expert.id}
          expert={expert}
          onBookConsultation={(expert) => {
            // Handle booking
          }}
          onAskQuestion={(expert) => {
            // Handle question
          }}
        />
      ))}
    </div>
  )
}
```

### StorageUsage Component

```typescript
import { StorageUsage } from '@/components/nsfw'

function SettingsPage() {
  return (
    <div>
      <h2>Storage</h2>
      <StorageUsage />
    </div>
  )
}
```

---

## 🔧 Advanced Examples

### Multi-File Upload with Progress

```typescript
import { useMediaUpload } from '@/hooks'

function BulkUploader() {
  const { uploadMultiple, uploading, progress, uploadedFiles } = useMediaUpload({
    bucket: 'images',
    compress: true
  })

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files)
    await uploadMultiple(fileArray)
  }

  return (
    <div>
      <input 
        type="file" 
        multiple 
        onChange={(e) => e.target.files && handleFiles(e.target.files)} 
      />
      {uploading && (
        <div>
          <p>Uploading {uploadedFiles.length} files... {progress}%</p>
        </div>
      )}
    </div>
  )
}
```

### Video Recording with Multiple Cameras

```typescript
import { useVideoRecording } from '@/hooks'

function MultiCameraRecorder() {
  const { startRecording, stopRecording, isRecording } = useVideoRecording()

  const handleStart = async () => {
    const cameras = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = cameras.filter(d => d.kind === 'videoinput')
    
    // Get stream from first camera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: videoDevices[0].deviceId },
      audio: true
    })

    await startRecording(stream, { quality: '4k' })
  }

  return (
    <div>
      <button onClick={handleStart} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop
      </button>
    </div>
  )
}
```

### Expert Consultation Booking

```typescript
import { bookConsultation, calculateConsultationPrice } from '@/lib/utils'

async function handleBooking(expert, consultationType, duration) {
  const price = calculateConsultationPrice(expert, consultationType, duration)
  
  const consultation = await bookConsultation({
    expert_id: expert.id,
    consultation_type: consultationType,
    scheduled_at: new Date().toISOString(),
    duration_minutes: duration,
    price: price
  })

  if (consultation) {
    console.log('Booking confirmed:', consultation.id)
  }
}
```

---

## 📝 Best Practices

### Error Handling

```typescript
try {
  const result = await upload(file)
  if (!result) {
    throw new Error('Upload failed')
  }
} catch (error) {
  console.error('Upload error:', error)
  toast.error('Failed to upload file')
}
```

### Loading States

```typescript
const { uploading, progress } = useMediaUpload()

{uploading ? (
  <div>
    <Spinner />
    <p>Uploading... {progress}%</p>
  </div>
) : (
  <button onClick={handleUpload}>Upload</button>
)}
```

### Type Safety

```typescript
import type { UploadResult, ExpertProfile } from '@/lib/utils'

const handleUpload = async (file: File): Promise<UploadResult | null> => {
  // Type-safe upload
}
```

---

## 🚀 Quick Reference

### Import Paths

```typescript
// Hooks
import { useMediaUpload, useVideoRecording } from '@/hooks'

// Utilities
import { formatBytes, formatDuration } from '@/lib/utils'

// Components
import { VideoPlayer, MediaUploader } from '@/components/nsfw'
```

### Common Patterns

```typescript
// Upload with progress
const { upload, uploading, progress } = useMediaUpload()

// Video recording
const { startRecording, stopRecording, isRecording } = useVideoRecording()

// Screenshot capture
const { captureScreenshot, screenshots } = useVideoScreenshots(videoId)
```

---

**For more details, see the individual component and utility documentation.**

