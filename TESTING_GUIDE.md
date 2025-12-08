# Testing Guide - NSFW Visionary Scanner

## 🧪 Comprehensive Testing Instructions

This guide covers testing all features of the NSFW Visionary Scanner to ensure everything works correctly.

---

## Prerequisites

- ✅ Application set up and running
- ✅ Supabase configured
- ✅ Storage buckets created
- ✅ Edge Functions deployed
- ✅ Test user account created

---

## Test Checklist

### 1. Media Upload System ✅

#### Test File Upload
- [ ] Upload small image (< 1MB)
- [ ] Upload large image (> 5MB)
- [ ] Upload video file
- [ ] Upload multiple files
- [ ] Verify progress tracking works
- [ ] Check file appears in storage
- [ ] Verify public URL works
- [ ] Test file deletion

#### Test Image Compression
- [ ] Upload large image
- [ ] Verify compression applied
- [ ] Check file size reduced
- [ ] Verify image quality acceptable

#### Test Video Chunked Upload
- [ ] Upload large video (> 50MB)
- [ ] Verify chunked upload works
- [ ] Check progress updates
- [ ] Verify video uploads completely

**Expected Results**:
- All uploads succeed
- Progress updates correctly
- Files accessible via URLs
- Compression works for images

---

### 2. Video Processing ✅

#### Test Video Recording
- [ ] Start video recording
- [ ] Verify camera access granted
- [ ] Record for 10 seconds
- [ ] Stop recording
- [ ] Verify video blob created
- [ ] Check video duration correct
- [ ] Test multiple quality settings (720p, 1080p, 4k)

#### Test Video Upload
- [ ] Record video
- [ ] Upload recorded video
- [ ] Verify upload progress
- [ ] Check video in storage
- [ ] Verify video URL works
- [ ] Test video playback

#### Test Thumbnail Generation
- [ ] Record/upload video
- [ ] Verify thumbnail generated
- [ ] Check thumbnail appears
- [ ] Verify thumbnail URL works

**Expected Results**:
- Recording works smoothly
- Videos upload successfully
- Thumbnails generated
- Playback works correctly

---

### 3. AI Chat System ✅

#### Test AI Chat
- [ ] Open AI Chat tab
- [ ] Send initial message
- [ ] Verify response received
- [ ] Test different personalities
- [ ] Test different intensity levels
- [ ] Verify conversation history
- [ ] Test context awareness

#### Test Edge Function
- [ ] Check Edge Function deployed
- [ ] Verify API key configured
- [ ] Test function logs
- [ ] Check response times
- [ ] Verify error handling

**Expected Results**:
- AI responds appropriately
- Different personalities work
- Conversation history maintained
- Response times acceptable (< 5s)

---

### 4. Expert Content System ✅

#### Test Expert Profiles
- [ ] View expert list
- [ ] Filter experts
- [ ] View expert details
- [ ] Check expert ratings
- [ ] Verify expert verification badges

#### Test Expert Articles
- [ ] View articles list
- [ ] Read article
- [ ] Check article metadata
- [ ] Verify article images

#### Test Expert Videos
- [ ] View videos list
- [ ] Play expert video
- [ ] Check video quality
- [ ] Verify video metadata

#### Test Q&A System
- [ ] Submit question
- [ ] View questions
- [ ] Check expert responses
- [ ] Verify question categories

#### Test Consultation Booking
- [ ] Select expert
- [ ] Choose consultation type
- [ ] Select date/time
- [ ] Submit booking
- [ ] Verify booking confirmation
- [ ] Check booking in dashboard

#### Test Group Workshops
- [ ] View workshops
- [ ] Join workshop
- [ ] Verify participant count
- [ ] Check workshop details

**Expected Results**:
- All expert features work
- Booking system functional
- Payments process (if configured)
- Ratings display correctly

---

### 5. Video Screenshot Capture ✅

#### Test Screenshot Capture
- [ ] Play video
- [ ] Capture screenshot at different timestamps
- [ ] Verify screenshot saved
- [ ] Check screenshot appears in gallery
- [ ] Test thumbnail generation
- [ ] Verify screenshot deletion

#### Test Screenshot Gallery
- [ ] View all screenshots for video
- [ ] Click screenshot to seek video
- [ ] Delete screenshot
- [ ] Verify deletion works

**Expected Results**:
- Screenshots capture correctly
- Thumbnails generated
- Gallery displays properly
- Deletion works

---

### 6. Video Content System ✅

#### Test Video Library
- [ ] Browse videos
- [ ] Filter by category
- [ ] Filter by difficulty
- [ ] Search videos
- [ ] View video details

#### Test Video Playback
- [ ] Play video
- [ ] Test playback controls
- [ ] Test seeking
- [ ] Test volume control
- [ ] Test fullscreen
- [ ] Test screenshot capture during playback

