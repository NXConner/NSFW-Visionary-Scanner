# Troubleshooting Guide - NSFW Visionary Scanner

## 🔧 Common Issues and Solutions

This guide helps you resolve common issues when setting up or using the NSFW Visionary Scanner.

---

## Setup Issues

### Issue: npm install fails

**Symptoms**: Errors during `npm install`

**Solutions**:
1. Clear npm cache:
```powershell
npm cache clean --force
```

2. Delete `node_modules` and `package-lock.json`:
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

3. Check Node.js version (requires v18+):
```powershell
node --version
```

4. Update npm:
```powershell
npm install -g npm@latest
```

---

### Issue: Environment variables not loading

**Symptoms**: `undefined` values for environment variables

**Solutions**:
1. Ensure `.env` file exists in root directory
2. Restart dev server after changing `.env`
3. Check variable names start with `VITE_`
4. Verify no typos in variable names
5. Check for spaces around `=` sign

---

### Issue: Supabase connection fails

**Symptoms**: "Failed to connect to Supabase"

**Solutions**:
1. Verify `VITE_SUPABASE_URL` is correct
2. Verify `VITE_SUPABASE_PUBLISHABLE_KEY` is correct
3. Check Supabase project is active
4. Verify network connection
5. Check browser console for CORS errors

---

## Database Issues

### Issue: Migrations fail

**Symptoms**: Error running `npm run db:migrate`

**Solutions**:
1. Check database connection string
2. Verify user has migration permissions
3. Check if tables already exist
4. Review migration SQL for errors
5. Check Supabase Dashboard → Database → Migrations

---

### Issue: RLS policies blocking access

**Symptoms**: "Row Level Security policy violation"

**Solutions**:
1. Check RLS policies in Supabase Dashboard
2. Verify user is authenticated
3. Check policy conditions
4. Review `setup-storage-policies.sql`
5. Test with service role key (development only)

---

## Storage Issues

### Issue: File upload fails

**Symptoms**: Upload errors or timeouts

**Solutions**:
1. Check file size (max 500MB for videos)
2. Verify bucket exists
3. Check bucket is public (if needed)
4. Verify RLS policies allow uploads
5. Check MIME type restrictions
6. Verify storage quota not exceeded

---

### Issue: Files not accessible

**Symptoms**: 404 errors or access denied

**Solutions**:
1. Check bucket is public
2. Verify file path is correct
3. Check RLS policies allow reads
4. Verify file exists in storage
5. Check URL generation

---

## Video Issues

### Issue: Video recording not working

**Symptoms**: MediaRecorder fails or no video recorded

**Solutions**:
1. Check browser supports MediaRecorder
2. Verify camera/microphone permissions
3. Check HTTPS (required for MediaRecorder)
4. Test in different browser
5. Check browser console for errors
6. Verify stream is active

---

### Issue: Video upload fails

**Symptoms**: Video upload errors or timeouts

**Solutions**:
1. Check video file size
2. Verify chunk size (5MB default)
3. Check network connection
4. Verify storage bucket exists
5. Check storage quota
6. Review upload progress logs

---

### Issue: Screenshots not capturing

**Symptoms**: Screenshot capture fails

**Solutions**:
1. Verify video element is loaded
2. Check video is playing/seeked
3. Verify canvas API is available
4. Check storage bucket exists
5. Verify RLS policies allow uploads
6. Check browser console for errors

---

## AI Chat Issues

### Issue: AI chat not responding

**Symptoms**: No response from AI chat

**Solutions**:
1. Check Edge Function is deployed
2. Verify `OPENAI_API_KEY` is set in Supabase secrets
3. Check Edge Function logs
4. Verify API key is valid
5. Check API quota not exceeded
6. Review function code

---

### Issue: AI responses are slow

**Symptoms**: Long wait times for responses

**Solutions**:
1. Check API quota/rate limits
2. Verify network connection
3. Check Edge Function region
4. Review conversation history size
5. Consider using faster model
6. Check Supabase function logs

