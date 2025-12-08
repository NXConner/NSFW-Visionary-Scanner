# Complete Setup Guide - NSFW Visionary Scanner

## 🎉 All Features Implemented!

This guide will help you set up the complete NSFW Visionary Scanner application with all features.

---

## Prerequisites

1. **Node.js** (v18+)
2. **Supabase Account** (free tier works)
3. **Git** (for version control)
4. **OpenAI API Key** (for AI features - optional but recommended)

---

## Step 1: Environment Setup

### 1.1 Clone/Initialize Repository

If you haven't already:

```powershell
cd C:\Users\n8ter\Desktop\visionary-scanner-suite-visionary-scanner-NSFW
git init
git remote add origin https://github.com/NXConner/visionary-scanner-suite.git
```

### 1.2 Install Dependencies

```powershell
npm install
```

### 1.3 Environment Variables

Create `.env` file in the root directory:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# OpenAI (for AI Chat)
OPENAI_API_KEY=your_openai_key

# Anthropic (optional, for AI Chat fallback)
ANTHROPIC_API_KEY=your_anthropic_key

# App Version
VITE_APP_VERSION=nsfw
VITE_DISTRIBUTION_CHANNEL=direct
```

---

## Step 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key to `.env`

### 2.2 Create Storage Buckets

In Supabase Dashboard → Storage → Buckets, create these buckets:

1. **user-uploads** (Public)
2. **videos** (Public)
3. **images** (Public)
4. **audio** (Public)
5. **screenshots** (Public)
6. **recordings** (Public)
7. **expert-content** (Public)
8. **nsfw-content** (Public)

**For each bucket:**
- Set to **Public**
- Enable **File size limit** (recommended: 500MB for videos, 50MB for images)
- Enable **Allowed MIME types** (or leave open for development)

### 2.3 Run Database Migrations

```powershell
npm run db:migrate
```

This will create all necessary tables including:
- NSFW advanced features tables
- Expert content tables
- Video content tables
- Community forum tables
- Sexual wellness analytics tables

### 2.4 Seed Initial Data

```powershell
npm run seed
# Or directly:
tsx scripts/seed-positions.ts
```

This populates the sex positions library with initial data.

---

## Step 3: Deploy Edge Functions

### 3.1 Install Supabase CLI

```powershell
npm install -g supabase
```

### 3.2 Login to Supabase

```powershell
supabase login
```

### 3.3 Link Your Project

```powershell
supabase link --project-ref your-project-ref
```

### 3.4 Deploy Functions

```powershell
# Deploy AI Chat Function
supabase functions deploy seductive-ai-chat

# Deploy Video Chunk Merger
supabase functions deploy merge-video-chunks

# Deploy Video Editing Function
supabase functions deploy video-editing
```

### 3.5 Set Function Secrets

For `seductive-ai-chat` function:

```powershell
supabase secrets set OPENAI_API_KEY=your_key
supabase secrets set ANTHROPIC_API_KEY=your_key  # Optional
```

---

## Step 4: Configure Storage Policies

In Supabase Dashboard → Storage → Policies, ensure these policies exist:

### For `user-uploads` bucket:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-uploads');

-- Allow users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### For `videos` bucket:
```sql
-- Public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');

-- Authenticated upload
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');
```

Repeat similar policies for other buckets as needed.

---

## Step 5: Create Admin User

### 5.1 Create User in Supabase Dashboard

1. Go to Authentication → Users
2. Click "Add User"
3. Email: `n8ter8@gmail.com`
4. Set password
5. Verify email (or manually verify)

### 5.2 Assign Admin Role

Run this SQL in Supabase SQL Editor:

```sql
-- Get user ID first
SELECT id FROM auth.users WHERE email = 'n8ter8@gmail.com';

-- Then assign role (replace USER_ID with actual ID)
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID', 'super_admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
```

---

## Step 6: Test the Application

### 6.1 Start Development Server

```powershell
npm run dev
```

### 6.2 Test Features

1. **NSFW Advanced Features**:
   - Navigate to "NSFW Advanced" tab
   - Test PornMD integration (if you have API keys)
   - Test Multi-Camera Recording
   - Test Intimate Date Planning
   - Test Seductive AI Chat
   - Test Sex Positions Library

2. **Expert Content**:
   - Navigate to "Expert Content" tab
   - View expert profiles
   - Book a consultation (test mode)
   - Submit a question

3. **Video Content**:
   - Navigate to "NSFW Videos" tab
   - Browse videos
   - Play a video
   - Capture screenshots

4. **Media Upload**:
   - Test file uploads in Intimate Dates
   - Test video recording and upload

---

## Step 7: Production Deployment

### 7.1 Build for Production

```powershell
npm run build:nsfw:direct
```

### 7.2 Deploy

Deploy the `dist` folder to your hosting service:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Your own server

### 7.3 Update Environment Variables

Set production environment variables in your hosting platform.

---

## Step 8: Git Branch Setup (Optional)

If you want to push to GitHub:

```powershell
# Run the setup script
.\setup-nsfw-branch.ps1

# Or manually:
git add .
git commit -m "Complete NSFW implementation"
git checkout -b NSFW-Visionary-Scanner
git push -u origin NSFW-Visionary-Scanner
```

---

## Troubleshooting

### Storage Upload Fails

1. Check bucket exists and is public
2. Check file size limits
3. Check MIME type restrictions
4. Verify RLS policies allow uploads

### AI Chat Not Working

1. Verify OPENAI_API_KEY is set in Supabase secrets
2. Check Edge Function logs in Supabase Dashboard
3. Verify function is deployed

### Video Recording Not Working

1. Check browser permissions for camera/microphone
2. Verify HTTPS (required for MediaRecorder)
3. Check browser console for errors

### Database Errors

1. Verify all migrations ran successfully
2. Check RLS policies are enabled
3. Verify user has correct permissions

---

## Feature Checklist

- [x] Media Upload/Storage
- [x] Video Processing
- [x] AI Model Integration
- [x] Expert Content & Consultations
- [x] Video Editing Backend
- [x] Video Screenshots
- [x] Seed Data
- [x] All Components Integrated
- [x] All Routes Added
- [x] All Navigation Updated

---

## Support

For issues or questions:
1. Check the documentation files in `/docs`
2. Review error logs in browser console
3. Check Supabase Dashboard logs
4. Review Edge Function logs

---

**Status**: ✅ **100% Complete and Ready for Production**

**Last Updated**: 2024-12-08

