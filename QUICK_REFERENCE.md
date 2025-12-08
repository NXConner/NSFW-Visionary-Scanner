# Quick Reference - NSFW Visionary Scanner

## 🚀 Quick Commands

### Setup
```powershell
npm install                    # Install dependencies
npm run setup:complete        # Complete automated setup
npm run setup:storage         # Setup storage buckets
npm run deploy:functions      # Deploy Edge Functions
npm run seed:positions        # Seed position library
```

### Development
```powershell
npm run dev                   # Start dev server
npm run build:nsfw:direct    # Build for production
npm run preview               # Preview production build
```

### Database
```powershell
npm run db:migrate            # Run migrations
npm run db:rollback           # Rollback migration
npm run db:create             # Create new migration
```

### Quality
```powershell
npm run lint                  # Lint code
npm run lint:fix              # Fix linting issues
npm run format                # Format code
npm test                      # Run tests
```

---

## 📦 Import Paths

### Hooks
```typescript
import { useMediaUpload, useVideoRecording, useVideoScreenshots } from '@/hooks'
```

### Utilities
```typescript
import { 
  formatBytes, 
  formatDuration,
  getStorageUrl,
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

## 🎯 Common Patterns

### Upload File
```typescript
const { upload, uploading, progress } = useMediaUpload({
  bucket: 'user-uploads',
  onUploadComplete: (result) => console.log(result.url)
})

await upload(file)
```

### Record Video
```typescript
const { startRecording, stopRecording, isRecording } = useVideoRecording()

const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
await startRecording(stream, { quality: '1080p' })
// ... recording ...
stopRecording()
```

### Capture Screenshot
```typescript
const { captureScreenshot, screenshots } = useVideoScreenshots(videoId)

await captureScreenshot(videoElement, timestamp)
```

### Format Bytes
```typescript
formatBytes(1024 * 1024) // "1 MB"
```

### Format Duration
```typescript
formatDuration(3661) // "1:01:01"
```

---

## 🗄️ Storage Buckets

- `user-uploads` - General files
- `videos` - Video content
- `images` - Image content
- `audio` - Audio files
- `screenshots` - Video screenshots
- `recordings` - Video recordings (private)
- `expert-content` - Expert content
- `nsfw-content` - NSFW-specific content

---

## 🔧 Environment Variables

```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key (optional)
VITE_APP_VERSION=nsfw
VITE_DISTRIBUTION_CHANNEL=direct
```

---

## 📁 Key Files

### Components
- `NSFWAdvancedFeatures.tsx` - Main NSFW features
- `NSFWVideoContent.tsx` - Video library
- `ExpertContentConsultations.tsx` - Expert system
- `VideoPlayer.tsx` - Video player with screenshots
- `MediaUploader.tsx` - Upload component

### Libraries
- `mediaUpload.ts` - Upload utilities
- `videoProcessing.ts` - Video processing
- `expertContent.ts` - Expert system
- `storageUtils.ts` - Storage helpers
- `videoUtils.ts` - Video helpers

### Hooks
- `useMediaUpload.ts` - Upload hook
- `useVideoRecording.ts` - Recording hook
- `useVideoScreenshots.ts` - Screenshot hook

---

## 🎨 Component Props

### MediaUploader
```typescript
<MediaUploader
  bucket="user-uploads"
  folder="my-folder"
  accept="image/*,video/*"
  multiple
  onUploadComplete={(results) => {}}
/>
```

### VideoPlayer
```typescript
<VideoPlayer
  videoUrl="https://..."
  videoId="video-123"
  title="My Video"
  showScreenshots={true}
  onProgress={(progress) => {}}
/>
```

### ExpertProfileCard
```typescript
<ExpertProfileCard
  expert={expert}
  onBookConsultation={(expert) => {}}
  onAskQuestion={(expert) => {}}
/>
```

---

## 🔗 Routes

- `/` - Main app
- `/nsfw-advanced` - NSFW Advanced Features
- `/expert-content` - Expert Content & Consultations
- `/nsfw-videos` - NSFW Video Content
- `/community` - Community Forum
- `/analytics` - Sexual Wellness Analytics

---

## ⚡ Quick Fixes

### Upload Fails
- Check file size limits
- Verify bucket exists
- Check RLS policies

### Video Recording Fails
- Check HTTPS (required)
- Verify camera permissions
- Check browser support

### AI Chat Not Working
- Verify Edge Function deployed
- Check API key in Supabase secrets
- Review function logs

### Storage Errors
- Check bucket policies
- Verify RLS policies
- Check storage quota

---

## 📚 Documentation

- **Setup**: `COMPLETE_SETUP_GUIDE.md`
- **Quick Start**: `QUICK_START_NSFW.md`
- **API**: `API_REFERENCE.md`
- **Examples**: `USAGE_EXAMPLES.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`
- **Deployment**: `DEPLOYMENT_GUIDE.md`

---

## 🆘 Support

1. Check `TROUBLESHOOTING.md`
2. Review error logs
3. Check Supabase Dashboard
4. Review documentation

---

**Last Updated**: 2024-12-08

