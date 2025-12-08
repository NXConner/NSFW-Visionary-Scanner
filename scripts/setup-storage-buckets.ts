/**
 * Setup Supabase Storage Buckets Script
 * Creates all required storage buckets with proper policies
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const buckets = [
  {
    id: 'user-uploads',
    name: 'user-uploads',
    public: true,
    fileSizeLimit: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: null // Allow all for development
  },
  {
    id: 'videos',
    name: 'videos',
    public: true,
    fileSizeLimit: 500 * 1024 * 1024, // 500MB
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime']
  },
  {
    id: 'images',
    name: 'images',
    public: true,
    fileSizeLimit: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  {
    id: 'audio',
    name: 'audio',
    public: true,
    fileSizeLimit: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm']
  },
  {
    id: 'screenshots',
    name: 'screenshots',
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png']
  },
  {
    id: 'recordings',
    name: 'recordings',
    public: false, // Private by default
    fileSizeLimit: 500 * 1024 * 1024, // 500MB
    allowedMimeTypes: ['video/mp4', 'video/webm']
  },
  {
    id: 'expert-content',
    name: 'expert-content',
    public: true,
    fileSizeLimit: 200 * 1024 * 1024, // 200MB
    allowedMimeTypes: null
  },
  {
    id: 'nsfw-content',
    name: 'nsfw-content',
    public: true,
    fileSizeLimit: 500 * 1024 * 1024, // 500MB
    allowedMimeTypes: null
  }
]

async function setupBuckets() {
  console.log('Setting up Supabase Storage buckets...\n')

  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      const { data: existing, error: checkError } = await supabase.storage.listBuckets()
      
      const exists = existing?.some(b => b.id === bucket.id)

      if (exists) {
        console.log(`✓ Bucket "${bucket.id}" already exists`)
        continue
      }

      // Create bucket
      const { data, error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes || undefined
      })

      if (error) {
        console.error(`✗ Failed to create bucket "${bucket.id}":`, error.message)
      } else {
        console.log(`✓ Created bucket "${bucket.id}" (${bucket.public ? 'public' : 'private'})`)
      }
    } catch (error) {
      console.error(`✗ Error with bucket "${bucket.id}":`, error)
    }
  }

  console.log('\n✅ Bucket setup complete!')
  console.log('\nNext: Set up RLS policies in Supabase Dashboard → Storage → Policies')
}

setupBuckets().catch(console.error)

