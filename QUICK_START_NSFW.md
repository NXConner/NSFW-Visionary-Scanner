# Quick Start Guide - NSFW Version

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```powershell
npm install
```

### Step 2: Setup Environment
Create `.env` file:
```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
OPENAI_API_KEY=your_key
```

### Step 3: Run Complete Setup
```powershell
npm run setup:complete
```

This automated script will:
- ✅ Check prerequisites
- ✅ Install dependencies
- ✅ Create .env if needed
- ✅ Run database migrations
- ✅ Setup storage buckets
- ✅ Seed initial data

### Step 4: Deploy Edge Functions
```powershell
npm run deploy:functions
```

### Step 5: Start Development
```powershell
npm run dev
```

---

## 📋 Manual Setup (If Needed)

### Create Storage Buckets
```powershell
npm run setup:storage
```

Then run `scripts/setup-storage-policies.sql` in Supabase SQL Editor.

### Run Migrations
```powershell
npm run db:migrate
```

### Seed Data
```powershell
npm run seed:positions
```

---

## 🎯 Access Features

Once running, navigate to:
- **NSFW Advanced** - Main NSFW features
- **Expert Content** - Expert consultations
- **NSFW Videos** - Video library with player
- **NSFW Forum** - Community forum
- **NSFW Analytics** - Sexual wellness tracking

---

## ✅ Verification Checklist

- [ ] Dependencies installed
- [ ] .env file configured
- [ ] Migrations run successfully
- [ ] Storage buckets created
- [ ] Edge Functions deployed
- [ ] Seed data loaded
- [ ] Dev server running
- [ ] Can access NSFW features

---

**For detailed setup, see**: `COMPLETE_SETUP_GUIDE.md`

