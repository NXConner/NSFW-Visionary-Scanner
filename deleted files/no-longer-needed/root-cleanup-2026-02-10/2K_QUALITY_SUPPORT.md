# 2K (1440p) Video and Image Quality Support

## Overview

2K (1440p) quality support has been added to the project for both videos and images. This provides users with a high-quality option between HD (1080p) and 4K (2160p).

## What Was Added

### Database Changes

**Migration**: `supabase/migrations/20251208000001_add_2k_quality_support.sql`

- Added `video_url_2k` column to `nsfw_video_content` table
- Updated quality preference constraints to include '2k'
- Updated download quality constraints to include '2k'
- Updated streaming session quality constraints to include '2k'

### Code Changes

#### 1. Video Recording (`src/lib/videoProcessing.ts`)
- Added '2k' to `VideoRecordingOptions` quality type
- Added 2K bitrate configuration (15 Mbps for 2K quality)
- Quality order: 720p (4 Mbps) → 1080p (8 Mbps) → **2K (15 Mbps)** → 4K (25 Mbps)

#### 2. Video Content (`src/lib/nsfwVideoContent.ts`)
- Added `video_url_2k` field to `NSFWVideoContent` interface
- Updated `quality_preference` to include '2k'
- Updated `NSFWVideoDownload` quality type to include '2k'

#### 3. Video Utilities (`src/lib/videoUtils.ts`)
- Updated `getVideoQuality()` to detect 2K quality from URLs
- Updated `getRecommendedQuality()` to recommend 2K for good 4G connections (5-10 Mbps)

#### 4. Video Components (`src/components/NSFWVideoContent.tsx`)
- Updated video player to prioritize 2K quality: `video_url_4k || video_url_2k || video_url_hd || video_url_sd`
- Added quality selector dropdown for downloads with 2K option
- Updated download handler to support 2K quality

## Quality Specifications

### Video Qualities

| Quality | Resolution | Bitrate | Use Case |
|---------|-----------|---------|----------|
| SD | 720p | 4 Mbps | Slow connections, mobile data |
| HD | 1080p | 8 Mbps | Standard quality, most users |
| **2K** | **1440p** | **15 Mbps** | **High quality, good connections** |
| 4K | 2160p | 25 Mbps | Maximum quality, fast connections |

### Image Qualities

Images use a quality parameter (0-1) for compression:
- **2K Images**: 2560x1440 resolution
- Quality setting: 0.85-0.95 recommended for 2K images
- File format: JPEG, PNG, or WebP

## Usage

### Recording Video in 2K

```typescript
import { recordVideo } from '@/lib/videoProcessing'

const recording = await recordVideo(stream, {
  quality: '2k',
  frameRate: 30,
  audio: true
})
```

### Uploading 2K Video

```typescript
import { uploadVideo } from '@/lib/mediaUpload'

const result = await uploadVideo(videoFile, {
  bucket: 'videos',
  folder: '2k-videos'
})
```

### Downloading 2K Video

```typescript
import { requestVideoDownload } from '@/lib/nsfwVideoContent'

const download = await requestVideoDownload(videoId, '2k')
```

### Setting Quality Preference

```typescript
import { updateVideoProgress } from '@/lib/nsfwVideoContent'

await updateVideoProgress(videoId, currentTime, watchedTime, {
  quality_preference: '2k'
})
```

## Database Migration

To apply the 2K support to your database:

```sql
-- Run the migration
\i supabase/migrations/20251208000001_add_2k_quality_support.sql
```

Or use Supabase Dashboard:
1. Go to SQL Editor
2. Copy and paste the migration file contents
3. Run the query

## UI Components

### Quality Selector

The download button now includes a quality selector dropdown:
- SD (720p)
- HD (1080p)
- **2K (1440p)** ← New
- 4K (2160p)

### Video Player

The video player automatically selects the best available quality:
1. 4K (if available)
2. **2K (if available)** ← New priority
3. HD (fallback)
4. SD (fallback)

## Recommendations

### When to Use 2K

- **Good 4G connections** (5-10 Mbps downlink)
- **Desktop/laptop viewing** (larger screens benefit from 2K)
- **Balanced quality/size** (better than HD, smaller than 4K)
- **Storage-conscious users** (2K files are ~40% smaller than 4K)

### When to Use Other Qualities

- **SD (720p)**: Slow connections, mobile data, bandwidth limits
- **HD (1080p)**: Standard viewing, most common use case
- **4K (2160p)**: Fast connections, large screens, maximum quality needs

## Technical Details

### Bitrate Calculation

2K quality uses **15 Mbps** bitrate:
- Provides excellent quality at 1440p resolution
- Balances file size and visual quality
- Suitable for most modern devices and connections

### File Size Estimates

For a 10-minute video:
- SD (720p): ~300 MB
- HD (1080p): ~600 MB
- **2K (1440p): ~1.1 GB** ← New
- 4K (2160p): ~1.9 GB

### Browser Support

2K video playback is supported in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (with hardware acceleration)

## Future Enhancements

Potential improvements:
- [ ] Adaptive bitrate streaming for 2K
- [ ] 2K thumbnail generation
- [ ] 2K image upload support
- [ ] Quality analytics (track 2K usage)
- [ ] Automatic quality switching based on connection

## Testing

To test 2K quality:

1. **Record a video in 2K**:
   ```typescript
   const recording = await recordVideo(stream, { quality: '2k' })
   ```

2. **Upload 2K video**:
   ```typescript
   await uploadVideo(recording.blob, { bucket: 'videos' })
   ```

3. **Test playback**:
   - Open video in player
   - Verify 2K quality is selected
   - Check video quality in browser dev tools

4. **Test download**:
   - Select 2K from quality dropdown
   - Verify download starts
   - Check downloaded file quality

## Troubleshooting

### 2K Quality Not Available

**Issue**: 2K option not showing in quality selector

**Solution**:
- Ensure database migration has been run
- Check that `video_url_2k` column exists
- Verify video has 2K URL populated

### 2K Playback Issues

**Issue**: Video won't play in 2K

**Solution**:
- Check browser codec support
- Verify network connection (needs 5+ Mbps)
- Try HD quality as fallback
- Check video file format (MP4/WebM)

### Large File Sizes

**Issue**: 2K files are too large

**Solution**:
- Use compression settings
- Consider chunked uploads
- Implement progressive loading
- Offer HD as alternative

## Related Files

- `src/lib/videoProcessing.ts` - Video recording with 2K support
- `src/lib/nsfwVideoContent.ts` - Video content with 2K URLs
- `src/lib/videoUtils.ts` - Quality detection and recommendations
- `src/components/NSFWVideoContent.tsx` - UI with 2K quality selector
- `supabase/migrations/20251208000001_add_2k_quality_support.sql` - Database migration

## Version History

- **v1.0.0** (2024-12-08): Initial 2K quality support added
  - Database migration created
  - Video recording updated
  - Quality selector added
  - Video player updated

---

**Last Updated**: 2024-12-08