---

## Expert System Issues

### Issue: Expert profiles not loading

**Symptoms**: Empty expert list

**Solutions**:
1. Check database tables exist
2. Verify RLS policies allow reads
3. Check if experts are verified
4. Review query filters
5. Check Supabase Dashboard → Database

---

### Issue: Consultation booking fails

**Symptoms**: Booking errors

**Solutions**:
1. Verify expert is available
2. Check scheduled time is valid
3. Verify user is authenticated
4. Check payment integration (if applicable)
5. Review booking form data
6. Check database constraints

---

## Component Issues

### Issue: Components not rendering

**Symptoms**: Blank pages or missing components

**Solutions**:
1. Check browser console for errors
2. Verify imports are correct
3. Check component props
4. Verify routes are configured
5. Check feature flags
6. Review component code

---

### Issue: Navigation not working

**Symptoms**: Links don't navigate

**Solutions**:
1. Check routes are defined
2. Verify route paths match
3. Check navigation handlers
4. Review router configuration
5. Check for JavaScript errors

---

## Performance Issues

### Issue: Slow page loads

**Symptoms**: Long load times

**Solutions**:
1. Check network connection
2. Review bundle size
3. Enable code splitting
4. Optimize images
5. Check API response times
6. Review database queries

---

### Issue: High memory usage

**Symptoms**: Browser becomes slow

**Solutions**:
1. Check for memory leaks
2. Review large file uploads
3. Check video playback
4. Review component cleanup
5. Check for infinite loops
6. Monitor memory in DevTools

---

## Build Issues

### Issue: Build fails

**Symptoms**: `npm run build` errors

**Solutions**:
1. Check TypeScript errors
2. Verify all imports are correct
3. Check for missing dependencies
4. Review build configuration
5. Check environment variables
6. Review error messages

---

### Issue: Build succeeds but app doesn't work

**Symptoms**: Build works but runtime errors

**Solutions**:
1. Check environment variables in production
2. Verify API endpoints
3. Check CORS configuration
4. Review browser console
5. Check network requests
6. Verify build output

---

### Issue: Android APK stuck on loading screen

**Symptoms**: APK shows the loading screen and never advances

**Solutions**:
1. Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set in `.env`
2. Rebuild the web bundle with Capacitor build flag:
   ```powershell
   $env:CAPACITOR_BUILD = "1"
   npm run build:nsfw:direct
   ```
3. Sync assets to Android:
   ```powershell
   npx cap sync android
   ```
4. Rebuild the APK (Android Studio or Gradle)
5. If still stuck, clear app storage/cache on device and relaunch

---

## General Debugging

### Enable Debug Logging

Add to `.env`:
```env
VITE_DEBUG=true
```

### Check Browser Console

1. Open DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Check Application tab for storage

### Check Supabase Dashboard

1. Go to Supabase Dashboard
2. Check Database → Logs
3. Check Storage → Logs
4. Check Edge Functions → Logs
5. Review API requests

### Common Error Messages

**"Failed to fetch"**
- Check network connection
- Verify API endpoint
- Check CORS configuration

**"Unauthorized"**
- Check authentication
- Verify user is logged in
- Check RLS policies

**"Not found"**
- Verify resource exists
- Check path/URL
- Review routing

**"Storage quota exceeded"**
- Check storage usage
- Delete old files
- Upgrade plan

---

## Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Review documentation
3. ✅ Check browser console
4. ✅ Review Supabase logs
5. ✅ Search for similar issues

### Information to Provide

When reporting issues, include:
- Error messages
- Browser console logs
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Supabase logs (if applicable)

---

## Prevention

### Best Practices

1. ✅ Test in development first
2. ✅ Use environment variables
3. ✅ Enable error logging
4. ✅ Monitor storage usage
5. ✅ Regular backups
6. ✅ Keep dependencies updated
7. ✅ Review logs regularly

---

**Last Updated**: 2024-12-08

