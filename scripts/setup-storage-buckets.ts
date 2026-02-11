/**
 * Setup Supabase Storage Buckets Script
 * Creates all required storage buckets with proper policies
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  console.error("Required environment variables:");
  console.error("  - VITE_SUPABASE_URL or SUPABASE_URL");
  console.error("  - SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_SERVICE_ROLE_KEY");
  console.error("");
  console.error("Please check your .env file and ensure these variables are set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const buckets = [
  {
    id: "user-media",
    name: "user-media",
    public: true,
    fileSizeLimit: 250 * 1024 * 1024, // 250MB
    allowedMimeTypes: null,
  },
  {
    id: "user-uploads",
    name: "user-uploads",
    public: false,
    fileSizeLimit: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: [
      "application/json",
      "text/csv",
      "text/plain",
      "application/pdf",
      "application/zip",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ],
  },
  {
    id: "videos",
    name: "videos",
    public: true,
    fileSizeLimit: 500 * 1024 * 1024, // 500MB
    allowedMimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
  },
  {
    id: "images",
    name: "images",
    public: true,
    fileSizeLimit: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  {
    id: "audio",
    name: "audio",
    public: true,
    fileSizeLimit: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"],
  },
  {
    id: "screenshots",
    name: "screenshots",
    public: false,
    fileSizeLimit: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  {
    id: "recordings",
    name: "recordings",
    public: false, // Private by default
    fileSizeLimit: 5 * 1024 * 1024 * 1024, // 5GB
    allowedMimeTypes: ["video/mp4", "video/webm", "video/quicktime", "application/octet-stream"],
  },
  {
    id: "expert-content",
    name: "expert-content",
    public: true,
    fileSizeLimit: 200 * 1024 * 1024, // 200MB
    allowedMimeTypes: null,
  },
  {
    id: "nsfw-content",
    name: "nsfw-content",
    public: false,
    fileSizeLimit: 10 * 1024 * 1024 * 1024, // 10GB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "application/json",
      "text/plain",
    ],
  },
];

async function setupBuckets() {
  console.log("Setting up Supabase Storage buckets...\n");

  const { data: existing, error: checkError } = await supabase.storage.listBuckets();
  if (checkError) {
    console.error("✗ Failed to list existing buckets:", checkError.message);
    process.exit(1);
  }
  const existingMap = new Map((existing || []).map(b => [b.id, b]));

  for (const bucket of buckets) {
    try {
      const existingBucket = existingMap.get(bucket.id);
      if (existingBucket) {
        // Keep bucket configuration aligned (idempotent).
        const wantsMimeTypes = bucket.allowedMimeTypes || undefined;
        const { error: updateError } = await supabase.storage.updateBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: wantsMimeTypes,
        });
        if (updateError) {
          console.error(`✗ Failed to update bucket "${bucket.id}":`, updateError.message);
        } else {
          console.log(
            `✓ Bucket "${bucket.id}" already exists (ensured ${bucket.public ? "public" : "private"})`,
          );
        }
        continue;
      }

      const { error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes || undefined,
      });
      if (error) {
        console.error(`✗ Failed to create bucket "${bucket.id}":`, error.message);
      } else {
        console.log(`✓ Created bucket "${bucket.id}" (${bucket.public ? "public" : "private"})`);
      }
    } catch (error) {
      console.error(`✗ Error with bucket "${bucket.id}":`, error);
    }
  }

  console.log("\n✅ Bucket setup complete!");
  console.log(
    "\nNext: apply RLS policies (prefer via migrations) and validate storage access paths.",
  );
}

setupBuckets().catch(console.error);