#### Test Video Downloads
- [ ] Request download
- [ ] Check download status
- [ ] Verify download progress
- [ ] Test download completion

**Expected Results**:
- Video library loads
- Filters work correctly
- Playback smooth
- Downloads work

---

### 7. Storage Usage ✅

#### Test Storage Display
- [ ] View storage usage
- [ ] Verify usage calculation
- [ ] Check storage limit
- [ ] Test warning when near limit
- [ ] Verify format display (MB/GB)

**Expected Results**:
- Usage displays correctly
- Limits enforced
- Warnings appear appropriately

---

### 8. Navigation & Routing ✅

#### Test Navigation
- [ ] Navigate to all tabs
- [ ] Verify routes work
- [ ] Check navigation highlights
- [ ] Test back/forward navigation

#### Test Routes
- [ ] NSFW Advanced route
- [ ] Expert Content route
- [ ] Video Content route
- [ ] Community Forum route
- [ ] Analytics route

**Expected Results**:
- All routes accessible
- Navigation works smoothly
- Active states correct

---

### 9. Authentication ✅

#### Test Login
- [ ] Login with email/password
- [ ] Verify session created
- [ ] Check user data loaded

#### Test Logout
- [ ] Logout
- [ ] Verify session cleared
- [ ] Check redirect to login

#### Test Protected Routes
- [ ] Access protected route when logged out
- [ ] Verify redirect to login
- [ ] Access after login
- [ ] Verify access granted

**Expected Results**:
- Login/logout work
- Protected routes secured
- Session management correct

---

### 10. Error Handling ✅

#### Test Error Scenarios
- [ ] Test network errors
- [ ] Test invalid file uploads
- [ ] Test API errors
- [ ] Test storage errors
- [ ] Verify error messages display
- [ ] Check error recovery

**Expected Results**:
- Errors handled gracefully
- User-friendly error messages
- App doesn't crash
- Recovery possible

---

### 11. Performance ✅

#### Test Load Times
- [ ] Check initial page load
- [ ] Test component load times
- [ ] Verify API response times
- [ ] Check image load times

#### Test Memory Usage
- [ ] Monitor memory during use
- [ ] Check for memory leaks
- [ ] Test with large files
- [ ] Verify cleanup works

**Expected Results**:
- Load times acceptable (< 3s)
- No memory leaks
- Performance smooth
- No lag during use

---

### 12. Browser Compatibility ✅

#### Test Browsers
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

**Expected Results**:
- Works in all modern browsers
- Responsive on mobile
- No browser-specific errors

---

## Automated Testing

### Unit Tests

```powershell
npm test
```

### E2E Tests

```powershell
npm run test:e2e
```

### Component Tests

```powershell
npm run test:components
```

---

## Manual Testing Scenarios

### Scenario 1: Complete User Flow

1. User logs in
2. Browses expert profiles
3. Books consultation
4. Uploads media for intimate date
5. Records video
6. Captures screenshots
7. Uses AI chat
8. Views analytics

**Expected**: All steps complete successfully

---

### Scenario 2: Media Management Flow

1. Upload multiple images
2. Record video
3. Upload video
4. Capture screenshots
5. Delete old files
6. Check storage usage

**Expected**: All media operations work

---

### Scenario 3: Expert Consultation Flow

1. Browse experts
2. View expert profile
3. Read expert article
4. Submit question
5. Book consultation
6. Rate expert

**Expected**: Complete expert system works

---

## Performance Benchmarks

### Target Metrics

- **Initial Load**: < 3 seconds
- **API Response**: < 1 second
- **File Upload**: Progress updates every 1s
- **Video Recording**: Smooth, no lag
- **AI Response**: < 5 seconds

---

## Bug Reporting

### When Reporting Bugs

Include:
1. **Steps to Reproduce**
2. **Expected Behavior**
3. **Actual Behavior**
4. **Browser/OS**
5. **Console Errors**
6. **Screenshots** (if applicable)

---

## Test Environment

### Development
- Local Supabase instance
- Test API keys
- Mock data

### Staging
- Staging Supabase project
- Staging API keys
- Real data (test)

### Production
- Production Supabase
- Production API keys
- Real data

---

## Continuous Testing

### Before Each Release

- [ ] Run full test suite
- [ ] Manual testing
- [ ] Performance testing
- [ ] Security testing
- [ ] Browser compatibility

---

## Test Data

### Test Users

Create test users with different roles:
- Regular user
- Expert user
- Admin user

### Test Content

- Test images
- Test videos
- Test expert profiles
- Test articles

---

**Testing Status**: ✅ **READY**  
**Last Updated**: 2024-12-08

