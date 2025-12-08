# Deployment Guide - NSFW Visionary Scanner

## 🚀 Production Deployment Instructions

This guide covers deploying the NSFW Visionary Scanner to production.

---

## Prerequisites

- ✅ Supabase project created
- ✅ Environment variables configured
- ✅ All migrations run
- ✅ Storage buckets created
- ✅ Edge Functions deployed
- ✅ Seed data loaded

---

## Step 1: Environment Setup

### 1.1 Production Environment Variables

Create `.env.production`:

```env
# Supabase Production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_production_key

# AI Services
OPENAI_API_KEY=your_production_key
ANTHROPIC_API_KEY=your_production_key

# App Configuration
VITE_APP_VERSION=nsfw
VITE_DISTRIBUTION_CHANNEL=direct
NODE_ENV=production
```

### 1.2 Set Supabase Secrets

```powershell
supabase secrets set OPENAI_API_KEY=your_key
supabase secrets set ANTHROPIC_API_KEY=your_key
```

---

## Step 2: Database Setup

### 2.1 Run Migrations

```powershell
npm run db:migrate
```

### 2.2 Verify Tables

Check Supabase Dashboard → Database → Tables to ensure all tables exist:
- Expert system tables (7 tables)
- NSFW advanced features tables
- Video content tables
- Community forum tables
- Analytics tables

### 2.3 Set RLS Policies

Run `scripts/setup-storage-policies.sql` in Supabase SQL Editor.

---

## Step 3: Storage Setup

### 3.1 Create Buckets

```powershell
npm run setup:storage
```

Or manually create in Supabase Dashboard → Storage:
- `user-uploads` (Public)
- `videos` (Public)
- `images` (Public)
- `audio` (Public)
- `screenshots` (Public)
- `recordings` (Private)
- `expert-content` (Public)
- `nsfw-content` (Public)

### 3.2 Configure Bucket Policies

Run the SQL from `scripts/setup-storage-policies.sql` in Supabase SQL Editor.

---

## Step 4: Edge Functions Deployment

### 4.1 Deploy All Functions

```powershell
npm run deploy:functions
```

Or individually:
```powershell
supabase functions deploy seductive-ai-chat
supabase functions deploy merge-video-chunks
supabase functions deploy video-editing
```

### 4.2 Verify Deployment

Check Supabase Dashboard → Edge Functions to ensure all functions are deployed.

---

## Step 5: Build Application

### 5.1 Production Build

```powershell
npm run build:nsfw:direct
```

This creates optimized production build in `dist/` folder.

### 5.2 Verify Build

```powershell
npm run preview
```

Test the production build locally.

---

## Step 6: Deploy to Hosting

### Option A: Vercel

1. Install Vercel CLI:
```powershell
npm i -g vercel
```

2. Deploy:
```powershell
vercel --prod
```

3. Set environment variables in Vercel Dashboard

### Option B: Netlify

1. Install Netlify CLI:
```powershell
npm i -g netlify-cli
```

2. Deploy:
```powershell
netlify deploy --prod --dir=dist
```

3. Set environment variables in Netlify Dashboard

### Option C: AWS S3 + CloudFront

1. Upload to S3:
```powershell
aws s3 sync dist/ s3://your-bucket-name
```

2. Configure CloudFront distribution
3. Set up custom domain

### Option D: Custom Server

1. Copy `dist/` folder to server
2. Configure web server (Nginx/Apache)
3. Set up SSL certificate
4. Configure environment variables

---

## Step 7: Post-Deployment

### 7.1 Verify Features

Test all features:
- ✅ Media upload
- ✅ Video recording
- ✅ AI chat
- ✅ Expert content
- ✅ Video playback
- ✅ Screenshot capture

### 7.2 Monitor Logs

- Browser console errors
- Supabase Dashboard logs
- Edge Function logs
- Server logs (if applicable)

### 7.3 Performance

- Check Lighthouse scores
- Monitor Core Web Vitals
- Check API response times
- Monitor storage usage

---

## Step 8: Security Checklist

- ✅ Environment variables secured
- ✅ RLS policies enabled
- ✅ Storage bucket policies set
- ✅ CORS configured
- ✅ SSL certificate installed
- ✅ API keys secured
- ✅ Rate limiting configured (if applicable)

---

## Step 9: Monitoring

### 9.1 Set Up Monitoring

- Error tracking (Sentry, LogRocket)
- Analytics (Google Analytics, Plausible)
- Performance monitoring
- Uptime monitoring

### 9.2 Set Up Alerts

- Error rate alerts
- Performance degradation alerts
- Storage quota alerts
- API quota alerts

---

## Step 10: Backup Strategy

### 10.1 Database Backups

- Enable Supabase automatic backups
- Set up manual backup schedule
- Test restore procedures

### 10.2 Storage Backups

- Set up storage replication
- Configure backup policies
- Test restore procedures

---

## Troubleshooting

### Build Errors

**Issue**: Build fails
**Solution**: Check environment variables, dependencies, and TypeScript errors

### Deployment Errors

**Issue**: Deployment fails
**Solution**: Check build output, verify hosting configuration

### Function Errors

**Issue**: Edge Functions not working
**Solution**: Check function logs, verify secrets, check function code

### Storage Errors

**Issue**: Uploads failing
**Solution**: Check bucket policies, verify RLS policies, check file size limits

---

## Rollback Procedure

If deployment fails:

1. **Revert Code**: Checkout previous version
2. **Rebuild**: `npm run build:nsfw:direct`
3. **Redeploy**: Deploy previous build
4. **Verify**: Test all features
5. **Investigate**: Review logs and errors

---

## Performance Optimization

### Build Optimization

- Enable code splitting
- Optimize images
- Minify assets
- Enable compression

### Runtime Optimization

- Enable CDN caching
- Optimize API calls
- Implement lazy loading
- Use service workers

---

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Review and update security patches
- Monitor storage usage
- Review and optimize database queries
- Check Edge Function performance

### Updates

1. Test in development
2. Deploy to staging
3. Verify all features
4. Deploy to production
5. Monitor for issues

---

## Support

For deployment issues:
1. Check deployment logs
2. Review error messages
3. Check Supabase Dashboard
4. Review documentation
5. Check GitHub issues

---

**Deployment Status**: ✅ **READY**  
**Last Updated**: 2024-12-08

