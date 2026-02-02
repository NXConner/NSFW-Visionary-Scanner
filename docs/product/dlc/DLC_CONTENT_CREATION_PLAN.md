# DLC Content Creation Plan

This document outlines all the content files needed for each DLC pack, how to create them, and how to upload them to the app.

> **Important**: This plan was written against an earlier/alternate DLC schema (it references tables like `dlc_content_items`, `dlc_packs`, `dlc_purchases`). Before executing any SQL from this document, align it to the **current** schema in `supabase/migrations/` and the production roadmap in `docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md`.
>
> **Also**: Avoid one-off upload scripts for production. Prefer an **admin import pipeline** (bulk validate → upload → upsert → audit) as described in `docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md`.

---

## Table of Contents

1. [Overview](#overview)
2. [Storage Structure](#storage-structure)
3. [Content Types](#content-types)
4. [DLC Packs Content Requirements](#dlc-packs-content-requirements)
5. [How to Add Content](#how-to-add-content)
6. [Content Guidelines](#content-guidelines)

---

## Overview

The DLC system uses Supabase Storage for file hosting. Content metadata is stored in the database (`dlc_content_items` table), and actual files are stored in storage buckets.

### Current DLC Packs in Database

| Pack ID                              | Pack Name                        | Items | Price  |
| ------------------------------------ | -------------------------------- | ----- | ------ |
| 11111111-1111-1111-1111-111111111101 | Positions Gallery - Beginner     | 25    | $9.99  |
| 11111111-1111-1111-1111-111111111102 | Positions Gallery - Intermediate | 30    | $14.99 |
| 11111111-1111-1111-1111-111111111103 | Positions Gallery - Advanced     | 40    | $19.99 |
| 11111111-1111-1111-1111-111111111104 | Positions Gallery - Complete     | 95    | $34.99 |
| 11111111-1111-1111-1111-111111111201 | PE Routines - Beginner           | 28    | $12.99 |
| 11111111-1111-1111-1111-111111111202 | PE Routines - Intermediate       | 56    | $19.99 |
| 11111111-1111-1111-1111-111111111203 | PE Routines - Advanced           | 84    | $29.99 |
| 11111111-1111-1111-1111-111111111204 | PE Device Mastery Guide          | 15    | $14.99 |
| 11111111-1111-1111-1111-111111111301 | Intimate Date Ideas - Romantic   | 50    | $9.99  |
| 11111111-1111-1111-1111-111111111302 | Intimate Date Ideas - Adventure  | 40    | $9.99  |
| 11111111-1111-1111-1111-111111111303 | Sensual Massage Techniques       | 30    | $14.99 |
| 11111111-1111-1111-1111-111111111401 | Male Anatomy Deep Dive           | 20    | $7.99  |
| 11111111-1111-1111-1111-111111111402 | Sexual Health Masterclass        | 25    | $19.99 |
| 11111111-1111-1111-1111-111111111501 | AI Intimacy Coach - Basic        | 1     | $4.99  |
| 11111111-1111-1111-1111-111111111502 | AI Intimacy Coach - Premium      | 1     | $9.99  |

---

## Storage Structure

Create a storage bucket called `dlc-content` (if not exists) with the following folder structure:

```
dlc-content/
├── positions/
│   ├── beginner/
│   │   ├── position-001-missionary.jpg
│   │   ├── position-001-missionary-thumb.jpg
│   │   └── position-001-missionary-guide.pdf
│   ├── intermediate/
│   └── advanced/
├── pe-routines/
│   ├── beginner/
│   │   ├── week-1/
│   │   │   ├── day-1-intro.pdf
│   │   │   └── day-1-video.mp4
│   │   ├── week-2/
│   │   ├── week-3/
│   │   └── week-4/
│   ├── intermediate/
│   └── advanced/
├── intimate/
│   ├── romantic-dates/
│   ├── adventure-dates/
│   └── massage-techniques/
├── education/
│   ├── anatomy/
│   │   ├── 3d-models/
│   │   ├── diagrams/
│   │   └── videos/
│   └── masterclass/
└── previews/
    ├── positions/
    ├── pe-routines/
    └── intimate/
```

---

## Content Types

The database supports these content types:

- `position` - Sexual position content
- `video` - Video files (MP4, WebM)
- `image` - Image files (JPG, PNG, WebP)
- `3d_model` - 3D model files (GLB, GLTF)
- `audio` - Audio files (MP3, WAV)
- `document` - PDF documents
- `other` - Other file types

---

## DLC Packs Content Requirements

### 1. Positions Gallery - Beginner (25 positions)

**Files needed per position:**

- Main image (1920x1080 or 1080x1920, JPG/PNG)
- Thumbnail (400x300, JPG)
- Guide PDF with instructions

**Positions to create:**

1. Missionary Classic
2. Cowgirl
3. Doggy Style
4. Spooning
5. Reverse Cowgirl
6. Seated Lotus
7. Edge of Bed
8. The Cradle
9. Lazy Dog
10. Standing Face-to-Face
11. The Bridge
12. Side Scissors
13. The Pretzel
14. Seated Chair
15. The Wrap
16. Kneeling Rear
17. The Straddle
18. Couch Comfort
19. The Rock
20. Face Down
21. The Lean
22. Modified Missionary
23. The Anchor
24. Lap Dance
25. The Slide

**Content requirements per position:**

- Tasteful illustration or photograph (NSFW)
- Step-by-step instructions
- Difficulty rating
- Benefits listed
- Tips for success
- Variations

---

### 2. Positions Gallery - Intermediate (30 positions)

**Additional positions:**

1. The Wheelbarrow
2. Standing Rear
3. The Spider
4. Reverse Rider
5. The Seashell
6. Standing Split
7. The Piledriver
8. Lotus Blossom
9. The Pinwheel
10. Butter Churner
11. The Suspended Congress
12. Rocking Horse
13. The Viennese Oyster
14. Reverse Missionary
15. The Corkscrew
16. Leapfrog
17. The Face-Off
18. Elevated Missionary
19. The Valedictorian
20. Sideways Straddle
21. The Magic Mountain
22. Crouching Tiger
23. The Ballet Dancer
24. Reverse Jockey
25. The Lazy Man
26. Prison Guard
27. The Camel Ride
28. Shoulder Holder
29. The Dolphin
30. Waterfall

---

### 3. Positions Gallery - Advanced (40 positions)

**Advanced positions requiring flexibility:**

1. The Pretzel Dip
2. Standing Wheelbarrow
3. The Acrobat
4. Inverted Jockey
5. The Helicopter
6. Suspended Scissors
7. The Splitting Bamboo
8. Flying Dutchman
9. The Accordion
10. Inverted Missionary
11. The Trapeze
12. Double Decker
13. The Propeller
14. Aerial Dancer
15. The Tumbler
16. Suspended Bridge
17. The Gymnast
18. Inverted Cowgirl
19. The Contortionist
20. Flying V
21. The Acro-Yogi
22. Suspended Lotus
23. The Pole Position
24. Inverted Spooning
25. The Levitator
26. Ceiling Fan
27. The Scorpion
28. Suspended Doggy
29. The Flamingo
30. Aerial Cowgirl
31. The Backbend
32. Flying Spider
33. The Swing
34. Inverted Pretzel
35. The Cirque
36. Suspended Seashell
37. The Acrobatic Wheel
38. Flying Lotus
39. The Suspension Bridge
40. Ultimate Flexibility

---

### 4. PE Routines - Beginner (4-week program)

**Week 1: Foundation**

- Day 1: Introduction & Warm-up (PDF + Video)
- Day 2: Basic Stretches (PDF + Video)
- Day 3: Rest & Recovery (PDF)
- Day 4: Jelqing Basics (PDF + Video)
- Day 5: Combined Routine (PDF)
- Day 6: Kegel Foundation (PDF + Video)
- Day 7: Rest Day (PDF)

**Week 2: Building Consistency**

- Days 1-7: Progressive routines (7 PDFs + 3 Videos)

**Week 3: Increasing Intensity**

- Days 1-7: Intermediate intensity (7 PDFs + 3 Videos)

**Week 4: Mastery**

- Days 1-7: Full program integration (7 PDFs + 3 Videos)

**Additional Resources:**

- Safety Guidelines PDF
- Measurement Tracking Template
- FAQ Document
- Troubleshooting Guide

---

### 5. PE Routines - Intermediate (8-week program)

**Weeks 1-8:** Progressive overload program

- 56 daily routine PDFs
- 16 instructional videos
- 8 weekly assessment documents
- Advanced technique guides

---

### 6. PE Routines - Advanced (12-week program)

**Weeks 1-12:** Periodization program

- 84 daily routine PDFs
- 24 instructional videos
- 12 weekly assessment documents
- Plateau-breaking techniques
- Recovery protocols

---

### 7. PE Device Mastery Guide

**Devices covered:**

1. Penis Pumps (Hydro & Air)
   - Types comparison
   - Usage protocols
   - Safety guidelines
   - Routine integration

2. Extenders
   - Selection guide
   - Wearing schedules
   - Comfort tips
   - Results tracking

3. Hangers
   - Weight progression
   - Time protocols
   - Safety checks

4. Clamps
   - Proper technique
   - Duration guidelines
   - Warning signs

5. Rings
   - Size selection
   - Usage patterns
   - Material guide

---

### 8. Intimate Date Ideas - Romantic (50 ideas)

**Format per idea:**

- Title and description
- Preparation checklist
- Budget estimate
- Time required
- Ambiance tips
- Activity suggestions
- Music/playlist recommendations

**Categories:**

- At-home dates (15 ideas)
- Outdoor dates (15 ideas)
- City dates (10 ideas)
- Special occasions (10 ideas)

---

### 9. Intimate Date Ideas - Adventure (40 ideas)

**Thrill-seeking dates:**

- Adrenaline activities (10 ideas)
- Exploration dates (10 ideas)
- Challenge dates (10 ideas)
- Spontaneous adventures (10 ideas)

---

### 10. Sensual Massage Techniques (30 techniques)

**Content per technique:**

- HD Video tutorial (5-20 min)
- PDF guide with diagrams
- Oil/product recommendations
- Pressure point guide

**Techniques:**

1. Swedish Relaxation Massage
2. Sensual Back Massage
3. Foot Reflexology
4. Scalp & Head Massage
5. Full Body Glide
6. Hot Stone Technique
7. Aromatic Oil Massage
8. Couples Synchronized Massage
9. Tantric Touch
10. Feather Light
11. Deep Tissue Relief
12. Warm Towel Technique
13. Ice & Heat Play
14. Pressure Point Release
15. Silk Glove Method
16. The Four Hands
17. Candlelit Touch
18. Blindfolded Sensation
19. Music & Movement
20. The Slow Build
21. Edge Work
22. Full Surrender
23. The Connection
24. Energy Flow
25. Sacred Spot
26. The Awakening
27. Sensory Deprivation
28. The Journey
29. Ultimate Release
30. Aftercare & Bonding

---

### 11. Male Anatomy Deep Dive

**3D Models:**

- External anatomy model (GLB)
- Internal anatomy model (GLB)
- Vascular system model (GLB)

**Diagrams:**

- Blood flow diagram (PNG)
- Nerve pathways (PNG)
- Muscle groups (PNG)
- Anatomical cross-sections (PNG)

**Videos:**

- Anatomy overview (20 min)
- Blood flow explained (15 min)
- Muscle function (10 min)
- Nerve sensitivity (10 min)

---

### 12. Sexual Health Masterclass

**Video Modules:**

1. Understanding Your Body (30 min)
2. Common Conditions (25 min)
3. Prevention Strategies (20 min)
4. Performance Optimization (35 min)
5. Mental Wellness (25 min)
6. Nutrition & Supplements (20 min)
7. Exercise & Lifestyle (25 min)
8. Partner Communication (20 min)

**Supporting Materials:**

- Workbook PDF
- Self-assessment quizzes
- Resource list
- Quick reference cards

---

### 13. AI Intimacy Coach

**Configuration files:**

- System prompts (JSON)
- Response templates (JSON)
- Topic databases (JSON)
- Personalization settings (JSON)

---

## How to Add Content

### Step 1: Create Storage Bucket

```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('dlc-content', 'dlc-content', false);

-- Create RLS policies
CREATE POLICY "Users can view purchased DLC content"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'dlc-content' AND
  EXISTS (
    SELECT 1 FROM dlc_purchases dp
    JOIN dlc_content_items dci ON dci.pack_id = dp.pack_id
    WHERE dp.user_id = auth.uid()
    AND dp.is_active = true
    AND storage.foldername(name)[1] = dci.pack_id::text
  )
);
```

### Step 2: Upload Files

Use the Supabase Dashboard or API to upload files:

```typescript
// Example: Upload a position image
const { data, error } = await supabase.storage
  .from("dlc-content")
  .upload("positions/beginner/position-001-missionary.jpg", file);
```

### Step 3: Update Database Records

After uploading, update the `dlc_content_items` table with file URLs:

```sql
UPDATE dlc_content_items
SET
  file_url = 'positions/beginner/position-001-missionary.jpg',
  thumbnail_url = 'positions/beginner/position-001-missionary-thumb.jpg',
  file_size_bytes = 245000
WHERE id = '44444444-4444-4444-4444-444444440101';
```

### Step 4: Add Preview Images

For each pack, add preview images that non-purchasers can see:

```sql
UPDATE dlc_packs
SET preview_images = ARRAY[
  'previews/positions/beginner-preview-1.jpg',
  'previews/positions/beginner-preview-2.jpg',
  'previews/positions/beginner-preview-3.jpg'
]
WHERE id = '11111111-1111-1111-1111-111111111101';
```

---

## Content Guidelines

### Image Requirements

| Type          | Dimensions             | Format  | Max Size |
| ------------- | ---------------------- | ------- | -------- |
| Position Main | 1920x1080 or 1080x1920 | JPG/PNG | 2MB      |
| Thumbnail     | 400x300                | JPG     | 100KB    |
| Preview       | 800x600                | JPG     | 500KB    |
| Diagram       | 1200x800               | PNG     | 1MB      |

### Video Requirements

| Type       | Resolution | Format      | Max Size |
| ---------- | ---------- | ----------- | -------- |
| Tutorial   | 1080p      | MP4 (H.264) | 500MB    |
| Short Clip | 720p       | MP4 (H.264) | 100MB    |

### Document Requirements

| Type     | Format | Max Size |
| -------- | ------ | -------- |
| Guide    | PDF    | 10MB     |
| Workbook | PDF    | 20MB     |

### 3D Model Requirements

| Type          | Format   | Max Size |
| ------------- | -------- | -------- |
| Anatomy Model | GLB/GLTF | 50MB     |
| Interactive   | GLB      | 30MB     |

---

## Content Checklist

### Before Launch

- [ ] All 25 beginner positions created
- [ ] All 30 intermediate positions created
- [ ] All 40 advanced positions created
- [ ] 4-week beginner PE program complete
- [ ] 8-week intermediate PE program complete
- [ ] 12-week advanced PE program complete
- [ ] PE device guides complete
- [ ] 50 romantic date ideas written
- [ ] 40 adventure date ideas written
- [ ] 30 massage technique videos recorded
- [ ] Anatomy 3D models created
- [ ] Masterclass videos recorded
- [ ] All thumbnails generated
- [ ] All preview images created
- [ ] Database records updated with file URLs
- [ ] RLS policies tested
- [ ] Download functionality tested
- [ ] Offline access verified

---

## File Naming Convention

Use consistent naming for all files:

```
{category}/{difficulty}/{item-number}-{slug}.{extension}
{category}/{difficulty}/{item-number}-{slug}-thumb.{extension}
{category}/{difficulty}/{item-number}-{slug}-guide.pdf
```

Examples:

- `positions/beginner/001-missionary.jpg`
- `positions/beginner/001-missionary-thumb.jpg`
- `positions/beginner/001-missionary-guide.pdf`
- `pe-routines/beginner/week-1/day-1-intro.pdf`
- `pe-routines/beginner/week-1/day-1-video.mp4`

---

## Production Content Upload (Recommended approach)

Do **not** rely on ad-hoc curl/bash upload scripts in production.

Use the **admin import pipeline** described in `docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md`:

- Validate content metadata (schema + required fields)
- Upload assets to private storage (bucket + folder convention)
- Upsert DB records deterministically (idempotent)
- Emit an audit report of successes/failures

---

## Summary

**Total Content Items to Create:**

| Category           | Items   | Estimated Files                  |
| ------------------ | ------- | -------------------------------- |
| Positions          | 95      | 285 (image + thumb + guide each) |
| PE Routines        | 168     | 200+ (PDFs + videos)             |
| Intimate Dates     | 90      | 90 (documents)                   |
| Massage Techniques | 30      | 60 (videos + guides)             |
| Education          | 45      | 60 (videos + 3D models + docs)   |
| AI Config          | 2       | 8 (JSON configs)                 |
| **TOTAL**          | **430** | **700+**                         |

This represents significant content creation effort. Prioritize based on expected sales and user interest.
